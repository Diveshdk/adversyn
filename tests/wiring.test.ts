import { describe, it, expect } from "vitest";
import { PACKAGE as core } from "@adversyn/core";
import { PACKAGE as protocol } from "@adversyn/protocol";
import { PACKAGE as policy } from "@adversyn/policy";
import { PACKAGE as scenarios } from "@adversyn/scenarios";
import { PACKAGE as executor } from "@adversyn/executor";
import { PACKAGE as analyzer } from "@adversyn/analyzer";
import { PACKAGE as reporter } from "@adversyn/reporter";
import { PACKAGE as testkit } from "@adversyn/testkit";

describe("workspace wiring", () => {
  it("resolves every package", () => {
    expect([core, protocol, policy, scenarios, executor, analyzer, reporter, testkit])
      .toHaveLength(8);
  });
});
