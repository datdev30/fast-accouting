import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

function looksLikeMd5Hex(value) {
    return typeof value === 'string' && /^[a-f0-9]{32}$/i.test(value);
}

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    display_name: {
        type: String,
        default: null
    },
    role: {
        type: String,
        default: null
    },
    password_hash: {
        type: String,
        required: true
    },
    pin_hash: {
        type: String,
        default: null
    },
    // Legacy support for MD5 passwords during migration
    legacy_password: {
        type: Boolean,
        default: false
    }
}, {
    collection: 'users',
    timestamps: false
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    const stored = this.password_hash;

    // Legacy support (FastAPI backend stored MD5 in password_hash)
    if (this.legacy_password || (looksLikeMd5Hex(stored) && !String(stored).startsWith('$2'))) {
        const crypto = await import('crypto');
        const md5Hash = crypto.createHash('md5').update(candidatePassword).digest('hex');
        return md5Hash === stored;
    }

    // Otherwise use bcrypt
    return await bcrypt.compare(candidatePassword, stored);
};

// Method to compare PIN
userSchema.methods.comparePin = async function (candidatePin) {
    if (!this.pin_hash) return false;

    const stored = this.pin_hash;
    // Legacy support (FastAPI backend stored MD5 for pin_hash)
    if (looksLikeMd5Hex(stored) && !String(stored).startsWith('$2')) {
        const crypto = await import('crypto');
        const md5Hash = crypto.createHash('md5').update(candidatePin).digest('hex');
        return md5Hash === stored;
    }

    return await bcrypt.compare(candidatePin, stored);
};

// Method to generate JWT token
userSchema.methods.generateToken = function () {
    return jwt.sign(
        {
            id: this._id?.toString?.() ?? String(this._id),
            username: this.username
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

// Static method to hash password
userSchema.statics.hashPassword = async function (password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

// Static method to hash PIN
userSchema.statics.hashPin = async function (pin) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(pin, salt);
};

const User = mongoose.model('User', userSchema);

export default User;
