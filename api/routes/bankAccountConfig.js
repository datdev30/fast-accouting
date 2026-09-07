import express from 'express';
import { getBankAccountConfigModel } from '../db/models.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { APIError, ErrorCodes } from '../utils/errors.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/bank-account-config
 * Lấy cấu hình ngân hàng toàn hệ thống (tất cả user đều có thể xem)
 */
router.get('/', async (req, res, next) => {
    try {
        // Chỉ có 1 record duy nhất, lấy record đầu tiên
        const config = await getBankAccountConfigModel().findOne().sort({ updatedAt: -1 });
        
        if (!config) {
            // Trả về null nếu chưa có cấu hình
            return res.json(null);
        }
        
        res.json(config);
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/bank-account-config
 * Lưu/cập nhật cấu hình ngân hàng toàn hệ thống (chỉ ADMIN)
 */
router.put('/', authMiddleware, requireAdmin, async (req, res, next) => {
    try {
        const { bank_code, bank_name, account_number, account_holder, qr_code_url, default_add_info } = req.body;

        // Validation
        if (!bank_code || !bank_name || !account_number || !account_holder) {
            throw new APIError(
                'bank_code, bank_name, account_number và account_holder là bắt buộc',
                400,
                ErrorCodes.VALIDATION_ERROR
            );
        }

        // Validate account_number chỉ chứa số
        if (!/^\d+$/.test(account_number.trim())) {
            throw new APIError(
                'Số tài khoản chỉ được chứa số',
                400,
                ErrorCodes.VALIDATION_ERROR
            );
        }

        // Validate độ dài
        if (account_number.trim().length < 8 || account_number.trim().length > 20) {
            throw new APIError(
                'Số tài khoản phải có từ 8 đến 20 chữ số',
                400,
                ErrorCodes.VALIDATION_ERROR
            );
        }

        if (account_holder.trim().length < 2 || account_holder.trim().length > 100) {
            throw new APIError(
                'Tên chủ tài khoản phải có từ 2 đến 100 ký tự',
                400,
                ErrorCodes.VALIDATION_ERROR
            );
        }

        // Tìm hoặc tạo cấu hình (chỉ có 1 record duy nhất)
        let config = await getBankAccountConfigModel().findOne();
        
        if (config) {
            // Cập nhật record hiện có
            config.bank_code = bank_code.trim();
            config.bank_name = bank_name.trim();
            config.account_number = account_number.trim();
            config.account_holder = account_holder.trim();
            if (qr_code_url !== undefined) {
                config.qr_code_url = qr_code_url ? qr_code_url.trim() : null;
            }
            if (default_add_info !== undefined) {
                config.default_add_info = default_add_info ? default_add_info.trim() : null;
            }
            await config.save();
        } else {
            // Tạo record mới
            config = new (getBankAccountConfigModel())({
                bank_code: bank_code.trim(),
                bank_name: bank_name.trim(),
                account_number: account_number.trim(),
                account_holder: account_holder.trim(),
                qr_code_url: qr_code_url ? qr_code_url.trim() : null,
                default_add_info: default_add_info ? default_add_info.trim() : null
            });
            await config.save();
        }

        logger.info('Bank account config updated', { 
            bank_code: config.bank_code,
            account_number: config.account_number,
            updated_by: req.currentUser?.username || 'unknown'
        });

        res.json(config);
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/bank-account-config
 * Cập nhật một phần cấu hình (chỉ ADMIN)
 */
router.patch('/', authMiddleware, requireAdmin, async (req, res, next) => {
    try {
        const { bank_code, bank_name, account_number, account_holder, qr_code_url, default_add_info } = req.body;

        // Tìm cấu hình hiện có
        let config = await getBankAccountConfigModel().findOne();
        
        if (!config) {
            // Nếu chưa có, tạo mới (nhưng cần đủ thông tin bắt buộc)
            if (!bank_code || !bank_name || !account_number || !account_holder) {
                throw new APIError(
                    'Chưa có cấu hình. Vui lòng cung cấp đầy đủ thông tin: bank_code, bank_name, account_number, account_holder',
                    400,
                    ErrorCodes.VALIDATION_ERROR
                );
            }
            config = new (getBankAccountConfigModel())({
                bank_code: bank_code.trim(),
                bank_name: bank_name.trim(),
                account_number: account_number.trim(),
                account_holder: account_holder.trim(),
                qr_code_url: qr_code_url ? qr_code_url.trim() : null,
                default_add_info: default_add_info ? default_add_info.trim() : null
            });
        } else {
            // Cập nhật các trường được cung cấp
            if (bank_code !== undefined) {
                config.bank_code = bank_code.trim();
            }
            if (bank_name !== undefined) {
                config.bank_name = bank_name.trim();
            }
            if (account_number !== undefined) {
                // Validate account_number nếu được cập nhật
                if (!/^\d+$/.test(account_number.trim())) {
                    throw new APIError(
                        'Số tài khoản chỉ được chứa số',
                        400,
                        ErrorCodes.VALIDATION_ERROR
                    );
                }
                if (account_number.trim().length < 8 || account_number.trim().length > 20) {
                    throw new APIError(
                        'Số tài khoản phải có từ 8 đến 20 chữ số',
                        400,
                        ErrorCodes.VALIDATION_ERROR
                    );
                }
                config.account_number = account_number.trim();
            }
            if (account_holder !== undefined) {
                if (account_holder.trim().length < 2 || account_holder.trim().length > 100) {
                    throw new APIError(
                        'Tên chủ tài khoản phải có từ 2 đến 100 ký tự',
                        400,
                        ErrorCodes.VALIDATION_ERROR
                    );
                }
                config.account_holder = account_holder.trim();
            }
            if (qr_code_url !== undefined) {
                config.qr_code_url = qr_code_url ? qr_code_url.trim() : null;
            }
            if (default_add_info !== undefined) {
                // Validate độ dài nội dung chuyển khoản
                if (default_add_info && default_add_info.trim().length > 100) {
                    throw new APIError(
                        'Nội dung chuyển khoản không được vượt quá 100 ký tự',
                        400,
                        ErrorCodes.VALIDATION_ERROR
                    );
                }
                config.default_add_info = default_add_info ? default_add_info.trim() : null;
            }
        }

        await config.save();

        logger.info('Bank account config patched', { 
            bank_code: config.bank_code,
            updated_by: req.currentUser?.username || 'unknown'
        });

        res.json(config);
    } catch (error) {
        next(error);
    }
});

export default router;
