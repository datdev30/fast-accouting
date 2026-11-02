import React, { useMemo, useState } from 'react';
import { Download, Upload, Database, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getApiErrorMessage } from '../utils/errorMessage';
import { exportBackupBundle, importBackupBundle } from '../services/api';
import { saveFile } from '../utils/saveFile';

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
        <div className="bg-white rounded-xl border border-slate-100 shadow-lg shadow-slate-200/40 p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Không có quyền truy cập</h2>
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

      await saveFile(blob, filename);

      showToast('Thành công', 'Đã tải xuống file backup', 'success');
    } catch (err) {
      showToast('Lỗi', getApiErrorMessage(err, 'Export backup (tải file .ejson)'), 'error');
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
      showToast('Lỗi', getApiErrorMessage(err, 'Import backup từ file'), 'error');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div className="space-y-0">
        <div>
            <h2 className="section-title">Backup data</h2>
            <p className="section-subtitle mt-1">Tải xuống & khôi phục toàn bộ dữ liệu database (ADMIN)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Database size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-slate-900">Tải xuống backup</h3>
              <p className="text-slate-500 mt-1 text-sm break-words">{hint}</p>
              <p className="text-slate-400 mt-2 text-xs">
                Lưu ý: File backup chứa dữ liệu nhạy cảm (users). Chỉ chia sẻ nội bộ.
              </p>

              <button
                type="button"
                onClick={handleDownload}
                disabled={isExporting}
                className="btn-primary btn-md mt-4 w-full sm:w-auto disabled:cursor-wait"
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

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Upload size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-slate-900">Upload & khôi phục</h3>
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
                  <p className="mt-2 text-xs text-slate-400 break-all">Đã chọn: {selectedFile.name}</p>
                )}
              </div>

              <button
                type="button"
                onClick={handleImport}
                disabled={isImporting}
                className="btn-success btn-md mt-4 w-full sm:w-auto disabled:cursor-wait"
              >
                {isImporting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Upload size={18} />
                )}
                Import Backup
              </button>

              <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
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
