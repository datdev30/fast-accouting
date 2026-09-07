/**
 * Firestore model factory — API gần giống Mongoose subset dùng trong routes.
 */
import { getFirestore } from './firestore.js';
import { isFirestore } from './dataStore.js';

/** Firestore Timestamp / { _seconds, _nanoseconds } → Date */
function coerceDate(val) {
    if (val == null || val instanceof Date) return val;
    if (typeof val?.toDate === 'function') return val.toDate();
    if (typeof val?.toMillis === 'function') return new Date(val.toMillis());
    if (typeof val === 'object' && typeof val._seconds === 'number') {
        return new Date(val._seconds * 1000 + Math.floor((val._nanoseconds || 0) / 1e6));
    }
    if (typeof val === 'object' && typeof val.seconds === 'number') {
        return new Date(val.seconds * 1000 + Math.floor((val.nanoseconds || 0) / 1e6));
    }
    return val;
}

function hydrateFirestoreData(value) {
    const dated = coerceDate(value);
    if (dated !== value) return dated;
    if (Array.isArray(value)) return value.map(hydrateFirestoreData);
    if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
        const out = {};
        for (const [k, v] of Object.entries(value)) out[k] = hydrateFirestoreData(v);
        return out;
    }
    return value;
}

function toMillis(val) {
    if (val == null) return NaN;
    const d = coerceDate(val);
    if (d instanceof Date) return d.getTime();
    const t = new Date(d).getTime();
    return t;
}

function toPlain(doc) {
    if (!doc) return null;
    const data = typeof doc.data === 'function' ? doc.data() : { ...doc };
    const id = doc.id || data._id || data.id;
    const hydrated = hydrateFirestoreData(data);
    return { ...hydrated, _id: hydrated._id ?? id };
}

function matchQuery(doc, query = {}) {
    if (!query || Object.keys(query).length === 0) return true;

    if (query.$or) {
        return query.$or.some((q) => matchQuery(doc, q));
    }
    if (query.$and) {
        return query.$and.every((q) => matchQuery(doc, q));
    }

    for (const [key, cond] of Object.entries(query)) {
        if (key.startsWith('$')) continue;
        const val = doc[key];

        if (cond && typeof cond === 'object' && !Array.isArray(cond) && !(cond instanceof Date)) {
            if (cond.$in) {
                const set = cond.$in.map((x) => String(x));
                if (!set.includes(String(val))) return false;
                continue;
            }
            if (cond.$gte != null || cond.$lte != null || cond.$gt != null || cond.$lt != null) {
                if (val == null) return false;
                const t = toMillis(val);
                if (Number.isNaN(t)) return false;
                if (cond.$gte != null && t < toMillis(cond.$gte)) return false;
                if (cond.$lte != null && t > toMillis(cond.$lte)) return false;
                if (cond.$gt != null && t <= toMillis(cond.$gt)) return false;
                if (cond.$lt != null && t >= toMillis(cond.$lt)) return false;
                continue;
            }
            if (cond.$exists === false && val !== undefined && val !== null) return false;
            if (cond.$exists === true && (val === undefined || val === null)) return false;
        } else if (String(val) !== String(cond) && val !== cond) {
            // loose equality for Mixed ids / null ≈ undefined
            if (val != cond) return false;
        }
    }
    return true;
}

function sortDocs(docs, sortSpec = {}) {
    const entries = Object.entries(sortSpec);
    if (!entries.length) return docs;
    return [...docs].sort((a, b) => {
        for (const [k, dir] of entries) {
            const aTime = toMillis(a[k]);
            const bTime = toMillis(b[k]);
            const av = Number.isNaN(aTime) ? a[k] : aTime;
            const bv = Number.isNaN(bTime) ? b[k] : bTime;
            if (av < bv) return dir < 0 ? 1 : -1;
            if (av > bv) return dir < 0 ? -1 : 1;
        }
        return 0;
    });
}

function parseSelect(fields) {
    if (!fields) return null;
    if (Array.isArray(fields)) return fields.filter(Boolean);
    if (typeof fields === 'string') return fields.split(/\s+/).filter(Boolean);
    if (typeof fields === 'object') {
        return Object.entries(fields)
            .filter(([, v]) => v)
            .map(([k]) => k);
    }
    return null;
}

function projectDoc(doc, keys) {
    if (!keys?.length) return doc;
    const out = {};
    for (const k of keys) {
        if (k in doc) out[k] = doc[k];
    }
    if (doc._id !== undefined && out._id === undefined) out._id = doc._id;
    return out;
}

function docIdFromData(data, preferredKeys = ['id', '_id']) {
    for (const k of preferredKeys) {
        if (data[k] != null && String(data[k]).trim()) return String(data[k]).trim();
    }
    return null;
}

class FsDocument {
    constructor(collectionName, data) {
        Object.assign(this, data);
        this.__collection = collectionName;
        this.__isNew = !data.__exists;
        delete this.__exists;
    }

    toObject() {
        const { __collection, __isNew, ...rest } = this;
        return { ...rest };
    }

    toJSON() {
        return this.toObject();
    }

