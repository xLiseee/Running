import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/manifest.json', express.static(path.join(__dirname, 'manifest.json')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// File-based database
const dbFile = path.join(__dirname, 'data.json');

// Create database file if it doesn't exist
if (!fs.existsSync(dbFile)) {
    fs.writeFileSync(dbFile, JSON.stringify({
        program: [],
        lastUpdated: new Date().toISOString()
    }));
}

// Helper functions
function loadData() {
    try {
        const data = fs.readFileSync(dbFile, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading database:', err);
        return { program: [], lastUpdated: new Date().toISOString() };
    }
}

function saveData(data) {
    try {
        data.lastUpdated = new Date().toISOString();
        fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
        return true;
    } catch (err) {
        console.error('Error writing database:', err);
        return false;
    }
}

// Broadcast updates to all connected clients
function broadcastUpdate(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === 1) { // WebSocket.OPEN = 1
            client.send(JSON.stringify({
                type: 'update',
                data: data
            }));
        }
    });
}

// API Endpoints

// GET all training data
app.get('/api/program', (req, res) => {
    const data = loadData();
    res.json(data);
});

// POST to update/synchronize training data
app.post('/api/program', (req, res) => {
    const newData = req.body;
    
    if (saveData(newData)) {
        broadcastUpdate(newData);
        res.json({ success: true, message: 'Program updated successfully' });
    } else {
        res.status(500).json({ success: false, message: 'Error saving program' });
    }
});

// PATCH to toggle a specific training day
app.patch('/api/program/toggle/:phaseNum/:weekNum/:dayNum', (req, res) => {
    const { phaseNum, weekNum, dayNum } = req.params;
    const data = loadData();
    
    const phase = data.program.find(p => p.phase === parseInt(phaseNum));
    if (!phase) {
        return res.status(404).json({ success: false, message: 'Phase not found' });
    }
    
    const week = phase.weeks.find(w => w.weekNum === parseInt(weekNum));
    if (!week) {
        return res.status(404).json({ success: false, message: 'Week not found' });
    }
    
    const day = week.days.find(d => d.dayNum === parseInt(dayNum));
    if (!day) {
        return res.status(404).json({ success: false, message: 'Day not found' });
    }
    
    // Toggle status
    day.completed = !day.completed;
    if (!day.completed) {
        day.log = null;
    }
    
    if (saveData(data)) {
        broadcastUpdate(data);
        res.json({ success: true, data: day });
    } else {
        res.status(500).json({ success: false, message: 'Error updating program' });
    }
});

// PATCH to save training log
app.patch('/api/program/log/:phaseNum/:weekNum/:dayNum', (req, res) => {
    const { phaseNum, weekNum, dayNum } = req.params;
    const { time, feeling, notes } = req.body;
    const data = loadData();
    
    const phase = data.program.find(p => p.phase === parseInt(phaseNum));
    if (!phase) {
        return res.status(404).json({ success: false, message: 'Phase not found' });
    }
    
    const week = phase.weeks.find(w => w.weekNum === parseInt(weekNum));
    if (!week) {
        return res.status(404).json({ success: false, message: 'Week not found' });
    }
    
    const day = week.days.find(d => d.dayNum === parseInt(dayNum));
    if (!day) {
        return res.status(404).json({ success: false, message: 'Day not found' });
    }
    
    // Set training as completed with logging
    day.completed = true;
    day.log = {
        time: time || 'Voltooid',
        feeling: feeling || 'good',
        notes: notes || ''
    };
    
    if (saveData(data)) {
        broadcastUpdate(data);
        res.json({ success: true, data: day });
    } else {
        res.status(500).json({ success: false, message: 'Error saving log' });
    }
});

// WebSocket connections for real-time updates
wss.on('connection', (ws) => {
    console.log('New client connected');
    
    // Send current data to new client
    const data = loadData();
    ws.send(JSON.stringify({
        type: 'initial',
        data: data
    }));
    
    // Handle messages from client
    ws.on('message', (message) => {
        try {
            const msg = JSON.parse(message);
            if (msg.type === 'update') {
                const data = msg.data;
                if (saveData(data)) {
                    broadcastUpdate(data);
                }
            }
        } catch (err) {
            console.error('Error handling message:', err);
        }
    });
    
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🏃 Running Tracker server listening on http://localhost:${PORT}`);
});
