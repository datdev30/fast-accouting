import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    seq: {
        type: Number,
        default: 0
    }
}, {
    collection: 'counters',
    timestamps: false
});

// NOTE: `unique: true` on `code` already creates an index; do not duplicate it here.

const Counter = mongoose.model('Counter', counterSchema);

export default Counter;
