/**
 * Trích thông báo lỗi cụ thể từ phản hồi API / axios để hiển thị cho người dùng.
 * @param {unknown} err - Lỗi từ catch (thường là AxiosError)
 * @param {string} operation - Tên thao tác (vd: "Đăng nhập", "Lưu giao dịch") — dùng khi server không trả nội dung
 * @returns {string}
 */
export function getApiErrorMessage(err, operation = 'Thao tác') {
    const op = String(operation || 'Thao tác').trim() || 'Thao tác';

    if (err == null) {
        return `${op} thất bại: không nhận được thông tin lỗi từ ứng dụng.`;
    }

    if (typeof err === 'string' && err.trim()) {
        return err.trim();
    }

    const response = err.response;
    const status = response?.status;
    let data = response?.data;

    if (typeof data === 'string') {
        try {
            data = JSON.parse(data);
        } catch {
            const t = data.trim();
            if (t) return t.length > 500 ? `${t.slice(0, 500)}…` : t;
        }
    }

    const fromBody = pickMessageFromBody(data);
    if (fromBody) {
        return fromBody;
    }

    if (status === 401) {
        return `${op} thất bại: chưa đăng nhập, phiên hết hạn hoặc sai tài khoản/mật khẩu (HTTP 401).`;
    }
    if (status === 403) {
        return `${op} thất bại: tài khoản không có quyền thực hiện thao tác này (HTTP 403).`;
    }
    if (status === 400) {
        return `${op} thất bại: yêu cầu không hợp lệ (HTTP 400) — kiểm tra dữ liệu nhập hoặc tham số gửi đi.`;
    }
    if (status === 404) {
        return `${op} thất bại: không tìm thấy dữ liệu trên máy chủ (HTTP 404).`;
    }
    if (status === 413) {
        return `${op} thất bại: dung lượng gửi lên vượt giới hạn máy chủ (HTTP 413).`;
    }
    if (status === 409) {
        return `${op} thất bại: xung đột dữ liệu (ví dụ bản ghi đã tồn tại) (HTTP 409).`;
    }
    if (status === 422) {
        return `${op} thất bại: dữ liệu gửi lên không đạt validation (HTTP 422).`;
    }
    if (status === 429) {
        return `${op} thất bại: gửi quá nhiều yêu cầu, vui lòng đợi rồi thử lại (HTTP 429).`;
    }
    if (status === 503) {
        return `${op} thất bại: máy chủ tạm ngưng phục vụ hoặc quá tải (HTTP 503).`;
    }
    if (status >= 500) {
        return `${op} thất bại: lỗi phía máy chủ (HTTP ${status}). Nếu lặp lại, vui lòng báo quản trị.`;
    }

    const code = err.code;
    if (code === 'ERR_NETWORK' || err.message === 'Network Error') {
        return `${op} thất bại: không kết nối được máy chủ (mất mạng, sai địa chỉ API, hoặc CORS).`;
    }
    if (code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        return `${op} thất bại: hết thời gian chờ phản hồi từ máy chủ.`;
    }

    if (err.request && !response) {
        return `${op} thất bại: đã gửi yêu cầu nhưng không nhận được phản hồi (máy chủ tắt hoặc chặn kết nối).`;
    }

    const msg = typeof err.message === 'string' ? err.message.trim() : '';
    if (msg && !/^Request failed with status code \d+$/i.test(msg)) {
        return `${op} thất bại: ${msg}`;
    }

    if (status) {
        return `${op} thất bại: máy chủ trả mã HTTP ${status} nhưng không kèm mô tả.`;
    }

    return `${op} thất bại: lỗi không xác định.`;
}

function pickMessageFromBody(payload) {
    if (payload == null || typeof payload !== 'object') {
        return null;
    }

    if (typeof payload.detail === 'string' && payload.detail.trim()) {
        return payload.detail.trim();
    }

    if (Array.isArray(payload.detail) && payload.detail.length) {
        const parts = payload.detail
            .map((d) => {
                if (typeof d === 'string') return d;
                if (d && typeof d === 'object') {
                    const loc = Array.isArray(d.loc) ? d.loc.join('.') : '';
                    const m = d.msg || d.message;
                    if (m) return loc ? `${loc}: ${m}` : String(m);
                }
                return null;
            })
            .filter(Boolean);
        if (parts.length) return parts.join(' · ');
    }

    if (typeof payload.error === 'string' && payload.error.trim()) {
        let msg = payload.error.trim();
        const details = payload.details;

        if (Array.isArray(details) && details.length) {
            const extra = details
                .map((d) => {
                    if (d && typeof d === 'object' && (d.field != null || d.path != null)) {
                        const field = d.field || d.path;
                        const m = d.message || d.msg;
                        return m ? `${field}: ${m}` : String(field);
                    }
                    if (typeof d === 'string') return d;
                    return null;
                })
                .filter(Boolean);
            if (extra.length) {
                const vague = ['Validation failed', 'Database error', 'Internal Server Error'];
                msg = vague.includes(msg) ? extra.join(' · ') : `${msg} — ${extra.join(' · ')}`;
            }
        } else if (details && typeof details === 'object' && !Array.isArray(details)) {
            const entries = Object.entries(details)
                .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
                .join(' · ');
            if (entries) msg = `${msg} — ${entries}`;
        }

        return msg;
    }

    if (typeof payload.message === 'string' && payload.message.trim()) {
        return payload.message.trim();
    }

    return null;
}
