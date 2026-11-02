import axios from 'axios';

function normalizeApiBaseUrl(raw) {
    const trimmed = String(raw || '').trim();
    if (!trimmed) return '/api';

    // Relative base URLs are allowed (e.g. '/api' for local proxy)
    if (trimmed.startsWith('/')) {
        return trimmed.replace(/\/+$/g, '');
    }

    // If user set only a host like 'fast-accounting-api.vercel.app', browsers treat it as a relative path.
    // Prefix https:// to ensure it is an absolute URL.
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

    try {
        const url = new URL(withScheme);
        // If only origin is provided, default to the API prefix.
        if (!url.pathname || url.pathname === '/') {
            url.pathname = '/api';
        }
        url.pathname = url.pathname.replace(/\/+$/g, '');
        return url.toString().replace(/\/+$/g, '');
    } catch {
        // Fallback to relative '/api' rather than generating broken URLs.
        return '/api';
    }
}

// Use environment variable for API URL
const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL || '/api');

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - Add JWT token to all requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // If sending FormData, let the browser/axios set the correct multipart boundary.
        if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
            try {
                delete config.headers['Content-Type'];
                delete config.headers['content-type'];
            } catch {
                // ignore
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle token expiration
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            // Redirect to login if not already there
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export const getCustomers = () => api.get('/customers').then(res => res.data);
export const createCustomer = (data) => api.post('/customers', data).then(res => res.data);
export const updateCustomer = (id, data) => api.patch(`/customers/${id}`, data).then(res => res.data);
export const deleteCustomer = (id) => api.delete(`/customers/${id}`);
export const getCustomer = (id) => api.get(`/customers/${id}`).then(res => res.data);

export const getInterestConfigs = () => api.get('/interest-configs').then(res => res.data);
export const createInterestConfig = (data) => api.post('/interest-configs', data).then(res => res.data);
export const updateInterestConfig = (code, data) => api.patch(`/interest-configs/${code}`, data).then(res => res.data);

export const getTransactions = async (customerId, startDate, endDate) => {
    const params = new URLSearchParams();
    if (customerId) params.append('customer_id', customerId);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await api.get(`/transactions?${params.toString()}`);
    return response.data;
};
export const createTransaction = (data) => api.post('/transactions', data).then(res => res.data);
export const updateTransaction = (id, data) => api.patch(`/transactions/${id}`, data).then(res => res.data);

// Transaction Image (Google Drive via backend)
export const fetchTransactionImageBlob = (id) =>
    api.get(`/transactions/${id}/image`, { responseType: 'blob' }).then(res => res.data);

export const uploadTransactionImage = (id, file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post(`/transactions/${id}/image`, formData).then(res => res.data);
};

export const getDebtReport = () => api.get('/transactions/reports/debt').then(res => res.data);
export const getOverviewSummary = () => api.get('/transactions/reports/summary').then(res => res.data);
export const batchExportReports = () => api.post('/reports/batch-export').then(res => res.data);

/** Tải PDF tất cả giao dịch (bao gồm cả đã trả và đang nợ). Truyền startDate, endDate nếu có lọc. */
export const downloadAllTransactionsPdf = async (customerId, startDate, endDate) => {
    const params = { include_all: true };
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    
    try {
        const res = await api.get(`/reports/${customerId}/pdf`, {
            responseType: 'blob',
            params
        });
        
        // Check if response is actually an error (when responseType is 'blob', axios doesn't auto-throw for 4xx/5xx)
        if (res.status < 200 || res.status >= 300) {
            // Try to parse error message from blob
            try {
                const errorText = await res.data.text();
                const errorJson = JSON.parse(errorText);
                throw new Error(
                    errorJson.error || errorJson.detail || errorJson.message || `HTTP ${res.status}: tải PDF thất bại`
                );
            } catch (parseError) {
                throw new Error(`HTTP ${res.status}: tải PDF thất bại (không parse được JSON lỗi)`);
            }
        }
        
        // Validate blob
        if (!res.data || !(res.data instanceof Blob)) {
            throw new Error('Phản hồi không hợp lệ: mong đợi file PDF (blob) từ máy chủ');
        }
        
        // Check if blob is empty
        if (res.data.size === 0) {
            throw new Error('File PDF từ máy chủ rỗng (0 byte)');
        }
        
        // Basic validation: check content type if available
        const contentType = res.headers?.['content-type'];
        if (contentType && !contentType.includes('pdf') && !contentType.includes('application/octet-stream')) {
            console.warn('Warning: Response content-type is not PDF:', contentType);
        }
        
        const contentDisposition = res.headers?.['content-disposition'];
        let filename = `Tat_ca_giao_dich_${customerId}.pdf`;
        if (contentDisposition) {
            const match = /filename\*=UTF-8''([^;]+)|filename="([^"]+)"|filename=([^;\s]+)/i.exec(contentDisposition);
            const raw = match?.[1] || match?.[2] || match?.[3];
            if (raw) {
                try {
                    filename = decodeURIComponent(String(raw).trim());
                } catch {
                    filename = String(raw).trim();
                }
            }
        }
        return { blob: res.data, filename };
    } catch (error) {
        // Re-throw axios errors with better messages
        if (error.response) {
            // Server responded with error status
            if (error.response.data instanceof Blob) {
                try {
                    const errorText = await error.response.data.text();
                    const errorJson = JSON.parse(errorText);
                    throw new Error(
                        errorJson.error ||
                            errorJson.detail ||
                            errorJson.message ||
                            `Lỗi máy chủ HTTP ${error.response.status} khi tải PDF`
                    );
                } catch {
                    throw new Error(
                        `Lỗi máy chủ HTTP ${error.response.status} khi tải PDF (không đọc được nội dung lỗi)`
                    );
                }
            }
            throw new Error(
                error.response.data?.error ||
                    error.response.data?.detail ||
                    error.response.data?.message ||
                    `Lỗi máy chủ HTTP ${error.response.status} khi tải PDF`
            );
        } else if (error.request) {
            // Request was made but no response received
            throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
        } else {
            // Something else happened
            throw error;
        }
    }
};

