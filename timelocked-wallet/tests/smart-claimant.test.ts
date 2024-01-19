import { initSimnet, Simnet, tx } from "@hirosystems/clarinet-sdk";
import { principalCV, uintCV, standardPrincipalCV } from "@stacks/transactions";
import { describe, expect, it, beforeEach } from "vitest";

let simnet: Simnet;
let accounts: Map<string, string>;

interface STXTransferEvent {
  event: string;
  data: {
    sender: string;
    recipient: string;
    amount: string;
  };
}

beforeEach(async () => {
  simnet = await initSimnet();
  accounts = simnet.getAccounts();
});

describe("Disburses tokens once it can claim the time-locked wallet balance", () => {
  it("correctly disburses tokens", async () => {
    const deployer = accounts.get("deployer")!;
    const beneficiary = `${deployer}.smart-claimant`;
    const wallet1 = accounts.get("wallet_1")!;
    const wallet2 = accounts.get("wallet_2")!;
    const wallet3 = accounts.get("wallet_3")!;
    const wallet4 = accounts.get("wallet_4")!;
    const unlockHeight = 10;
    const amount = 1000;
    const share = Math.floor(amount / 4);

    // Lock the wallet
    simnet.mineBlock([
      tx.callPublicFn(
        "timelocked-wallet",
        "lock",
        [principalCV(beneficiary), uintCV(unlockHeight), uintCV(amount)],
        deployer
      ),
    ]);

    // Mine blocks until unlock height
    await simnet.mineEmptyBlocks(unlockHeight);

    // Claim the balance
    const block = await simnet.mineBlock([
      tx.callPublicFn("smart-claimant", "claim", [], deployer),
    ]);

    // Take the first receipt
    const [receipt] = block;

    // Check if the claim was successful
    expect(receipt.result).toBeDefined();

    // Check if each wallet received their share
    receipt.events.forEach((event: any) => {
      if (
        event.event === "stx_transfer_event" &&
        event.data.sender ===
          "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.smart-claimant"
      ) {
        expect(event.data.amount).toEqual(share.toString());
        expect([wallet1, wallet2, wallet3, wallet4]).toContain(
          event.data.recipient
        );
      }
    });
  });
});
