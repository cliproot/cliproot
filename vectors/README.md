# `spx-prov` Conformance Vectors

This directory is the canonical, language-neutral source for `spx-prov` conformance fixtures.

## Layout

- `v0.3/manifest.json`: top-level index of vector metadata.
- `v0.3/<case-dir>/case.json`: vector metadata and runner wiring.
- `v0.3/<case-dir>/input/*.json`: deterministic input fixtures.
- `v0.3/<case-dir>/expected/*.json`: expected outcomes and reason code assertions.
- `v0.3/<case-dir>/notes.md`: human rationale for the vector.

## Runner Contract

The required runner hook surface is documented in `docs/conformance_runner_contract.md`:

- `parseEnvelope`
- `validateEnvelope`
- `evaluatePolicy`
- `processTransferClaim`
- `verifyIdempotency`

## Determinism Rules

- Each case includes a fixed RFC 3339 `runner.clock` value.
- Implementations must produce stable reason codes for the same inputs.
- `claimId` and `toolCallId` replay behavior must be idempotent.

## Semver Policy for Vectors

- `v0.3.x` for additive vectors and expectation clarifications.
- `v0.4.0` for breaking expectation changes.

## Local Validation

Run from repository root:

```bash
python3 tools/conformance/validate_vectors.py --manifest vectors/v0.3/manifest.json
```
