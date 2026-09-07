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

// Khách hàng dùng chung mọi năm làm việc — không gắn working_year
customerSchema.index({ name: 1 });

const Customer = mongoose.model('Customer', customerSchema);

export default Customer;
