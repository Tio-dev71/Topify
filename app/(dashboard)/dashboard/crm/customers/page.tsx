"use client";

import { useState } from "react";
import { Search, Plus, Filter, MoreHorizontal, UserCheck, Star, Mail, Phone, ExternalLink } from "lucide-react";

const MOCK_CUSTOMERS = [
  { id: "C001", name: "Nguyễn Văn A", email: "nva@gmail.com", phone: "0901234567", source: "Facebook", status: "VIP", totalSpent: "12,500,000 ₫", lastContact: "2 giờ trước" },
  { id: "C002", name: "Trần Thị B", email: "tranthib@gmail.com", phone: "0912345678", source: "TikTok", status: "Lead", totalSpent: "0 ₫", lastContact: "Hôm qua" },
  { id: "C003", name: "Lê Văn C", email: "levanc.work@gmail.com", phone: "0987654321", source: "Website", status: "Khách quen", totalSpent: "4,200,000 ₫", lastContact: "3 ngày trước" },
  { id: "C004", name: "Phạm D", email: "phamd@yahoo.com", phone: "0965432198", source: "Facebook", status: "Lead", totalSpent: "0 ₫", lastContact: "1 tuần trước" },
];

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = MOCK_CUSTOMERS.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-foreground)] mb-2">Khách hàng</h1>
          <p className="text-[var(--color-muted-foreground)]">Quản lý danh sách khách hàng và thông tin liên hệ</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center font-medium shadow-sm transition-colors">
          <Plus className="w-4 h-4 mr-2" />
          Thêm khách hàng
        </button>
      </div>

      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[var(--color-border)] flex gap-4 bg-[var(--color-muted)]/30">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
            <input 
              placeholder="Tìm kiếm theo tên, số điện thoại..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-[var(--color-foreground)] transition-all"
            />
          </div>
          <button className="p-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-md hover:bg-[var(--color-muted)] text-[var(--color-foreground)] flex items-center gap-2 px-4 text-sm font-medium transition-colors">
            <Filter className="w-4 h-4" />
            Lọc
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-[var(--color-muted)] text-[var(--color-muted-foreground)] border-b border-[var(--color-border)]">
              <tr>
                <th className="px-6 py-4 font-semibold">Tên Khách Hàng</th>
                <th className="px-6 py-4 font-semibold">Liên Hệ</th>
                <th className="px-6 py-4 font-semibold">Nguồn</th>
                <th className="px-6 py-4 font-semibold">Trạng Thái</th>
                <th className="px-6 py-4 font-semibold">Đã Chi Tiêu</th>
                <th className="px-6 py-4 font-semibold">Tương Tác Cuối</th>
                <th className="px-6 py-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filtered.map(customer => (
                <tr key={customer.id} className="hover:bg-[var(--color-muted)]/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800">
                        {customer.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--color-foreground)]">{customer.name}</p>
                        <p className="text-xs text-[var(--color-muted-foreground)]">ID: {customer.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 text-[var(--color-muted-foreground)]">
                      <span className="flex items-center gap-2"><Phone className="w-3 h-3 text-[var(--color-muted-foreground)]/70" /> {customer.phone}</span>
                      <span className="flex items-center gap-2"><Mail className="w-3 h-3 text-[var(--color-muted-foreground)]/70" /> {customer.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[var(--color-muted-foreground)]">{customer.source}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      customer.status === 'VIP' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-500 border border-yellow-200 dark:border-yellow-900/50' :
                      customer.status === 'Khách quen' ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-500 border border-green-200 dark:border-green-900/50' :
                      'bg-[var(--color-muted)] text-[var(--color-muted-foreground)] border border-[var(--color-border)]'
                    }`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-[var(--color-foreground)]">{customer.totalSpent}</td>
                  <td className="px-6 py-4 text-[var(--color-muted-foreground)]">{customer.lastContact}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] rounded-md hover:bg-[var(--color-muted)] transition-colors">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center p-12 text-[var(--color-muted-foreground)]">
              Không tìm thấy khách hàng nào.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
