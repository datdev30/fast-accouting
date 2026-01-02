import mongoose from 'mongoose';

const interestConfigSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    rate_per_month: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        default: null
    }
}, {
    collection: 'interest_configs',
    timestamps: false
});

// NOTE: `unique: true` on `code` already creates an index; do not duplicate it here.

const InterestConfig = mongoose.model('InterestConfig', interestConfigSchema);

export default InterestConfig;
