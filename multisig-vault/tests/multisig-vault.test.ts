import { initSimnet, Simnet, tx } from "@hirosystems/clarinet-sdk";
import { principalCV, uintCV, listCV } from "@stacks/transactions";
import { describe, expect, it, beforeEach } from "vitest";

let simnet: Simnet;
let accounts: Map<string, string>;

beforeEach(async () => {
  simnet = await initSimnet();
  accounts = simnet.getAccounts();
});

const contractName = "multisig-vault";

describe("Multisig Vault Contract", () => {
  it("initializes with given members and vote requirement", async () => {
    const deployer = accounts.get("deployer")!;
    const members = [
      accounts.get("wallet_1")!,
      accounts.get("wallet_2")!,
      accounts.get("wallet_3")!,
    ];
    const votesRequired = 2;

    const membersPrincipals = members.map((member) =>
      principalCV(member.address)
    );

    const startBlock = simnet.mineBlock([
      tx.contractCall(
        contractName,
        "start",
        [listCV(membersPrincipals), uintCV(votesRequired)],
        deployer
      ),
    ]);

    const [startReceipt] = startBlock;
    expect(startReceipt.result).toEqual("(ok true)");
  });

  // Additional tests for vote, withdraw, deposit, get-vote, tally-votes
  // ...
});
