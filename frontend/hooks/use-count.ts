'use client';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import * as anchor from '@coral-xyz/anchor';
import { useEffect, useState, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import idl from '../idl.json';
import { AnchorProvider, Program, Idl } from '@coral-xyz/anchor';
import { Count } from "../types/count";
import { formatDate, getRelativeTime } from '../utils/date';

interface Counter {
    value: number;
    created_at: string;
}

interface CounterHistory extends Counter {
    formattedDate: string;
    relativeTime: string;
}

declare global {
    interface Window {
        solana: any;
    }
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const POLLING_INTERVAL = 30000; // Poll every 30 seconds

export const useCount = () => {
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();
    const [program, setProgram] = useState<Program<Count> | null>(null);
    const [loading, setLoading] = useState(false);
    const [counter, setCounter] = useState<Counter | null>(null);
    const [history, setHistory] = useState<CounterHistory[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isPolling, setIsPolling] = useState(false);

    useEffect(() => {
        if (!publicKey) return;
        try {
            const provider = new AnchorProvider(
                connection, 
                window.solana, 
                {
                    commitment: 'confirmed',
                    preflightCommitment: 'confirmed',
                }
            );

            anchor.setProvider(provider);
            //@ts-ignore
            const program = new Program(idl as unknown as Idl, provider) as Program<Count>;
            setProgram(program);
        } catch (err) {
            console.error('Error initializing program:', err);
            setError('Failed to initialize program');
        }
    }, [publicKey, connection]);

    const getCounterPDA = useCallback((program: Program<Count>) => {
        if(!publicKey) throw new Error('Wallet not connected');
        const [counterPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from('counter')],
            program.programId
        );
        return counterPDA;
    }, [publicKey]);

    // Function to fetch counter from backend
    const fetchCounterFromBackend = useCallback(async () => {
        try {
            if (!isPolling) setLoading(true);
            setError(null);
            const url = `${BACKEND_URL}/counter/current`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to fetch counter from backend');
            }
            const data = await response.json();
            setCounter(data);
        } catch (error) {
            console.error('Error fetching counter from backend:', error);
            setError("Failed to fetch count");
        } finally {
            if (!isPolling) setLoading(false);
        }
    }, [isPolling]);

    // Function to fetch history
    const fetchHistory = useCallback(async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/counter/history`);
            if (!response.ok) {
                throw new Error('Failed to fetch counter history');
            }
            const data = await response.json();
            
            // Add formatted dates to each history item
            const formattedHistory = data.map((item: any) => ({
                ...item,
                formattedDate: formatDate(item.created_at),
                relativeTime: getRelativeTime(item.created_at)
            }));
            
            setHistory(formattedHistory);
        } catch (error) {
            console.error('Error fetching history:', error);
        }
    }, []);

    // Function to fetch all data
    const fetchAllData = useCallback(async () => {
        if (!publicKey) return;
        await Promise.all([
            fetchCounterFromBackend(),
            fetchHistory()
        ]);
    }, [publicKey, fetchCounterFromBackend, fetchHistory]);

    // Set up polling when wallet is connected
    useEffect(() => {
        if (!publicKey) {
            setIsPolling(false);
            return;
        }

        setIsPolling(true);
        // Initial fetch
        fetchAllData();

        // Set up polling interval
        const pollInterval = setInterval(fetchAllData, POLLING_INTERVAL);

        // Cleanup function
        return () => {
            setIsPolling(false);
            clearInterval(pollInterval);
        };
    }, [publicKey, fetchAllData]);

    const incrementCounter = useCallback(async () => {
        if(!program || !publicKey) throw new Error("Program not initialized");

        setLoading(true);
        setError(null);
        try {
            const counterPDA = getCounterPDA(program);
            const tx = await program.methods
                .increment()
                .accounts({
                    globalCounter: counterPDA,
                })
                .transaction();

            const latestBlockhash = await connection.getLatestBlockhash();
            tx.feePayer = publicKey;
            tx.recentBlockhash = latestBlockhash.blockhash;
            const signature = await sendTransaction(tx, connection, {
                signers: [],
                preflightCommitment: 'confirmed',
            });
            await connection.confirmTransaction({ 
                signature, 
                blockhash: latestBlockhash.blockhash, 
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight 
            });
            
            // After successful increment, fetch latest data
            await fetchAllData();
            return signature;
        } catch (error) {
            console.error('Error incrementing counter:', error);
            setError("Failed to increment counter");
        } finally {
            setLoading(false);
        }
    }, [program, publicKey, getCounterPDA, fetchAllData, sendTransaction, connection]);

    const initializeCounter = useCallback(async () => {
        if(!program || !publicKey) throw new Error("Program not initialized");

        setLoading(true);
        setError(null);
        try {
            const counterPDA = getCounterPDA(program);
            const latestBlockhash = await connection.getLatestBlockhash('confirmed');
            
            const tx = await program.methods
                .initialize()
                .accounts({
                    //@ts-ignore
                    globalCounter: counterPDA,
                    user: publicKey,
                    systemProgram: anchor.web3.SystemProgram.programId,
                })
                .transaction();

            tx.feePayer = publicKey;
            tx.recentBlockhash = latestBlockhash.blockhash;
            tx.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;

            const signature = await sendTransaction(tx, connection, {
                signers: [],
                preflightCommitment: 'confirmed',
                maxRetries: 5
            });
            
            const confirmation = await connection.confirmTransaction({
                signature,
                blockhash: latestBlockhash.blockhash,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
            }, 'confirmed');

            if (confirmation.value.err) {
                throw new Error(`Transaction failed: ${confirmation.value.err.toString()}`);
            }

            // After successful initialization, fetch latest data
            await fetchAllData();
            return signature;
        } catch (error: any) {
            console.error('Error initializing counter:', error);
            setError(error.message || "Failed to initialize counter");
            throw error;
        } finally {
            setLoading(false);
        }
    }, [program, publicKey, getCounterPDA, fetchAllData, sendTransaction, connection]);

    const refreshRelativeTimes = useCallback(() => {
        setHistory(prevHistory => 
            prevHistory.map(item => ({
                ...item,
                relativeTime: getRelativeTime(item.created_at)
            }))
        );
    }, []);

    useEffect(() => {
        const interval = setInterval(refreshRelativeTimes, 60000);
        return () => clearInterval(interval);
    }, [refreshRelativeTimes]);

    return {
        loading,
        counter,
        history,
        error,
        incrementCounter,
        fetchCounter: fetchCounterFromBackend,
        initializeCounter,
        refreshRelativeTimes,
    };
};