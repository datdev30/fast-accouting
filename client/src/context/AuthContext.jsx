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
                    setUser({ username: res.data.username });
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
        const { token, username: userField } = res.data;

        localStorage.setItem('token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser({ username: userField });
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
            await api.post('/reports/batch-export', { output_path: customPath });
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
        // Auto-backup on logout
        if (user) {
            const success = await performBackup();
            if (!success) {
                // Abort logout
                return;
            }
        }

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
