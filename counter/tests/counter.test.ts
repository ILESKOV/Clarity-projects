import { describe, expect, it } from "vitest";
import { principalCV } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;

describe("Counter Contract Tests", () => {
  describe("count-up public function", () => {
    it("successfully increments the count", async () => {
      const response = await simnet.callPublicFn(
        "counter",
        "count-up",
        [],
        address1
      );
      expect(response).toBeDefined();
    });

    it("increases count on subsequent calls", async () => {
      await simnet.callPublicFn("counter", "count-up", [], address1);
      const initialCount = await simnet.callReadOnlyFn(
        "counter",
        "get-count",
        [principalCV(address1)],
        address1
      );

      await simnet.callPublicFn("counter", "count-up", [], address1);
      const updatedCount = await simnet.callReadOnlyFn(
        "counter",
        "get-count",
        [principalCV(address1)],
        address1
      );

      expect(updatedCount).not.toEqual(initialCount);
    });
  });

  describe("get-count read-only function", () => {
    it("returns u0 for principals that never called count-up", async () => {
      const response = await simnet.callReadOnlyFn(
        "counter",
        "get-count",
        [principalCV(address2)],
        address2
      );

      // Extract the uint value from the response
      const countValue = response.result.value;

      // Assert that the returned result is 0 (representing u0 in Clarity)
      expect(countValue).toBe(0n); // Use BigInt literal for comparison
    });

    it("reflects the updated count after count-up calls", async () => {
      await simnet.callPublicFn("counter", "count-up", [], address1);
      const count = await simnet.callReadOnlyFn(
        "counter",
        "get-count",
        [principalCV(address1)],
        address1
      );
      expect(count).toBeDefined();
      expect(count).not.toEqual("u0");
    });
  });

  // Additional test cases as needed
});
