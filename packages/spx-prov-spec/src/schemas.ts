import conformanceExpectedOutcomeSchema from "./generated/schemas/conformance-expected-outcome-0.3.schema.json";
import conformanceManifestSchema from "./generated/schemas/conformance-manifest-0.3.schema.json";
import conformanceResultSchema from "./generated/schemas/conformance-result-envelope-0.3.schema.json";
import conformanceVectorCaseSchema from "./generated/schemas/conformance-vector-case-0.3.schema.json";

export type SchemaName =
  | "conformanceManifest"
  | "conformanceVectorCase"
  | "conformanceExpectedOutcome"
  | "conformanceResultEnvelope";

const SCHEMAS: Record<SchemaName, unknown> = {
  conformanceManifest: conformanceManifestSchema,
  conformanceVectorCase: conformanceVectorCaseSchema,
  conformanceExpectedOutcome: conformanceExpectedOutcomeSchema,
  conformanceResultEnvelope: conformanceResultSchema,
};

export function getSchema(name: SchemaName): unknown {
  return SCHEMAS[name];
}
