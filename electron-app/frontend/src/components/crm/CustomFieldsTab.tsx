import { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  User,
  Save,
  Code2,
  X,
  Tag,
  Check,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/axios';

export interface CustomFieldDefinition {
  id: string;
  key: string;
  name: string;
  type: 'TEXT' | 'NUMBER' | 'SELECT' | 'DATE' | 'BOOLEAN';
  options?: string[];
  required?: boolean;
  description?: string;
}

interface CustomerOption {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  source?: string | null;
  customData?: any;
}

export default function CustomFieldsTab({
  customers = [],
  onCustomerUpdated,
}: {
  customers?: CustomerOption[];
  onCustomerUpdated?: () => void;
}) {
  const [fields, setFields] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Internal customers list fallback
  const [internalCustomers, setInternalCustomers] = useState<CustomerOption[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Selected customer for preview / testing
  const [selectedCustId, setSelectedCustId] = useState<string>('');
  const [customerValues, setCustomerValues] = useState<Record<string, any>>({});
  const [savingValues, setSavingValues] = useState(false);

  // Add field form
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<'TEXT' | 'NUMBER' | 'SELECT' | 'DATE'>('TEXT');
  const [newFieldOptions, setNewFieldOptions] = useState('');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldDesc, setNewFieldDesc] = useState('');

  const customerList = customers && customers.length > 0 ? customers : internalCustomers;

  const fetchInternalCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const res = await api.get('/crm/customers?limit=100');
      if (res.data?.customers) {
        setInternalCustomers(res.data.customers);
      }
    } catch (e) {
      console.error('Failed to load customers in CustomFieldsTab', e);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const fetchFields = async () => {
    setLoading(true);
    try {
      const res = await api.get('/crm/custom-fields');
      if (res.data?.fields) {
        setFields(res.data.fields);
      }
    } catch {
      toast.error('Lỗi khi tải danh sách trường tùy biến');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
    if (!customers || customers.length === 0) {
      fetchInternalCustomers();
    }
  }, []);

  useEffect(() => {
    if (customerList.length > 0) {
      if (!selectedCustId) {
        // Prefer customer that already has customData in DB, otherwise first customer
        const custWithData = customerList.find(c => c.customData && Object.keys(c.customData).length > 0);
        const target = custWithData || customerList[0];
        setSelectedCustId(target.id);
        setCustomerValues((target.customData as any) || {});
      } else {
        const current = customerList.find(c => c.id === selectedCustId);
        if (current && current.customData && Object.keys(customerValues).length === 0) {
          setCustomerValues((current.customData as any) || {});
        }
      }
    }
  }, [customers, internalCustomers]);

  const handleSelectCustomer = (custId: string) => {
    setSelectedCustId(custId);
    if (!custId) {
      setCustomerValues({});
      return;
    }
    const cust = customerList.find(c => c.id === custId);
    setCustomerValues((cust?.customData as any) || {});
  };

  const handleSaveCustomerValues = async () => {
    if (!selectedCustId) {
      toast.error('Vui lòng chọn khách hàng để gán dữ liệu');
      return;
    }

    setSavingValues(true);
    try {
      await api.patch('/crm/customers', {
        id: selectedCustId,
        customData: customerValues,
      });
      const cust = customerList.find(c => c.id === selectedCustId);
      toast.success(`Đã lưu dữ liệu tùy biến vào hồ sơ "${cust?.name || 'khách hàng'}" thành công!`);
      // Update local state immediately
      setInternalCustomers(prev =>
        prev.map(c => (c.id === selectedCustId ? { ...c, customData: customerValues } : c))
      );
      if (onCustomerUpdated) onCustomerUpdated();
    } catch {
      toast.error('Lỗi khi lưu dữ liệu tùy biến');
    } finally {
      setSavingValues(false);
    }
  };

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldKey.trim() || !newFieldName.trim()) {
      toast.error('Vui lòng nhập mã trường và tên trường');
      return;
    }

    setSubmitting(true);
    try {
      const optionsArray = newFieldType === 'SELECT'
        ? newFieldOptions.split(',').map(o => o.trim()).filter(Boolean)
        : [];

      const res = await api.post('/crm/custom-fields', {
        key: newFieldKey.trim(),
        name: newFieldName.trim(),
        type: newFieldType,
        options: optionsArray,
        required: newFieldRequired,
        description: newFieldDesc.trim(),
      });

      if (res.data?.field) {
        toast.success(`Đã thêm trường tùy biến "${newFieldName.trim()}"!`);
        fetchFields();
        setShowAddModal(false);
        setNewFieldKey('');
        setNewFieldName('');
        setNewFieldOptions('');
        setNewFieldDesc('');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Lỗi khi thêm trường tùy biến');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteField = async (key: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa trường tùy biến "${name}"?`)) return;
    try {
      await api.delete(`/crm/custom-fields?key=${key}`);
      setFields(prev => prev.filter(f => f.key !== key));
      toast.success('Đã xóa trường tùy biến');
    } catch {
      toast.error('Lỗi khi xóa trường');
    }
  };

  const selectedCust = customerList.find(c => c.id === selectedCustId);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-mono">
              Tính năng F099
            </span>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              Trường Dữ Liệu Tùy Biến CRM (Custom Fields)
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Định nghĩa các trường dữ liệu tùy biến theo đặc thù ngành hàng (Lĩnh vực, Quy mô, Ngân sách, Mã số thuế) lưu qua đối tượng JSON <code>customData</code>.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchFields}
            className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm trường tùy biến</span>
          </button>
        </div>
      </div>

      {/* Main 2-column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Field Definitions (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-purple-600" />
                <span>Danh Sách Trường Tùy Biến ({fields.length})</span>
              </h3>
              <span className="text-[11px] text-gray-400">Tự động đồng bộ vào Schema CRM</span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-gray-400">Đang tải danh sách trường...</div>
            ) : fields.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl">
                Chưa có trường tùy biến nào. Bấm "Thêm trường tùy biến" để bắt đầu.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {fields.map((field) => (
                  <div key={field.id} className="py-3 flex items-start justify-between gap-3 group">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-gray-900">{field.name}</span>
                        <code className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">
                          {field.key}
                        </code>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                          {field.type}
                        </span>
                        {field.required && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-600 border border-rose-200">
                            Bắt buộc
                          </span>
                        )}
                      </div>

                      {field.description && (
                        <p className="text-[11px] text-gray-500">{field.description}</p>
                      )}

                      {field.options && field.options.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap pt-0.5">
                          <span className="text-[10px] text-gray-400">Tùy chọn:</span>
                          {field.options.map((opt, i) => (
                            <span key={i} className="text-[9px] px-1.5 py-0.2 rounded bg-gray-100 text-gray-600">
                              {opt}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteField(field.key, field.name)}
                      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-rose-600 p-1 rounded transition shrink-0"
                      title="Xóa trường tùy biến"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Data Assignment per Customer (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Gán Dữ Liệu Tùy Biến Cho Khách</span>
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold">
                customData
              </span>
            </div>

            {/* Customer Picker */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-gray-700 text-xs block">Chọn khách hàng thực tế:</label>
                <span className="text-[10px] text-gray-400">
                  {loadingCustomers ? 'Đang tải...' : `${customerList.length} khách trong Workspace`}
                </span>
              </div>
              <select
                value={selectedCustId}
                onChange={e => handleSelectCustomer(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="">-- Chọn khách hàng ({customerList.length} khách trong Workspace) --</option>
                {customerList.map(c => {
                  const hasData = c.customData && Object.keys(c.customData).length > 0;
                  return (
                    <option key={c.id} value={c.id}>
                      {c.name || 'Khách không tên'} {c.phone ? `(${c.phone})` : ''} {hasData ? '• [Đã có customData]' : ''}
                    </option>
                  );
                })}
              </select>

              {/* Selected Customer Info Badge */}
              {selectedCust && (
                <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-100 flex items-center justify-between text-[11px] animate-in fade-in">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-purple-200 text-purple-800 flex items-center justify-center font-bold text-xs shrink-0">
                      {(selectedCust.name || 'K')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 truncate leading-tight">
                        {selectedCust.name || 'Khách không tên'}
                      </p>
                      <p className="text-[10px] text-gray-500 font-mono truncate">
                        {selectedCust.phone || 'Chưa có SĐT'} • {selectedCust.email || 'Chưa có Email'}
                      </p>
                    </div>
                  </div>
                  {selectedCust.source && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white text-purple-700 border border-purple-200 uppercase shrink-0">
                      {selectedCust.source}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Dynamic Fields Form */}
            <div className="space-y-3 pt-2">
              {fields.length === 0 ? (
                <div className="p-4 rounded-xl bg-gray-50 border border-dashed border-gray-200 text-center text-xs text-gray-400">
                  Chưa có trường tùy biến nào. Hãy tạo trường mới ở cột bên trái trước khi gán dữ liệu.
                </div>
              ) : (
                fields.map((field) => (
                  <div key={field.id} className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 block">
                      {field.name} {field.required && <span className="text-rose-500">*</span>}
                    </label>

                    {field.type === 'SELECT' ? (
                      <select
                        value={customerValues[field.key] || ''}
                        onChange={e => setCustomerValues({ ...customerValues, [field.key]: e.target.value })}
                        className="w-full p-2 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">-- Chọn {field.name} --</option>
                        {field.options?.map((opt, i) => (
                          <option key={i} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : field.type === 'NUMBER' ? (
                      <input
                        type="number"
                        value={customerValues[field.key] ?? ''}
                        onChange={e => setCustomerValues({ ...customerValues, [field.key]: e.target.value === '' ? '' : Number(e.target.value) })}
                        placeholder={`Nhập ${field.name}...`}
                        className="w-full p-2 rounded-lg border border-gray-200 text-xs font-mono focus:outline-none focus:border-indigo-500"
                      />
                    ) : field.type === 'DATE' ? (
                      <input
                        type="date"
                        value={customerValues[field.key] || ''}
                        onChange={e => setCustomerValues({ ...customerValues, [field.key]: e.target.value })}
                        className="w-full p-2 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none focus:border-indigo-500"
                      />
                    ) : (
                      <input
                        type="text"
                        value={customerValues[field.key] || ''}
                        onChange={e => setCustomerValues({ ...customerValues, [field.key]: e.target.value })}
                        placeholder={`Nhập ${field.name}...`}
                        className="w-full p-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-indigo-500"
                      />
                    )}
                  </div>
                ))
              )}
            </div>

            <button
              onClick={handleSaveCustomerValues}
              disabled={savingValues || !selectedCustId || fields.length === 0}
              className="w-full btn-primary py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingValues ? (
                <span>Đang lưu...</span>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu Dữ Liệu Tùy Biến Cho Khách Hàng</span>
                </>
              )}
            </button>

            {/* JSON Output preview */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Đối tượng customData trong DB:</span>
                <span className="text-[10px] text-gray-400 font-mono">
                  {Object.keys(customerValues).length > 0
                    ? `${Object.keys(customerValues).length} thuộc tính`
                    : 'Trống {}'}
                </span>
              </div>
              <pre className="text-[10px] text-gray-700 font-mono overflow-x-auto p-1.5 bg-white rounded border border-gray-100 max-h-36">
                {JSON.stringify(customerValues, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Thêm Trường Tùy Biến Mới */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 border border-gray-100 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-sm text-gray-900">Tạo Trường Tùy Biến (F099)</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">Tạo thuộc tính mới để lưu trữ thêm thông tin khách hàng</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddField} className="space-y-3">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Tên trường hiển thị *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Số thẻ thành viên VIP"
                  value={newFieldName}
                  onChange={e => {
                    setNewFieldName(e.target.value);
                    if (!newFieldKey) {
                      setNewFieldKey(
                        e.target.value
                          .toLowerCase()
                          .normalize('NFD')
                          .replace(/[\u0300-\u036f]/g, '')
                          .replace(/[^a-z0-9]/g, '_')
                      );
                    }
                  }}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Mã trường (Key trong JSON) *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: vip_card_number"
                  value={newFieldKey}
                  onChange={e => setNewFieldKey(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Kiểu dữ liệu</label>
                  <select
                    value={newFieldType}
                    onChange={e => setNewFieldType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="TEXT">Văn bản (Text)</option>
                    <option value="NUMBER">Số (Number)</option>
                    <option value="SELECT">Danh sách chọn (Select)</option>
                    <option value="DATE">Ngày tháng (Date)</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-gray-700 font-semibold">
                    <input
                      type="checkbox"
                      checked={newFieldRequired}
                      onChange={e => setNewFieldRequired(e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span>Bắt buộc nhập</span>
                  </label>
                </div>
              </div>

              {newFieldType === 'SELECT' && (
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    Các tùy chọn (phân cách bằng dấu phẩy)
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Hạng Bạc, Hạng Vàng, Hạng Kim Cương"
                    value={newFieldOptions}
                    onChange={e => setNewFieldOptions(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-gray-700 block mb-1">Mô tả / Hướng dẫn nhập</label>
                <input
                  type="text"
                  placeholder="VD: Mã số in trên thẻ cứng của khách hàng"
                  value={newFieldDesc}
                  onChange={e => setNewFieldDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 font-semibold hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary px-5 py-2 rounded-xl font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  {submitting ? (
                    <span>Đang tạo...</span>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Tạo trường</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

