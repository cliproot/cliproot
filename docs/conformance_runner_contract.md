# `spx-prov` Conformance Runner Contract (v0.1.0)

This document defines the implementation contract for running canonical vectors from `vectors/v0.3`.

## Goal

Provide a language-neutral adapter shape so any implementation can run the same vectors and emit a comparable result envelope.

## Required Hooks

All Level 1-4 candidate implementations must expose the following operations:

1. `parseEnvelope(input) -> ParsedEnvelope`
2. `validateEnvelope(parsed) -> ValidationResult`
3. `evaluatePolicy(context) -> PolicyDecision`
4. `processTransferClaim(claimContext) -> ReceiptResult`
5. `verifyIdempotency(replayContext) -> IdempotencyResult`

## Hook Semantics

### `parseEnvelope`
- Accepts raw clipboard or claim fixtures.
- Resolves transport precedence (`application/x-provenance+json` before fallback formats).
- Returns normalized structure for validation.

### `validateEnvelope`
- Enforces schema and protocol constraints.
- Must detect enum violations, duplicate segment IDs, non-contiguous order, hash mismatch, and stale grants.

### `evaluatePolicy`
- Uses normalized rights/access-control state and deterministic `runner.clock`.
- Must return one of:
  - `allow`
  - `allow_with_attribution`
  - `deny_no_permission`
  - `deny_license_violation`
  - `pending_owner_approval`

### `processTransferClaim`
- Processes transfer claim callback logic and receipt statuses.
- Must support partial pending outcomes for multi-origin vectors.

### `verifyIdempotency`
- Verifies duplicate `claimId` replay behavior.
- Must not duplicate persisted artifacts or side effects.

## Expected Outcome Contract

Each vector `expected/outcome.json` must include:

- `policyOutcome`
- `receiptStatus`
- `reasonCodes`
- `persistedArtifacts`
- `auditEvents`

Reason codes are asserted through `ReasonCodeAssertion` entries with `code`, `scope`, and `mustExist`.

## Result Envelope Contract

Runner output reports must follow `schemas/conformance-result-envelope-0.3.schema.json`:

- per-vector status: `pass | fail | skip`
- deterministic `failureReason` when non-pass
- optional `diagnostics` payload

## Determinism Requirements

- Use vector `runner.clock` as the authoritative current time.
- Do not mutate input fixtures in-place.
- The same inputs and clock must produce the same reason code set.

## Level 5 Note

`webmcp-imperative-v1` Level 5 tool-governance vectors are deferred from initial blocking scope and can be added in a subsequent `v0.3.x` vector release.
