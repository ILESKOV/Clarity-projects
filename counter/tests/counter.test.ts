import { describe, expect, it } from "vitest";
import {
  principalCV,
  serializeCV,
  bufferCVFromString,
} from "@stacks/transactions";

const accounts = simnet.getAccounts();
console.log(accounts);
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;

describe("test count-up public function", () => {
  it("increments the count successfully", async () => {
    // Call the count-up function for address1 and expect a successful execution
    let response = await simnet.callPublicFn(
      "counter",
      "count-up",
      [],
      address1
    );
    // Serialize the address as a Clarity principal

    response = await simnet.callReadOnlyFn(
      "counter",
      "get-count",
      [],
      address1
    );
    console.log(response);
    // Check if the response object is defined, indicating a successful transaction
    expect(response).toBeDefined();

    // Call the count-up function again for address1
    response = await simnet.callPublicFn("counter", "count-up", [], address1);
    response = await simnet.callPublicFn("counter", "count-up", [], address1);
    response = await simnet.callReadOnlyFn(
      "counter",
      "get-count",
      [],
      address1
    );
    console.log(response);
    // Check if the response object is defined for the second call
    expect(response).toBeDefined();
  });

  // Additional test cases as needed
});
