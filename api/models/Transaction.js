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
        sparse: true
    },
    /** Năm làm việc — lọc theo field này, không theo năm của transaction_date */
    working_year: {
        type: Number,
        required: true,
        default: 2025,
        index: true
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
    image_drive_file_id: {
        type: String,
        default: null
    },
    image_mime_type: {
        type: String,
        default: null
    },
    image_original_name: {
        type: String,
        default: null
    },
    image_uploaded_at: {
        type: Date,
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

transactionSchema.index({ customer_id: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ transaction_date: 1 });
transactionSchema.index(
    { working_year: 1, id: 1 },
    {
        unique: true,
        name: 'working_year_1_id_1_partial',
        partialFilterExpression: { id: { $type: 'string' } }
    }
);
transactionSchema.index({ working_year: 1, customer_id: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
