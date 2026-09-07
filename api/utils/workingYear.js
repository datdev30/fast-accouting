import { getAppSettingsModel, getTransactionModel } from '../db/models.js';

export const DEFAULT_WORKING_YEAR = 2025;

/**
 * Năm làm việc chỉ scope Transaction.
 * Không gắn vào Customer / InterestConfig / BankAccount / SystemNotification / User / Drive…
 */
export async function getCurrentWorkingYear() {
    const AppSettings = getAppSettingsModel();
    let settings = await AppSettings.findById('default');
    if (!settings) {
        settings = await AppSettings.create({
            _id: 'default',
            current_working_year: DEFAULT_WORKING_YEAR
        });
    }
    return Number(settings.current_working_year) || DEFAULT_WORKING_YEAR;
}

/**
 * Đặt năm làm việc hiện tại (ADMIN).
 */
export async function setCurrentWorkingYear(year, updatedBy = null) {
    const y = Number(year);
    if (!Number.isInteger(y) || y < 2000 || y > 2100) {
        const err = new Error('Năm làm việc không hợp lệ');
        err.statusCode = 400;
        throw err;
    }

    const AppSettings = getAppSettingsModel();
    const settings = await AppSettings.findOneAndUpdate(
        { _id: 'default' },
        {
            $set: {
                current_working_year: y,
                updated_at: new Date(),
                updated_by: updatedBy
            }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return Number(settings.current_working_year);
}

/**
 * Danh sách năm đã có dữ liệu KH hoặc GD (+ năm hiện tại).
 */
export async function listAvailableWorkingYears() {
    const Transaction = getTransactionModel();
    const current = await getCurrentWorkingYear();
    const txYears = await Transaction.distinct('working_year');

    const set = new Set([current, DEFAULT_WORKING_YEAR]);
    for (const y of txYears) {
        const n = Number(y);
        if (Number.isInteger(n)) set.add(n);
    }

    return Array.from(set).sort((a, b) => b - a);
}

/**
 * Middleware: gắn req.workingYear = năm đang chọn.
 * Bỏ qua nếu DB chưa sẵn sàng trên một số route tĩnh — vẫn cố lấy năm.
 */
export async function attachWorkingYear(req, res, next) {
    try {
        req.workingYear = await getCurrentWorkingYear();
        next();
    } catch (err) {
        next(err);
    }
}
