import fs from 'fs';
import path from 'path';
import { supabase } from '../lib/supabaseClient.js';

const dbFile = path.join(process.cwd(), 'data.json');

function loadLocalData() {
    if (!fs.existsSync(dbFile)) {
        fs.writeFileSync(dbFile, JSON.stringify({ program: [], lastUpdated: new Date().toISOString() }, null, 2));
    }

    try {
        const raw = fs.readFileSync(dbFile, 'utf8');
        const parsed = JSON.parse(raw);
        return parsed.program || [];
    } catch (error) {
        console.error('Error reading local data:', error);
        return [];
    }
}

function saveLocalData(program) {
    const payload = { program, lastUpdated: new Date().toISOString() };
    try {
        fs.writeFileSync(dbFile, JSON.stringify(payload, null, 2));
    } catch (error) {
        console.error('Error writing local data:', error);
    }
}

export async function getProgramData() {
    if (!supabase) {
        if (process.env.VERCEL) {
            throw new Error('SUPABASE_URL and SUPABASE_KEY must be configured on Vercel.');
        }
        return loadLocalData();
    }

    const { data, error, status } = await supabase
        .from('running_program')
        .select('program')
        .eq('id', 1)
        .single();

    if (error && status !== 406) {
        throw error;
    }

    return data?.program || [];
}

export async function saveProgramData(program) {
    if (!supabase) {
        if (process.env.VERCEL) {
            throw new Error('SUPABASE_URL and SUPABASE_KEY must be configured on Vercel.');
        }
        saveLocalData(program);
        return;
    }

    const { error } = await supabase
        .from('running_program')
        .upsert({ id: 1, program });

    if (error) {
        throw error;
    }
}
