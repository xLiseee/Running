import { getProgramData, saveProgramData } from '../_helpers.js';

export default async function handler(req, res) {
    try {
        if (req.method === 'GET') {
            const program = await getProgramData();
            return res.status(200).json({ program });
        }

        if (req.method === 'POST') {
            const { program } = req.body;
            await saveProgramData(program || []);
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message || 'Server error' });
    }
}
