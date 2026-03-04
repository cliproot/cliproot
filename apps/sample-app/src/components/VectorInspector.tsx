import { useState } from "react";
import { FIRST_VECTOR_ID } from "@provenance/spx-prov-spec";

interface VectorInspectorProps {
  onRun: (vectorId: string) => Promise<void>;
}

export function VectorInspector({ onRun }: VectorInspectorProps) {
  const [selectedVectorId] = useState(FIRST_VECTOR_ID);

  return (
    <section aria-label="vector-inspector">
      <h2>Protocol Inspector</h2>
      <p>Selected vector: {selectedVectorId}</p>
      <button type="button" onClick={() => onRun(selectedVectorId)}>
        Run Vector
      </button>
    </section>
  );
}
