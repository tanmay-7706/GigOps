// lib/lemma/agents/structured.ts
// -----------------------------------------------------------------------------
// Shared helper: call the LLM (Groq) and get back a validated JSON object.
//
// Uses Groq's JSON mode (response_format: { type: "json_object" }) so the model
// is constrained to emit a single JSON object. The agent system prompts spell
// out the exact shape; we still defensively parse in case of stray whitespace.
// `schema` is kept for documentation/validation intent (and easy upgrade to
// response_format json_schema on models that support strict structured outputs).
// -----------------------------------------------------------------------------

import { getGroq, AGENT_MODEL } from "../config";

export interface GenerateJSONOptions {
  system: string;
  user: string;
  schema: Record<string, unknown>;
  /** Short identifier for the schema (kept for readability/intent). */
  schemaName: string;
  maxTokens?: number;
}

export async function generateJSON<T>(opts: GenerateJSONOptions): Promise<T> {
  const client = getGroq();

  const completion = await client.chat.completions.create({
    model: AGENT_MODEL,
    max_tokens: opts.maxTokens ?? 1024,
    temperature: 0, // deterministic classification / drafting
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
  });

  const text = completion.choices[0]?.message?.content ?? "";
  return parseJSON<T>(text);
}

function parseJSON<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    // Defensive fallback: pull out the outermost JSON object.
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(text.slice(start, end + 1)) as T;
    }
    throw new Error(`Agent did not return valid JSON. Got: ${text.slice(0, 200)}`);
  }
}
