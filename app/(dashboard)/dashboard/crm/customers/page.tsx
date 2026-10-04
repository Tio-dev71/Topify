"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Filter, Trash2, UserCheck, Mail, Phone, RefreshCw, X, Eye, Edit2, Calendar, Tag, Briefcase } from "lucide-react";
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

  // View & Edit states
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phone: "",
    source: "Facebook",
    tags: "Lead",
    notes: ""
  });
  const [updating, setUpdating] = useState(false);

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

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditFormData({
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      source: customer.source || "Facebook",
      tags: customer.tags || "Lead",
      notes: customer.notes || ""
    });
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    if (!editFormData.name.trim()) {
      return toast.error("Vui lòng nhập tên khách hàng");
    }

    setUpdating(true);
    try {
      const res = await fetch('/api/crm/customers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCustomer.id,
          ...editFormData
        })
      });

      if (res.ok) {
        const updated = await res.json();
        toast.success("Cập nhật thông tin khách hàng thành công!");
        setCustomers(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
        if (viewingCustomer?.id === updated.id) {
          setViewingCustomer(prev => prev ? { ...prev, ...updated } : null);
        }
        setEditingCustomer(null);
      } else {
        const err = await res.json();
        toast.error(err.error || "Lỗi khi cập nhật khách hàng");
      }
    } catch (err) {
      toast.error("Lỗi kết nối khi cập nhật");
    } finally {
      setUpdating(false);
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
                <th className="px-6 py-4 font-semibold whitespace-nowrap min-w-[260px]">Tên Khách Hàng</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap min-w-[220px]">Liên Hệ</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap w-[140px]">Nguồn</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap w-[160px]">Phân Loại / Thẻ</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap w-[140px]">Số Giao Dịch</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap w-[140px]">Ngày Tạo</th>
                <th className="px-6 py-4 font-semibold text-right whitespace-nowrap w-[100px]">Thao Tác</th>
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
                      <td className="px-6 py-4 min-w-[260px] max-w-[320px]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#5B3DF5]/10 flex items-center justify-center text-[#5B3DF5] font-bold shrink-0">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-foreground truncate" title={customer.name}>{customer.name}</p>
                            {customer.notes && (
                              <p className="text-xs text-muted-foreground mt-0.5 truncate" title={customer.notes}>{customer.notes}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 min-w-[220px] max-w-[280px]">
                        <div className="flex flex-col gap-1 text-muted-foreground">
                          {customer.phone && (
                            <span className="flex items-center gap-2 text-xs truncate" title={customer.phone}>
                              <Phone className="w-3.5 h-3.5 shrink-0 text-zinc-400" /> <span className="truncate">{customer.phone}</span>
                            </span>
                          )}
                          {customer.email && (
                            <span className="flex items-center gap-2 text-xs truncate" title={customer.email}>
                              <Mail className="w-3.5 h-3.5 shrink-0 text-zinc-400" /> <span className="truncate">{customer.email}</span>
                            </span>
                          )}
                          {!customer.phone && !customer.email && (
                            <span className="text-xs italic text-zinc-400 whitespace-nowrap">Chưa cập nhật</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap w-[140px]">
                        <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 inline-block whitespace-nowrap">
                          {customer.source || "Trực tiếp"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap w-[160px]">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium border inline-block whitespace-nowrap ${
                          customer.tags === 'VIP' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                          customer.tags === 'Khách quen' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                          'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20'
                        }`}>
                          {customer.tags || "Lead"}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground whitespace-nowrap w-[140px]">
                        {dealCount > 0 ? (
                          <div className="flex flex-col">
                            <span>{dealCount} đơn</span>
                            <span className="text-xs text-muted-foreground">{totalValue.toLocaleString('vi-VN')} ₫</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">0 đơn</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground whitespace-nowrap w-[140px]">
                        {new Date(customer.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap w-[130px]">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => setViewingCustomer(customer)}
                            className="p-2 text-zinc-500 hover:text-[#5B3DF5] hover:bg-[#5B3DF5]/10 rounded-lg transition-colors"
                            title="Xem chi tiết khách hàng"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleOpenEdit(customer)}
                            className="p-2 text-zinc-500 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors"
                            title="Chỉnh sửa thông tin"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(customer.id, customer.name)}
                            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                            title="Xóa khách hàng"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Customer Modal */}
      {viewingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background rounded-3xl shadow-2xl w-full max-w-lg border border-border overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#5B3DF5]/10 flex items-center justify-center text-[#5B3DF5] font-bold text-lg">
                  {viewingCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    {viewingCustomer.name}
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${
                      viewingCustomer.tags === 'VIP' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                      viewingCustomer.tags === 'Khách quen' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                      'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20'
                    }`}>
                      {viewingCustomer.tags || "Lead"}
                    </span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Mã KH: #{viewingCustomer.id.slice(-6).toUpperCase()}</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingCustomer(null)} 
                className="p-2 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/40 rounded-xl border border-border/50">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1 font-medium">
                    <Phone className="w-3.5 h-3.5 text-zinc-400" /> Số điện thoại
                  </p>
                  <p className="text-sm font-semibold text-foreground">{viewingCustomer.phone || 'Chưa cập nhật'}</p>
                </div>
                <div className="p-3 bg-muted/40 rounded-xl border border-border/50">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1 font-medium">
                    <Mail className="w-3.5 h-3.5 text-zinc-400" /> Email
                  </p>
                  <p className="text-sm font-semibold text-foreground truncate" title={viewingCustomer.email || ''}>
                    {viewingCustomer.email || 'Chưa cập nhật'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/40 rounded-xl border border-border/50">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1 font-medium">
                    <Tag className="w-3.5 h-3.5 text-zinc-400" /> Nguồn khách
                  </p>
                  <p className="text-sm font-semibold text-foreground">{viewingCustomer.source || 'Trực tiếp'}</p>
                </div>
                <div className="p-3 bg-muted/40 rounded-xl border border-border/50">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" /> Ngày tạo
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {new Date(viewingCustomer.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>

              {viewingCustomer.notes && (
                <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1.5 font-medium">Ghi chú khách hàng</p>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap">{viewingCustomer.notes}</p>
                </div>
              )}

              {/* Deals Summary */}
              <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                <p className="text-xs text-muted-foreground mb-2 font-medium flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-[#5B3DF5]" /> Giao dịch liên quan ({viewingCustomer.deals?.length || 0})
                </p>
                {(!viewingCustomer.deals || viewingCustomer.deals.length === 0) ? (
                  <p className="text-xs text-muted-foreground italic">Chưa có giao dịch nào liên kết với khách hàng này.</p>
                ) : (
                  <div className="space-y-2">
                    {viewingCustomer.deals.map(deal => (
                      <div key={deal.id} className="flex justify-between items-center bg-background p-2.5 rounded-lg border border-border text-xs">
                        <span className="font-semibold text-foreground truncate max-w-[200px]">{deal.title}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#5B3DF5]">{deal.value.toLocaleString('vi-VN')} ₫</span>
                          <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] uppercase font-bold">{deal.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-border flex justify-between items-center bg-muted/20">
              <button
                type="button"
                onClick={() => {
                  const cust = viewingCustomer;
                  setViewingCustomer(null);
                  handleOpenEdit(cust);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Chỉnh sửa thông tin
              </button>
              <button 
                type="button"
                onClick={() => setViewingCustomer(null)}
                className="px-5 py-2 text-sm font-semibold rounded-xl bg-foreground text-background hover:opacity-90 transition-opacity"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background rounded-3xl shadow-2xl w-full max-w-lg border border-border overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Chỉnh Sửa Khách Hàng</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Cập nhật thông tin chi tiết khách hàng</p>
              </div>
              <button onClick={() => setEditingCustomer(null)} className="p-1 hover:bg-muted rounded-xl text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCustomer} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Tên khách hàng *</label>
                <input 
                  type="text" 
                  value={editFormData.name}
                  onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
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
                    value={editFormData.phone}
                    onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                    placeholder="VD: 0912345678"
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Email</label>
                  <input 
                    type="email" 
                    value={editFormData.email}
                    onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                    placeholder="VD: nva@gmail.com"
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Nguồn khách</label>
                  <select 
                    value={editFormData.source}
                    onChange={e => setEditFormData({ ...editFormData, source: e.target.value })}
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
                    value={editFormData.tags}
                    onChange={e => setEditFormData({ ...editFormData, tags: e.target.value })}
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
                  rows={3}
                  value={editFormData.notes}
                  onChange={e => setEditFormData({ ...editFormData, notes: e.target.value })}
                  placeholder="Ghi chú sở thích, nhu cầu, yêu cầu đặc biệt..."
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/50"
                />
              </div>

              <div className="pt-4 flex gap-3 justify-end">
                <button 
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-4 py-2 text-sm font-medium rounded-xl hover:bg-muted transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 text-sm font-semibold rounded-xl bg-[#5B3DF5] text-white hover:bg-[#5B3DF5]/90 transition-colors disabled:opacity-50"
                >
                  {updating ? "Đang lưu..." : "Cập Nhật Khách Hàng"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

