import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
    // PROD may store business key in `_id` (e.g., "KH001") instead of ObjectId.
    // Use Mixed to support both ObjectId and string ids.
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
    name: {
        type: String,
        required: true,
        trim: true
    },
    contact_info: {
        type: String,
        default: null
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, {
    collection: 'customers',
    timestamps: false
});

// Index for faster queries
// NOTE: `unique: true` on `id` already creates an index; do not duplicate it here.
customerSchema.index({ name: 1 });

const Customer = mongoose.model('Customer', customerSchema);

export default Customer;
