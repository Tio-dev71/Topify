'use client';

import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle,
  MoreVertical,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

const MOCK_TASKS = [
  { id: 'T-1', title: 'Viết content cho chiến dịch 20/10', assignee: 'Hương Nguyễn', priority: 'high', status: 'todo', dueDate: '2024-10-15', project: 'Campaign 20/10' },
  { id: 'T-2', title: 'Gọi lại khách hàng Nguyễn Văn A', assignee: 'Tuấn Trần', priority: 'medium', status: 'in-progress', dueDate: '2024-10-12', project: 'CRM Follow-up' },
  { id: 'T-3', title: 'Thiết kế banner trang chủ', assignee: 'Mai Lê', priority: 'high', status: 'done', dueDate: '2024-10-10', project: 'Website Update' },
  { id: 'T-4', title: 'Lên kịch bản video Tiktok', assignee: 'Hương Nguyễn', priority: 'low', status: 'todo', dueDate: '2024-10-18', project: 'Tiktok Channel' },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [searchTerm, setSearchTerm] = useState('');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'low': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      default: return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'in-progress': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'todo': return <Circle className="w-5 h-5 text-zinc-400" />;
      default: return <Circle className="w-5 h-5 text-zinc-400" />;
    }
  };

  const filteredTasks = tasks.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-foreground)] mb-2">Công việc (Tasks)</h1>
          <p className="text-[var(--color-muted-foreground)]">Quản lý và giao việc cho đội ngũ nội bộ</p>
        </div>
        <button className="bg-[var(--color-primary)] hover:opacity-90 text-white px-4 py-2 rounded-xl flex items-center font-medium transition-opacity">
          <Plus className="w-4 h-4 mr-2" />
          Thêm công việc
        </button>
      </div>

      <div className="bg-white dark:bg-[#1a1b1e] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm">
        {/* Toolbar */}
        <div className="p-4 border-b border-[var(--color-border)] flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
            <input 
              placeholder="Tìm công việc..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-foreground)]"
            />
          </div>
          <button className="p-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-muted)] text-[var(--color-foreground)] flex items-center gap-2 px-4 text-sm font-medium transition-colors">
            <Filter className="w-4 h-4" />
            Lọc
          </button>
        </div>

        {/* Task List */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-[var(--color-muted)]/50 text-[var(--color-muted-foreground)] border-b border-[var(--color-border)]">
              <tr>
                <th className="px-6 py-4 font-semibold w-12"></th>
                <th className="px-6 py-4 font-semibold">Tên công việc</th>
                <th className="px-6 py-4 font-semibold">Dự án/Phân loại</th>
                <th className="px-6 py-4 font-semibold">Người phụ trách</th>
                <th className="px-6 py-4 font-semibold">Độ ưu tiên</th>
                <th className="px-6 py-4 font-semibold">Hạn chót</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredTasks.map(task => (
                <tr key={task.id} className="hover:bg-[var(--color-muted)]/30 transition-colors group">
                  <td className="px-6 py-4">
                    <button className="hover:scale-110 transition-transform">
                      {getStatusIcon(task.status)}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${task.status === 'done' ? 'text-[var(--color-muted-foreground)] line-through' : 'text-[var(--color-foreground)]'}`}>
                      {task.title}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[var(--color-muted-foreground)]">
                    {task.project}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[var(--color-primary)]/20 text-[var(--color-primary)] flex items-center justify-center text-xs font-bold">
                        {task.assignee.charAt(0)}
                      </div>
                      <span className="text-[var(--color-foreground)]">{task.assignee}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)} uppercase`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-[var(--color-muted-foreground)]">
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(task.dueDate), 'dd/MM/yyyy')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] rounded-lg hover:bg-[var(--color-muted)] opacity-0 group-hover:opacity-100 transition-all">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTasks.length === 0 && (
            <div className="text-center p-12 text-[var(--color-muted-foreground)]">
              Không tìm thấy công việc nào.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
