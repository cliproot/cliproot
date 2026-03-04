import { useState } from "react";
import type { SampleAppVectorRunResult } from "./lib/types";
import { runVector } from "./lib/runVector";
import { ResultPanel } from "./components/ResultPanel";
import { VectorInspector } from "./components/VectorInspector";

export default function App() {
  const [result, setResult] = useState<SampleAppVectorRunResult | null>(null);

  async function handleRun(vectorId: string) {
    const runResult = await runVector(vectorId);
    setResult(runResult);
  }

  return (
    <main>
      <h1>spx-prov Sample App</h1>
      <VectorInspector onRun={handleRun} />
      <ResultPanel result={result} />
    </main>
  );
}
