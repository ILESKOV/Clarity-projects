import { initSimnet, Simnet } from "@hirosystems/clarinet-sdk";
import { principalCV, uintCV, boolCV } from "@stacks/transactions";
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

describe("Timelocked Wallet Contract Tests", () => {
  describe("Testing 'lock'", () => {
    it("Allows the contract owner to lock an amount", async () => {
      const deployer = accounts.get("deployer");
      const beneficiary = accounts.get("wallet_1");
      if (!deployer || !beneficiary) {
        throw new Error("Required accounts not found");
      }
      const amount = 10;
      const unlockHeight = 20;

      const response = await simnet.callPublicFn(
        "timelocked-wallet",
        "lock",
        [principalCV(beneficiary), uintCV(unlockHeight), uintCV(amount)],
        deployer
      );

      expect(response.result).toBeOk(boolCV(true));
      // Check for STX transfer event
      expect(
        response.events.some(
          (event: STXTransferEvent) =>
            event.event === "stx_transfer_event" &&
            event.data.sender === deployer &&
            event.data.recipient === `${deployer}.timelocked-wallet` &&
            event.data.amount === amount.toString()
        )
      ).toBe(true);
    });

    it("Does not allow anyone else to lock an amount", async () => {
      const nonOwner = accounts.get("wallet_2");
      const beneficiary = accounts.get("wallet_1");
      if (!nonOwner || !beneficiary) {
        throw new Error("Required accounts not found");
      }
      const amount = 10;
      const unlockHeight = 20;

      const response = await simnet.callPublicFn(
        "timelocked-wallet",
        "lock",
        [principalCV(beneficiary), uintCV(unlockHeight), uintCV(amount)],
        nonOwner
      );

      expect(response.result).toBeErr(uintCV(100)); // err-owner-only
    });

    it("Cannot lock more than once", async () => {
      const deployer = accounts.get("deployer");
      const beneficiary = accounts.get("wallet_1");
      if (!deployer || !beneficiary) {
        throw new Error("Required accounts not found");
      }
      const amount = 10;
      const unlockHeight = 20;

      // First lock attempt
      let response = await simnet.callPublicFn(
        "timelocked-wallet",
        "lock",
        [principalCV(beneficiary), uintCV(unlockHeight), uintCV(amount)],
        deployer
      );
      expect(response.result).toBeOk(boolCV(true));

      // Second lock attempt
      response = await simnet.callPublicFn(
        "timelocked-wallet",
        "lock",
        [principalCV(beneficiary), uintCV(unlockHeight), uintCV(amount)],
        deployer
      );
      expect(response.result).toBeErr(uintCV(101)); // err-already-locked
    });

    it("Unlock height cannot be in the past", async () => {
      const deployer = accounts.get("deployer");
      const beneficiary = accounts.get("wallet_1");
      if (!deployer || !beneficiary) {
        throw new Error("Required accounts not found");
      }
      const amount = 10;
      const targetBlockHeight = 10;

      // Mine blocks to advance the chain beyond the target block height
      await simnet.mineEmptyBlocks(targetBlockHeight + 1);

      const response = await simnet.callPublicFn(
        "timelocked-wallet",
        "lock",
        [principalCV(beneficiary), uintCV(targetBlockHeight), uintCV(amount)],
        deployer
      );

      expect(response.result).toBeErr(uintCV(102)); // err-unlock-in-past
    });
  });
  describe("Testing 'bestow'", () => {
    it("Allows the beneficiary to bestow the right to claim to someone else", async () => {
      const deployer = accounts.get("deployer");
      const beneficiary = accounts.get("wallet_1");
      const newBeneficiary = accounts.get("wallet_2");
      if (!deployer || !beneficiary || !newBeneficiary) {
        throw new Error("Required accounts not found");
      }

      // Lock the wallet first
      await simnet.callPublicFn(
        "timelocked-wallet",
        "lock",
        [principalCV(beneficiary), uintCV(10), uintCV(10)],
        deployer
      );

      // Attempt to bestow the right to claim
      const response = await simnet.callPublicFn(
        "timelocked-wallet",
        "bestow",
        [principalCV(newBeneficiary)],
        beneficiary
      );

      expect(response.result).toBeOk(boolCV(true));
    });
    it("Does not allow anyone else to bestow the right to claim to someone else", async () => {
      const deployer = accounts.get("deployer");
      const beneficiary = accounts.get("wallet_1");
      const nonBeneficiary = accounts.get("wallet_3");
      if (!deployer || !beneficiary || !nonBeneficiary) {
        throw new Error("Required accounts not found");
      }

      // Lock the wallet first
      await simnet.callPublicFn(
        "timelocked-wallet",
        "lock",
        [principalCV(beneficiary), uintCV(10), uintCV(10)],
        deployer
      );

      // Attempt to bestow the right to claim by the contract owner
      let response = await simnet.callPublicFn(
        "timelocked-wallet",
        "bestow",
        [principalCV(deployer)],
        deployer
      );
      expect(response.result).toBeErr(uintCV(104)); // err-beneficiary-only

      // Attempt to bestow the right to claim by a non-beneficiary
      response = await simnet.callPublicFn(
        "timelocked-wallet",
        "bestow",
        [principalCV(nonBeneficiary)],
        nonBeneficiary
      );
      expect(response.result).toBeErr(uintCV(104)); // err-beneficiary-only
    });
  });
  describe("Testing 'claim'", () => {
    it("Allows the beneficiary to claim the balance when the block-height is reached", async () => {
      const deployer = accounts.get("deployer");
      const beneficiary = accounts.get("wallet_1");
      if (!deployer || !beneficiary) {
        throw new Error("Required accounts not found");
      }
      const targetBlockHeight = 10;
      const amount = 10;

      // Lock the wallet first
      await simnet.callPublicFn(
        "timelocked-wallet",
        "lock",
        [principalCV(beneficiary), uintCV(targetBlockHeight), uintCV(amount)],
        deployer
      );

      // Mine blocks to advance the chain to the target block height
      await simnet.mineEmptyBlocks(targetBlockHeight);

      // Attempt to claim the balance
      const response = await simnet.callPublicFn(
        "timelocked-wallet",
        "claim",
        [],
        beneficiary
      );

      expect(response.result).toBeOk(boolCV(true));
      // Check for STX transfer event
      expect(
        response.events.some(
          (event: STXTransferEvent) =>
            event.event === "stx_transfer_event" &&
            event.data.sender === `${deployer}.timelocked-wallet` &&
            event.data.recipient === beneficiary &&
            event.data.amount === amount.toString()
        )
      ).toBe(true);
    });

    it("Does not allow the beneficiary to claim the balance before the block-height is reached", async () => {
      const deployer = accounts.get("deployer");
      const beneficiary = accounts.get("wallet_1");
      if (!deployer || !beneficiary) {
        throw new Error("Required accounts not found");
      }
      const targetBlockHeight = 10;
      const amount = 10;

      // Lock the wallet first
      await simnet.callPublicFn(
        "timelocked-wallet",
        "lock",
        [principalCV(beneficiary), uintCV(targetBlockHeight), uintCV(amount)],
        deployer
      );

      // Mine blocks to advance the chain to just before the target block height
      await simnet.mineEmptyBlocks(targetBlockHeight - 4); //should be 8, because 'claim' would be added to 9

      // Ensure the current block height is less than the target block height
      const currentBlockHeight = simnet.blockHeight;
      if (currentBlockHeight >= targetBlockHeight) {
        throw new Error(
          "Block height is not less than the target block height"
        );
      }

      // Attempt to claim the balance
      const response = await simnet.callPublicFn(
        "timelocked-wallet",
        "claim",
        [],
        beneficiary
      );

      expect(response.result).toBeErr(uintCV(105)); // err-unlock-height-not-reached
    });

    it("Does not allow anyone else to claim the balance when the block-height is reached", async () => {
      const deployer = accounts.get("deployer");
      const beneficiary = accounts.get("wallet_1");
      const nonBeneficiary = accounts.get("wallet_2");
      if (!deployer || !beneficiary || !nonBeneficiary) {
        throw new Error("Required accounts not found");
      }
      const targetBlockHeight = 10;
      const amount = 10;

      // Lock the wallet first
      await simnet.callPublicFn(
        "timelocked-wallet",
        "lock",
        [principalCV(beneficiary), uintCV(targetBlockHeight), uintCV(amount)],
        deployer
      );

      // Mine blocks to advance the chain to the target block height
      await simnet.mineEmptyBlocks(targetBlockHeight);

      // Attempt to claim the balance by a non-beneficiary
      const response = await simnet.callPublicFn(
        "timelocked-wallet",
        "claim",
        [],
        nonBeneficiary
      );

      expect(response.result).toBeErr(uintCV(104)); // err-beneficiary-only
    });
  });
});
