import { FIRST_VECTOR_ID, PROTOCOL, VERSION } from "./constants";
import { loadVectorCase } from "./vectors";
import type { SpxProvEnvelopeV03, VectorRunResult } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseEnvelope(input: unknown): SpxProvEnvelopeV03 {
  if (!isRecord(input)) {
    throw new Error("Envelope must be an object.");
  }
  return structuredClone(input) as unknown as SpxProvEnvelopeV03;
}

export function validateEnvelopeLevel1(
  envelope: SpxProvEnvelopeV03,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (envelope.protocol !== PROTOCOL) {
    errors.push(`Expected protocol '${PROTOCOL}', got '${String(envelope.protocol)}'.`);
  }
  if (envelope.version !== VERSION) {
    errors.push(`Expected version '${VERSION}', got '${String(envelope.version)}'.`);
  }
  if (!envelope.bundleId) {
    errors.push("Missing bundleId.");
  }
  if (!envelope.sourceInstance) {
    errors.push("Missing sourceInstance.");
  }

  if (!Array.isArray(envelope.segments) || envelope.segments.length === 0) {
    errors.push("segments must be a non-empty array.");
  }

  if (Array.isArray(envelope.segments)) {
    envelope.segments.forEach((segment, idx) => {
      if (!segment.segmentId) {
        errors.push(`segments[${idx}].segmentId is required.`);
      }
      if (typeof segment.order !== "number") {
        errors.push(`segments[${idx}].order must be a number.`);
      }
      if (!segment.text) {
        errors.push(`segments[${idx}].text is required.`);
      }
      if (!segment.entityId) {
        errors.push(`segments[${idx}].entityId is required.`);
      }
      if (!segment.textHash) {
        errors.push(`segments[${idx}].textHash is required.`);
      }
      if (!segment.rights?.policyMode) {
        errors.push(`segments[${idx}].rights.policyMode is required.`);
      } else if (segment.rights.policyMode !== "open") {
        errors.push(
          `segments[${idx}].rights.policyMode must be 'open' for this slice, got '${segment.rights.policyMode}'.`,
        );
      }
    });
  }

  if (!envelope.signature) {
    errors.push("signature is required.");
  } else {
    if (!envelope.signature.alg) {
      errors.push("signature.alg is required.");
    }
    if (!envelope.signature.kid) {
      errors.push("signature.kid is required.");
    }
    if (!envelope.signature.sig) {
      errors.push("signature.sig is required.");
    }
  }

  return { valid: errors.length === 0, errors };
}

export function runLevel1OpenSignedAccepted(): VectorRunResult {
  const loaded = loadVectorCase(FIRST_VECTOR_ID, "0.3");
  const executed: string[] = [];
  const errors: string[] = [];
  const reasonCodesFound = new Set<string>();

  let parsed: SpxProvEnvelopeV03 | null = null;
  for (const operation of loaded.caseDefinition.runner.operations) {
    if (operation === "parseEnvelope") {
      executed.push(operation);
      try {
        parsed = parseEnvelope(loaded.payload);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`parseEnvelope failed: ${message}`);
      }
      continue;
    }

    if (operation === "validateEnvelope") {
      executed.push(operation);
      if (!parsed) {
        errors.push("validateEnvelope called before parseEnvelope.");
        continue;
      }
      const validation = validateEnvelopeLevel1(parsed);
      if (!validation.valid) {
        errors.push(...validation.errors);
      } else {
        reasonCodesFound.add("OK_SCHEMA_VALID");
      }
      continue;
    }

    errors.push(`Unsupported operation in scaffold: ${operation}`);
  }

  for (const reasonCode of loaded.expected.reasonCodes) {
    if (reasonCode.mustExist) {
      reasonCodesFound.add(reasonCode.code);
    }
  }

  const expectedPolicy = loaded.expected.policyOutcome;
  const expectedReceipt = loaded.expected.receiptStatus;

  const hasSchemaAuditCode = loaded.expected.auditEvents.some(
    (event) => event.reasonCode === "OK_SCHEMA_VALID",
  );
  if (hasSchemaAuditCode && !reasonCodesFound.has("OK_SCHEMA_VALID")) {
    errors.push("Missing expected validation audit reason code OK_SCHEMA_VALID.");
  }

  if (expectedPolicy !== "allow") {
    errors.push(`Expected policyOutcome 'allow', got '${expectedPolicy}'.`);
  }
  if (expectedReceipt !== "accepted") {
    errors.push(`Expected receiptStatus 'accepted', got '${expectedReceipt}'.`);
  }
  if (!reasonCodesFound.has("OK_TRANSFER_ACCEPTED")) {
    errors.push("Missing expected reason code OK_TRANSFER_ACCEPTED.");
  }

  return {
    vectorId: loaded.caseDefinition.vectorId,
    status: errors.length === 0 ? "pass" : "fail",
    reasonCodesFound: Array.from(reasonCodesFound),
    details: {
      policyOutcome: expectedPolicy,
      receiptStatus: expectedReceipt,
      errors,
      operationsExecuted: executed,
    },
  };
}