export const getAppInfo = () => api.get('/info').then(res => res.data);
export const updateAppInfo = (data) => api.put('/info', data).then(res => res.data);

// Backup (Admin)
export const exportBackupBundle = async () => {
    const res = await api.get('/backup/export', { responseType: 'blob' });
    const contentDisposition = res.headers?.['content-disposition'];
    let filename = null;
    if (contentDisposition) {
        const match = /filename\*=UTF-8''([^;]+)|filename="([^"]+)"|filename=([^;]+)/i.exec(contentDisposition);
        const raw = match?.[1] || match?.[2] || match?.[3];
        if (raw) {
            try {
                filename = decodeURIComponent(String(raw).trim());
            } catch {
                filename = String(raw).trim();
            }
        }
    }
    return { blob: res.data, filename };
};

export const importBackupBundle = (ejsonText) =>
    api.post('/backup/import', ejsonText, {
        headers: { 'Content-Type': 'application/json' },
        transformRequest: [(data) => data]
    }).then(res => res.data);


// Secure Delete Functions
export const deleteTransactionSecure = (id, pin) => api.post('/transactions/delete-secure', { id, pin }).then(res => res.data);
export const deleteCustomerSecure = (id, pin) => api.post('/customers/delete-secure', { id, pin }).then(res => res.data);
export const deleteInterestConfigSecure = (code, pin) => api.post('/interest-configs/delete-secure', { code, pin }).then(res => res.data);

// User Management (Admin)
export const getUsers = () => api.get('/users').then(res => res.data);
export const createUser = (data) => api.post('/users', data).then(res => res.data);
export const updateUser = (id, data) => api.patch(`/users/${id}`, data).then(res => res.data);
export const deleteUserSecure = (id, pin) => api.post('/users/delete-secure', { id, pin }).then(res => res.data);


export const deleteTransactionImage = (id) => api.delete(`/transactions/${id}/image`).then(res => res.data);

// Monthly Transaction Count for Analytics
export const getMonthlyTransactionCount = (year) => api.get(`/transactions/reports/monthly-count?year=${year}`).then(res => res.data);

// Bank Account Config (Toàn hệ thống - tất cả user đều thấy)
/** Lấy cấu hình ngân hàng toàn hệ thống (tất cả user đều có thể xem) */
export const getBankAccountConfig = () => api.get('/bank-account-config').then(res => res.data);

/** Lưu/cập nhật cấu hình ngân hàng toàn hệ thống (chỉ ADMIN) */
export const saveBankAccountConfig = (data) => api.put('/bank-account-config', data).then(res => res.data);

/** Cập nhật một phần cấu hình ngân hàng (chỉ ADMIN) */
export const updateBankAccountConfig = (data) => api.patch('/bank-account-config', data).then(res => res.data);

// VietQR API Functions
/**
 * Lấy danh sách ngân hàng từ VietQR API
 * Không cần xác thực, gọi trực tiếp đến VietQR API
 */
export const getVietQRBankList = async () => {
    try {
        const baseUrl = 'https://api.vietqr.io/v2';
        const response = await fetch(`${baseUrl}/banks`);
        const data = await response.json();
        
        if (data.code === '00') {
            return data.data || [];
        }
        return [];
    } catch (error) {
        console.error('Lỗi khi lấy danh sách ngân hàng:', error);
        return [];
    }
};

/**
 * Tạo URL QR code sử dụng VietQR Image Service (miễn phí, không cần API key)
 * @param {string} bankCode - Mã ngân hàng (3 ký tự, ví dụ: VCB, ACB)
 * @param {string} accountNo - Số tài khoản
 * @param {string} accountName - Tên chủ tài khoản (IN HOA, không dấu)
 * @param {string} template - Template QR (tùy chọn) - mặc định '9DVkSUh'
 * @param {number} amount - Số tiền (tùy chọn)
 * @param {string} addInfo - Nội dung chuyển khoản (tùy chọn)
 * @returns {string} URL của QR code image
 */
