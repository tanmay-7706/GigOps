// lib/lemma/agents/triageAgent.ts
// Calls the Lemma `triage` agent (its system prompt lives in the pod, at
// lemma-pod/agents/triage/instruction.md) and returns the parsed classification.

import type { Severity } from "@/types";
import { runAgentJSON } from "../lemmaRest";

export interface TriageAgentInput {
  feedbackText: string;
  professionalName: string;
  serviceType: string;
}

export interface TriageAgentOutput {
  severity: Severity;
  issueType: string;
  keyDetails: string;
  confidence: number;
  recommendedAction: string;
}

export function runTriageAgent(input: TriageAgentInput): Promise<TriageAgentOutput> {
  const message =
    "Customer feedback to classify:\n\n" +
    `Professional: ${input.professionalName}\n` +
    `Service: ${input.serviceType}\n` +
    `Feedback: "${input.feedbackText}"`;
  return runAgentJSON<TriageAgentOutput>("triage", message);
}
