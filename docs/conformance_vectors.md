# Conformance Vectors Guide (`spx-prov` v0.3)

## Purpose

This guide explains how to consume, extend, and review conformance vectors for `spx-prov`.

Initial publication scope covers Interop Levels 1-4.

## Canonical Locations

- Vector fixtures: `vectors/v0.3/`
- Vector manifest: `vectors/v0.3/manifest.json`
- Schemas:
  - `schemas/conformance-manifest-0.3.schema.json`
  - `schemas/conformance-vector-case-0.3.schema.json`
  - `schemas/conformance-expected-outcome-0.3.schema.json`
  - `schemas/conformance-result-envelope-0.3.schema.json`
- Runner contract: `docs/conformance_runner_contract.md`

## How to Consume Vectors

1. Load `manifest.json`.
2. For each manifest entry, load `<path>/case.json`.
3. Execute listed `runner.operations` in order using `runner.inputFiles`.
4. Compare output to `runner.expectedFile`.
5. Emit a result envelope report in `conformance_reports/v0.3/<implementation>/<date>.json`.

## How to Add a Vector

1. Create a new case directory under `vectors/v0.3/`.
2. Add:
   - `case.json`
   - `input/*.json`
   - `expected/*.json`
   - `notes.md`
3. Add the new case to `vectors/v0.3/manifest.json`.
4. Keep `vectorId` stable and globally unique.
5. Use deterministic fixtures and a fixed `runner.clock`.

## Naming Rules

- `vectorId`: uppercase with underscores, for example `VEC_L4_TEXT_HASH_MISMATCH_REJECTED`.
- case directory: numeric prefix + snake case, for example `17_text_hash_mismatch_rejected`.

## Determinism Rules

- Use explicit timestamps in input fixtures.
- Avoid random IDs in expected outputs.
- Idempotency vectors must prove replay safety (`claimId` duplicate behavior).

## Review Rules

If protocol behavior changes:

1. Update the relevant vector(s).
2. Document compatibility impact.
3. Update `updatedIn` for modified vectors.
4. Include reason-code deltas in PR description.

PRs that change `expected/*.json` without protocol-change rationale should be rejected.

## CI Rollout Policy

- Phase A: warn-only (non-blocking) vector checks.
- Phase B: baseline stabilization and flaky vector triage.
- Phase C: required blocking checks for touched implementations.

## Release Artifact Policy

`vectors/` is the canonical source. Downstream packages (for example `@provenance/spx-prov-spec` and `@provenance/spx-prov-conformance`) should import the exact same vectors at release time.

Use:

```bash
./tools/conformance/export_release_artifacts.sh
```

If package directories are not present yet, the script exits successfully and prints skipped targets.

## Local Commands

```bash
python3 tools/conformance/validate_vectors.py --manifest vectors/v0.3/manifest.json
python3 tools/conformance/generate_matrix.py \
  --reports-root conformance_reports/v0.3 \
  --manifest vectors/v0.3/manifest.json \
  --output docs/conformance_matrix.md
```
