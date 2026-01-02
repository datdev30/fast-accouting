import Counter from '../models/Counter.js';
import { isMongoWriteForbidden } from './helpers.js';

/**
 * Get next sequential ID for a given code
 * Ported from Python utils.py
 */
export async function getNextId(code) {
    try {
        // Find or create counter
        let counter = await Counter.findOne({ code });

        if (!counter) {
            counter = new Counter({ code, seq: 0 });
            await counter.save();
        }

        // Increment sequence
        counter.seq += 1;
        await counter.save();

        const seq = counter.seq;

    // Format ID based on code
        if (code === 'customer') {
            return `KH${seq.toString().padStart(3, '0')}`; // KH001, KH002...
        } else if (code === 'transaction') {
            return `GD${seq.toString().padStart(4, '0')}`; // GD0001, GD0002...
        } else {
            return `${code.toUpperCase()}${seq.toString().padStart(3, '0')}`;
        }
    } catch (error) {
        if (isMongoWriteForbidden(error)) {
            const err = new Error('Hệ thống đang ở chế độ chỉ đọc (read-only). Không thể cấp mã mới.');
            err.statusCode = 403;
            throw err;
        }
        throw error;
    }
}