export const generateVietQRUrl = (bankCode, accountNo, accountName, template = null, amount = null, addInfo = null) => {
    // Template mặc định: 9DVkSUh
    const qrTemplate = template || '9DVkSUh';
    
    // Chuẩn hóa tên tài khoản: IN HOA, không dấu
    const normalizedAccountName = accountName
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu
        .trim();
    
    // Xây dựng URL base
    let qrUrl = `https://img.vietqr.io/image/${bankCode}-${accountNo}-${qrTemplate}.png`;
    
    // Thêm query parameters nếu có
    const params = new URLSearchParams();
    if (amount && amount > 0) {
        params.append('amount', amount);
    }
    if (addInfo) {
        params.append('addInfo', addInfo);
    }
    if (normalizedAccountName) {
        params.append('accountName', normalizedAccountName);
    }
    
    const queryString = params.toString();
    if (queryString) {
        qrUrl += `?${queryString}`;
    }
    
    return qrUrl;
};

/** Tải PDF báo cáo công nợ */
export const downloadDebtReportPdf = async (customerId, startDate, endDate) => {
    const params = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    
    try {
        const res = await api.get(`/reports/${customerId}/pdf`, {
            responseType: 'blob',
            params
        });
        
        if (res.status < 200 || res.status >= 300) {
            try {
                const errorText = await res.data.text();
                const errorJson = JSON.parse(errorText);
                throw new Error(
                    errorJson.error || errorJson.detail || errorJson.message || `HTTP ${res.status}: tải PDF thất bại`
                );
            } catch (parseError) {
                throw new Error(`HTTP ${res.status}: tải PDF thất bại (không parse được JSON lỗi)`);
            }
        }
        
        if (!res.data || !(res.data instanceof Blob)) {
            throw new Error('Phản hồi không hợp lệ: mong đợi file PDF (blob) từ máy chủ');
        }
        
        if (res.data.size === 0) {
            throw new Error('File PDF từ máy chủ rỗng (0 byte)');
        }
        
        const contentDisposition = res.headers?.['content-disposition'];
        let filename = `Bao_cao_cong_no_${customerId}.pdf`;
        if (contentDisposition) {
            const match = /filename\*=UTF-8''([^;]+)|filename="([^"]+)"|filename=([^;\s]+)/i.exec(contentDisposition);
            const raw = match?.[1] || match?.[2] || match?.[3];
            if (raw) {
                try {
                    filename = decodeURIComponent(String(raw).trim());
                } catch {
                    filename = String(raw).trim();
                }
            }
        }
        return { blob: res.data, filename };
    } catch (error) {
        if (error.response) {
            if (error.response.data instanceof Blob) {
                try {
                    const errorText = await error.response.data.text();
                    const errorJson = JSON.parse(errorText);
                    throw new Error(
                        errorJson.error ||
                            errorJson.detail ||
                            errorJson.message ||
                            `Lỗi máy chủ HTTP ${error.response.status} khi tải PDF báo cáo công nợ`
                    );
                } catch {
                    throw new Error(
                        `Lỗi máy chủ HTTP ${error.response.status} khi tải PDF báo cáo công nợ (không đọc được nội dung lỗi)`
                    );
                }
            }
            throw new Error(
                error.response.data?.error ||
                    error.response.data?.detail ||
                    error.response.data?.message ||
                    `Lỗi máy chủ HTTP ${error.response.status} khi tải PDF báo cáo công nợ`
            );
        } else if (error.request) {
            throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
        } else {
            throw error;
        }
    }
};

// Drive OAuth Management (Admin only)
export const getDriveOAuthRefreshToken = () => api.get('/drive-oauth/refresh-token').then(res => res.data);
export const updateDriveOAuthRefreshToken = (refreshToken) => api.put('/drive-oauth/refresh-token', { refresh_token: refreshToken }).then(res => res.data);
export const getDriveOAuthGenerateUrl = () => api.get('/drive-oauth/generate-url').then(res => res.data);
export const handleDriveOAuthCallback = (code) => api.post('/drive-oauth/callback', { code }).then(res => res.data);

export default api;

// ==========================================================
// Thông báo hệ thống (chỉ ADMIN được tạo/sửa/xoá)
// ==========================================================

/** Thông báo đang hiệu lực — công khai, không cần đăng nhập. */
export const getActiveSystemNotifications = () =>
    api.get('/system-notifications/active').then(res => res.data);

/** Toàn bộ thông báo kể cả đã tắt (ADMIN). */
export const getSystemNotifications = () =>
    api.get('/system-notifications').then(res => res.data);

export const createSystemNotification = (data) =>
    api.post('/system-notifications', data).then(res => res.data);

export const updateSystemNotification = (id, data) =>
    api.patch(`/system-notifications/${id}`, data).then(res => res.data);

export const deleteSystemNotificationSecure = (id, pin) =>
    api.post('/system-notifications/delete-secure', { id, pin }).then(res => res.data);

// ==========================================================
// Năm làm việc
// ==========================================================

export const getWorkingYear = () =>
    api.get('/working-year').then(res => res.data);

export const setWorkingYear = (year) =>
    api.put('/working-year', { current_working_year: year }).then(res => res.data);
