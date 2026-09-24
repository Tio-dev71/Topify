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
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Khách hàng</h1>
          <p className="text-muted-foreground">Quản lý danh sách khách hàng và thông tin liên hệ</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center font-medium">
          <Plus className="w-4 h-4 mr-2" />
          Thêm khách hàng
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input 
              placeholder="Tìm kiếm theo tên, số điện thoại..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-white"
            />
          </div>
          <button className="p-2 bg-zinc-950 border border-zinc-800 rounded-md hover:bg-zinc-800 text-zinc-300 flex items-center gap-2 px-4 text-sm font-medium">
            <Filter className="w-4 h-4" />
            Lọc
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-zinc-950 text-zinc-400 border-b border-zinc-800">
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
            <tbody className="divide-y divide-zinc-800">
              {filtered.map(customer => (
                <tr key={customer.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                        {customer.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{customer.name}</p>
                        <p className="text-xs text-zinc-500">ID: {customer.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 text-zinc-300">
                      <span className="flex items-center gap-2"><Phone className="w-3 h-3 text-zinc-500" /> {customer.phone}</span>
                      <span className="flex items-center gap-2"><Mail className="w-3 h-3 text-zinc-500" /> {customer.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-300">{customer.source}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      customer.status === 'VIP' ? 'bg-yellow-500/10 text-yellow-500' :
                      customer.status === 'Khách quen' ? 'bg-green-500/10 text-green-500' :
                      'bg-zinc-800 text-zinc-400'
                    }`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-white">{customer.totalSpent}</td>
                  <td className="px-6 py-4 text-zinc-400">{customer.lastContact}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-zinc-400 hover:text-white rounded-md hover:bg-zinc-800">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center p-12 text-zinc-500">
              Không tìm thấy khách hàng nào.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
