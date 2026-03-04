import type { SampleAppVectorRunResult } from "../lib/types";

interface ResultPanelProps {
  result: SampleAppVectorRunResult | null;
}

export function ResultPanel({ result }: ResultPanelProps) {
  if (!result) {
    return (
      <section aria-label="result-panel">
        <h2>Result</h2>
        <p>No run yet.</p>
      </section>
    );
  }

  return (
    <section aria-label="result-panel">
      <h2>Result</h2>
      <p>Vector: {result.vectorId}</p>
      <p>Status: {result.status}</p>
      <p>Policy Outcome: {result.details.policyOutcome ?? "n/a"}</p>
      <p>Receipt Status: {result.details.receiptStatus ?? "n/a"}</p>
      <p>Reason Codes: {result.reasonCodesFound.join(", ") || "none"}</p>
      {result.details.errors.length > 0 ? (
        <ul>
          {result.details.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
