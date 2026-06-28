// lib/lemma/store.ts
// -----------------------------------------------------------------------------
// Internal persistence singleton backing the "Datastore" (professionals) and
// "Document Store" (feedback). Seeded from data/seed.json on first access.
//
// Why a local store: the real Lemma is an observability platform, not a database
// (see config.ts). For the demo we keep professionals + feedback in a process
// singleton — fast, deterministic, and shared across all API routes in one
// `next dev` / `next start` process. Writes are also flushed to disk best-effort
// so state survives restarts and is inspectable. datastore.ts / documentStore.ts
// expose the clean CRUD surface the prompt describes; this file is the plumbing.
// -----------------------------------------------------------------------------

import { promises as fs } from "node:fs";
import path from "node:path";
import type { ServiceProfessional, CustomerFeedback } from "@/types";

interface StoreShape {
  professionals: ServiceProfessional[];
  feedback: CustomerFeedback[];
  seeded: boolean;
}

interface SeedShape {
  professionals: ServiceProfessional[];
  feedback: CustomerFeedback[];
}

// Persist alongside the seed so it's easy to find/inspect; falls back silently
// on read-only filesystems (e.g. serverless), where the in-memory copy is used.
const DATA_DIR = path.join(process.cwd(), "data");
const SEED_PATH = path.join(DATA_DIR, "seed.json");
const STORE_PATH = path.join(DATA_DIR, "store.runtime.json");

// Survive Next.js dev hot-reloads by stashing the singleton on globalThis.
const globalRef = globalThis as unknown as { __gigopsStore?: StoreShape };

function emptyStore(): StoreShape {
  return { professionals: [], feedback: [], seeded: false };
}

async function loadSeed(): Promise<SeedShape> {
  const raw = await fs.readFile(SEED_PATH, "utf-8");
  return JSON.parse(raw) as SeedShape;
}

/**
 * Return the singleton store, seeding it on first access. On cold start we
 * prefer a previously-persisted runtime store; otherwise we load seed.json.
 */
export async function getStore(): Promise<StoreShape> {
  if (globalRef.__gigopsStore?.seeded) {
    return globalRef.__gigopsStore;
  }

  const store = globalRef.__gigopsStore ?? emptyStore();

  // Try a previously-persisted runtime snapshot first.
  try {
    const raw = await fs.readFile(STORE_PATH, "utf-8");
    const snapshot = JSON.parse(raw) as SeedShape;
    if (snapshot.professionals?.length) {
      store.professionals = snapshot.professionals;
      store.feedback = snapshot.feedback ?? [];
      store.seeded = true;
      globalRef.__gigopsStore = store;
      console.log("[lemma:store] restored runtime snapshot from disk");
      return store;
    }
  } catch {
    /* no snapshot yet — fall through to seed */
  }

  const seed = await loadSeed();
  // Deep clone so mutations never touch the seed objects.
  store.professionals = structuredClone(seed.professionals);
  store.feedback = structuredClone(seed.feedback);
  store.seeded = true;
  globalRef.__gigopsStore = store;
  console.log(
    `[lemma:store] seeded ${store.professionals.length} professionals, ${store.feedback.length} feedback entries`
  );
  await persist();
  return store;
}

/** Flush the current store to disk (best-effort; ignored on read-only FS). */
export async function persist(): Promise<void> {
  const store = globalRef.__gigopsStore;
  if (!store) return;
  try {
    await fs.writeFile(
      STORE_PATH,
      JSON.stringify(
        { professionals: store.professionals, feedback: store.feedback },
        null,
        2
      ),
      "utf-8"
    );
  } catch {
    /* serverless / read-only fs — in-memory copy is the source of truth */
  }
}

/** Test/demo helper: wipe the runtime store so the next access re-seeds. */
export async function resetStore(): Promise<void> {
  globalRef.__gigopsStore = emptyStore();
  try {
    await fs.unlink(STORE_PATH);
  } catch {
    /* nothing to remove */
  }
}
