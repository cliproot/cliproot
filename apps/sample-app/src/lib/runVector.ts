import { FIRST_VECTOR_ID, runLevel1OpenSignedAccepted } from "@provenance/spx-prov-spec";
import type { SampleAppVectorRunResult } from "./types";

export async function runVector(vectorId: string): Promise<SampleAppVectorRunResult> {
  if (vectorId === FIRST_VECTOR_ID) {
    return runLevel1OpenSignedAccepted();
  }

  return {
    vectorId,
    status: "fail",
    reasonCodesFound: [],
    details: {
      errors: [`Unsupported vector for sample-app scaffold: ${vectorId}`],
      operationsExecuted: [],
    },
  };
}
