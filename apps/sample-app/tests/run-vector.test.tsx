import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { FIRST_VECTOR_ID } from "@provenance/spx-prov-spec";
import App from "../src/App";
import { runVector } from "../src/lib/runVector";

describe("sample-app vector flow", () => {
  it("runVector returns pass for VEC_L1_OPEN_SIGNED_ACCEPTED", async () => {
    const result = await runVector(FIRST_VECTOR_ID);
    expect(result.status).toBe("pass");
    expect(result.details.policyOutcome).toBe("allow");
    expect(result.details.receiptStatus).toBe("accepted");
    expect(result.reasonCodesFound).toContain("OK_TRANSFER_ACCEPTED");
  });

  it("renders Protocol Inspector and shows pass state after run", async () => {
    render(<App />);

    expect(screen.getByText("spx-prov Sample App")).toBeInTheDocument();
    expect(screen.getByText(`Selected vector: ${FIRST_VECTOR_ID}`)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Run Vector" }));

    expect(await screen.findByText("Status: pass")).toBeInTheDocument();
    expect(screen.getByText("Policy Outcome: allow")).toBeInTheDocument();
    expect(screen.getByText("Receipt Status: accepted")).toBeInTheDocument();
  });
});
