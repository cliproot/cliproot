import manifestJson from "./generated/vectors/v0.3/manifest.json";
import openCaseJson from "./generated/vectors/v0.3/01_open_signed_accepted/case.json";
import openExpectedJson from "./generated/vectors/v0.3/01_open_signed_accepted/expected/outcome.json";
import openPayloadJson from "./generated/vectors/v0.3/01_open_signed_accepted/input/payload.json";
import { FIRST_VECTOR_ID } from "./constants";
import type {
  ConformanceVectorCase,
  ConformanceVectorManifest,
  ExpectedOutcome,
  LoadedVectorCase,
  SupportedVectorId,
} from "./types";

function isVectorVersion(version: string): version is "0.3" {
  return version === "0.3";
}

export function loadVectorManifest(version: "0.3" = "0.3"): ConformanceVectorManifest {
  if (!isVectorVersion(version)) {
    throw new Error(`Unsupported vector version: ${version}`);
  }
  return manifestJson as ConformanceVectorManifest;
}

const VECTORS: Record<SupportedVectorId, Omit<LoadedVectorCase, "manifestEntry">> = {
  [FIRST_VECTOR_ID]: {
    caseDefinition: openCaseJson as ConformanceVectorCase,
    payload: openPayloadJson,
    expected: openExpectedJson as unknown as ExpectedOutcome,
  },
};

export function loadVectorCase(vectorId: string, version: "0.3" = "0.3"): LoadedVectorCase {
  const manifest = loadVectorManifest(version);
  const manifestEntry = manifest.vectors.find((entry) => entry.vectorId === vectorId);
  if (!manifestEntry) {
    throw new Error(`Vector not found in manifest: ${vectorId}`);
  }

  if (vectorId !== FIRST_VECTOR_ID) {
    throw new Error(
      `Vector ${vectorId} is not implemented in this scaffold. Implemented: ${FIRST_VECTOR_ID}`,
    );
  }

  const vector = VECTORS[FIRST_VECTOR_ID];

  if (vector.caseDefinition.vectorId !== manifestEntry.vectorId) {
    throw new Error(
      `Manifest/case mismatch for ${vectorId}: case has ${vector.caseDefinition.vectorId}`,
    );
  }

  return {
    manifestEntry,
    caseDefinition: vector.caseDefinition,
    payload: vector.payload,
    expected: vector.expected,
  };
}
