# `spx-prov` Conformance Vectors `v0.3`

This vector set is the initial publication baseline for Interop Levels 1-4.

## Coverage Summary

- Level 1: import-only + fallback + v0.2 compatibility
- Level 2: callback and partial pending behavior
- Level 3: signature and idempotency checks
- Level 4: rights/grants enforcement and validation negatives

## Cases

- `VEC_L1_OPEN_SIGNED_ACCEPTED`
- `VEC_L1_MALFORMED_ENVELOPE_REJECTED`
- `VEC_L1_HTML_FALLBACK_LOW_CONFIDENCE`
- `VEC_L2_CALLBACK_PARTIAL_PENDING`
- `VEC_L3_INVALID_SIGNATURE_REJECTED`
- `VEC_L3_UNKNOWN_SOURCE_ENTITY_REJECTED`
- `VEC_L3_REPLAY_CLAIM_IDEMPOTENT`
- `VEC_L4_ATTRIBUTION_REQUIRED_ALLOW`
- `VEC_L4_PERMISSION_REQUIRED_ACTIVE_GRANT`
- `VEC_L4_PERMISSION_REQUIRED_NO_GRANT`
- `VEC_L4_PRIVATE_NO_COPY_NOTICE`
- `VEC_L4_GRANT_REVOKED_BEFORE_PASTE`
- `VEC_L4_GRANT_EXPIRED_REJECTED`
- `VEC_L4_INVALID_POLICY_ENUM_REJECTED`
- `VEC_L4_DUPLICATE_SEGMENT_ID_REJECTED`
- `VEC_L4_NON_CONTIGUOUS_ORDER_REJECTED`
- `VEC_L4_TEXT_HASH_MISMATCH_REJECTED`
- `VEC_L4_MIXED_POLICY_MULTI_ORIGIN`
- `VEC_L1_V02_COMPAT_INGEST`

Level 5 vectors are deferred to a follow-up `v0.3.x` vector release.
