import express from 'express';
import { PublicKey } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { initializeAnchor } from './utils/anchor-setup';
import { Idl, Program } from '@coral-xyz/anchor';
import idl from './count.json';
import cors from 'cors';
dotenv.config();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const app = express();
const port = 8080;
app.use(cors());
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

const provider = initializeAnchor();
const program = new Program(idl as unknown as Idl, provider);
const programId = new PublicKey(idl.address);

async function initDatabase() {
    try {
        const { data, error } = await supabase
            .from('counter_history')
            .select('id')
            .limit(1);
            
        if (error) {
            throw error;
        }
        
        console.log('Supabase connection established');
    } catch (error) {
        console.error('Database initialization error:', error);
        process.exit(1);
    }
}

function getCounterPDA(): PublicKey {
    const [counterPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('counter')],
        programId
    );
    return counterPDA;
}

async function fetchAndStoreCounter() {
    try {
        const counterPDA = getCounterPDA();
        //@ts-ignore
        const counterAccount = await program.account.globalCounter.fetch(counterPDA);
        //@ts-ignore
        const counterValue = counterAccount.count.toNumber();
        
        const { error } = await supabase
            .from('counter_history')
            .insert([
                {
                    value: counterValue,
                    created_at: new Date().toISOString()
                }
            ]);

        if (error) {
            throw error;
        }

        console.log(`Counter value ${counterValue} stored at ${new Date().toISOString()}`);
    } catch (error) {
        console.error('Error fetching/storing counter:', error);
    }
}

app.get('/counter/current', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('counter_history')
            .select('value, created_at')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) throw error;
        res.json(data || { value: null, created_at: null });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch counter' });
    }
});

app.get('/counter/history', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('counter_history')
            .select('value, created_at')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch counter history' });
    }
});

// Add health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

async function startServer() {
    await initDatabase();
    
    setInterval(fetchAndStoreCounter, 10000);
    
    await fetchAndStoreCounter();
    
    app.listen(port, () => {
        console.log(`Server running at ${port}`);
    });
}

startServer().catch(error => {
    console.error('Server startup error:', error);
    process.exit(1);
});