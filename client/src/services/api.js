import axios from 'axios';

const api = axios.create({
    // baseURL: 'http://localhost:5000/api', // Node.js Backend
    // baseURL: 'http://localhost:8000/api', // Python Backend (Old)
    baseURL: '/api', // Relative path for Desktop App (Same Origin) & Vite Proxy
    headers: {
        'Content-Type': 'application/json',
    },
});

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


// Secure Delete Functions
export const deleteTransactionSecure = (id, pin) => api.post('/transactions/delete-secure', { id, pin }).then(res => res.data);
export const deleteCustomerSecure = (id, pin) => api.post('/customers/delete-secure', { id, pin }).then(res => res.data);
export const deleteInterestConfigSecure = (code, pin) => api.post('/interest-configs/delete-secure', { code, pin }).then(res => res.data);

export default api;
