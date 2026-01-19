import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/Toast';

const ToastContext = createContext(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState(null);
    const [timerId, setTimerId] = useState(null);

    const showToast = useCallback((title, message, type = 'info', duration = 3000) => {
        if (timerId) {
            clearTimeout(timerId);
        }

        setToast({ title, message, type });

        const id = setTimeout(() => {
            setToast(null);
        }, duration);
        setTimerId(id);
    }, [timerId]);

    const hideToast = useCallback(() => {
        if (timerId) {
            clearTimeout(timerId);
        }
        setToast(null);
    }, [timerId]);

    return (
        <ToastContext.Provider value={{ showToast, hideToast }}>
            {children}
            <Toast toast={toast} onClose={hideToast} />
        </ToastContext.Provider>
    );
};
