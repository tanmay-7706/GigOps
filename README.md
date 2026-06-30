# GigOps — AI Operations Agent for Gig Workforce Platforms

> Built for the Gappy AI Hackathon (Lemma SDK) | June 2026

GigOps is an agentic operations desk for home-services platforms managing large
gig workforces. Customer feedback flows through a **Lemma** pod — two Lemma
agents (Triage + Action) classify severity, draft the operational response, and
update professional quality scores in Lemma tables. A Next.js operator dashboard
shows a live Team Health Board.

## What it does
- Triages a queue of customer feedback in under a minute
- Classifies each as CRITICAL / WARNING / POSITIVE with a **Lemma Triage agent**
- Drafts the escalation message + internal ops note via a **Lemma Action agent**
- Updates complaint counts, flag status, and quality scores in **Lemma tables**
- Shows area managers a live Team Health Board — zero manual input

## Built on Lemma
Everything operational lives in a **Lemma pod** (`gigops`):

| Lemma primitive | GigOps usage |
| --- | --- |
| **Table** `professionals` | the Datastore — service-professional profiles |
| **Table** `feedback` | the Document Store — customer feedback + attached triage/action |
| **Agent** `triage` | classifies feedback → `{severity, issueType, keyDetails, confidence}` |
| **Agent** `action` | drafts → `{actionType, escalationMessage, internalNote, scoreAdjustment}` |

The pod definition is an importable bundle in [`lemma-pod/`](lemma-pod). Agents
run on Lemma's built-in runtime. The Next.js server talks to the pod over Lemma's
REST API (`lib/lemma/lemmaRest.ts`); auth is handled by the Lemma CLI and tokens
auto-refresh — no API key in the app.

## Stack
- Next.js 16 (App Router) + TypeScript · Tailwind CSS + shadcn
- Lemma (lemma.work, by Gappy AI) — pod, tables, agents, REST SDK

## Backend architecture (`/lib/lemma`)
| Module | Responsibility |
| --- | --- |
| `lemmaRest.ts` | REST client for the Lemma pod (records, agents) + token auto-refresh |
| `datastore.ts` | professionals table ↔ `ServiceProfessional` |
| `documentStore.ts` | feedback table ↔ `CustomerFeedback` (+ triage/action JSON) |
| `agents/triageAgent.ts` | calls the Lemma `triage` agent |
| `agents/actionAgent.ts` | calls the Lemma `action` agent |
| `functions/qualityScore.ts` | quality-score + status recalculation |
| `workflow.ts` | `gigops-triage-workflow` — runs both agents over pending feedback, writes back to Lemma |

## API routes
| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/professionals` | All professionals, sorted by score ascending |
| GET | `/api/professionals/:id` | One professional + their feedback history |
| GET | `/api/feedback?status=` | Feedback (optional status filter), newest first |
| GET | `/api/feedback/:id` | One feedback doc (+ triage result & action draft) |
| POST | `/api/run-triage-workflow` | Run the triage workflow over pending feedback |
| POST | `/api/approve-action/:feedbackId` | Approve action, apply score adjustment |
| GET | `/api/dashboard/stats` | Team Health Board aggregates |

All responses use the envelope `{ success, data, error }`.

## Setup
```bash
npm install
uv tool install lemma-terminal          # the Lemma CLI
lemma auth login                        # browser login (once)
lemma pod import ./lemma-pod --pod gigops   # create + import the pod (first time)
cp .env.example .env.local              # set LEMMA_POD_ID (lemma pod get gigops)
npm run dev
```

## Try it / demo
```bash
npm run lemma:reset    # reset the pod to a clean pending state before a demo
# then in the app: open /dashboard → "Run Triage Workflow" → open a CRITICAL case → Approve
npm run demo           # or run the whole loop from the CLI
```

## Team
Built by Tanmay Singh & Aaryan Yadav — B.Tech CS-AI, Newton School of Technology
