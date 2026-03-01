import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORAGE_DIR = path.join(__dirname, 'storage');
const DATA_FILE = path.join(STORAGE_DIR, 'data.json');

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL;

// Provide a default simple static token if server restarts, existing sessions will just need re-login
const STATIC_TOKEN = 'session_' + Math.random().toString(36).substring(2);

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    // Fallback logic incase user hasn't set up the env
    const emailMatch = ADMIN_EMAIL ? email === ADMIN_EMAIL : true;
    const passMatch = ADMIN_PASSWORD ? password === ADMIN_PASSWORD : password === 'admin';

    if (emailMatch && passMatch) {
        res.json({ success: true, token: STATIC_TOKEN });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

app.post('/api/auth/verify', (req, res) => {
    const token = req.headers.authorization;
    if (token === `Bearer ${STATIC_TOKEN}`) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false });
    }
});

function checkAuth(req, res, next) {
    const token = req.headers.authorization;
    if (token === `Bearer ${STATIC_TOKEN}`) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
}

app.get('/api/tree', (req, res) => {
    if (fs.existsSync(DATA_FILE)) {
        res.sendFile(DATA_FILE);
    } else {
        // Send a 404 or an explicit empty object, letting frontend use initial data
        res.json(null);
    }
});

app.post('/api/tree', checkAuth, (req, res) => {
    fs.writeFile(DATA_FILE, JSON.stringify(req.body, null, 2), (err) => {
        if (err) {
            console.error('Save error:', err);
            return res.status(500).json({ error: 'Failed to write data' });
        }
        res.json({ success: true });
    });
});

// Serve frontend if built
if (fs.existsSync(path.join(__dirname, 'dist'))) {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get(/.*/, (req, res) => {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`Server API listening on port ${PORT}`);
});