    async save() {
        const db = getFirestore();
        const payload = this.toObject();
        // Keep dates as Date (Admin SDK accepts Date)
        const id = docIdFromData(payload) || db.collection(this.__collection).doc().id;
        if (!payload._id) payload._id = id;
        await db.collection(this.__collection).doc(String(id)).set(payload, { merge: true });
        this._id = payload._id;
        this.__isNew = false;
        return this;
    }
}

class FsQuery {
    constructor(collectionName, filter = {}, { single = false } = {}) {
        this.collectionName = collectionName;
        this.filter = filter;
        this._sort = {};
        this._lean = false;
        this._select = null;
        this._single = single;
    }

    sort(spec) {
        this._sort = spec || {};
        return this;
    }

    select(fields) {
        this._select = parseSelect(fields);
        return this;
    }

    lean() {
        this._lean = true;
        return this;
    }

    async exec() {
        const db = getFirestore();
        const snap = await db.collection(this.collectionName).get();
        let docs = snap.docs.map((d) => toPlain(d));
        docs = docs.filter((d) => matchQuery(d, this.filter));
        docs = sortDocs(docs, this._sort);

        if (this._single) {
            const row = docs[0];
            if (!row) return null;
            const projected = projectDoc(row, this._select);
            if (this._lean) return projected;
            return new FsDocument(this.collectionName, { ...projected, __exists: true });
        }

        return docs.map((row) => {
            const projected = projectDoc(row, this._select);
            return this._lean
                ? projected
                : new FsDocument(this.collectionName, { ...projected, __exists: true });
        });
    }

    then(resolve, reject) {
        return this.exec().then(resolve, reject);
    }
}

export function createFsModel(collectionName, { idKeys = ['id', '_id'] } = {}) {
    const Model = function ModelConstructor(data = {}) {
        return new FsDocument(collectionName, { ...data, __exists: false });
    };

    Model.find = (query = {}) => new FsQuery(collectionName, query);

    // Chainable like mongoose: findOne().sort().select().lean()
    Model.findOne = (query = {}) => new FsQuery(collectionName, query || {}, { single: true });

    Model.findById = (id) => Model.findOne({ $or: [{ _id: id }, { id }] });

    Model.create = async (data) => {
        const doc = new FsDocument(collectionName, { ...data, __exists: false });
        await doc.save();
        return doc;
    };

    Model.deleteOne = async (query = {}) => {
        const found = await Model.findOne(query);
        if (!found) return { deletedCount: 0 };
        const id = docIdFromData(found.toObject(), idKeys);
        await getFirestore().collection(collectionName).doc(String(id)).delete();
        return { deletedCount: 1 };
    };

    Model.deleteMany = async (query = {}) => {
        const rows = await Model.find(query).lean();
        const db = getFirestore();
        let n = 0;
        let batch = db.batch();
        for (const row of rows) {
            const id = docIdFromData(row, idKeys);
            if (!id) continue;
            batch.delete(db.collection(collectionName).doc(String(id)));
            n += 1;
            if (n % 400 === 0) {
                await batch.commit();
                batch = db.batch();
            }
        }
        if (n % 400 !== 0) await batch.commit();
        return { deletedCount: n };
    };

    Model.updateMany = async (query, update) => {
        const rows = await Model.find(query).lean();
        const db = getFirestore();
        let modified = 0;
        for (const row of rows) {
            const id = docIdFromData(row, idKeys);
            if (!id) continue;
            const patch = update.$set || update;
            await db.collection(collectionName).doc(String(id)).set({ ...row, ...patch }, { merge: true });
            modified += 1;
        }
        return { modifiedCount: modified, matchedCount: rows.length };
    };

    Model.findOneAndUpdate = async (query, update, opts = {}) => {
        let doc = await Model.findOne(query);
        const patch = update.$set || update;
        if (!doc) {
            if (!opts.upsert) return null;
            doc = new FsDocument(collectionName, {
                ...(typeof query._id !== 'undefined' ? { _id: query._id } : {}),
                ...patch,
                __exists: false
            });
        } else {
            Object.assign(doc, patch);
        }
        await doc.save();
        return opts.new === false ? doc : doc;
    };

    Model.distinct = async (field) => {
        const rows = await Model.find({}).lean();
        return [...new Set(rows.map((r) => r[field]).filter((v) => v != null))];
    };

    Model.aggregate = async (pipeline = []) => {
        // Minimal support: $match → $group by month → $sort
        let rows = await Model.find({}).lean();
        for (const stage of pipeline) {
            if (stage.$match) {
                rows = rows.filter((r) => matchQuery(r, stage.$match));
            } else if (stage.$group && stage.$group._id?.$month) {
                const field = stage.$group._id.$month.replace('$', '');
                const map = {};
                for (const r of rows) {
                    const d = new Date(r[field]);
                    const m = d.getMonth() + 1;
                    map[m] = (map[m] || 0) + (stage.$group.count?.$sum || 1);
                }
                rows = Object.entries(map).map(([month, count]) => ({
                    _id: Number(month),
                    count
                }));
            } else if (stage.$sort) {
                rows = sortDocs(rows, stage.$sort);
            }
        }
        return rows;
    };

    Model.collectionName = collectionName;
    return Model;
}

export function assertFirestoreMode() {
    if (!isFirestore()) {
        throw new Error('Firestore model used while DATA_STORE is not firestore');
    }
}
