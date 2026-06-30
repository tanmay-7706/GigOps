// lib/lemma/agents/actionAgent.ts
// Calls the Lemma `action` agent (system prompt at
// lemma-pod/agents/action/instruction.md) and returns the parsed action draft.

import type { ActionType, Severity } from "@/types";
import { runAgentJSON } from "../lemmaRest";

export interface ActionAgentInput {
  severity: Severity;
  issueType: string;
  keyDetails: string;
  professionalName: string;
  customerName: string;
}

export interface ActionAgentOutput {
  actionType: ActionType;
  escalationMessage: string;
  internalNote: string;
  qualityScoreAdjustment: number;
}

export function runActionAgent(input: ActionAgentInput): Promise<ActionAgentOutput> {
  const message =
    "Classified complaint to act on:\n\n" +
    `Severity: ${input.severity}\n` +
    `Issue type: ${input.issueType}\n` +
    `Key details: ${input.keyDetails}\n` +
    `Professional: ${input.professionalName}\n` +
    `Customer: ${input.customerName}`;
  return runAgentJSON<ActionAgentOutput>("action", message);
}
