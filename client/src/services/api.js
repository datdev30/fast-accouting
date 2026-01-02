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

export const getDebtReport = () => api.get('/transactions/reports/debt').then(res => res.data);
export const batchExportReports = () => api.post('/reports/batch-export').then(res => res.data);

export const getAppInfo = () => api.get('/info').then(res => res.data);
export const updateAppInfo = (data) => api.put('/info', data).then(res => res.data);


// Secure Delete Functions
export const deleteTransactionSecure = (id, pin) => api.post('/transactions/delete-secure', { id, pin }).then(res => res.data);
export const deleteCustomerSecure = (id, pin) => api.post('/customers/delete-secure', { id, pin }).then(res => res.data);
export const deleteInterestConfigSecure = (code, pin) => api.post('/interest-configs/delete-secure', { code, pin }).then(res => res.data);

// User Management (Admin)
export const getUsers = () => api.get('/users').then(res => res.data);
export const createUser = (data) => api.post('/users', data).then(res => res.data);
export const updateUser = (id, data) => api.patch(`/users/${id}`, data).then(res => res.data);
export const deleteUserSecure = (id, pin) => api.post('/users/delete-secure', { id, pin }).then(res => res.data);

export default api;
