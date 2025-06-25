import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import * as borsh from "borsh";
import { expect } from "chai";

const COUNTER_PROGRAM_ID = new PublicKey(
  "uGKBAoENGNYZmtMrvzGBxgBzk5VJa412ctECGTWSKxC"
);

export class CounterAccount {
  count: number;
  constructor({ count }: { count: number }) {
    this.count = count;
  }
}

export const schema: borsh.Schema = {
  struct: { count: "u32" },
};

export const COUNTER_SIZE = borsh.serialize(
  schema,
  new CounterAccount({ count: 0 })
).length;

describe("counter program", () => {
  const connection = new Connection("http://localhost:8899", "confirmed");
  it("initiates the data account with zero counter", async () => {
    const payer = Keypair.generate();
    const dataAccount = Keypair.generate();

    // Request airdrop and confirm transaction
    const airdropSig = await connection.requestAirdrop(
      payer.publicKey,
      1 * LAMPORTS_PER_SOL
    );
    console.log(airdropSig);
    await connection.confirmTransaction(airdropSig, "confirmed");

    const lamports = await connection.getMinimumBalanceForRentExemption(
      COUNTER_SIZE
    );
    console.info("counter struct size: ", COUNTER_SIZE);

    const accountCreateInstruction = SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: dataAccount.publicKey,
      lamports,
      space: COUNTER_SIZE,
      programId: COUNTER_PROGRAM_ID,
    });

    const txn = new Transaction().add(accountCreateInstruction);
    const txnSig = await connection.sendTransaction(txn, [payer, dataAccount]);
    await connection.confirmTransaction(txnSig);

    const accountInfo = await connection.getAccountInfo(dataAccount.publicKey);
    if (!accountInfo) {
      throw new Error("Counter account not found");
    }

    const counter = borsh.deserialize(
      schema,
      accountInfo.data
    ) as CounterAccount;
    expect(counter.count, "somehow the counter is not zero").to.equal(0);
  });

  it("increases the counter by 10", () => {});

  it("decreases the counter by 5", () => {});
});
