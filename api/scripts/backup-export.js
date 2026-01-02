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

function formatTimestampForPath(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    '_',
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('');
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function writeJsonEjson(filePath, value) {
  const json = EJSON.stringify(value, { relaxed: false, indent: 2 });
  await fs.writeFile(filePath, json, 'utf8');
}

async function exportCollection({ name, model, outDir }) {
  const docs = await model.find().lean();
  await writeJsonEjson(path.join(outDir, `${name}.ejson.json`), docs);
  return docs.length;
}

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('Missing MONGODB_URI in environment.');
    process.exit(1);
  }

  const outArg = getArg('--out');
  const rootOut = outArg
    ? path.resolve(outArg)
    : path.resolve(process.cwd(), 'backups', formatTimestampForPath());

  await ensureDir(rootOut);

  console.log(`Backup export -> ${rootOut}`);

  await mongoose.connect(mongoUri);

  const startedAt = new Date();
  const counts = {};

  counts.customers = await exportCollection({ name: 'customers', model: Customer, outDir: rootOut });
  counts.transactions = await exportCollection({ name: 'transactions', model: Transaction, outDir: rootOut });
  counts.interest_configs = await exportCollection({ name: 'interest_configs', model: InterestConfig, outDir: rootOut });
  counts.users = await exportCollection({ name: 'users', model: User, outDir: rootOut });
  counts.counters = await exportCollection({ name: 'counters', model: Counter, outDir: rootOut });

  const meta = {
    app: 'FastAccounting',
    format: 'ejson-array',
    created_at: new Date().toISOString(),
    mongodb_uri_hint: mongoUri.replace(/:\/\/.*@/, '://***@'),
    counts,
    node: process.version,
  };

  await writeJsonEjson(path.join(rootOut, 'backup.meta.ejson.json'), meta);

  const finishedAt = new Date();
  console.log('Done.');
  console.log(`Duration: ${Math.round((finishedAt - startedAt) / 1000)}s`);
  console.log(`Customers: ${counts.customers}`);
  console.log(`Transactions: ${counts.transactions}`);
  console.log(`Interest configs: ${counts.interest_configs}`);
  console.log(`Users: ${counts.users}`);
  console.log(`Counters: ${counts.counters}`);

  await mongoose.disconnect();

  if (hasFlag('--print-path-only')) {
    console.log(rootOut);
  }
}

main().catch(async (err) => {
  console.error('Backup export failed:', err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
