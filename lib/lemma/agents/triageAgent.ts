// lib/lemma/agents/triageAgent.ts
// -----------------------------------------------------------------------------
// Triage Agent — reads raw customer feedback and produces a structured
// classification (severity + issue type + key details + confidence + action).
// -----------------------------------------------------------------------------

import type { Severity } from "@/types";
import { generateJSON } from "./structured";

export interface TriageAgentInput {
  feedbackText: string;
  professionalName: string;
  serviceType: string;
}

/** The agent's raw output — workflow adds feedbackId / professionalId / processedAt. */
export interface TriageAgentOutput {
  severity: Severity;
  issueType: string;
  keyDetails: string;
  confidence: number;
  recommendedAction: string;
}

const SYSTEM_PROMPT = `You are a quality operations assistant for a home-services platform that manages gig beauty and wellness professionals. Your job is to analyze customer feedback and classify it accurately.

Given a piece of customer feedback, produce a JSON object with this exact structure — no preamble, no markdown, no explanation:

{
  "severity": "CRITICAL" | "WARNING" | "POSITIVE",
  "issueType": "<short label for the core problem or praise>",
  "keyDetails": "<1-2 sentences summarizing the specific issue or compliment>",
  "confidence": <float between 0.0 and 1.0>,
  "recommendedAction": "<short action phrase>"
}

Severity classification rules:
- CRITICAL: Physical harm, skin reactions, no-shows, dangerous product misuse, verbally abusive behavior, anything requiring immediate intervention.
- WARNING: Late arrivals (over 15 minutes), incomplete service, hygiene concerns, unprofessional behavior (short of CRITICAL), repeated mild issues.
- POSITIVE: Praise about quality, punctuality, professionalism, customer satisfaction, or intent to rebook.

Issue type examples: "Late Arrival", "Skin Reaction / Product Misuse", "Incomplete Service", "Hygiene Concern", "Excellent Service Quality", "Repeat Punctuality Issue", "Missing Service Items".

Recommended action examples: "Immediate escalation + medical follow-up", "Quality flag + retraining required", "Escalate to area manager + refund consideration", "Log as testimonial + quality boost", "Manager review + warning issuance".

Use Indian English conventions (the platform is India-based).`;

const TRIAGE_SCHEMA = {
  type: "object",
  properties: {
    severity: { type: "string", enum: ["CRITICAL", "WARNING", "POSITIVE"] },
    issueType: { type: "string" },
    keyDetails: { type: "string" },
    confidence: { type: "number" },
    recommendedAction: { type: "string" },
  },
  required: ["severity", "issueType", "keyDetails", "confidence", "recommendedAction"],
  additionalProperties: false,
} as const;

/** Run the Triage Agent on a single piece of feedback. */
export async function runTriageAgent(
  input: TriageAgentInput
): Promise<TriageAgentOutput> {
  const user = `Customer feedback to classify:

Professional: ${input.professionalName}
Service: ${input.serviceType}
Feedback: "${input.feedbackText}"`;

  return generateJSON<TriageAgentOutput>({
    system: SYSTEM_PROMPT,
    user,
    schema: TRIAGE_SCHEMA as unknown as Record<string, unknown>,
    schemaName: "triage_result",
    maxTokens: 512,
  });
}
