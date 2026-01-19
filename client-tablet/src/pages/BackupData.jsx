import React, { useMemo, useState } from 'react';
import { Download, Upload, Database, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { exportBackupBundle, importBackupBundle } from '../services/api';
import { downloadFile } from '../utils/fileDownload';

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
        <div className="bg-white rounded-2xl tablet-lg:rounded-xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 tablet-lg:p-5">
          <div className="flex items-start gap-4 tablet-lg:gap-3">
            <div className="w-12 h-12 tablet-lg:w-10 tablet-lg:h-10 rounded-2xl tablet-lg:rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <ShieldAlert size={22} className="tablet-lg:w-5 tablet-lg:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl tablet-lg:text-lg font-black text-slate-900">Không có quyền truy cập</h2>
              <p className="text-slate-500 mt-1 text-sm tablet-lg:text-xs">Chỉ ADMIN mới được xem và thao tác Backup Data.</p>
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

      await downloadFile(blob, filename);

      showToast('Thành công', 'Đã tải xuống file backup', 'success');
    } catch (err) {
      showToast('Lỗi', err?.message || err.response?.data?.error || 'Không thể export backup', 'error');
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

      showToast('Thành công', `Đã import backup (đã cập nhật: ${totals} bản ghi)`, 'success');
    } catch (err) {
      showToast('Lỗi', err.response?.data?.error || 'Không thể import backup', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 tablet-lg:space-y-5 pb-12 tablet-lg:pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div className="space-y-0">
        <div>
          <h2 className="section-title text-2xl tablet-lg:text-xl">Backup Data</h2>
          <p className="section-subtitle text-sm tablet-lg:text-xs mt-1">Tải xuống & khôi phục toàn bộ dữ liệu (ADMIN)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 tablet-lg:grid-cols-2 gap-4 tablet-lg:gap-4">
        {/* Card: Tải xuống backup */}
        <div className="bg-white rounded-2xl tablet-lg:rounded-xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 tablet-lg:p-5">
          <div className="flex items-start gap-4 tablet-lg:gap-3">
            <div className="w-12 h-12 tablet-lg:w-10 tablet-lg:h-10 rounded-2xl tablet-lg:rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Database size={22} className="tablet-lg:w-5 tablet-lg:h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg tablet-lg:text-base font-black text-slate-900">Tải xuống backup</h3>
              <p className="text-slate-500 mt-1 text-sm tablet-lg:text-xs">{hint}</p>
              <p className="text-slate-400 mt-2 text-xs tablet-lg:text-[10px]">
                Lưu ý: File backup chứa dữ liệu nhạy cảm (users). Chỉ chia sẻ nội bộ.
              </p>

              <button
                onClick={handleDownload}
                disabled={isExporting}
                className="mt-5 tablet-lg:mt-4 inline-flex items-center gap-2 px-5 py-3 tablet-lg:px-4 tablet-lg:py-2.5 rounded-xl tablet-lg:rounded-lg bg-blue-600 text-white font-bold text-sm tablet-lg:text-xs hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100"
              >
                {isExporting ? (
                  <div className="w-4 h-4 tablet-lg:w-3.5 tablet-lg:h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Download size={18} className="tablet-lg:w-4 tablet-lg:h-4" />
                )}
                Export Backup
              </button>
            </div>
          </div>
        </div>

        {/* Card: Upload & khôi phục */}
        <div className="bg-white rounded-2xl tablet-lg:rounded-xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 tablet-lg:p-5">
          <div className="flex items-start gap-4 tablet-lg:gap-3">
            <div className="w-12 h-12 tablet-lg:w-10 tablet-lg:h-10 rounded-2xl tablet-lg:rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Upload size={22} className="tablet-lg:w-5 tablet-lg:h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg tablet-lg:text-base font-black text-slate-900">Upload & khôi phục</h3>
              <p className="text-slate-500 mt-1 text-sm tablet-lg:text-xs">
                Import sẽ UPSERT theo <span className="font-mono text-slate-600">_id</span> (an toàn cho DB trống).
              </p>

              <div className="mt-4 tablet-lg:mt-3">
                <label className="block text-xs tablet-lg:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Chọn file</label>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm tablet-lg:text-xs text-slate-600 file:mr-4 file:py-2.5 file:px-4 tablet-lg:file:py-2 tablet-lg:file:px-3 file:rounded-xl tablet-lg:file:rounded-lg file:border-0 file:text-sm tablet-lg:file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                />
                {selectedFile && (
                  <p className="mt-2 text-xs tablet-lg:text-[10px] text-slate-400 truncate">Đã chọn: {selectedFile.name}</p>
                )}
              </div>

              <button
                onClick={handleImport}
                disabled={isImporting}
                className="mt-5 tablet-lg:mt-4 inline-flex items-center gap-2 px-5 py-3 tablet-lg:px-4 tablet-lg:py-2.5 rounded-xl tablet-lg:rounded-lg bg-emerald-600 text-white font-bold text-sm tablet-lg:text-xs hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100"
              >
                {isImporting ? (
                  <div className="w-4 h-4 tablet-lg:w-3.5 tablet-lg:h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Upload size={18} className="tablet-lg:w-4 tablet-lg:h-4" />
                )}
                Import Backup
              </button>

              <div className="mt-4 tablet-lg:mt-3 p-4 tablet-lg:p-3 rounded-2xl tablet-lg:rounded-xl bg-amber-50 border border-amber-100">
                <p className="text-xs tablet-lg:text-[10px] text-amber-800 font-semibold">Cảnh báo</p>
                <p className="text-xs tablet-lg:text-[10px] text-amber-700 mt-1">
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
