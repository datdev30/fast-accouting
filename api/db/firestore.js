/**
 * Firebase Admin / Cloud Firestore bootstrap.
 * Credentials (one of):
 * - GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
 * - FIREBASE_SERVICE_ACCOUNT_JSON=<json string>
 * - FIREBASE_SERVICE_ACCOUNT_BASE64=<base64 json>
 */
import admin from 'firebase-admin';
import logger from '../utils/logger.js';

let db = null;

function loadCredential() {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        const json = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        return admin.credential.cert(json);
    }
    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
        const raw = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
        return admin.credential.cert(JSON.parse(raw));
    }
    // Application Default Credentials / GOOGLE_APPLICATION_CREDENTIALS
    return admin.credential.applicationDefault();
}

export async function initFirestore() {
    if (db) return db;

    if (!admin.apps.length) {
        let projectId = process.env.FIREBASE_PROJECT_ID || undefined;
        let credential = loadCredential();

        // Lấy project_id từ service account JSON nếu env thiếu
        if (!projectId && process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
            try {
                projectId = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON).project_id;
            } catch { /* ignore */ }
        }
        if (!projectId && process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
            try {
                const raw = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
                projectId = JSON.parse(raw).project_id;
            } catch { /* ignore */ }
        }
        if (!projectId && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            try {
                const fs = await import('fs');
                const raw = fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8');
                projectId = JSON.parse(raw).project_id;
            } catch { /* ignore */ }
        }

        if (!projectId) {
            throw new Error(
                'Thiếu FIREBASE_PROJECT_ID. Thêm vào api/.env ví dụ:\n' +
                '  FIREBASE_PROJECT_ID=fast-accounting-5fd20\n' +
                'và cấu hình credential (GOOGLE_APPLICATION_CREDENTIALS hoặc FIREBASE_SERVICE_ACCOUNT_JSON).'
            );
        }

        admin.initializeApp({
            credential,
            projectId
        });
        logger.info('Firebase Admin initialized', { projectId });
    }

    db = admin.firestore();
    return db;
}

export function getFirestore() {
    if (!db) {
        throw new Error('Firestore not initialized. Call initFirestore() first.');
    }
    return db;
}

export { admin };
