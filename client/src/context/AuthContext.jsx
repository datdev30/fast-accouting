import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isBackingUp, setIsBackingUp] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    // Set default header
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    const res = await api.get('/auth/me');
                    setUser({
                        username: res.data.username,
                        displayName: res.data.display_name || res.data.username,
                        role: res.data.role || null
                    });
                } catch (error) {
                    console.error("Auth check failed", error);
                    localStorage.removeItem('token');
                    delete api.defaults.headers.common['Authorization'];
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (username, password) => {
        const res = await api.post('/auth/login', { username, password });
        const { token, username: userField, display_name, role } = res.data;

        localStorage.setItem('token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser({
            username: userField,
            displayName: display_name || userField,
            role: role || null
        });
        return true;
    };

    const register = async (username, password) => {
        await api.post('/auth/register', { username, password });
        return true;
    };

    const performBackup = async (customPath = null) => {
        setIsBackingUp(true);
        try {
            // Artificial delay to let the modal show up nicely and user to see it
            await new Promise(r => setTimeout(r, 800));

            if (customPath) {
                await api.post('/reports/batch-export', { output_path: customPath });
                return true;
            }

            const res = await api.post(
                '/reports/batch-export',
                { output_path: null },
                { responseType: 'blob' }
            );

            const contentDisposition = res.headers?.['content-disposition'] || '';
            const match = /filename="?([^";]+)"?/i.exec(contentDisposition);
            const fileName = match?.[1] || 'reports.zip';

            const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'application/zip' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            return true;
        } catch (e) {
            console.error("Backup failed", e);
            showToast("Lỗi sao lưu", "Không thể sao lưu báo cáo. Vui lòng thử lại hoặc kiểm tra server.", "error");
            return false;
        } finally {
            setIsBackingUp(false);
        }
    };

    const logout = async () => {
        // Removed auto-backup on logout as per user request
        try {
            await api.post('/auth/logout');
        } catch (e) {
            console.error("Logout error", e);
        }
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
    };



    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, isBackingUp, triggerBatchExport: performBackup }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
