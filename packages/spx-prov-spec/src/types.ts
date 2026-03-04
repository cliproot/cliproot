import type {
  FIRST_VECTOR_ID,
  POLICY_OUTCOMES,
  RECEIPT_STATUSES,
  RIGHTS_POLICY_MODES,
} from "./constants";

export type RightsPolicyMode = (typeof RIGHTS_POLICY_MODES)[number];
export type PolicyOutcome = (typeof POLICY_OUTCOMES)[number];
export type ReceiptStatus = (typeof RECEIPT_STATUSES)[number];

export interface SpxProvSegment {
  segmentId: string;
  order: number;
  text: string;
  entityId: string;
  textHash: string;
  rights: {
    policyMode: RightsPolicyMode;
  };
}

export interface SpxProvEnvelopeV03 {
  protocol: string;
  version: string;
  bundleId: string;
  sourceInstance: string;
  segments: SpxProvSegment[];
  signature: {
    alg: string;
    kid: string;
    sig: string;
  };
}

export interface ConformanceVectorManifestEntry {
  vectorId: string;
  path: string;
  level: number;
  category: string;
  requires: string[];
  tags: string[];
  status: string;
  introducedIn: string;
  updatedIn: string;
}

export interface ConformanceVectorManifest {
  protocol: string;
  vectorSetVersion: string;
  manifestVersion: string;
  runnerContractVersion: string;
  vectorSemverPolicy: {
    additive: string;
    breaking: string;
  };
  vectors: ConformanceVectorManifestEntry[];
}

export interface ConformanceVectorCase {
  vectorId: string;
  title: string;
  level: number;
  category: string;
  description: string;
  requires: string[];
  tags: string[];
  status: string;
  introducedIn: string;
  updatedIn: string;
  runner: {
    clock: string;
    operations: string[];
    inputFiles: Record<string, string>;
    expectedFile: string;
  };
}

export interface ReasonCodeAssertion {
  code: string;
  scope: string;
  mustExist: boolean;
}

export interface ExpectedOutcome {
  policyOutcome: PolicyOutcome;
  receiptStatus: ReceiptStatus;
  reasonCodes: ReasonCodeAssertion[];
  persistedArtifacts: {
    activities: string[];
    claims: string[];
    receipts: string[];
    decisions: string[];
  };
  auditEvents: Array<{
    phase: string;
    status: string;
    reasonCode: string;
  }>;
}

export type VectorRunStatus = "pass" | "fail";

export interface VectorRunResult {
  vectorId: string;
  status: VectorRunStatus;
  reasonCodesFound: string[];
  details: {
    policyOutcome?: string;
    receiptStatus?: string;
    errors: string[];
    operationsExecuted: string[];
  };
}

export interface LoadedVectorCase {
  manifestEntry: ConformanceVectorManifestEntry;
  caseDefinition: ConformanceVectorCase;
  payload: unknown;
  expected: ExpectedOutcome;
}

export type SupportedVectorId = typeof FIRST_VECTOR_ID;
