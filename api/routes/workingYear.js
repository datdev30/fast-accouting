import express from 'express';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { APIError, ErrorCodes } from '../utils/errors.js';
import {
    getCurrentWorkingYear,
    setCurrentWorkingYear,
    listAvailableWorkingYears
} from '../utils/workingYear.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/working-year
 * Năm làm việc hiện tại + danh sách năm có dữ liệu.
 */
router.get('/', authMiddleware, async (req, res, next) => {
    try {
        const [current, available] = await Promise.all([
            getCurrentWorkingYear(),
            listAvailableWorkingYears()
        ]);
        res.json({
            current_working_year: current,
            available_years: available
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/working-year
 * ADMIN đổi năm làm việc đang chọn.
 */
router.put('/', authMiddleware, requireAdmin, async (req, res, next) => {
    try {
        const year = req.body?.current_working_year ?? req.body?.year;
        if (year === undefined || year === null || year === '') {
            throw new APIError('Thiếu năm làm việc', 400, ErrorCodes.VALIDATION_ERROR);
        }

        const current = await setCurrentWorkingYear(
            year,
            req.currentUser?.username || null
        );

        logger.info('Working year changed', {
            year: current,
            by: req.currentUser?.username
        });

        const available = await listAvailableWorkingYears();
        res.json({
            current_working_year: current,
            available_years: available
        });
    } catch (error) {
        if (error.statusCode === 400) {
            return next(new APIError(error.message, 400, ErrorCodes.VALIDATION_ERROR));
        }
        next(error);
    }
});

export default router;
