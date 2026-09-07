import mongoose from 'mongoose';

/**
 * Thông báo hệ thống — do ADMIN tạo, hiển thị cho mọi người dùng.
 *
 * Dùng cho các loại tin như: lịch bảo trì, thay đổi quy tắc tính lãi,
 * nhắc chốt sổ cuối tháng. Không phải thông báo riêng theo từng user.
 */
const systemNotificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 120
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
    },
    /** Quyết định màu và mức độ nổi bật khi hiển thị */
    level: {
        type: String,
        enum: ['info', 'warning', 'critical'],
        default: 'info'
    },
    /** Tắt nhanh mà không cần xoá — giữ lại lịch sử */
    is_active: {
        type: Boolean,
        default: true
    },
    /** Khoảng thời gian hiệu lực. Để trống nghĩa là không giới hạn đầu đó. */
    starts_at: {
        type: Date,
        default: null
    },
    ends_at: {
        type: Date,
        default: null
    },
    /** Cho phép người xem tự đóng thông báo trên máy của họ */
    dismissible: {
        type: Boolean,
        default: true
    },
    created_by: {
        type: String,
        default: null,
        trim: true
    },
    updated_by: {
        type: String,
        default: null,
        trim: true
    }
}, {
    collection: 'system_notifications',
    timestamps: true
});

/** Lọc các thông báo đang có hiệu lực tại thời điểm `now` (mongo + firestore). */
export function activeNotificationFilter(now = new Date()) {
    return {
        is_active: true,
        $and: [
            { $or: [{ starts_at: null }, { starts_at: { $lte: now } }] },
            { $or: [{ ends_at: null }, { ends_at: { $gte: now } }] }
        ]
    };
}

systemNotificationSchema.statics.activeFilter = function (now = new Date()) {
    return activeNotificationFilter(now);
};

const SystemNotification = mongoose.model('SystemNotification', systemNotificationSchema);

export default SystemNotification;
