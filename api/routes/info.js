import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { APIError, ErrorCodes } from '../utils/errors.js';
import logger from '../utils/logger.js';

const router = express.Router();

async function resolveAppInfoPath() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // Expected repo layout:
    // repoRoot/
    //   app_info.json
    //   api/routes/info.js
    const repoRoot = path.resolve(__dirname, '..', '..');

    const candidates = [
        path.resolve(repoRoot, 'app_info.json'),
        // Fallbacks for different runtime cwd behaviors
        path.resolve(process.cwd(), 'app_info.json'),
        path.resolve(process.cwd(), '..', 'app_info.json')
    ];

    for (const candidate of candidates) {
        try {
            await fs.access(candidate);
            return candidate;
        } catch {
            // try next
        }
    }

    // Default to the most likely path (useful for better error messages)
    return candidates[0];
}

router.get('/', async (req, res, next) => {
    try {
        const infoPath = await resolveAppInfoPath();
        const raw = await fs.readFile(infoPath, 'utf-8');
        const info = JSON.parse(raw);
        res.json(info);
    } catch (error) {
        // Return default info if file not found (not an error)
        logger.debug('App info file not found, using defaults', { path: await resolveAppInfoPath() });
        res.json({
            name: 'FastAccounting',
            version: null,
            description: 'Financial Management System',
            updated_at: new Date().toISOString().split('T')[0],
            author: 'Anonymous',
            summary: []
        });
    }
});

import { authMiddleware, requireAdmin } from '../middleware/auth.js';

router.put('/', authMiddleware, requireAdmin, async (req, res, next) => {
    try {
        const { name, version, description, updated_at, author, summary } = req.body;

        const infoPath = await resolveAppInfoPath();

        const newInfo = {
            name: name || 'FastAccounting',
            version: version || '1.0.0',
            description: description || '',
            updated_at: updated_at || new Date().toISOString().split('T')[0],
            author: author || '',
            summary: Array.isArray(summary) ? summary : []
        };

        await fs.writeFile(infoPath, JSON.stringify(newInfo, null, 2), 'utf-8');

        logger.info('App info updated', { version: newInfo.version });

        res.json(newInfo);
    } catch (error) {
        const code = error?.code;
        // Vercel/serverless filesystem is typically read-only
        if (code === 'EROFS' || code === 'EPERM') {
            throw new APIError(
                'Deployment environment is read-only; cannot update app_info.json on server.',
                409,
                ErrorCodes.READ_ONLY_MODE
            );
        }
        next(error);
    }
});

export default router;
