#!/usr/bin/env node
/**
 * Backfill working_year = 2025 cho customers & transactions thiếu field.
 * Đồng thời tách counter theo năm: customer_2025 / transaction_2025.
 *
 * Usage: node scripts/backfill-working-year.js [--year=2025]
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../config/db.js';
import Customer from '../models/Customer.js';
import Transaction from '../models/Transaction.js';
import Counter from '../models/Counter.js';
import AppSettings from '../models/AppSettings.js';
import { DEFAULT_WORKING_YEAR } from '../utils/workingYear.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

function parseYear() {
    const arg = process.argv.find((a) => a.startsWith('--year='));
    if (!arg) return DEFAULT_WORKING_YEAR;
    const y = Number(arg.split('=')[1]);
    return Number.isInteger(y) ? y : DEFAULT_WORKING_YEAR;
}

async function dropIndexSafe(collection, name) {
    try {
        await collection.dropIndex(name);
        console.log(`Dropped index ${collection.collectionName}.${name}`);
    } catch {
        /* missing */
    }
}

/** Gán id từ _id khi PROD lưu mã nghiệp vụ ở _id và để id trống. */
async function fillMissingBusinessIds(Model, prefix) {
    const missing = await Model.find({
        $or: [{ id: { $exists: false } }, { id: null }, { id: '' }]
    }).lean();

    let filled = 0;
    for (const row of missing) {
        const raw = row._id != null ? String(row._id).trim() : '';
        if (!raw) continue;
        // ObjectId hex 24 chars → không phải mã KH/GD
        if (/^[a-f0-9]{24}$/i.test(raw) && !raw.toUpperCase().startsWith(prefix)) continue;
        if (prefix && !raw.toUpperCase().startsWith(prefix) && !/^[A-Z]{2}\d+/i.test(raw)) {
            // vẫn chấp nhận nếu trông giống mã chữ+số
            if (!/^[A-Za-z]+\d+$/.test(raw)) continue;
        }
        await Model.updateOne({ _id: row._id }, { $set: { id: raw } });
        filled += 1;
    }
    console.log(`${Model.collection.collectionName}: filled missing id from _id → ${filled}`);
}

async function main() {
    const year = parseYear();
    console.log(`Backfill working_year → ${year}`);

    await connectDB();

    // Bỏ index cũ gây lỗi khi nhiều bản ghi id=null
    await dropIndexSafe(Customer.collection, 'id_1');
    await dropIndexSafe(Transaction.collection, 'id_1');
    await dropIndexSafe(Customer.collection, 'working_year_1_id_1');
    await dropIndexSafe(Transaction.collection, 'working_year_1_id_1');

    await fillMissingBusinessIds(Customer, 'KH');
    await fillMissingBusinessIds(Transaction, 'GD');

    const custRes = await Customer.updateMany(
        { $or: [{ working_year: { $exists: false } }, { working_year: null }] },
        { $set: { working_year: year } }
    );
    console.log(`customers working_year updated: ${custRes.modifiedCount}`);

    const txRes = await Transaction.updateMany(
        { $or: [{ working_year: { $exists: false } }, { working_year: null }] },
        { $set: { working_year: year } }
    );
    console.log(`transactions working_year updated: ${txRes.modifiedCount}`);

    // Tạo lại index partial unique
    await Customer.syncIndexes();
    await Transaction.syncIndexes();
    console.log('indexes synced');

    // Migrate legacy counters → year-scoped
    for (const base of ['customer', 'transaction']) {
        const legacy = await Counter.findOne({ code: base });
        const yearCode = `${base}_${year}`;
        const existing = await Counter.findOne({ code: yearCode });
        if (legacy && !existing) {
            await Counter.create({ code: yearCode, seq: legacy.seq || 0 });
            console.log(`counter ${yearCode} created from ${base} (seq=${legacy.seq})`);
        } else if (!existing) {
            await Counter.create({ code: yearCode, seq: 0 });
            console.log(`counter ${yearCode} created (seq=0)`);
        }
    }

    await AppSettings.findOneAndUpdate(
        { _id: 'default' },
        {
            $setOnInsert: {
                current_working_year: year,
                updated_at: new Date()
            }
        },
        { upsert: true }
    );
    console.log('app_settings ensured');

    console.log('Done.');
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
