import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair } from '@solana/web3.js';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export function loadProvider(): anchor.Provider {
    // Load environment variables or use defaults
    const rpcUrl = process.env.ANCHOR_PROVIDER_URL || 'http://127.0.0.1:8899';
    const defaultWalletPath = path.join(os.homedir(), '.config', 'solana', 'id.json');
    const walletPath = process.env.ANCHOR_WALLET || defaultWalletPath;

    // Create connection
    const connection = new Connection(rpcUrl, 'confirmed');

    // Load wallet
    // Load wallet
    let wallet: anchor.Wallet;
    try {
        let keypair: Keypair;

        if (process.env.ANCHOR_WALLET_KEYPAIR) {
            // Load from environment variable
            const secret = Uint8Array.from(JSON.parse(process.env.ANCHOR_WALLET_KEYPAIR));
            keypair = Keypair.fromSecretKey(secret);
            console.log("Loaded wallet from env");
        } else {
            // Fallback to filesystem
            const keypairFile = fs.readFileSync(walletPath, 'utf-8');
            const keypairData = Uint8Array.from(JSON.parse(keypairFile));
            keypair = Keypair.fromSecretKey(keypairData);
            console.log("Loaded wallet from file");
        }

        wallet = new anchor.Wallet(keypair);
        console.log('Wallet pubkey:', wallet.publicKey.toString());
    } catch (error) {
        console.warn('Failed to load wallet, generating new one:', error);
        const keypair = Keypair.generate();
        wallet = new anchor.Wallet(keypair);
    }


    // Create and return provider
    const provider = new anchor.AnchorProvider(
        connection,
        wallet,
        { commitment: 'confirmed' }
    );

    return provider;
}

export function initializeAnchor(): anchor.Provider {
    const provider = loadProvider();
    anchor.setProvider(provider);
    return provider;
}