export const PROTOCOL = "spx-prov";
export const VERSION = "0.3";

export const RIGHTS_POLICY_MODES = [
  "open",
  "attribution_required",
  "permission_required",
  "private_no_copy",
] as const;

export const POLICY_OUTCOMES = [
  "allow",
  "allow_with_attribution",
  "deny_no_permission",
  "deny_license_violation",
  "pending_owner_approval",
] as const;

export const RECEIPT_STATUSES = [
  "accepted",
  "accepted_with_attribution_required",
  "accepted_unsigned",
  "rejected_invalid_signature",
  "rejected_unknown_source_entity",
  "rejected_policy",
  "rejected_no_permission",
  "rejected_license_violation",
  "pending_async",
  "pending_owner_approval",
] as const;

export const FIRST_VECTOR_ID = "VEC_L1_OPEN_SIGNED_ACCEPTED" as const;
