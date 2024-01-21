import { initSimnet, Simnet } from "@hirosystems/clarinet-sdk";
import {
  standardPrincipalCV,
  principalCV,
  uintCV,
  listCV,
  boolCV,
} from "@stacks/transactions";
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

describe("Multisig-vault Contract Tests", () => {
  describe("Testing 'start'", () => {
    describe("negative scenarious", () => {
      it("Do not allow call 'start' to anybody besides contract-owner", async () => {
        const deployer = accounts.get("deployer");
        const accountNames = Array.from(accounts.keys()).filter((name) =>
          name.startsWith("wallet_")
        );
        if (!deployer || accountNames.length < 1) {
          throw new Error("Required accounts not found");
        }
        const newVotesRequired = 20;
        const memberCount = 100;

        // Create a list of 100 principals using the available accounts
        const participants = [];
        for (let i = 0; i < memberCount; i++) {
          const accountName = accountNames[i % accountNames.length];
          const account = accounts.get(accountName);
          if (account) {
            participants.push(standardPrincipalCV(account));
          }
        }

        const response = await simnet.callPublicFn(
          "multisig-vault",
          "start",
          [listCV(participants), uintCV(newVotesRequired)],
          accounts.get("wallet_1") // Not a deploter
        );

        expect(response.result).toBeErr(uintCV(100)); // err-owner-only
      });
      it("Do not allow call 'start' if already started", async () => {
        const deployer = accounts.get("deployer");
        const accountNames = Array.from(accounts.keys()).filter((name) =>
          name.startsWith("wallet_")
        );
        if (!deployer || accountNames.length < 1) {
          throw new Error("Required accounts not found");
        }
        const newVotesRequired = 20;
        const memberCount = 100;

        // Create a list of 100 principals using the available accounts
        const participants = [];
        for (let i = 0; i < memberCount; i++) {
          const accountName = accountNames[i % accountNames.length];
          const account = accounts.get(accountName);
          if (account) {
            participants.push(standardPrincipalCV(account));
          }
        }

        await simnet.callPublicFn(
          "multisig-vault",
          "start",
          [listCV(participants), uintCV(newVotesRequired)],
          deployer
        );

        const response = await simnet.callPublicFn(
          "multisig-vault",
          "start",
          [listCV(participants), uintCV(newVotesRequired)],
          deployer
        );

        expect(response.result).toBeErr(uintCV(101)); // err-already-locked
      });
      it("Do not allow to set more required votes than members", async () => {
        const deployer = accounts.get("deployer");
        const accountNames = Array.from(accounts.keys()).filter((name) =>
          name.startsWith("wallet_")
        );
        if (!deployer || accountNames.length < 1) {
          throw new Error("Required accounts not found");
        }
        const newVotesRequired = 20;
        const memberCount = 100;

        // Create a list of 100 principals using the available accounts
        const participants = [];
        for (let i = 0; i < memberCount; i++) {
          const accountName = accountNames[i % accountNames.length];
          const account = accounts.get(accountName);
          if (account) {
            participants.push(standardPrincipalCV(account));
          }
        }

        const moreVotesThanMembers = 101;

        const response = await simnet.callPublicFn(
          "multisig-vault",
          "start",
          [listCV(participants), uintCV(moreVotesThanMembers)],
          deployer
        );

        expect(response.result).toBeErr(uintCV(102)); // err-more-votes-than-members-required
      });
    });
    describe("positive scenarious", () => {
      it("Should update members list after 'start'", async () => {
        const deployer = accounts.get("deployer");
        const accountNames = Array.from(accounts.keys()).filter((name) =>
          name.startsWith("wallet_")
        );
        if (!deployer || accountNames.length < 1) {
          throw new Error("Required accounts not found");
        }
        const newVotesRequired = 20;
        const memberCount = 100;

        // Create a list of 100 principals using the available accounts
        const participants = [];
        for (let i = 0; i < memberCount; i++) {
          const accountName = accountNames[i % accountNames.length];
          const account = accounts.get(accountName);
          if (account) {
            participants.push(standardPrincipalCV(account));
          }
        }

        await simnet.callPublicFn(
          "multisig-vault",
          "start",
          [listCV(participants), uintCV(newVotesRequired)],
          deployer
        );
        const response = simnet.getDataVar("multisig-vault", "members");
        const expectedFirstAddressFromList =
          "eabc65f3e890fb8bf20d153e95119c72d85765a9";
        expect(response.list[0].address.hash160).to.equal(
          expectedFirstAddressFromList
        );
      });
      it("Should update votes-required variable after 'start'", async () => {
        const deployer = accounts.get("deployer");
        const accountNames = Array.from(accounts.keys()).filter((name) =>
          name.startsWith("wallet_")
        );
        if (!deployer || accountNames.length < 1) {
          throw new Error("Required accounts not found");
        }
        const newVotesRequired = 20;
        const memberCount = 100;

        // Create a list of 100 principals using the available accounts
        const participants = [];
        for (let i = 0; i < memberCount; i++) {
          const accountName = accountNames[i % accountNames.length];
          const account = accounts.get(accountName);
          if (account) {
            participants.push(standardPrincipalCV(account));
          }
        }

        await simnet.callPublicFn(
          "multisig-vault",
          "start",
          [listCV(participants), uintCV(newVotesRequired)],
          deployer
        );
        const response = simnet.getDataVar("multisig-vault", "votes-required");
        const expectedNumberOfRequiredVotes = uintCV(20);
        expect(response).to.deep.equal(expectedNumberOfRequiredVotes);
      });
    });
  });
  describe("Testing 'vote'", () => {
    describe("negative scenarious", () => {
      it("Do not allow call 'vote' to anybody that is not a member", async () => {
        const deployer = accounts.get("deployer");
        const accountNames = Array.from(accounts.keys()).filter((name) =>
          name.startsWith("wallet_")
        );
        if (!deployer || accountNames.length < 1) {
          throw new Error("Required accounts not found");
        }
        const newVotesRequired = 20;
        const memberCount = 100;

        // Create a list of 100 principals using the available accounts
        const participants = [];
        for (let i = 0; i < memberCount; i++) {
          const accountName = accountNames[i % accountNames.length];
          const account = accounts.get(accountName);
          if (account) {
            participants.push(standardPrincipalCV(account));
          }
        }

        await simnet.callPublicFn(
          "multisig-vault",
          "start",
          [listCV(participants), uintCV(newVotesRequired)],
          deployer
        );

        const response = await simnet.callPublicFn(
          "multisig-vault",
          "vote",
          [standardPrincipalCV(accounts.get("wallet_1")), boolCV(true)],
          deployer
        );

        expect(response.result).toBeErr(uintCV(103)); // err-not-a-member
      });
    });
    describe("positive scenarious", () => {
      it("Should update votes map", async () => {
        const deployer = accounts.get("deployer");
        const participant1 = accounts.get("wallet_1");
        const accountNames = Array.from(accounts.keys()).filter((name) =>
          name.startsWith("wallet_")
        );
        if (!deployer || accountNames.length < 1) {
          throw new Error("Required accounts not found");
        }
        const newVotesRequired = 20;
        const memberCount = 100;

        // Create a list of 100 principals using the available accounts
        const participants = [];
        for (let i = 0; i < memberCount; i++) {
          const accountName = accountNames[i % accountNames.length];
          const account = accounts.get(accountName);
          if (account) {
            participants.push(standardPrincipalCV(account));
          }
        }

        await simnet.callPublicFn(
          "multisig-vault",
          "start",
          [listCV(participants), uintCV(newVotesRequired)],
          deployer
        );

        await simnet.callPublicFn(
          "multisig-vault",
          "vote",
          [standardPrincipalCV(accounts.get("wallet_5")), boolCV(true)],
          participant1
        );
        const response = simnet.callReadOnlyFn(
          "multisig-vault",
          "get-vote",
          [
            standardPrincipalCV(participant1),
            standardPrincipalCV(accounts.get("wallet_5")),
          ],
          deployer
        );
        expect(response.result).to.deep.equal(boolCV(true));
      });
    });
  });
  describe("Testing 'withdraw'", () => {
    describe("negative scenarious", () => {
      it("Do not allow call 'withdraw' if required amount of votes not met", async () => {
        const deployer = accounts.get("deployer");
        const participant1 = accounts.get("wallet_1");
        const participant2 = accounts.get("wallet_2");
        const accountNames = Array.from(accounts.keys()).filter((name) =>
          name.startsWith("wallet_")
        );
        if (!deployer || accountNames.length < 1) {
          throw new Error("Required accounts not found");
        }
        const newVotesRequired = 20;
        const memberCount = 100;

        // Create a list of 100 principals using the available accounts
        const participants = [];
        for (let i = 0; i < memberCount; i++) {
          const accountName = accountNames[i % accountNames.length];
          const account = accounts.get(accountName);
          if (account) {
            participants.push(standardPrincipalCV(account));
          }
        }

        await simnet.callPublicFn(
          "multisig-vault",
          "start",
          [listCV(participants), uintCV(newVotesRequired)],
          deployer
        );

        await simnet.callPublicFn(
          "multisig-vault",
          "vote",
          [standardPrincipalCV(accounts.get("wallet_1")), boolCV(true)],
          participant1
        );

        await simnet.callPublicFn(
          "multisig-vault",
          "vote",
          [standardPrincipalCV(accounts.get("wallet_1")), boolCV(true)],
          participant2
        );

        const response = await simnet.callPublicFn(
          "multisig-vault",
          "withdraw",
          [],
          deployer
        );
        expect(response.result).toBeErr(uintCV(104)); // err-votes-required-not-met
      });
    });
    // describe("positive scenarious", () => {
    //   it("Should update votes map", async () => {
    //     const deployer = accounts.get("deployer");
    //     const participant1 = accounts.get("wallet_1");
    //     const accountNames = Array.from(accounts.keys()).filter((name) =>
    //       name.startsWith("wallet_")
    //     );
    //     if (!deployer || accountNames.length < 1) {
    //       throw new Error("Required accounts not found");
    //     }
    //     const newVotesRequired = 20;
    //     const memberCount = 100;

    //     // Create a list of 100 principals using the available accounts
    //     const participants = [];
    //     for (let i = 0; i < memberCount; i++) {
    //       const accountName = accountNames[i % accountNames.length];
    //       const account = accounts.get(accountName);
    //       if (account) {
    //         participants.push(standardPrincipalCV(account));
    //       }
    //     }

    //     await simnet.callPublicFn(
    //       "multisig-vault",
    //       "start",
    //       [listCV(participants), uintCV(newVotesRequired)],
    //       deployer
    //     );

    //     await simnet.callPublicFn(
    //       "multisig-vault",
    //       "vote",
    //       [standardPrincipalCV(accounts.get("wallet_5")), boolCV(true)],
    //       participant1
    //     );
    //     const response = simnet.callReadOnlyFn(
    //       "multisig-vault",
    //       "get-vote",
    //       [
    //         standardPrincipalCV(participant1),
    //         standardPrincipalCV(accounts.get("wallet_5")),
    //       ],
    //       deployer
    //     );
    //     expect(response.result).to.deep.equal(boolCV(true));
    //   });
    // });
  });
});
