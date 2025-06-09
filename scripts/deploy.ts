import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Count } from "../target/types/count";
import { PublicKey, SystemProgram } from "@solana/web3.js";

async function main() {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.count as Program<Count>;

    try {
        const [counterPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from("counter")],
            program.programId
        );
        console.log("Counter PDA:", counterPDA.toBase58());

        const tx = await program.methods.initialize().accounts({
            globalCounter: counterPDA,
        }).rpc();

        console.log("Transaction signature:", tx);
        const counterAccount = await program.account.globalCounter.fetch(counterPDA);
        console.log("Counter account:", counterAccount.count.toNumber());
    } catch (error) {
        console.error("Error:", error);
        throw error;
    } 
}

main().then(() => {
    process.exit(0);
}).catch((error) => {
    console.error("Error:", error);
    process.exit(1);
});