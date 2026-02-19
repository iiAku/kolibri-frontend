
Observations:

- Calls to `rpc.tzbeta.net` fail with CORS errors.
- Calls to `rpc.tzkt.io` succeed.
- S3 data endpoints load correctly.
- Failure likely caused by outdated RPC fallback logic or deprecated endpoint usage.

Tasks:

1. Identify where `rpc.tzbeta.net` is configured or hardcoded.
2. Verify RPC selection/fallback logic.
3. Replace deprecated or non-CORS-compatible endpoints.
4. Ensure RPC providers used support browser CORS requests.
5. Add safer fallback handling if an RPC endpoint fails.
6. Confirm `/all-ovens` loads successfully after fix.

Important:

- Do not change protocol logic — only infrastructure compatibility.
- Maintain same data semantics.

---

## Phase 5 — Oven Computation Verification & Fix

Known issue:  
Some imprecision exists when creating ovens near maximum values and limit computations.

Tasks:

1. Locate all oven-related computations:
    - max value logic
    - rounding
    - limits
    - validation
2. Identify numerical inconsistencies:
    - float precision
    - boundary conditions
    - UI vs backend mismatch
3. Fix while preserving expected outputs.

Requirements:

- No regression in normal ranges.
- Explicit handling of edge/max values.
- Add lightweight safeguards where needed.

---

## Phase 6 — UI & Logic Sanity Check

Not a visual redesign — only correctness.

Verify:

- Forms behave identically
- Limits and computed values match expectations
- Navigation flows unchanged
- No console errors
- State updates correctly

Focus on logic correctness rather than styling.

---

## Phase 7 — CI / Deployment Integrity

Ensure existing automation still works:

- GitHub Actions pipelines pass
- Docker build succeeds
- Cloudflare Workers deployment still functions
- Production build artifacts equivalent

If CI breaks:
- adapt configs minimally
- do not redesign pipeline unless unavoidable.

---

## Phase 8 — Self-Verification (MANDATORY)

Before declaring completion, perform:

### Build checks
- clean install
- dev build
- production build

### Runtime checks
- navigate main flows
- create/edit ovens
- test max/limit edge cases
- verify `/all-ovens` loads correctly

### Regression checks
- compare behavior with previous version
- confirm computations produce consistent results

Provide a final report including:
- what changed
- risks remaining
- areas needing human QA (if any)

---

## Expected Deliverable

- Modernized Nuxt-based frontend
- Updated dependencies
- Stable CI/deployment
- Fixed oven computation edge cases
- RPC/CORS production issue resolved
- No functional regressions

The application should behave indistinguishably from the previous version from a user perspective.
