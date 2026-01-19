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

// Debug: Log API URL (sẽ hiển thị trong console và Logcat)
console.log('🔗 API Configuration:', {
    'VITE_API_URL (raw)': import.meta.env.VITE_API_URL,
    'API_BASE_URL (normalized)': API_BASE_URL,
    'Mode': import.meta.env.MODE,
    'Production': import.meta.env.PROD
});

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

        // Debug: Log request details
        console.log('📤 API Request:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            baseURL: config.baseURL,
            fullURL: config.baseURL + config.url,
            hasToken: !!token
        });

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
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor - Handle token expiration
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Enhanced error logging for debugging
        console.error('❌ API Error:', {
            url: error.config?.url,
            method: error.config?.method,
            baseURL: error.config?.baseURL,
            fullURL: error.config?.baseURL + error.config?.url,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message,
            code: error.code
        });

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
export const getMonthlyTransactionCount = (year) =>
    api.get('/transactions/reports/monthly-count', { params: { year } }).then(res => res.data);
export const batchExportReports = () => api.post('/reports/batch-export').then(res => res.data);

/** Tải PDF phiếu thanh toán công nợ (nội dung tương đương Xem trước bản in). Truyền startDate, endDate nếu có lọc. */
export const downloadDebtReportPdf = async (customerId, startDate, endDate) => {
    const params = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    
    try {
        const res = await api.get(`/reports/${customerId}/pdf`, {
            responseType: 'blob',
            params: Object.keys(params).length > 0 ? params : undefined
        });
        
        // Check if response is actually an error (when responseType is 'blob', axios doesn't auto-throw for 4xx/5xx)
        if (res.status < 200 || res.status >= 300) {
            // Try to parse error message from blob
            try {
                const errorText = await res.data.text();
                const errorJson = JSON.parse(errorText);
                throw new Error(errorJson.error || errorJson.message || `HTTP ${res.status}: Failed to download PDF`);
            } catch (parseError) {
                throw new Error(`HTTP ${res.status}: Failed to download PDF`);
            }
        }
        
        // Validate blob
        if (!res.data || !(res.data instanceof Blob)) {
            throw new Error('Invalid response: expected PDF blob');
        }
        
        // Check if blob is empty
        if (res.data.size === 0) {
            throw new Error('PDF file is empty');
        }
        
        // Basic validation: check content type if available
        const contentType = res.headers?.['content-type'];
        if (contentType && !contentType.includes('pdf') && !contentType.includes('application/octet-stream')) {
            console.warn('Warning: Response content-type is not PDF:', contentType);
        }
        
        const contentDisposition = res.headers?.['content-disposition'];
        let filename = `Phieu_TTCN_${customerId}.pdf`;
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
                    throw new Error(errorJson.error || errorJson.message || `Server error: ${error.response.status}`);
                } catch {
                    throw new Error(`Server error: ${error.response.status}`);
                }
            }
            throw new Error(error.response.data?.error || error.response.data?.message || `Server error: ${error.response.status}`);
        } else if (error.request) {
            // Request was made but no response received
            throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
        } else {
            // Something else happened
            throw error;
        }
    }
};

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
                throw new Error(errorJson.error || errorJson.message || `HTTP ${res.status}: Failed to download PDF`);
            } catch (parseError) {
                throw new Error(`HTTP ${res.status}: Failed to download PDF`);
            }
        }
        
        // Validate blob
        if (!res.data || !(res.data instanceof Blob)) {
            throw new Error('Invalid response: expected PDF blob');
        }
        
        // Check if blob is empty
        if (res.data.size === 0) {
            throw new Error('PDF file is empty');
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
                    throw new Error(errorJson.error || errorJson.message || `Server error: ${error.response.status}`);
                } catch {
                    throw new Error(`Server error: ${error.response.status}`);
                }
            }
            throw new Error(error.response.data?.error || error.response.data?.message || `Server error: ${error.response.status}`);
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

/** Trạng thái cấu hình Drive cho ảnh giao dịch (chỉ boolean, cần đăng nhập) */
export const getTransactionImageDriveStatus = () =>
    api.get('/transactions/drive-status').then(res => res.data);

export default api;
