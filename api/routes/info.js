import express from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const infoPath = path.resolve(process.cwd(), '..', 'app_info.json');
        const raw = await fs.readFile(infoPath, 'utf-8');
        const info = JSON.parse(raw);
        res.json(info);
    } catch (error) {
        console.error('Get app info error:', error);
        res.json({
            name: 'FastAccounting',
            version: '1.0.0',
            description: 'Financial Management System',
            updated_at: new Date().toISOString().split('T')[0],
            author: 'Anonymous',
            summary: []
        });
    }
});

import { authMiddleware, requireAdmin } from '../middleware/auth.js';

router.put('/', authMiddleware, requireAdmin, async (req, res) => {
    try {
        const { name, version, description, updated_at, author, summary } = req.body;

        const infoPath = path.resolve(process.cwd(), '..', 'app_info.json');

        // Validation could go here

        const newInfo = {
            name: name || 'FastAccounting',
            version: version || '1.0.0',
            description: description || '',
            updated_at: updated_at || new Date().toISOString().split('T')[0],
            author: author || '',
            summary: Array.isArray(summary) ? summary : []
        };

        await fs.writeFile(infoPath, JSON.stringify(newInfo, null, 2), 'utf-8');

        res.json(newInfo);
    } catch (error) {
        console.error('Update app info error:', error);
        res.status(500).json({ error: 'Cannot update app info' });
    }
});

export default router;
