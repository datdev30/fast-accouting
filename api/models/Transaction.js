import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    // PROD may store business key in `_id` (e.g., "GD0001") instead of ObjectId.
    _id: {
        type: mongoose.Schema.Types.Mixed,
        default: () => new mongoose.Types.ObjectId()
    },
    id: {
        type: String,
        required: false,
        unique: true,
        sparse: true
    },
    customer_id: {
        type: String,
        required: true,
        ref: 'Customer'
    },
    type: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    transaction_date: {
        type: Date,
        required: true
    },
    interest_rate_snapshot: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['OPEN', 'PAID'],
        default: 'OPEN'
    },
    closed_at: {
        type: Date,
        default: null
    },
    final_interest: {
        type: Number,
        default: null
    },
    final_months: {
        type: Number,
        default: null
    },
    final_total: {
        type: Number,
        default: null
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, {
    collection: 'transactions',
    timestamps: false
});

// Indexes for faster queries
// NOTE: `unique: true` on `id` already creates an index; do not duplicate it here.
transactionSchema.index({ customer_id: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ transaction_date: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
