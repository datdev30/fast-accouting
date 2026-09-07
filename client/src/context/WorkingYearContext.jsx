import React, { createContext, useContext, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWorkingYear, setWorkingYear as setWorkingYearApi } from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { getApiErrorMessage } from '../utils/errorMessage';

const WorkingYearContext = createContext({
    year: 2025,
    availableYears: [2025],
    loading: true,
    setYear: async () => {},
    isAdmin: false,
});

export function WorkingYearProvider({ children }) {
    const { user, loading: authLoading } = useAuth();
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const isAdmin = user?.role === 'ADMIN';

    const { data, isLoading } = useQuery({
        queryKey: ['working-year'],
        queryFn: getWorkingYear,
        enabled: !authLoading && !!user,
        staleTime: 30_000,
        retry: 1,
    });

    const mutation = useMutation({
        mutationFn: setWorkingYearApi,
        onSuccess: (res) => {
            queryClient.setQueryData(['working-year'], res);
            // Làm mới mọi dữ liệu gắn năm
            queryClient.invalidateQueries();
            showToast('Thành công', `Đã chuyển năm làm việc sang ${res.current_working_year}`, 'success');
        },
        onError: (err) => {
            showToast('Lỗi', getApiErrorMessage(err, 'Đổi năm làm việc'), 'error');
        },
    });

    const value = useMemo(() => ({
        year: data?.current_working_year ?? 2025,
        availableYears: data?.available_years?.length
            ? data.available_years
            : [data?.current_working_year ?? 2025],
        loading: authLoading || (!!user && isLoading),
        isAdmin,
        setYear: async (y) => {
            if (!isAdmin) return;
            await mutation.mutateAsync(Number(y));
        },
        isChanging: mutation.isPending,
    }), [data, authLoading, user, isLoading, isAdmin, mutation]);

    return (
        <WorkingYearContext.Provider value={value}>
            {children}
        </WorkingYearContext.Provider>
    );
}

export function useWorkingYear() {
    return useContext(WorkingYearContext);
}
