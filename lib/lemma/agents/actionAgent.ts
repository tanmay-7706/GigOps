// lib/lemma/agents/actionAgent.ts
// -----------------------------------------------------------------------------
// Action Agent — given a triage result, drafts the operational action:
// a customer-facing message + an internal ops note + a quality-score delta.
// -----------------------------------------------------------------------------

import type { ActionType, Severity } from "@/types";
import { generateJSON } from "./structured";

export interface ActionAgentInput {
  severity: Severity;
  issueType: string;
  keyDetails: string;
  professionalName: string;
  customerName: string;
}

/** The agent's raw output — workflow adds feedbackId / createdAt. */
export interface ActionAgentOutput {
  actionType: ActionType;
  escalationMessage: string;
  internalNote: string;
  qualityScoreAdjustment: number;
}

const SYSTEM_PROMPT = `You are an operations communications specialist for a home-services platform. You receive a classified customer complaint (with severity, issue type, and key details) and must draft the operational response.

Produce a JSON object with this exact structure — no preamble, no markdown:

{
  "actionType": "ESCALATION" | "QUALITY_FLAG" | "TESTIMONIAL",
  "escalationMessage": "<professional, empathetic customer-facing message — 2-4 sentences>",
  "internalNote": "<direct internal instruction to the area manager — what to do, who to contact, what to watch>",
  "qualityScoreAdjustment": <number>
}

Action type rules (driven by severity):
- CRITICAL -> "ESCALATION": urgent, compensatory, personal tone.
- WARNING  -> "QUALITY_FLAG": apologetic but measured; promise to investigate.
- POSITIVE -> "TESTIMONIAL": warm thank-you; request to share as a review.

Quality score adjustment rules:
- CRITICAL: -0.4 to -0.5 depending on severity.
- WARNING: -0.1 to -0.2 depending on severity.
- POSITIVE: +0.1 to +0.15 depending on enthusiasm.

Keep escalationMessage under 80 words. Keep internalNote under 60 words.
Use Indian English conventions (the platform is India-based).
The professional's name MUST appear in internalNote for clarity.`;

const ACTION_SCHEMA = {
  type: "object",
  properties: {
    actionType: { type: "string", enum: ["ESCALATION", "QUALITY_FLAG", "TESTIMONIAL"] },
    escalationMessage: { type: "string" },
    internalNote: { type: "string" },
    qualityScoreAdjustment: { type: "number" },
  },
  required: ["actionType", "escalationMessage", "internalNote", "qualityScoreAdjustment"],
  additionalProperties: false,
} as const;

/** Run the Action Agent on a single triage result. */
export async function runActionAgent(
  input: ActionAgentInput
): Promise<ActionAgentOutput> {
  const user = `Classified complaint to act on:

Severity: ${input.severity}
Issue type: ${input.issueType}
Key details: ${input.keyDetails}
Professional: ${input.professionalName}
Customer: ${input.customerName}`;

  return generateJSON<ActionAgentOutput>({
    system: SYSTEM_PROMPT,
    user,
    schema: ACTION_SCHEMA as unknown as Record<string, unknown>,
    schemaName: "action_draft",
    maxTokens: 768,
  });
}
