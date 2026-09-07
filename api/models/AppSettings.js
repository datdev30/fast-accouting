import mongoose from 'mongoose';

/**
 * Singleton app settings (doc id cố định: "default").
 * current_working_year: năm làm việc đang chọn bởi ADMIN — chỉ dùng để lọc giao dịch.
 * KH, user, lãi suất, STK, thông báo, Drive… không theo năm.
 */
const appSettingsSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: 'default'
    },
    current_working_year: {
        type: Number,
        required: true,
        default: 2025,
        min: 2000,
        max: 2100
    },
    updated_at: {
        type: Date,
        default: Date.now
    },
    updated_by: {
        type: String,
        default: null
    }
}, {
    collection: 'app_settings',
    timestamps: false
});

const AppSettings = mongoose.model('AppSettings', appSettingsSchema);

export default AppSettings;
