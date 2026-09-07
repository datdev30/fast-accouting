import React from 'react';
import useScrollLock from '../hooks/useScrollLock';

const BackupModal = () => {
    useScrollLock(true);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop with heavy blur */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-300"></div>

            {/* Modal Card */}
            <div className="relative bg-white/80 backdrop-filter backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-white/40 flex flex-col items-center max-w-sm w-full mx-6 transform transition-all scale-100">

                {/* Decoration: Top Shine */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>

                {/* Animated Icon Container */}
                <div className="relative mb-8">
                    {/* Pulsing circles */}
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
                    <div className="absolute inset-0 bg-blue-500/10 rounded-full animate-pulse blur-xl"></div>

                    {/* Main Icon Circle */}
                    <div className="relative w-24 h-24 bg-gradient-to-br from-blue-50 to-white rounded-full shadow-inner border border-white/60 flex items-center justify-center">
                        {/* Spinning border ring */}
                        <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>

                        {/* Center Icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600 drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                    </div>
                </div>

                {/* Text Content */}
                <h3 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600 mb-3 text-center tracking-tight">
                    Đang Sao Lưu Dữ Liệu
                </h3>

                <p className="text-slate-500 text-center text-sm mb-8 leading-relaxed font-medium">
                    Hệ thống đang xuất toàn bộ báo cáo PDF.<br />
                    <span className="text-rose-500 font-bold animate-pulse">Vui lòng không tắt máy tính.</span>
                </p>

                {/* Progress Indicator */}
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden relative">
                    <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-indigo-600 w-1/2 rounded-full animate-[shimmer_1.5s_infinite] translate-x-[-100%]"></div>
                    {/* Simulating indeterminate loading with a moving bar */}
                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full w-full origin-left animate-progress"></div>
                </div>
                <div className="mt-2 flex justify-between w-full text-xs text-slate-400 font-medium px-1">
                    <span>Exporting...</span>
                    <span>Please wait</span>
                </div>
            </div>
        </div>
    );
};

export default BackupModal;
