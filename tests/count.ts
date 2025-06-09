import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Count } from "../target/types/count";
import { expect } from "chai";
import { PublicKey, SystemProgram } from "@solana/web3.js";

describe("count", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.count as Program<Count>;

  it("Initialize the counter", async () => {
    // Add your test here.
    const [counterPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("counter")],
      program.programId
    );


    const tx = await program.methods
      .initialize()
      .accounts({
        //@ts-ignore
        globalCounter: counterPDA,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Your transaction signature", tx);

    const counterAccount = await program.account.globalCounter.fetch(counterPDA);
    expect(counterAccount.count.toNumber()).to.equal(0);
  });

  it("Increment the counter", async () => {
    const [counterPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("counter")],
      program.programId
    );

    const tx = await program.methods.increment().accounts({
      globalCounter: counterPDA,
    }).rpc();

    console.log("Your transaction signature", tx);

    const counterAccount = await program.account.globalCounter.fetch(counterPDA);
    expect(counterAccount.count.toNumber()).to.equal(1);
  });

  it("Increments multiple times", async () => {
    const [counterPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("counter")],
      program.programId
    );

    for (let i = 0; i < 10; i++) {
      const tx = await program.methods.increment().accounts({
        globalCounter: counterPDA,
      }).rpc();

      console.log("Your transaction signature", tx);
    }

    const counterAccount = await program.account.globalCounter.fetch(counterPDA);
    expect(counterAccount.count.toNumber()).to.equal(11);
  });
});
