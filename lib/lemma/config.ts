// lib/lemma/config.ts
// -----------------------------------------------------------------------------
// GigOps backend configuration.
//
// IMPORTANT — about "Lemma":
// The real Lemma SDK (uselemma.ai) is an *observability* platform for AI agents:
// it ingests OpenTelemetry traces and surfaces silent failures / drift. It does
// NOT provide Datastore / DocumentStore / Agent / Workflow primitives to *build*
// agents. So in GigOps:
//   • Agent reasoning runs on Groq (OpenAI-compatible LLM inference).  <- this file
//   • Professionals / feedback live in a local seeded store.          (store.ts)
//   • Lemma is integrated as the OBSERVABILITY layer — every step of
//     the triage workflow is wrapped in a span and exported to Lemma   (this file)
//     over OTLP/HTTP when LEMMA creds are configured. Spans always log
//     to the console so the workflow is visible during the demo.
// -----------------------------------------------------------------------------

import Groq from "groq-sdk";
import { randomBytes } from "node:crypto";

// ---------------------------------------------------------------------------
// Groq client (the engine behind the Triage + Action agents)
// ---------------------------------------------------------------------------

/**
 * Model used by every agent. Defaults to Llama 3.3 70B — strong instruction
 * following and reliable JSON. Override with GROQ_MODEL (e.g. openai/gpt-oss-120b).
 */
export const AGENT_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

let _groq: Groq | null = null;

/** Lazily construct a singleton Groq client (reads GROQ_API_KEY). */
export function getGroq(): Groq {
  if (!_groq) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error(
        "GROQ_API_KEY is not set. Add it to .env.local — the Triage and Action agents cannot run without it."
      );
    }
    _groq = new Groq();
  }
  return _groq;
}

// ---------------------------------------------------------------------------
// Lemma observability — lightweight OpenTelemetry-style tracing
// ---------------------------------------------------------------------------

const LEMMA_OTLP_ENDPOINT = process.env.LEMMA_OTLP_ENDPOINT; // e.g. https://otel.uselemma.ai/v1/traces
const LEMMA_API_KEY = process.env.LEMMA_API_KEY;
const SERVICE_NAME = "gigops-backend";

export type SpanAttributes = Record<string, string | number | boolean>;

interface SpanRecord {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  startUnixNano: number;
  endUnixNano: number;
  attributes: SpanAttributes;
  status: "OK" | "ERROR";
  error?: string;
}

function hexId(bytes: number): string {
  return randomBytes(bytes).toString("hex");
}

function nowNano(): number {
  return Date.now() * 1_000_000;
}

/**
 * A trace groups the spans of a single workflow run. Pass it down so every
 * step shares one traceId (and nests under the workflow's root span).
 */
export interface Trace {
  traceId: string;
  rootSpanId: string;
}

export function startTrace(): Trace {
  return { traceId: hexId(16), rootSpanId: hexId(8) };
}

/**
 * Run a whole workflow inside one root span. Child steps created with
 * `withSpan(trace, ...)` nest under this root automatically. Returns the
 * workflow result; the root span is timed and exported like any other.
 */
export async function withWorkflowTrace<T>(
  name: string,
  attributes: SpanAttributes,
  fn: (trace: Trace) => Promise<T>
): Promise<T> {
  const trace = startTrace();
  const startUnixNano = nowNano();
  try {
    const result = await fn(trace);
    finalizeSpan({
      traceId: trace.traceId,
      spanId: trace.rootSpanId,
      name,
      startUnixNano,
      endUnixNano: nowNano(),
      attributes,
      status: "OK",
    });
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    finalizeSpan({
      traceId: trace.traceId,
      spanId: trace.rootSpanId,
      name,
      startUnixNano,
      endUnixNano: nowNano(),
      attributes,
      status: "ERROR",
      error: message,
    });
    throw err;
  }
}

/**
 * Wrap an async unit of work in a span. The span is timed, logged to the
 * console (demo visibility), and exported to Lemma over OTLP when configured.
 */
export async function withSpan<T>(
  trace: Trace,
  name: string,
  attributes: SpanAttributes,
  fn: () => Promise<T>,
  parentSpanId?: string
): Promise<T> {
  const spanId = hexId(8);
  const startUnixNano = nowNano();
  try {
    const result = await fn();
    finalizeSpan({
      traceId: trace.traceId,
      spanId,
      parentSpanId: parentSpanId ?? trace.rootSpanId,
      name,
      startUnixNano,
      endUnixNano: nowNano(),
      attributes,
      status: "OK",
    });
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    finalizeSpan({
      traceId: trace.traceId,
      spanId,
      parentSpanId: parentSpanId ?? trace.rootSpanId,
      name,
      startUnixNano,
      endUnixNano: nowNano(),
      attributes,
      status: "ERROR",
      error: message,
    });
    throw err;
  }
}

function finalizeSpan(span: SpanRecord): void {
  const durationMs = Math.round((span.endUnixNano - span.startUnixNano) / 1e6);
  // Console visibility — shows the workflow executing live during the demo.
  const icon = span.status === "OK" ? "✓" : "✗";
  console.log(
    `[lemma:trace ${span.traceId.slice(0, 8)}] ${icon} ${span.name} (${durationMs}ms)`,
    span.error ? `error=${span.error}` : ""
  );
  // Best-effort OTLP export to Lemma (fire-and-forget; never blocks the request).
  exportToLemma(span).catch(() => {
    /* observability must never break the workflow */
  });
}

async function exportToLemma(span: SpanRecord): Promise<void> {
  if (!LEMMA_OTLP_ENDPOINT) return; // Lemma not configured — console-only mode.

  const toAttrs = (attrs: SpanAttributes) =>
    Object.entries(attrs).map(([key, value]) => ({
      key,
      value:
        typeof value === "number"
          ? Number.isInteger(value)
            ? { intValue: String(value) }
            : { doubleValue: value }
          : typeof value === "boolean"
            ? { boolValue: value }
            : { stringValue: String(value) },
    }));

  const payload = {
    resourceSpans: [
      {
        resource: {
          attributes: [{ key: "service.name", value: { stringValue: SERVICE_NAME } }],
        },
        scopeSpans: [
          {
            scope: { name: "gigops.workflow" },
            spans: [
              {
                traceId: span.traceId,
                spanId: span.spanId,
                parentSpanId: span.parentSpanId,
                name: span.name,
                kind: 1, // SPAN_KIND_INTERNAL
                startTimeUnixNano: String(span.startUnixNano),
                endTimeUnixNano: String(span.endUnixNano),
                attributes: toAttrs(span.attributes),
                status:
                  span.status === "ERROR"
                    ? { code: 2, message: span.error ?? "" } // STATUS_CODE_ERROR
                    : { code: 1 }, // STATUS_CODE_OK
              },
            ],
          },
        ],
      },
    ],
  };

  await fetch(LEMMA_OTLP_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(LEMMA_API_KEY ? { Authorization: `Bearer ${LEMMA_API_KEY}` } : {}),
    },
    body: JSON.stringify(payload),
  });
}
