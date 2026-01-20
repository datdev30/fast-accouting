import mongoose from 'mongoose';

const bankAccountConfigSchema = new mongoose.Schema({
    // Chỉ có 1 record duy nhất cho toàn hệ thống
    // Không có user_id vì đây là cấu hình toàn hệ thống
    bank_code: {
        type: String,
        required: true,
        trim: true
    },
    bank_name: {
        type: String,
        required: true,
        trim: true
    },
    account_number: {
        type: String,
        required: true,
        trim: true
    },
    account_holder: {
        type: String,
        required: true,
        trim: true
    },
    qr_code_url: {
        type: String,
        default: null,
        trim: true
    },
    default_add_info: {
        type: String,
        default: null,
        trim: true,
        maxlength: 100 // Giới hạn độ dài
    }
}, {
    collection: 'bank_account_config',
    timestamps: true // Tự động thêm createdAt và updatedAt
});

// Đảm bảo chỉ có 1 record duy nhất
// Tạo index unique trên một trường giả để đảm bảo chỉ có 1 record
bankAccountConfigSchema.index({ _id: 1 }, { unique: true });

const BankAccountConfig = mongoose.model('BankAccountConfig', bankAccountConfigSchema);

export default BankAccountConfig;
