#!/usr/bin/env node
/**
 * Migrate MongoDB → Cloud Firestore.
 *
 * Prerequisites:
 * - MONGODB_URI set
 * - Firebase credentials: GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_JSON
 * - FIREBASE_PROJECT_ID (recommended)
 *
 * Usage:
 *   node scripts/mongo-to-firestore.js --preview [--year=2025]
 *   node scripts/mongo-to-firestore.js [--year=2025]
 *   npm run migrate:firestore:preview
 *   npm run migrate:firestore
 *
 * Lưu ý: đừng dùng --dry-run với npm (npm nuốt flag đó). Dùng --preview.
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../config/db.js';
import { initFirestore, getFirestore } from '../db/firestore.js';
import Customer from '../models/Customer.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import InterestConfig from '../models/InterestConfig.js';
import Counter from '../models/Counter.js';
import BankAccountConfig from '../models/BankAccountConfig.js';
import DriveOAuthConfig from '../models/DriveOAuthConfig.js';
import SystemNotification from '../models/SystemNotification.js';
import AppSettings from '../models/AppSettings.js';
import { DEFAULT_WORKING_YEAR } from '../utils/workingYear.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const DRY =
    process.argv.includes('--preview')
    || process.argv.includes('--dry')
    || process.argv.includes('--dry-run')
    || process.env.DRY_RUN === '1'
    || process.env.DRY_RUN === 'true';
const yearArg = process.argv.find((a) => a.startsWith('--year='));
const FALLBACK_YEAR = yearArg ? Number(yearArg.split('=')[1]) : DEFAULT_WORKING_YEAR;

function plain(doc) {
    if (!doc) return null;
    const o = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
    // Normalize dates already Date; stringify ObjectIds
    if (o._id != null) o._id = String(o._id);
    return o;
}

function docId(row, fallbackKeys = ['_id', 'id', 'code', 'username']) {
    for (const k of fallbackKeys) {
        if (row[k] != null && String(row[k]).trim()) return String(row[k]).trim();
    }
    return null;
}

async function writeCollection(name, rows, idFn) {
    console.log(`\n→ ${name}: ${rows.length} docs`);
    if (DRY) return { written: 0, skipped: rows.length };

    const db = getFirestore();
    let written = 0;
    let batch = db.batch();
    let ops = 0;

    const commit = async () => {
        if (ops === 0) return;
        await batch.commit();
        batch = db.batch();
        ops = 0;
    };

    for (const row of rows) {
        const id = idFn(row);
        if (!id) {
            console.warn(`  skip (no id):`, row);
            continue;
        }
        const ref = db.collection(name).doc(id);
        batch.set(ref, row, { merge: true });
        ops += 1;
        written += 1;
        if (ops >= 400) await commit();
    }
    await commit();
    return { written };
}

async function main() {
    console.log(DRY ? 'PREVIEW — chỉ đọc Mongo, không ghi Firestore' : 'MIGRATE Mongo → Firestore');
    await connectDB();
    if (!DRY) {
        await initFirestore();
    } else {
        console.log('(bỏ qua khởi tạo Firestore ở chế độ preview)');
    }

    // Khách hàng dùng chung mọi năm — không gắn / không prefix working_year
    const customers = (await Customer.find().lean()).map((c) => {
        const row = plain(c);
        delete row.working_year;
        return row;
    });
    const transactions = (await Transaction.find().lean()).map((t) => {
        const row = plain(t);
        if (row.working_year == null) row.working_year = FALLBACK_YEAR;
        return row;
    });
    const users = (await User.find().lean()).map((u) => {
        const row = plain(u);
        // Prefer username as stable Firestore doc id
        if (!row._id) row._id = row.username;
        return row;
    });
    const interest = (await InterestConfig.find().lean()).map(plain);
    const counters = (await Counter.find().lean()).map(plain);
    const banks = (await BankAccountConfig.find().lean()).map(plain);
    const drives = (await DriveOAuthConfig.find().lean()).map(plain);
    const notifications = (await SystemNotification.find().lean()).map(plain);
    let settings = await AppSettings.findById('default').lean();
    if (!settings) {
        settings = { _id: 'default', current_working_year: FALLBACK_YEAR, updated_at: new Date() };
    } else {
        settings = plain(settings);
        settings._id = 'default';
    }

    const results = {};
    results.customers = await writeCollection('customers', customers, (r) => String(r.id || r._id));
    results.transactions = await writeCollection('transactions', transactions, (r) => {
        // GD vẫn theo năm: doc id = 2025_GDxxxx (tránh trùng mã giữa các năm)
        const biz = r.id || r._id;
        return r.working_year ? `${r.working_year}_${biz}` : String(biz);
    });
    results.users = await writeCollection('users', users, (r) => String(r.username || r._id));
    results.interest_configs = await writeCollection('interest_configs', interest, (r) => String(r.code || r._id));
    results.counters = await writeCollection('counters', counters, (r) => String(r.code || r._id));
    results.bank_account_config = await writeCollection('bank_account_config', banks, (r) => String(r._id || 'default'));
    results.drive_oauth_config = await writeCollection('drive_oauth_config', drives, (r) => String(r._id || 'default'));
    results.system_notifications = await writeCollection(
        'system_notifications',
        notifications,
        (r) => String(r._id)
    );
    results.app_settings = await writeCollection('app_settings', [settings], () => 'default');

    console.log('\n=== Verify (Mongo counts) ===');
    console.log({
        customers: customers.length,
        transactions: transactions.length,
        users: users.length,
        interest_configs: interest.length,
        counters: counters.length,
        bank_account_config: banks.length,
        drive_oauth_config: drives.length,
        system_notifications: notifications.length,
        app_settings: 1
    });
    console.log('=== Write results ===');
    console.log(results);

    if (!DRY) {
        const db = getFirestore();
        const [fsCustomers, fsTx] = await Promise.all([
            db.collection('customers').get().then((s) => s.size),
            db.collection('transactions').get().then((s) => s.size)
        ]);
        console.log('\n=== Firestore counts ===');
        console.log({ customers: fsCustomers, transactions: fsTx });
    }

    console.log('\nDone.');
    console.log('Next: set DATA_STORE=firestore and restart API. See docs/FIRESTORE_CUTOVER.md');
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
