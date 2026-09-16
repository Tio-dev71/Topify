"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/supabase/useSession";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, RefreshCw } from "lucide-react";

export default function IntelligencePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  
  const [newUrl, setNewUrl] = useState("");
  const [newName, setNewName] = useState("");

  const fetchPages = async () => {
    try {
      const res = await fetch(`/api/intelligence/competitors`);
      if (res.ok) {
        const data = await res.json();
        setPages(data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load competitors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleAdd = async () => {
    if (!newUrl) return toast.error("URL is required");
    try {
      setAdding(true);
      const res = await fetch("/api/intelligence/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: newUrl,
          name: newName || "New Competitor",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add competitor");
      toast.success("Competitor added");
      setNewUrl("");
      setNewName("");
      fetchPages();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this competitor?")) return;
    try {
      const res = await fetch(`/api/intelligence/competitors/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Competitor deleted");
      fetchPages();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">M6. Intelligence</h1>
        <p className="text-muted-foreground">Theo dõi và phân tích Fanpage đối thủ</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-6 pb-2">
          <h2 className="text-xl font-semibold text-white">Thêm Fanpage Đối Thủ</h2>
        </div>
        <div className="p-6 flex gap-4 items-end">
          <div className="flex-1 space-y-2">
            <label className="text-sm text-zinc-400">Tên gợi nhớ (Tùy chọn)</label>
            <input 
              placeholder="Ví dụ: TechComBank Fanpage" 
              value={newName} 
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex-[2] space-y-2">
            <label className="text-sm text-zinc-400">URL Fanpage Facebook</label>
            <input 
              placeholder="https://facebook.com/..." 
              value={newUrl} 
              onChange={(e) => setNewUrl(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button onClick={handleAdd} disabled={adding} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-md flex items-center font-medium">
            {adding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            Thêm
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
          </div>
        ) : pages.length === 0 ? (
          <div className="col-span-full text-center p-12 border border-dashed border-zinc-800 rounded-xl text-zinc-500">
            Chưa có Fanpage đối thủ nào. Thêm một URL để bắt đầu.
          </div>
        ) : (
          pages.map(page => (
            <div key={page.id} className="bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 transition-colors cursor-pointer group rounded-xl overflow-hidden flex flex-col" onClick={() => router.push(`/dashboard/intelligence/${page.id}`)}>
              <div className="p-6 pb-2">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold text-white truncate pr-4">{page.name || "Competitor"}</h3>
                  <button className="p-1 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity rounded-md hover:bg-zinc-800" onClick={(e) => { e.stopPropagation(); handleDelete(page.id); }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <a href={page.url} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:underline truncate block mt-1" onClick={(e) => e.stopPropagation()}>
                  {page.url}
                </a>
              </div>
              <div className="p-6 pt-4 flex-1">
                <div className="flex gap-4">
                  <div className="bg-zinc-950 p-3 rounded-lg flex-1 text-center">
                    <p className="text-2xl font-bold text-white">{page._count?.posts || 0}</p>
                    <p className="text-xs text-zinc-500">Bài viết đã cào</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
