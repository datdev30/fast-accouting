import { isMongoWriteForbidden } from './helpers.js';
import { getCurrentWorkingYear } from './workingYear.js';
import { getCounterModel } from '../db/models.js';

/**
 * Get next sequential ID.
 * - customer: global (`customer`)
 * - transaction: theo năm làm việc (`transaction_2025`, …)
 */
export async function getNextId(code, workingYear = null) {
    try {
        const Counter = getCounterModel();
        let counterCode = code;
        if (code === 'transaction') {
            const year = workingYear ?? (await getCurrentWorkingYear());
            counterCode = `${code}_${year}`;
        }

        let counter = await Counter.findOne({ code: counterCode });

        if (!counter) {
            // Bootstrap transaction year counter from legacy unscoped once
            const legacy = code === 'transaction'
                ? await Counter.findOne({ code: 'transaction' })
                : null;
            counter = new Counter({
                code: counterCode,
                seq: legacy?.seq || 0
            });
            await counter.save();
        }

        counter.seq += 1;
        await counter.save();

        const seq = counter.seq;

        if (code === 'customer') {
            return `KH${seq.toString().padStart(3, '0')}`;
        }
        if (code === 'transaction') {
            return `GD${seq.toString().padStart(4, '0')}`;
        }
        return `${code.toUpperCase()}${seq.toString().padStart(3, '0')}`;
    } catch (error) {
        if (isMongoWriteForbidden(error)) {
            const err = new Error('Hệ thống đang ở chế độ chỉ đọc (read-only). Không thể cấp mã mới.');
            err.statusCode = 403;
            throw err;
        }
        throw error;
    }
}
