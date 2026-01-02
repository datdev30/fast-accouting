import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import { EJSON } from 'bson';

import Customer from '../models/Customer.js';
import Transaction from '../models/Transaction.js';
import InterestConfig from '../models/InterestConfig.js';
import User from '../models/User.js';
import Counter from '../models/Counter.js';

function getArg(name, fallback = null) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] ?? fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

async function readEjsonArray(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  const value = EJSON.parse(raw, { relaxed: false });
  if (!Array.isArray(value)) {
    throw new Error(`Expected array in ${filePath}`);
  }
  return value;
}

async function upsertMany(model, docs) {
  if (!docs.length) return 0;

  const ops = docs.map((doc) => {
    if (!doc || !doc._id) {
      // Without _id we cannot safely upsert. Skip.
      return null;
    }
    return {
      replaceOne: {
        filter: { _id: doc._id },
        replacement: doc,
        upsert: true,
      },
    };
  }).filter(Boolean);

  if (!ops.length) return 0;

  const res = await model.collection.bulkWrite(ops, { ordered: false });
  return (res.upsertedCount || 0) + (res.modifiedCount || 0) + (res.insertedCount || 0);
}

async function dropIfRequested(model, drop) {
  if (!drop) return;
  try {
    await model.collection.drop();
  } catch (err) {
    // If collection doesn't exist, ignore.
    if (err?.codeName !== 'NamespaceNotFound') throw err;
  }
}

async function importCollection({ name, model, backupDir, drop }) {
  const filePath = path.join(backupDir, `${name}.ejson.json`);
  const docs = await readEjsonArray(filePath);
  await dropIfRequested(model, drop);
  const affected = await upsertMany(model, docs);
  return { count: docs.length, affected };
}

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('Missing MONGODB_URI in environment.');
    process.exit(1);
  }

  const backupDirArg = getArg('--dir');
  if (!backupDirArg) {
    console.error('Usage: node scripts/backup-import.js --dir <backupDir> [--drop] [--force]');
    process.exit(1);
  }

  const backupDir = path.resolve(backupDirArg);
  const drop = hasFlag('--drop');
  const force = hasFlag('--force');

  if (drop && !force) {
    console.error('Refusing to run with --drop without --force.');
    console.error('This would DELETE existing collections before restore.');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);

  console.log(`Backup import <- ${backupDir}`);
  if (drop) {
    console.log('Mode: DROP + RESTORE (dangerous)');
  } else {
    console.log('Mode: UPSERT (safe)');
  }

  const results = {};

  results.customers = await importCollection({ name: 'customers', model: Customer, backupDir, drop });
  results.transactions = await importCollection({ name: 'transactions', model: Transaction, backupDir, drop });
  results.interest_configs = await importCollection({ name: 'interest_configs', model: InterestConfig, backupDir, drop });
  results.users = await importCollection({ name: 'users', model: User, backupDir, drop });
  results.counters = await importCollection({ name: 'counters', model: Counter, backupDir, drop });

  console.log('Done.');
  for (const [k, v] of Object.entries(results)) {
    console.log(`${k}: read=${v.count} affected=${v.affected}`);
  }

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('Backup import failed:', err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
