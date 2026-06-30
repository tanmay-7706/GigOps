// lib/lemma/lemmaRest.ts
// -----------------------------------------------------------------------------
// Minimal server-side client for the real Lemma REST API (lemma.work, by Gappy
// AI — the hackathon SDK). The official `lemma-sdk` is browser/React-first
// (pulls supertokens-web-js, uses window/localStorage), so our Next.js server
// routes talk to Lemma over plain HTTPS with a Bearer token instead.
//
// Env (.env.local):
//   LEMMA_API_URL   default https://api.lemma.work
//   LEMMA_POD_ID    the gigops pod id
//   LEMMA_TOKEN     a session token — get one with `lemma auth print-token`
// -----------------------------------------------------------------------------

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileP = promisify(execFile);

const API_URL = process.env.LEMMA_API_URL || "https://api.lemma.work";
const POD_ID = process.env.LEMMA_POD_ID;
const LEMMA_BIN = process.env.LEMMA_CLI || `${process.env.HOME}/.local/bin/lemma`;

export type LemmaRecord = Record<string, unknown> & { id: string };

// ---------------------------------------------------------------------------
// Token provider — Lemma access tokens are short-lived (~1h). Locally we let
// the Lemma CLI mint/refresh them (`lemma auth print-token` auto-refreshes),
// cache the result, and refresh ~1min before expiry. Falls back to a static
// LEMMA_TOKEN env if the CLI isn't available.
// ---------------------------------------------------------------------------

let cachedToken: { token: string; expMs: number } | null = null;
let inflight: Promise<string> | null = null;

function decodeExpMs(jwt: string): number {
  try {
    const payload = JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString());
    return (payload.exp ?? 0) * 1000;
  } catch {
    return 0;
  }
}

async function refreshToken(): Promise<string> {
  // Strip LEMMA_TOKEN from the child env: the Lemma CLI reads it and would
  // echo that (stale) static token instead of refreshing its own session.
  const env = { ...process.env };
  delete env.LEMMA_TOKEN;
  const { stdout } = await execFileP(LEMMA_BIN, ["auth", "print-token"], {
    timeout: 15_000,
    env,
  });
  const token = stdout.trim();
  if (!token) {
    throw new Error("`lemma auth print-token` returned no token. Run `lemma auth login`.");
  }
  cachedToken = { token, expMs: decodeExpMs(token) || Date.now() + 600_000 };
  return token;
}

/** Cached access token, single-flight refreshed via the Lemma CLI (~1min before expiry). */
async function getToken(): Promise<string> {
  if (cachedToken && cachedToken.expMs > Date.now() + 60_000) return cachedToken.token;
  if (!inflight) {
    inflight = refreshToken().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

async function lemmaFetch<T>(method: string, path: string, body?: unknown, retry = true): Promise<T> {
  if (!POD_ID) {
    throw new Error("LEMMA_POD_ID is not set in .env.local.");
  }
  const token = await getToken();
  const res = await fetch(`${API_URL}${path}`, {
    method: method.toUpperCase(), // undici won't normalize a lowercase "patch" → 400
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 401 && retry) {
      cachedToken = null; // force a fresh token and retry once
      return lemmaFetch<T>(method, path, body, false);
    }
    throw new Error(`Lemma ${method.toUpperCase()} ${path} → ${res.status} ${text.slice(0, 200)}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// --- Tables / records --------------------------------------------------------

export async function listRecords(table: string): Promise<LemmaRecord[]> {
  const data = await lemmaFetch<{ items?: LemmaRecord[] }>(
    "get",
    `/pods/${POD_ID}/datastore/tables/${table}/records?limit=500`
  );
  return data.items ?? [];
}

export async function updateRecord(
  table: string,
  recordId: string,
  fields: Record<string, unknown>
): Promise<void> {
  await lemmaFetch("patch", `/pods/${POD_ID}/datastore/tables/${table}/records/${recordId}`, {
    data: fields,
  });
}

// --- Agents (via conversations) ----------------------------------------------

interface LemmaMessage {
  role?: string;
  kind?: string;
  text?: string;
}

/**
 * Run a pod agent on a single message and return its parsed JSON reply.
 * Opens a conversation bound to the agent, sends the message, then polls until
 * the agent's final assistant TEXT message (pure JSON) arrives.
 */
export async function runAgentJSON<T>(
  agentName: string,
  message: string,
  timeoutMs = 120_000
): Promise<T> {
  if (!POD_ID) throw new Error("LEMMA_POD_ID is not set in .env.local.");
  const conv = await lemmaFetch<{ id: string }>("post", `/pods/${POD_ID}/conversations`, {
    agent_name: agentName,
  });

  // Sending a message returns a Server-Sent-Events stream that stays open until
  // the agent finishes its run. Drain it to completion (with a timeout safety
  // net), then read the final messages as JSON.
  const token = await getToken();
  try {
    const res = await fetch(
      `${API_URL}/pods/${POD_ID}/conversations/${conv.id}/messages`,
      {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "text/event-stream",
        },
        body: JSON.stringify({ content: message }),
        signal: AbortSignal.timeout(timeoutMs),
      }
    );
    await res.text(); // blocks until the agent's run completes
  } catch {
    /* stream aborted/errored — fall through and read whatever landed */
  }

  const data = await lemmaFetch<{ items?: LemmaMessage[] }>(
    "get",
    `/pods/${POD_ID}/conversations/${conv.id}/messages`
  );
  const replies = (data.items ?? [])
    .filter((m) => m.role === "assistant" && m.kind === "TEXT" && m.text)
    .map((m) => m.text as string);
  if (replies.length) return parseAgentJSON<T>(replies[replies.length - 1]);
  throw new Error(`Lemma agent '${agentName}' produced no reply`);
}

function parseAgentJSON<T>(text: string): T {
  const trimmed = (text || "").trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start !== -1 && end > start) return JSON.parse(trimmed.slice(start, end + 1)) as T;
    throw new Error(`Agent reply was not JSON: ${trimmed.slice(0, 160)}`);
  }
}
