/**
 * Helper utility functions
 * Ported from Python utils.py
 */

/**
 * Remove Vietnamese accents from string
 */
export function removeAccents(inputStr) {
    if (!inputStr) return "";

    // Manually handle Vietnamese Đ
    let s = inputStr.replace(/Đ/g, "D").replace(/đ/g, "d");

    // Normalize and remove combining characters
    const nfkd = s.normalize('NFKD');
    return nfkd.replace(/[\u0300-\u036f]/g, "");
}

/**
 * Verify admin PIN
 * PIN must be exactly 4 digits
 */
export async function verifyAdminPin(pin, userOrModel, userId = null) {
    const pinValue = pin !== null && pin !== undefined ? String(pin).trim() : '';
    if (!pinValue) {
        const error = new Error('Vui lòng nhập mã PIN');
        error.statusCode = 403; // 403: đã đăng nhập nhưng từ chối thao tác (tránh nhầm 401 → redirect /login)
        throw error;
    }

    // Validate PIN format: must be exactly 4 digits
    if (pinValue.length !== 4 || !/^\d{4}$/.test(pinValue)) {
        const error = new Error('Mã PIN phải có đúng 4 chữ số');
        error.statusCode = 400;
        throw error;
    }

    // Preferred: validate against the currently authenticated admin user.
    // Routes using `requireAdmin` set `req.currentUser`.
    let admin = null;

    if (userOrModel && typeof userOrModel.comparePin === 'function') {
        admin = userOrModel;
    } else if (userOrModel && typeof userOrModel.findById === 'function' && userId) {
        admin = await userOrModel.findById(userId);
    } else if (userOrModel && typeof userOrModel.findOne === 'function') {
        // Legacy fallback (older logic assumed the admin username is literally "admin")
        admin = await userOrModel.findOne({ username: 'admin' });
    }

    if (!admin || !admin.pin_hash) {
        const error = new Error('Admin PIN not configured');
        error.statusCode = 400;
        throw error;
    }

    const isValid = await admin.comparePin(pinValue);
    if (!isValid) {
        const error = new Error('Sai mã PIN');
        error.statusCode = 403; // 403: đã đăng nhập nhưng từ chối thao tác (tránh nhầm 401 → redirect /login)
        throw error;
    }

    return true;
}

/**
 * Detect MongoDB permission / read-only write errors.
 * Useful when the app is pointed at a PROD DB user that can only read.
 */
export function isMongoWriteForbidden(error) {
    const code = error?.code;
    const codeName = error?.codeName;
    const msg = String(error?.message || '').toLowerCase();

    // Mongo common auth/permission codes:
    // - 13 Unauthorized
    // - 8000 / 8001 Atlas auth-related (varies)
    if (code === 13) return true;
    if (codeName === 'Unauthorized') return true;

    // Heuristic fallbacks
    if (msg.includes('not authorized')) return true;
    if (msg.includes('unauthorized')) return true;
    if (msg.includes('auth') && msg.includes('failed')) return true;
    if (msg.includes('requires authentication')) return true;

    return false;
}
