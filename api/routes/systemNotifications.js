import express from 'express';
import { getSystemNotificationModel } from '../db/models.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { verifyAdminPin } from '../utils/helpers.js';
import { APIError, ErrorCodes } from '../utils/errors.js';
import logger from '../utils/logger.js';

const router = express.Router();

const LEVELS = ['info', 'warning', 'critical'];

/** Chuẩn hoá và kiểm tra payload dùng chung cho create/update. */
function normalizePayload(body, { partial = false } = {}) {
    const out = {};

    if (body.title !== undefined || !partial) {
        const title = String(body.title ?? '').trim();
        if (!title) throw new APIError('Tiêu đề là bắt buộc', 400, ErrorCodes.VALIDATION_ERROR);
        if (title.length > 120) throw new APIError('Tiêu đề tối đa 120 ký tự', 400, ErrorCodes.VALIDATION_ERROR);
        out.title = title;
    }

    if (body.message !== undefined || !partial) {
        const message = String(body.message ?? '').trim();
        if (!message) throw new APIError('Nội dung là bắt buộc', 400, ErrorCodes.VALIDATION_ERROR);
        if (message.length > 2000) throw new APIError('Nội dung tối đa 2000 ký tự', 400, ErrorCodes.VALIDATION_ERROR);
        out.message = message;
    }

    if (body.level !== undefined) {
        const level = String(body.level).trim().toLowerCase();
        if (!LEVELS.includes(level)) {
            throw new APIError(`Mức độ phải là một trong: ${LEVELS.join(', ')}`, 400, ErrorCodes.VALIDATION_ERROR);
        }
        out.level = level;
    }

    if (body.is_active !== undefined) out.is_active = Boolean(body.is_active);
    if (body.dismissible !== undefined) out.dismissible = Boolean(body.dismissible);

    for (const field of ['starts_at', 'ends_at']) {
        if (body[field] === undefined) continue;
        if (body[field] === null || body[field] === '') {
            out[field] = null;
            continue;
        }
        const d = new Date(body[field]);
        if (Number.isNaN(d.getTime())) {
            throw new APIError(`${field} không phải ngày hợp lệ`, 400, ErrorCodes.VALIDATION_ERROR);
        }
        out[field] = d;
    }

    const starts = out.starts_at;
    const ends = out.ends_at;
    if (starts && ends && ends < starts) {
        throw new APIError('Ngày kết thúc không được trước ngày bắt đầu', 400, ErrorCodes.VALIDATION_ERROR);
    }

    return out;
}

/**
 * GET /api/system-notifications/active
 * Thông báo đang hiệu lực — công khai (không cần đăng nhập)
 * để banner hiện ngay khi mở trang, kể cả màn hình login.
 * Đặt TRƯỚC route '/:id' để không bị nuốt mất bởi param.
 */
router.get('/active', async (req, res, next) => {
    try {
        const SystemNotification = getSystemNotificationModel();
        const items = await SystemNotification
            .find(SystemNotification.activeFilter())
            .sort({ level: 1, createdAt: -1 })
            .select('title message level dismissible createdAt updatedAt')
            .lean();
        res.json(items);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/system-notifications
 * Toàn bộ thông báo, kể cả đã tắt (chỉ ADMIN).
 */
router.get('/', authMiddleware, requireAdmin, async (req, res, next) => {
    try {
        const SystemNotification = getSystemNotificationModel();
        const items = await SystemNotification.find().sort({ createdAt: -1 }).lean();
        res.json(items);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/system-notifications
 * Tạo thông báo mới (chỉ ADMIN).
 */
router.post('/', authMiddleware, requireAdmin, async (req, res, next) => {
    try {
        const SystemNotification = getSystemNotificationModel();
        const payload = normalizePayload(req.body);
        payload.created_by = req.currentUser?.username || null;
        payload.updated_by = payload.created_by;

        const created = await SystemNotification.create(payload);
        logger.info('System notification created', { id: created._id.toString(), title: created.title });

        res.status(201).json(created);
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/system-notifications/:id
 * Sửa một phần thông báo (chỉ ADMIN).
 */
router.patch('/:id', authMiddleware, requireAdmin, async (req, res, next) => {
    try {
        const SystemNotification = getSystemNotificationModel();
        const existing = await SystemNotification.findById(req.params.id);
        if (!existing) {
            throw new APIError('Không tìm thấy thông báo', 404, ErrorCodes.NOT_FOUND);
        }

        const payload = normalizePayload(req.body, { partial: true });

        // Kiểm tra chéo với giá trị đang lưu khi chỉ gửi lên một trong hai mốc
        const starts = payload.starts_at !== undefined ? payload.starts_at : existing.starts_at;
        const ends = payload.ends_at !== undefined ? payload.ends_at : existing.ends_at;
        if (starts && ends && ends < starts) {
            throw new APIError('Ngày kết thúc không được trước ngày bắt đầu', 400, ErrorCodes.VALIDATION_ERROR);
        }

        Object.assign(existing, payload);
        existing.updated_by = req.currentUser?.username || null;
        await existing.save();

        logger.info('System notification updated', { id: existing._id.toString() });
        res.json(existing);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/system-notifications/delete-secure
 * Xoá vĩnh viễn, cần mã PIN (chỉ ADMIN) — cùng quy ước với các mục khác.
 */
router.post('/delete-secure', authMiddleware, requireAdmin, async (req, res, next) => {
    try {
        const { id, pin } = req.body;
        if (!id) {
            throw new APIError('Thiếu id thông báo', 400, ErrorCodes.VALIDATION_ERROR);
        }

        await verifyAdminPin(pin, req.currentUser);

        const SystemNotification = getSystemNotificationModel();
        const found = await SystemNotification.findById(id);
        if (!found) {
            throw new APIError('Không tìm thấy thông báo', 404, ErrorCodes.NOT_FOUND);
        }

        await SystemNotification.deleteOne({ _id: id });
        logger.warn('System notification deleted', { id, title: found.title });

        res.json({ message: 'Đã xóa thông báo' });
    } catch (error) {
        next(error);
    }
});

export default router;
