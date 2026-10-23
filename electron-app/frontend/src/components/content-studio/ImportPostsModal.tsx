import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  Download,
  Link as LinkIcon,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Loader2,
  Trash2,
  Calendar,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Edit3,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/axios';
import { safeFormatDate } from '../../lib/utils';

export interface ParsedImportRow {
  rowNumber: number;
  title: string;
  caption: string;
  firstComment: string;
  hashtags: string;
  platforms: string[];
  scheduledAt: string | null;
  mediaUrl: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface ImportPostsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ImportPostsModal({ isOpen, onClose, onSuccess }: ImportPostsModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'google_sheet'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [sheetUrl, setSheetUrl] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Parsed result state
  const [parsedRows, setParsedRows] = useState<ParsedImportRow[] | null>(null);
  const [selectedRowNumbers, setSelectedRowNumbers] = useState<number[]>([]);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      handleParseFile(selected);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      setFile(selected);
      handleParseFile(selected);
    }
  };

  const handleParseFile = async (targetFile: File) => {
    setIsParsing(true);
    try {
      const formData = new FormData();
      formData.append('file', targetFile);

      const res = await api.post('/content-studio/import/parse', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        const rows: ParsedImportRow[] = res.data.rows || [];
        setParsedRows(rows);
        setSelectedRowNumbers(rows.filter((r) => r.isValid).map((r) => r.rowNumber));
        toast.success(`Đã phân tích thành công ${rows.length} bài viết từ tệp!`);
      } else {
        toast.error(res.data?.error || 'Lỗi khi phân tích tệp bảng tính.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Không thể đọc tệp bảng tính.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleParseGoogleSheet = async () => {
    if (!sheetUrl.trim()) {
      toast.error('Vui lòng dán liên kết Google Sheets.');
      return;
    }

    setIsParsing(true);
    try {
      const res = await api.post('/content-studio/import/parse', { sheetUrl: sheetUrl.trim() });
      if (res.data?.success) {
        const rows: ParsedImportRow[] = res.data.rows || [];
        setParsedRows(rows);
        setSelectedRowNumbers(rows.filter((r) => r.isValid).map((r) => r.rowNumber));
        toast.success(`Đã nạp ${rows.length} bài viết từ Google Sheets!`);
      } else {
        toast.error(res.data?.error || 'Không thể lấy dữ liệu từ Google Sheets.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Lỗi kết nối Google Sheets.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await api.get('/content-studio/import/template', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Mau_Import_Bai_Viet_Topify.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Đã tải xuống tệp mẫu Excel!');
    } catch (err: any) {
      toast.error('Không thể tải tệp mẫu');
    }
  };

  const toggleSelectAll = () => {
    if (!parsedRows) return;
    if (selectedRowNumbers.length === parsedRows.length) {
      setSelectedRowNumbers([]);
    } else {
      setSelectedRowNumbers(parsedRows.map((r) => r.rowNumber));
    }
  };

  const toggleSelectRow = (rowNum: number) => {
    setSelectedRowNumbers((prev) =>
      prev.includes(rowNum) ? prev.filter((n) => n !== rowNum) : [...prev, rowNum]
    );
  };

  const handleDeleteRow = (rowNum: number) => {
    if (!parsedRows) return;
    setParsedRows(parsedRows.filter((r) => r.rowNumber !== rowNum));
    setSelectedRowNumbers((prev) => prev.filter((n) => n !== rowNum));
  };

  const handleUpdateRowCell = (rowNum: number, field: keyof ParsedImportRow, value: any) => {
    if (!parsedRows) return;
    setParsedRows(
      parsedRows.map((r) => {
        if (r.rowNumber !== rowNum) return r;
        const updated = { ...r, [field]: value };
        // Re-check validity if title changed
        if (field === 'title') {
          const titleStr = String(value || '').trim();
          if (titleStr) {
            updated.errors = updated.errors.filter((e) => !e.includes('tiêu đề'));
            updated.isValid = updated.errors.length === 0;
          } else if (!updated.errors.some((e) => e.includes('tiêu đề'))) {
            updated.errors.push('Thiếu tiêu đề bài viết (Bắt buộc).');
            updated.isValid = false;
          }
        }
        return updated;
      })
    );
  };

  const handleSavePosts = async (importAsDraft: boolean) => {
    if (!parsedRows || parsedRows.length === 0) return;

    const selectedPosts = parsedRows.filter((r) => selectedRowNumbers.includes(r.rowNumber));
    if (selectedPosts.length === 0) {
      toast.error('Vui lòng tích chọn ít nhất 1 bài viết để nhập.');
      return;
    }

    const invalidSelected = selectedPosts.filter((r) => !r.isValid);
    if (invalidSelected.length > 0) {
      toast.error(`Có ${invalidSelected.length} bài viết đang bị lỗi (thiếu tiêu đề). Vui lòng sửa hoặc bỏ chọn trước khi lưu.`);
      return;
    }

    setIsSaving(true);
    try {
      const res = await api.post('/content-studio/import/save', {
        posts: selectedPosts.map((p) => ({
          title: p.title,
          caption: p.caption,
          firstComment: p.firstComment,
          hashtags: p.hashtags,
          platforms: p.platforms,
          scheduledAt: p.scheduledAt,
          mediaUrl: p.mediaUrl,
        })),
        importAsDraft,
      });

      if (res.data?.success) {
        toast.success(res.data.message || `Đã nhập thành công ${selectedPosts.length} bài viết!`);
        onSuccess?.();
        onClose();
      } else {
        toast.error(res.data?.error || 'Lỗi khi lưu bài viết.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Lỗi kết nối khi lưu bài viết.');
    } finally {
      setIsSaving(false);
    }
  };

  const validCount = parsedRows ? parsedRows.filter((r) => r.isValid).length : 0;
  const errorCount = parsedRows ? parsedRows.filter((r) => !r.isValid).length : 0;
  const warningCount = parsedRows ? parsedRows.filter((r) => r.warnings.length > 0).length : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50/50 to-indigo-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">
                  Import Bài Viết Hàng Loạt (F019)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                  Excel & Google Drive
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Nhập kịch bản, tiêu đề, caption và lịch đăng từ file bảng tính hoặc link Google Sheets trực tiếp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!parsedRows ? (
            /* STEP 1: UPLOAD / CONNECT SHEET */
            <div className="space-y-6">
              {/* Source Tabs */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      activeTab === 'upload'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <UploadCloud className="w-4 h-4" />
                    Tải tệp từ máy tính (.xlsx, .csv)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('google_sheet')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      activeTab === 'google_sheet'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <LinkIcon className="w-4 h-4" />
                    Kết nối Google Drive / Sheets
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Tải file mẫu Excel (.xlsx)
                </button>
              </div>

              {/* Tab 1: Upload File */}
              {activeTab === 'upload' && (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-purple-200 hover:border-purple-400 rounded-3xl p-10 text-center bg-purple-50/20 transition-all cursor-pointer space-y-3"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
                    {isParsing ? (
                      <Loader2 className="w-7 h-7 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-7 h-7" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">
                      {isParsing
                        ? 'Đang phân tích bảng tính...'
                        : 'Kéo thả file Excel (.xlsx, .xls) hoặc .csv vào đây'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Hoặc click để chọn tệp từ máy tính của bạn (Tối đa 10MB)
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 2: Google Sheets URL */}
              {activeTab === 'google_sheet' && (
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 space-y-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Đường dẫn Google Sheets (Chia sẻ công khai xem):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://docs.google.com/spreadsheets/d/.../edit?usp=sharing"
                        value={sheetUrl}
                        onChange={(e) => setSheetUrl(e.target.value)}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleParseGoogleSheet}
                        disabled={isParsing || !sheetUrl.trim()}
                        className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {isParsing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ArrowRight className="w-4 h-4" />
                        )}
                        Lấy Dữ Liệu
                      </button>
                    </div>
                  </div>

                  {/* Google Sheets Guide */}
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1.5">
                    <p className="font-bold flex items-center gap-1.5 text-amber-900">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      Hướng dẫn bật quyền truy cập Google Sheets:
                    </p>
                    <p>
                      1. Mở file Google Sheets của bạn trên trình duyệt.
                    </p>
                    <p>
                      2. Nhấp nút <strong>"Chia sẻ" (Share)</strong> ở góc trên bên phải.
                    </p>
                    <p>
                      3. Tại mục <em>Quyền truy cập chung</em>, chọn <strong>"Bất kỳ ai có đường liên kết đều có thể xem (Viewer)"</strong>.
                    </p>
                    <p>
                      4. Sao chép liên kết và dán vào ô bên trên để Topify đọc tự động.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* STEP 2: PREVIEW DATA TABLE */
            <div className="space-y-5 animate-fade-in">
              {/* Metric Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-100">
                  <span className="text-[11px] font-semibold text-purple-700 uppercase">Tổng số bài</span>
                  <div className="text-xl font-black text-purple-900 mt-0.5">{parsedRows.length}</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <span className="text-[11px] font-semibold text-emerald-700 uppercase">Hợp lệ</span>
                  <div className="text-xl font-black text-emerald-700 mt-0.5">{validCount}</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-100">
                  <span className="text-[11px] font-semibold text-amber-700 uppercase">Có cảnh báo</span>
                  <div className="text-xl font-black text-amber-700 mt-0.5">{warningCount}</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100">
                  <span className="text-[11px] font-semibold text-rose-700 uppercase">Không hợp lệ</span>
                  <div className="text-xl font-black text-rose-700 mt-0.5">{errorCount}</div>
                </div>
              </div>

              {/* Data Table */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="max-h-[50vh] overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 sticky top-0 z-10">
                      <tr>
                        <th className="p-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={selectedRowNumbers.length === parsedRows.length}
                            onChange={toggleSelectAll}
                            className="rounded text-purple-600 focus:ring-purple-400"
                          />
                        </th>
                        <th className="p-3 w-12 font-bold text-center">STT</th>
                        <th className="p-3 font-bold w-1/4">Tiêu đề bài viết *</th>
                        <th className="p-3 font-bold w-1/3">Nội dung (Caption)</th>
                        <th className="p-3 font-bold">Nền tảng</th>
                        <th className="p-3 font-bold">Thời gian</th>
                        <th className="p-3 font-bold text-center">Trạng thái</th>
                        <th className="p-3 font-bold text-center w-12">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {parsedRows.map((row) => {
                        const isSelected = selectedRowNumbers.includes(row.rowNumber);
                        const hasErrors = row.errors.length > 0;
                        const hasWarnings = row.warnings.length > 0;

                        return (
                          <tr
                            key={row.rowNumber}
                            className={`hover:bg-purple-50/30 transition-colors ${
                              !isSelected ? 'opacity-60 bg-gray-50/50' : hasErrors ? 'bg-rose-50/20' : ''
                            }`}
                          >
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectRow(row.rowNumber)}
                                className="rounded text-purple-600 focus:ring-purple-400"
                              />
                            </td>
                            <td className="p-3 text-center font-mono text-gray-500 font-bold">
                              {row.rowNumber}
                            </td>
                            <td className="p-3 font-semibold text-gray-900">
                              <input
                                type="text"
                                value={row.title}
                                onChange={(e) => handleUpdateRowCell(row.rowNumber, 'title', e.target.value)}
                                className={`w-full px-2 py-1 rounded border text-xs font-semibold focus:outline-none focus:ring-1 ${
                                  hasErrors ? 'border-rose-300 bg-rose-50/50 text-rose-900' : 'border-transparent hover:border-gray-300'
                                }`}
                                placeholder="Nhập tiêu đề bài viết..."
                              />
                            </td>
                            <td className="p-3 text-gray-700">
                              <textarea
                                value={row.caption}
                                onChange={(e) => handleUpdateRowCell(row.rowNumber, 'caption', e.target.value)}
                                rows={2}
                                className="w-full px-2 py-1 rounded border border-transparent hover:border-gray-300 text-xs focus:outline-none focus:ring-1 focus:border-purple-400 resize-none bg-transparent"
                                placeholder="Nhập caption bài viết..."
                              />
                            </td>
                            <td className="p-3">
                              <div className="flex flex-wrap gap-1">
                                {row.platforms.map((p, idx) => (
                                  <span
                                    key={idx}
                                    className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100"
                                  >
                                    {p.replace('_REELS', '').replace('_POST', '').replace('_VIDEO', '')}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="p-3 whitespace-nowrap text-gray-600 font-mono">
                              {row.scheduledAt ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700">
                                  <Calendar className="w-3 h-3 text-purple-600" />
                                  {safeFormatDate(row.scheduledAt, 'HH:mm (dd/MM)')}
                                </span>
                              ) : (
                                <span className="text-[11px] text-gray-400 italic">Bản thảo (Draft)</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {hasErrors ? (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 cursor-help"
                                  title={row.errors.join('; ')}
                                >
                                  <AlertCircle className="w-3 h-3 text-rose-600" />
                                  Lỗi
                                </span>
                              ) : hasWarnings ? (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 cursor-help"
                                  title={row.warnings.join('; ')}
                                >
                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                  Cảnh báo
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Hợp lệ
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteRow(row.rowNumber)}
                                className="p-1 text-gray-400 hover:text-rose-600 rounded transition-colors"
                                title="Xóa dòng này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          {!parsedRows ? (
            <div className="text-xs text-gray-500">
              Định dạng cột hỗ trợ: Tiêu đề, Nội dung, Bình luận đầu, Hashtag, Nền tảng, Thời gian đăng
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setParsedRows(null);
                  setFile(null);
                  setSheetUrl('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-200 transition-colors"
              >
                ← Chọn file khác
              </button>
              <span className="text-xs text-gray-500">
                Đã chọn <strong>{selectedRowNumbers.length}</strong> / {parsedRows.length} bài
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-200 transition-colors"
            >
              Đóng
            </button>

            {parsedRows && (
              <>
                <button
                  type="button"
                  onClick={() => handleSavePosts(true)}
                  disabled={isSaving || selectedRowNumbers.length === 0}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-200 hover:bg-gray-300 text-gray-800 transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Lưu dạng Bản Thảo (Draft)
                </button>

                <button
                  type="button"
                  onClick={() => handleSavePosts(false)}
                  disabled={isSaving || selectedRowNumbers.length === 0}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Xác Nhận Lên Lịch & Lưu Bài
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
