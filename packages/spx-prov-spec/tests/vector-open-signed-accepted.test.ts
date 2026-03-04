import { describe, expect, it } from "vitest";
import {
  FIRST_VECTOR_ID,
  PROTOCOL,
  VERSION,
  loadVectorCase,
  loadVectorManifest,
  parseEnvelope,
  runLevel1OpenSignedAccepted,
  validateEnvelopeLevel1,
} from "../src/index";

describe("@provenance/spx-prov-spec scaffold", () => {
  it("loads manifest and finds the first vector", () => {
    const manifest = loadVectorManifest("0.3");
    expect(manifest.protocol).toBe(PROTOCOL);
    expect(manifest.vectorSetVersion).toBe(VERSION);

    const entry = manifest.vectors.find((vector) => vector.vectorId === FIRST_VECTOR_ID);
    expect(entry).toBeDefined();
    expect(entry?.path).toBe("01_open_signed_accepted");
  });

  it("loads vector case and payload by vector id", () => {
    const loaded = loadVectorCase(FIRST_VECTOR_ID, "0.3");
    expect(loaded.caseDefinition.vectorId).toBe(FIRST_VECTOR_ID);
    expect(loaded.manifestEntry.vectorId).toBe(FIRST_VECTOR_ID);
    expect(loaded.expected.policyOutcome).toBe("allow");
  });

  it("parses and validates the first vector payload", () => {
    const loaded = loadVectorCase(FIRST_VECTOR_ID, "0.3");
    const envelope = parseEnvelope(loaded.payload);
    const validation = validateEnvelopeLevel1(envelope);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toEqual([]);
  });

  it("runs the first vector and returns pass", () => {
    const result = runLevel1OpenSignedAccepted();
    expect(result.status).toBe("pass");
    expect(result.reasonCodesFound).toContain("OK_TRANSFER_ACCEPTED");
    expect(result.reasonCodesFound).toContain("OK_SCHEMA_VALID");
  });

  it("fails validation when version is missing", () => {
    const loaded = loadVectorCase(FIRST_VECTOR_ID, "0.3");
    const envelope = parseEnvelope(loaded.payload);
    delete (envelope as { version?: string }).version;

    const validation = validateEnvelopeLevel1(envelope);
    expect(validation.valid).toBe(false);
    expect(validation.errors.join(" ")).toContain("Expected version");
  });

  it("fails validation when rights.policyMode is missing", () => {
    const loaded = loadVectorCase(FIRST_VECTOR_ID, "0.3");
    const envelope = parseEnvelope(loaded.payload);
    delete (envelope.segments[0].rights as { policyMode?: string }).policyMode;

    const validation = validateEnvelopeLevel1(envelope);
    expect(validation.valid).toBe(false);
    expect(validation.errors.join(" ")).toContain("rights.policyMode is required");
  });

  it("fails validation when protocol is wrong", () => {
    const loaded = loadVectorCase(FIRST_VECTOR_ID, "0.3");
    const envelope = parseEnvelope(loaded.payload);
    (envelope as { protocol: string }).protocol = "not-spx-prov";

    const validation = validateEnvelopeLevel1(envelope);
    expect(validation.valid).toBe(false);
    expect(validation.errors.join(" ")).toContain("Expected protocol");
  });
});
