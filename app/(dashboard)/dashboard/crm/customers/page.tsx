"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Filter, Trash2, UserCheck, Mail, Phone, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";

type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  tags: string | null;
  source: string | null;
  notes: string | null;
  createdAt: string;
  deals?: { id: string; title: string; value: number; status: string }[];
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    source: "Facebook",
    tags: "Lead",
    notes: ""
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async (search = "") => {
    setLoading(true);
    try {
      const url = search ? `/api/crm/customers?search=${encodeURIComponent(search)}` : '/api/crm/customers';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
      } else {
        toast.error("Không thể tải danh sách khách hàng");
      }
    } catch (err) {
      toast.error("Lỗi kết nối khi tải khách hàng");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers(searchTerm);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      return toast.error("Vui lòng nhập tên khách hàng");
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/crm/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success("Thêm khách hàng thành công!");
        setShowAddModal(false);
        setFormData({ name: "", email: "", phone: "", source: "Facebook", tags: "Lead", notes: "" });
        fetchCustomers();
      } else {
        const err = await res.json();
        toast.error(err.error || "Lỗi khi thêm khách hàng");
      }
    } catch (err) {
      toast.error("Lỗi kết nối máy chủ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa khách hàng "${name}"?`)) return;

    try {
      const res = await fetch(`/api/crm/customers?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("Đã xóa khách hàng");
        setCustomers(customers.filter(c => c.id !== id));
      } else {
        toast.error("Không thể xóa khách hàng");
      }
    } catch (err) {
      toast.error("Lỗi kết nối khi xóa");
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-[#5B3DF5]" />
            Khách hàng
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Quản lý cơ sở dữ liệu khách hàng và lịch sử liên hệ</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => fetchCustomers(searchTerm)}
            className="flex items-center gap-2 p-2.5 bg-card border border-border rounded-xl hover:bg-muted text-foreground transition-colors"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-foreground text-background hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Thêm khách hàng
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <form onSubmit={handleSearch} className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 bg-background items-center">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              placeholder="Tìm kiếm theo tên, số điện thoại, email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/50 text-foreground transition-shadow"
            />
          </div>
          <button 
            type="submit"
            className="p-2 bg-card border border-border rounded-xl hover:bg-muted text-foreground flex items-center gap-2 px-4 text-sm font-medium transition-colors w-full sm:w-auto justify-center"
          >
            <Filter className="w-4 h-4" />
            Lọc & Tìm kiếm
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Tên Khách Hàng</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Liên Hệ</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Nguồn</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Phân Loại / Thẻ</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Số Giao Dịch</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Ngày Tạo</th>
                <th className="px-6 py-4 font-semibold text-right whitespace-nowrap">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-12 text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                    Đang tải danh sách khách hàng...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-12 text-muted-foreground">
                    Chưa có khách hàng nào. Nhấn &quot;Thêm khách hàng&quot; để tạo mới.
                  </td>
                </tr>
              ) : (
                customers.map(customer => {
                  const dealCount = customer.deals?.length || 0;
                  const totalValue = (customer.deals || []).reduce((sum, d) => sum + (d.value || 0), 0);
                  
                  return (
                    <tr key={customer.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#5B3DF5]/10 flex items-center justify-center text-[#5B3DF5] font-bold shrink-0">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">{customer.name}</p>
                            {customer.notes && (
                              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{customer.notes}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-muted-foreground">
                          {customer.phone && (
                            <span className="flex items-center gap-2 text-xs truncate">
                              <Phone className="w-3.5 h-3.5 shrink-0 text-zinc-400" /> {customer.phone}
                            </span>
                          )}
                          {customer.email && (
                            <span className="flex items-center gap-2 text-xs truncate">
                              <Mail className="w-3.5 h-3.5 shrink-0 text-zinc-400" /> {customer.email}
                            </span>
                          )}
                          {!customer.phone && !customer.email && (
                            <span className="text-xs italic text-zinc-400">Chưa cập nhật</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          {customer.source || "Trực tiếp"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                          customer.tags === 'VIP' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                          customer.tags === 'Khách quen' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                          'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20'
                        }`}>
                          {customer.tags || "Lead"}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground whitespace-nowrap">
                        {dealCount > 0 ? (
                          <div className="flex flex-col">
                            <span>{dealCount} đơn</span>
                            <span className="text-xs text-muted-foreground">{totalValue.toLocaleString('vi-VN')} ₫</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">0 đơn</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(customer.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDelete(customer.id, customer.name)}
                          className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                          title="Xóa khách hàng"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background rounded-3xl shadow-2xl w-full max-w-lg border border-border overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Thêm Khách Hàng Mới</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Nhập thông tin hồ sơ khách hàng</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-muted rounded-xl text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Tên khách hàng *</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Nguyễn Văn A"
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/50"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Số điện thoại</label>
                  <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="VD: 0912345678"
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Email</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="VD: nva@gmail.com"
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Nguồn khách</label>
                  <select 
                    value={formData.source}
                    onChange={e => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/50"
                  >
                    <option value="Facebook">Facebook</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Zalo">Zalo</option>
                    <option value="Website">Website</option>
                    <option value="Giới thiệu">Giới thiệu</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Phân loại</label>
                  <select 
                    value={formData.tags}
                    onChange={e => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/50"
                  >
                    <option value="Lead">Lead tiềm năng</option>
                    <option value="Khách quen">Khách quen</option>
                    <option value="VIP">Khách hàng VIP</option>
                    <option value="Chưa mua">Chưa mua hàng</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5">Ghi chú thêm</label>
                <textarea 
                  rows={2}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ghi chú sở thích, nhu cầu, yêu cầu đặc biệt..."
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/50"
                />
              </div>

              <div className="pt-4 flex gap-3 justify-end">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium rounded-xl hover:bg-muted transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-semibold rounded-xl bg-[#5B3DF5] text-white hover:bg-[#5B3DF5]/90 transition-colors disabled:opacity-50"
                >
                  {submitting ? "Đang lưu..." : "Lưu Khách Hàng"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
