import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

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

app.get('/api/tree', async (req, res) => {
    try {
        const peopleRecords = await prisma.person.findMany({
            include: {
                parents: true,
                spouses1: true,
                spouses2: true,
            }
        });

        if (!peopleRecords || peopleRecords.length === 0) {
            return res.json(null);
        }

        // Map Prisma relational data back to exactly what frontend expects
        const people = peopleRecords.map(p => {
            // Reconstruct parentIds
            const parentIds = p.parents.map(rel => rel.parentId);

            // Reconstruct spouseIds (either they are spouse1 or spouse2)
            const spouseIds = [
                ...p.spouses1.map(rel => rel.spouse2Id),
                ...p.spouses2.map(rel => rel.spouse1Id)
            ];

            return {
                id: p.id,
                firstName: p.firstName,
                middleName: p.middleName !== null ? p.middleName : undefined,
                lastName: p.lastName,
                nickname: p.nickname !== null ? p.nickname : undefined,
                gender: p.gender,
                birthYear: p.birthYear,
                deathYear: p.deathYear,
                notes: p.notes !== null ? p.notes : undefined,
                photoUrl: p.photoUrl !== null ? p.photoUrl : undefined,
                parentIds: parentIds,
                spouseIds: spouseIds
            };
        });

        res.json({ people });
    } catch (error) {
        console.error('Error fetching tree:', error);
        res.status(500).json({ error: 'Failed to read data' });
    }
});

app.post('/api/tree', checkAuth, async (req, res) => {
    const { people } = req.body;
    if (!people || !Array.isArray(people)) {
        return res.status(400).json({ error: 'Invalid data format' });
    }

    try {
        const normalizeName = (name) => {
            if (!name) return '';
            return name
                .toLowerCase()
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        };

        // Simple strategy: Clear the graph edges and nodes, and rebuild them in a single transaction
        await prisma.$transaction(async (tx) => {
            await tx.parentChild.deleteMany();
            await tx.spouse.deleteMany();
            await tx.person.deleteMany();

            for (const p of people) {
                await tx.person.create({
                    data: {
                        id: p.id,
                        firstName: normalizeName(p.firstName),
                        middleName: normalizeName(p.middleName),
                        lastName: normalizeName(p.lastName),
                        nickname: p.nickname || '',
                        gender: p.gender || '',
                        birthYear: p.birthYear || null,
                        deathYear: p.deathYear || null,
                        notes: p.notes || '',
                        photoUrl: p.photoUrl || '',
                    }
                });
            }

            // Rebuild edges
            const createdParents = new Set();
            const createdSpouses = new Set();

            for (const p of people) {
                if (p.parentIds) {
                    for (const pid of p.parentIds) {
                        const edgeId = `${pid}_${p.id}`;
                        if (!createdParents.has(edgeId) && people.find(x => x.id === pid)) {
                            await tx.parentChild.create({ data: { parentId: pid, childId: p.id } });
                            createdParents.add(edgeId);
                        }
                    }
                }

                if (p.spouseIds) {
                    for (const sid of p.spouseIds) {
                        const ids = [p.id, sid].sort();
                        const edgeId = `${ids[0]}_${ids[1]}`;
                        if (!createdSpouses.has(edgeId) && people.find(x => x.id === sid)) {
                            await tx.spouse.create({ data: { spouse1Id: ids[0], spouse2Id: ids[1] } });
                            createdSpouses.add(edgeId);
                        }
                    }
                }
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Save error:', error);
        res.status(500).json({ error: 'Failed to write data' });
    }
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
