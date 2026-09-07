/**
 * Data store selector: mongo (default) | firestore
 * Set DATA_STORE=firestore to use Cloud Firestore via Admin SDK.
 */
import logger from '../utils/logger.js';

let initialized = false;
let store = 'mongo';

export function getDataStore() {
    const raw = String(process.env.DATA_STORE || 'mongo').trim().toLowerCase();
    store = raw === 'firestore' ? 'firestore' : 'mongo';
    return store;
}

export function isFirestore() {
    return getDataStore() === 'firestore';
}

export async function initDataStore() {
    if (initialized) return getDataStore();
    const mode = getDataStore();
    if (mode === 'firestore') {
        const { initFirestore } = await import('./firestore.js');
        await initFirestore();
        logger.info('Data store: Firestore');
    } else {
        logger.info('Data store: MongoDB');
    }
    initialized = true;
    return mode;
}
