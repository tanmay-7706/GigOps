# GigOps — AI Operations Agent for Gig Workforce Platforms

> Built for the Gappy AI Hackathon (Lemma SDK) | June 2026

GigOps is an agentic operations desk for home-services platforms managing
large gig workforces. It processes customer feedback through a Lemma SDK
workflow — classifying severity, drafting escalation actions, and updating
professional quality scores automatically.

## What it does
- Triages 50–100 customer feedback messages in under 60 seconds
- Classifies each as CRITICAL / WARNING / POSITIVE using a Lemma AI Agent
- Drafts escalation messages and internal ops notes via a second Agent
- Updates gig worker quality scores in a Lemma Datastore automatically
- Shows area managers a live Team Health Board — zero manual input

## Built With
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + Shadcn UI
- Lemma SDK (Datastore, DocumentStore, Agents, Workflow, Functions)

## Setup
```bash
git clone https://github.com/tanmay-7706/gigops
cd gigops
npm install
cp .env.example .env.local   # fill in your keys
npm run dev
```

## Team
Built by Tanmay Singh & Aaryan Yadav — B.Tech CS-AI, Newton School of Technology
