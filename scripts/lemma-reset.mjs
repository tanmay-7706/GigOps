// scripts/lemma-reset.mjs
// Reset the Lemma `gigops` pod to the seed state (all feedback pending, triage/
// action cleared, professionals back to their seed scores/status). Run before a
// demo so you can show the full triage flow from scratch.
//
//   node scripts/lemma-reset.mjs
//
// Reads the pod id from LEMMA_POD_ID (or .env.local) and the token from the
// Lemma CLI (`lemma auth print-token`).

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

function envFromFile() {
  try {
    const out = {};
    for (const line of readFileSync(".env.local", "utf8").split("\n")) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m) out[m[1]] = m[2];
    }
    return out;
  } catch {
    return {};
  }
}

const env = { ...envFromFile(), ...process.env };
const POD = env.LEMMA_POD_ID;
const API = env.LEMMA_API_URL || "https://api.lemma.work";
if (!POD) throw new Error("LEMMA_POD_ID not set (in env or .env.local).");

const token = execFileSync(`${process.env.HOME}/.local/bin/lemma`, ["auth", "print-token"])
  .toString()
  .trim();
const H = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

async function listAll(table) {
  const res = await fetch(`${API}/pods/${POD}/datastore/tables/${table}/records?limit=500`, { headers: H });
  return (await res.json()).items ?? [];
}
async function patch(table, id, data) {
  const res = await fetch(`${API}/pods/${POD}/datastore/tables/${table}/records/${id}`, {
    method: "PATCH", // uppercase — undici won't normalize lowercase "patch"
    headers: H,
    body: JSON.stringify({ data }),
  });
  if (!res.ok) console.error(`  patch ${table}/${id} → ${res.status} ${(await res.text()).slice(0, 120)}`);
  return res.ok;
}

const seed = JSON.parse(readFileSync("data/seed.json", "utf8"));
const proSeed = new Map(seed.professionals.map((p) => [p.id, p]));

const feedback = await listAll("feedback");
let fb = 0;
for (const r of feedback) {
  if (await patch("feedback", r.id, {
    status: "pending", severity: null, triage_result: null, action_draft: null, approved_message: null,
  })) fb++;
}

const pros = await listAll("professionals");
let pr = 0;
for (const r of pros) {
  const s = proSeed.get(r.key);
  if (!s) continue;
  if (await patch("professionals", r.id, {
    quality_score: s.qualityScore, active_complaints: s.activeComplaints,
    status: s.status, total_bookings: s.totalBookings,
  })) pr++;
}

console.log(`reset complete — feedback: ${fb}/${feedback.length} pending, professionals: ${pr}/${pros.length} to seed`);
