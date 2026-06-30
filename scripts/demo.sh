#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# GigOps end-to-end demo / smoke test.
#
# Runs the full "Definition of Done" flow against a running dev server:
#   1. dashboard stats (before)   4. inspect one CRITICAL item's triage+action
#   2. run the triage workflow    5. approve that action
#   3. show triaged feedback      6. dashboard stats (after)
#
# Requires the Lemma pod (LEMMA_POD_ID) + `lemma auth login`. Run `npm run
# lemma:reset` first for a clean pending state.
# Usage:  npm run dev   # in one terminal
#         ./scripts/demo.sh [base_url]      (default http://localhost:3000)
# -----------------------------------------------------------------------------
set -euo pipefail

BASE="${1:-http://localhost:3000}"
PY=python3
hr() { printf '\n\033[1m== %s ==\033[0m\n' "$1"; }
jq_py() { $PY -c "import sys,json; d=json.load(sys.stdin); $1"; }

hr "0. Server reachable?"
curl -fsS "$BASE/api/dashboard/stats" >/dev/null && echo "ok: $BASE"

hr "1. Dashboard stats (before)"
curl -fsS "$BASE/api/dashboard/stats" | jq_py "print(json.dumps(d['data'], indent=2))"

hr "2. Run triage workflow (POST /api/run-triage-workflow)"
curl -fsS -X POST "$BASE/api/run-triage-workflow" | jq_py "
r=d['data']
print('processed:', r['processed'], '| failed:', len(r['failed']))
for x in r['results']: print(' ', x['feedbackId'], '->', x['severity'], '(', x['issueType'], ')')
for f in r['failed']: print('  FAILED', f['feedbackId'], ':', f['error'][:80])
"

hr "3. Triaged feedback (GET /api/feedback?status=triaged)"
curl -fsS "$BASE/api/feedback?status=triaged" | jq_py "
for f in d['data']:
    t=f.get('triageResult') or {}
    a=f.get('actionDraft') or {}
    print(' ', f['id'], f['professionalName'], '->', t.get('severity'), '/', a.get('actionType'))
"

hr "4. Inspect first CRITICAL item (triage result + action draft)"
CRIT=$(curl -fsS "$BASE/api/feedback?status=triaged" | jq_py "
crit=[f for f in d['data'] if (f.get('triageResult') or {}).get('severity')=='CRITICAL']
print(crit[0]['id'] if crit else '')
")
if [ -z "$CRIT" ]; then
  echo "No CRITICAL items found (did the workflow run with an API key?). Skipping approve step."
  exit 0
fi
echo "CRITICAL feedback: $CRIT"
curl -fsS "$BASE/api/feedback/$CRIT" | jq_py "
f=d['data']; t=f['triageResult']; a=f['actionDraft']
print('  severity        :', t['severity'], '(confidence', t['confidence'], ')')
print('  issueType       :', t['issueType'])
print('  keyDetails      :', t['keyDetails'])
print('  actionType      :', a['actionType'])
print('  escalationMsg   :', a['escalationMessage'])
print('  internalNote    :', a['internalNote'])
print('  scoreAdjustment :', a['qualityScoreAdjustment'])
"

hr "5. Approve the action (POST /api/approve-action/$CRIT)"
curl -fsS -X POST "$BASE/api/approve-action/$CRIT" \
  -H 'Content-Type: application/json' \
  -d '{"approvedMessage":"Approved by area manager."}' \
  | jq_py "print(json.dumps(d['data'], indent=2))"

hr "6. Dashboard stats (after)"
curl -fsS "$BASE/api/dashboard/stats" | jq_py "print(json.dumps(d['data'], indent=2))"

printf '\n\033[1m✓ demo flow complete\033[0m\n'
