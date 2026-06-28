# GigOps — AI Operations Agent for Gig Workforce Platforms

> Built for the Gappy AI Hackathon (Lemma SDK) | June 2026

GigOps is an agentic operations desk for home-services platforms managing
large gig workforces. It processes customer feedback through an AI workflow —
classifying severity, drafting escalation actions, and updating professional
quality scores automatically — with the whole pipeline observable in Lemma.

## What it does
- Triages 50–100 customer feedback messages in under 60 seconds
- Classifies each as CRITICAL / WARNING / POSITIVE using a **Triage Agent**
- Drafts escalation messages and internal ops notes via an **Action Agent**
- Updates gig worker quality scores automatically
- Shows area managers a live Team Health Board — zero manual input
- Emits an OpenTelemetry trace for every workflow run to **Lemma**

## Built With
- Next.js 16 (App Router) + TypeScript
- Tailwind CSS + Shadcn UI
- **Groq** (`llama-3.3-70b-versatile`) — powers the Triage & Action agents
- **Lemma** — observability layer; the triage workflow exports OpenTelemetry
  traces so every agent step is auditable

> **A note on Lemma.** Lemma (uselemma.ai) is a production *observability /
> monitoring* platform for AI agents — it ingests OpenTelemetry traces and
> surfaces silent failures and drift. It is not an agent-building SDK. GigOps
> therefore runs its agent reasoning on Groq (LLM inference) and integrates Lemma
> for what it actually does: tracing the workflow end-to-end. Set
> `LEMMA_OTLP_ENDPOINT` + `LEMMA_API_KEY` to export; without them, every span is
> logged to the console and the app still works fully.

## Backend architecture (`/lib/lemma`)
| Module | Responsibility |
| --- | --- |
| `config.ts` | Groq client + Lemma tracing (`withSpan` / `withWorkflowTrace`) |
| `store.ts` | Seeded in-memory + on-disk store (from `data/seed.json`) |
| `datastore.ts` | Professional-profile CRUD ("Datastore") |
| `documentStore.ts` | Customer-feedback CRUD ("Document Store") |
| `agents/triageAgent.ts` | Triage Agent — classifies feedback (structured JSON) |
| `agents/actionAgent.ts` | Action Agent — drafts escalation / note / score delta |
| `functions/qualityScore.ts` | Quality-score + status recalculation |
| `workflow.ts` | `gigops-triage-workflow` — orchestrates both agents, fully traced |

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
git clone https://github.com/tanmay-7706/gigops
cd gigops
npm install
cp .env.example .env.local   # add GROQ_API_KEY (Lemma vars optional)
npm run dev
```

## Try the workflow
```bash
# Run the triage workflow (watch the [lemma:trace] / [workflow] logs in the terminal)
curl -X POST http://localhost:3000/api/run-triage-workflow

# See the results
curl "http://localhost:3000/api/feedback?status=triaged"
curl http://localhost:3000/api/dashboard/stats

# Approve a CRITICAL item (applies the quality-score adjustment)
curl -X POST http://localhost:3000/api/approve-action/fb_001 \
  -H 'Content-Type: application/json' -d '{"approvedMessage":"..."}'
```

## Team
Built by Tanmay Singh & Aaryan Yadav — B.Tech CS-AI, Newton School of Technology
