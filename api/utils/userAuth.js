/**
 * Attach User auth helpers onto Firestore user documents.
 */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

function looksLikeMd5Hex(value) {
    return typeof value === 'string' && /^[a-f0-9]{32}$/i.test(value);
}

export async function comparePassword(user, candidatePassword) {
    const stored = user.password_hash;
    if (user.legacy_password || (looksLikeMd5Hex(stored) && !String(stored).startsWith('$2'))) {
        const md5Hash = crypto.createHash('md5').update(candidatePassword).digest('hex');
        return md5Hash === stored;
    }
    return bcrypt.compare(candidatePassword, stored);
}

export async function comparePin(user, candidatePin) {
    if (!user.pin_hash) return false;
    const stored = user.pin_hash;
    if (looksLikeMd5Hex(stored) && !String(stored).startsWith('$2')) {
        const md5Hash = crypto.createHash('md5').update(candidatePin).digest('hex');
        return md5Hash === stored;
    }
    return bcrypt.compare(candidatePin, stored);
}

export function generateToken(user) {
    return jwt.sign(
        {
            id: user._id?.toString?.() ?? String(user._id),
            username: user.username
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
}

export async function hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

export async function hashPin(pin) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(pin, salt);
}

/** Bind instance methods onto a user-like object (mongo or firestore). */
export function withUserAuthMethods(user) {
    if (!user) return null;
    if (typeof user.comparePassword === 'function') return user;
    user.comparePassword = (pwd) => comparePassword(user, pwd);
    user.comparePin = (pin) => comparePin(user, pin);
    user.generateToken = () => generateToken(user);
    return user;
}
