import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
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
    const timerIdRef = useRef(null);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (timerIdRef.current) {
                clearTimeout(timerIdRef.current);
            }
        };
    }, []);

    const showToast = useCallback((title, message, type = 'info', duration = 3000) => {
        // Clear existing timer
        if (timerIdRef.current) {
            clearTimeout(timerIdRef.current);
            timerIdRef.current = null;
        }

        setToast({ title, message, type });

        // Set new timer
        timerIdRef.current = setTimeout(() => {
            setToast(null);
            timerIdRef.current = null;
        }, duration);
    }, []);

    const hideToast = useCallback(() => {
        if (timerIdRef.current) {
            clearTimeout(timerIdRef.current);
            timerIdRef.current = null;
        }
        setToast(null);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, hideToast }}>
            {children}
            <Toast toast={toast} onClose={hideToast} />
        </ToastContext.Provider>
    );
};
