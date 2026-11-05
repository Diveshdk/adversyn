import { scenarioHash, type Observation, type Scenario, type SubmitResult } from "@adversyn/core";

export const PACKAGE = "@adversyn/testkit";

// Real rejection texts captured from the public devnet on 2026-11-06.
export const REAL = {
  solvency:
    "validation frame 0: the payer 0x94b821d4cae56eb2691503b3d749fddc17f259cb has 0 wei, the transaction's maximum cost is 605652000000000 wei",
  verifyAfterPrefix: "frame 2 is a VERIFY frame after the validation prefix (ends at index 0)",
  budget:
    "validation prefix execution gas sum 100001 + signature-verification cost 2800 = 102801 exceeds MAX_VERIFY_GAS 100000",
} as const;

export function makeObservation(
  s: Scenario,
  submit: Partial<SubmitResult> & Pick<SubmitResult, "outcome">,
): Observation {
  return {
    schemaVersion: 1,
    runId: "fixture-run",
    scenarioId: s.id,
    scenarioHash: scenarioHash(s),
    target: { name: "fixture", rpcUrl: "fixture://", chainId: 1337 },
    startedAt: "2026-11-06T00:00:00.000Z",
    durationMs: 1,
    submit: { rpcMethod: "eth_sendFrameTransaction", reasons: [], ...submit },
    raw: { request: {}, response: {} },
  };
}

export function rejected(code: number, message: string): Partial<SubmitResult> & Pick<SubmitResult, "outcome"> {
  return { outcome: "rejected", errorCode: code, errorMessage: message };
}
