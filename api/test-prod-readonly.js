import 'dotenv/config';
import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI;

// Colors
const green = '\x1b[32m';
const red = '\x1b[31m';
const reset = '\x1b[0m';

console.log('--- PROD DB READ-ONLY CHECK ---');
console.log('URI configured:', uri ? 'YES' : 'NO');

if (!uri) {
    console.error(red + 'MONGODB_URI is missing!' + reset);
    process.exit(1);
}

async function run() {
    try {
        console.log('Connecting...');
        await mongoose.connect(uri);
        console.log(green + '✅ Connected to MongoDB' + reset);

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));

        const counts = {};
        for (const col of collections) {
            const count = await mongoose.connection.db.collection(col.name).countDocuments();
            counts[col.name] = count;
        }
        console.table(counts);

        console.log(green + '✅ Verification Complete. No changes made.' + reset);
    } catch (err) {
        console.error(red + '❌ Connection Failed: ' + err.message + reset);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
}

run();
