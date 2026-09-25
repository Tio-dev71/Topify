"use client";

import { useState } from "react";
import { Search, Plus, Filter, MoreHorizontal, UserCheck, Mail, Phone } from "lucide-react";

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
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-primary" />
            Khách hàng
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Quản lý danh sách khách hàng và thông tin liên hệ</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-foreground text-background hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" />
          Thêm khách hàng
        </button>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 bg-background items-center">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              placeholder="Tìm kiếm theo tên, số điện thoại..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground transition-shadow"
            />
          </div>
          <button className="p-2 bg-card border border-border rounded-xl hover:bg-muted text-foreground flex items-center gap-2 px-4 text-sm font-medium transition-colors w-full sm:w-auto justify-center">
            <Filter className="w-4 h-4" />
            Lọc
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Tên Khách Hàng</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Liên Hệ</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Nguồn</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Trạng Thái</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Đã Chi Tiêu</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Tương Tác Cuối</th>
                <th className="px-6 py-4 font-semibold text-right whitespace-nowrap">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(customer => (
                <tr key={customer.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                        {customer.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{customer.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">ID: {customer.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5 text-muted-foreground">
                      <span className="flex items-center gap-2 text-xs truncate">
                        <Phone className="w-3.5 h-3.5 shrink-0" /> {customer.phone}
                      </span>
                      <span className="flex items-center gap-2 text-xs truncate">
                        <Mail className="w-3.5 h-3.5 shrink-0" /> {customer.email}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-muted-foreground">{customer.source}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                      customer.status === 'VIP' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' :
                      customer.status === 'Khách quen' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                      'bg-muted text-muted-foreground border-border'
                    }`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-foreground whitespace-nowrap">
                    {customer.totalSpent}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                    {customer.lastContact}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center p-12 text-muted-foreground">
                    Không tìm thấy khách hàng nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

