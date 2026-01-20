import mongoose from 'mongoose';

const driveOAuthConfigSchema = new mongoose.Schema({
    // Chỉ có 1 record duy nhất cho toàn hệ thống
    refresh_token: {
        type: String,
        required: true,
        trim: true
    },
    // Lưu thông tin khi nào token được tạo
    token_created_at: {
        type: Date,
        default: Date.now
    },
    // Lưu email của account Google được authorize
    google_account_email: {
        type: String,
        default: null,
        trim: true
    }
}, {
    collection: 'drive_oauth_config',
    timestamps: true
});

// Đảm bảo chỉ có 1 record duy nhất
driveOAuthConfigSchema.index({ _id: 1 }, { unique: true });

const DriveOAuthConfig = mongoose.model('DriveOAuthConfig', driveOAuthConfigSchema);

export default DriveOAuthConfig;
