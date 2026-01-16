import React, { useMemo, useState } from 'react';
import { Download, Upload, Database, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { exportBackupBundle, importBackupBundle } from '../services/api';

function parseFilenameFromContentDisposition(value) {
  if (!value) return null;
  // e.g. attachment; filename="fastaccounting-backup-20260103-010203.ejson.json"
  const match = /filename\*=UTF-8''([^;]+)|filename="([^"]+)"|filename=([^;]+)/i.exec(value);
  const raw = match?.[1] || match?.[2] || match?.[3];
  if (!raw) return null;
  try {
    return decodeURIComponent(raw.trim());
  } catch {
    return raw.trim();
  }
}

export default function BackupData() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const isAdmin = user?.role === 'ADMIN';

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const hint = useMemo(() => {
    return 'Backup sẽ bao gồm: customers, transactions, interest_configs, users, counters.';
  }, []);

  if (!isAdmin) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Không có quyền truy cập</h2>
              <p className="text-slate-500 mt-1">Chỉ ADMIN mới được xem và thao tác Backup Data.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleDownload = async () => {
    try {
      setIsExporting(true);
      const res = await exportBackupBundle();
      const blob = res.blob;
      const filename = res.filename || `fastaccounting-backup.ejson.json`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      showToast('Thành công', 'Đã tải xuống file backup', 'success');
    } catch (err) {
      showToast('Lỗi', err.response?.data?.error || 'Không thể export backup', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      showToast('Thiếu file', 'Vui lòng chọn file backup để upload', 'warning');
      return;
    }

    try {
      setIsImporting(true);
      const text = await selectedFile.text();
      const result = await importBackupBundle(text);

      const totals = Object.values(result?.results || {}).reduce(
        (acc, v) => acc + (v?.affected || 0),
        0
      );

      showToast('Thành công', `Đã import backup (affected: ${totals})`, 'success');
    } catch (err) {
      showToast('Lỗi', err.response?.data?.error || 'Không thể import backup', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section - Portrait: Stack layout, Landscape: All in 1 Row */}
      <div className="space-y-4 md:space-y-5 xl:space-y-0">
        {/* Portrait: Stack layout */}
        <div className="xl:hidden space-y-4 md:space-y-5">
          {/* Row 1: Title & Subtitle */}
          <div>
            <h2 className="section-title text-2xl md:text-3xl">Backup Data</h2>
            <p className="section-subtitle text-sm md:text-base mt-1">Tải xuống & khôi phục toàn bộ dữ liệu database (ADMIN)</p>
          </div>
        </div>

        {/* Landscape: All in 1 Row */}
        <div className="hidden xl:flex xl:items-center xl:justify-between xl:gap-6">
          {/* Left: Title & Subtitle */}
          <div>
            <h2 className="section-title text-2xl 2xl:text-3xl">Backup Data</h2>
            <p className="section-subtitle text-sm 2xl:text-base mt-1">Tải xuống & khôi phục toàn bộ dữ liệu database (ADMIN)</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Database size={22} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black text-slate-900">Tải xuống backup</h3>
              <p className="text-slate-500 mt-1 text-sm">{hint}</p>
              <p className="text-slate-400 mt-2 text-xs">
                Lưu ý: File backup chứa dữ liệu nhạy cảm (users). Chỉ chia sẻ nội bộ.
              </p>

              <button
                onClick={handleDownload}
                disabled={isExporting}
                className="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100"
              >
                {isExporting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Download size={18} />
                )}
                Export Backup
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Upload size={22} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black text-slate-900">Upload & khôi phục</h3>
              <p className="text-slate-500 mt-1 text-sm">
                Import sẽ UPSERT theo <span className="font-mono text-slate-600">_id</span> (an toàn cho DB trống).
              </p>

              <div className="mt-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Chọn file</label>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                />
                {selectedFile && (
                  <p className="mt-2 text-xs text-slate-400">Đã chọn: {selectedFile.name}</p>
                )}
              </div>

              <button
                onClick={handleImport}
                disabled={isImporting}
                className="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100"
              >
                {isImporting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Upload size={18} />
                )}
                Import Backup
              </button>

              <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-100">
                <p className="text-xs text-amber-800 font-semibold">Cảnh báo</p>
                <p className="text-xs text-amber-700 mt-1">
                  Chỉ import vào database bạn tin tưởng. Nếu DB đã có dữ liệu, thao tác này có thể ghi đè bản ghi trùng _id.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
