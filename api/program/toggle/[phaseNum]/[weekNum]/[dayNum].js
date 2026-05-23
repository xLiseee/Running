import { getProgramData, saveProgramData } from '../../../../../_helpers.js';

export default async function handler(req, res) {
    if (req.method !== 'PATCH') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { phaseNum, weekNum, dayNum } = req.query;
    try {
        const program = await getProgramData();
        const phase = program.find(p => p.phase === parseInt(phaseNum, 10));
        if (!phase) return res.status(404).json({ error: 'Phase not found' });

        const week = phase.weeks.find(w => w.weekNum === parseInt(weekNum, 10));
        if (!week) return res.status(404).json({ error: 'Week not found' });

        const day = week.days.find(d => d.dayNum === parseInt(dayNum, 10));
        if (!day) return res.status(404).json({ error: 'Day not found' });

        day.completed = !day.completed;
        if (!day.completed) {
            day.log = null;
        }

        await saveProgramData(program);
        return res.status(200).json({ success: true, data: day });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message || 'Server error' });
    }
}
