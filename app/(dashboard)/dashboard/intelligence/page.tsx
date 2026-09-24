"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/supabase/useSession";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, RefreshCw } from "lucide-react";

export default function IntelligencePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"competitors" | "keywords" | "alerts">("competitors");

  // Competitor States
  const [pages, setPages] = useState<any[]>([]);
  const [loadingPages, setLoadingPages] = useState(true);
  const [addingPage, setAddingPage] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newName, setNewName] = useState("");
  const [syncingPageId, setSyncingPageId] = useState<string | null>(null);

  // Keyword States
  const [keywords, setKeywords] = useState<any[]>([]);
  const [loadingKeywords, setLoadingKeywords] = useState(true);
  const [addingKeyword, setAddingKeyword] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [syncingKeywords, setSyncingKeywords] = useState(false);

  // Alert States
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [addingAlert, setAddingAlert] = useState(false);
  const [newAlertName, setNewAlertName] = useState("");
  const [newAlertKeyword, setNewAlertKeyword] = useState("");
  const [syncingAlerts, setSyncingAlerts] = useState(false);

  // Fetch Competitors
  const fetchPages = async () => {
    try {
      const res = await fetch(`/api/intelligence/competitors`);
      if (res.ok) {
        const data = await res.json();
        setPages(data);
      }
    } catch (error) {
      toast.error("Failed to load competitors");
    } finally {
      setLoadingPages(false);
    }
  };

  // Fetch Keywords
  const fetchKeywords = async () => {
    try {
      const res = await fetch(`/api/intelligence/keywords`);
      if (res.ok) {
        const data = await res.json();
        setKeywords(data);
      }
    } catch (error) {
      toast.error("Failed to load keywords");
    } finally {
      setLoadingKeywords(false);
    }
  };

  // Fetch Alerts (Alert Settings)
  const fetchAlerts = async () => {
    try {
      const res = await fetch(`/api/intelligence/alerts`);
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (error) {
      toast.error("Failed to load alerts");
    } finally {
      setLoadingAlerts(false);
    }
  };

  useEffect(() => {
    fetchPages();
    fetchKeywords();
    fetchAlerts();
  }, []);

  // Competitor Handlers
  const handleAddPage = async () => {
    if (!newUrl) return toast.error("URL is required");
    try {
      setAddingPage(true);
      const res = await fetch("/api/intelligence/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: newUrl,
          name: newName || "New Competitor",
        }),
      });
      if (!res.ok) throw new Error("Failed to add competitor");
      toast.success("Competitor added");
      setNewUrl("");
      setNewName("");
      fetchPages();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setAddingPage(false);
    }
  };

  const handleDeletePage = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      const res = await fetch(`/api/intelligence/competitors/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Deleted");
      fetchPages();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSyncPage = async (pageId: string) => {
    try {
      setSyncingPageId(pageId);
      const res = await fetch(`/api/competitors/posts/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      toast.success(data.message || "Synced successfully");
      fetchPages();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSyncingPageId(null);
    }
  };

  // Keyword Handlers
  const handleAddKeyword = async () => {
    if (!newKeyword) return toast.error("Keyword is required");
    try {
      setAddingKeyword(true);
      const res = await fetch("/api/intelligence/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: newKeyword }),
      });
      if (!res.ok) throw new Error("Failed to add keyword");
      toast.success("Keyword added");
      setNewKeyword("");
      fetchKeywords();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setAddingKeyword(false);
    }
  };

  const handleSyncKeywords = async () => {
    try {
      setSyncingKeywords(true);
      const res = await fetch(`/api/keywords/sync`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      toast.success(data.message || "Synced successfully");
      fetchKeywords();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSyncingKeywords(false);
    }
  };

  // Alert Handlers
  const handleAddAlert = async () => {
    if (!newAlertName || !newAlertKeyword) return toast.error("Name and Keyword are required");
    try {
      setAddingAlert(true);
      const res = await fetch("/api/intelligence/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newAlertName, keywords: [newAlertKeyword], frequency: "DAILY" }),
      });
      if (!res.ok) throw new Error("Failed to add alert");
      toast.success("Alert added");
      setNewAlertName("");
      setNewAlertKeyword("");
      fetchAlerts();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setAddingAlert(false);
    }
  };

  const handleSyncAlerts = async (keyword: string) => {
    try {
      setSyncingAlerts(true);
      const res = await fetch(`/api/alerts/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      toast.success(data.message || "Synced successfully");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSyncingAlerts(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">M6. Intelligence</h1>
        <p className="text-muted-foreground">Theo dõi Đối thủ, Từ khóa và Cảnh báo tin tức</p>
      </div>

      <div className="flex space-x-1 bg-zinc-900/50 p-1 rounded-lg w-fit">
        {["competitors", "keywords", "alerts"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            {tab === "competitors" && "Đối thủ"}
            {tab === "keywords" && "Từ khóa"}
            {tab === "alerts" && "Cảnh báo"}
          </button>
        ))}
      </div>

      {activeTab === "competitors" && (
        <div className="space-y-6">
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
              <button onClick={handleAddPage} disabled={addingPage} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-md flex items-center font-medium">
                {addingPage ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Thêm
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingPages ? (
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
                      <button className="p-1 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity rounded-md hover:bg-zinc-800" onClick={(e) => { e.stopPropagation(); handleDeletePage(page.id); }}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <a href={page.url} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:underline truncate block mt-1" onClick={(e) => e.stopPropagation()}>
                      {page.url}
                    </a>
                  </div>
                  <div className="p-6 pt-4 flex-1 flex gap-4 items-center">
                    <div className="bg-zinc-950 p-3 rounded-lg flex-1 text-center">
                      <p className="text-2xl font-bold text-white">{page._count?.posts || 0}</p>
                      <p className="text-xs text-zinc-500">Bài viết</p>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleSyncPage(page.id); }}
                      disabled={syncingPageId === page.id}
                      className="bg-zinc-800 hover:bg-zinc-700 text-white p-3 rounded-lg flex items-center justify-center transition-colors"
                      title="Đồng bộ bài viết"
                    >
                      <RefreshCw className={`w-5 h-5 ${syncingPageId === page.id ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "keywords" && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="p-6 pb-2 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">Thêm Từ Khóa</h2>
              <button 
                onClick={handleSyncKeywords} 
                disabled={syncingKeywords || keywords.length === 0} 
                className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-md flex items-center text-sm transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${syncingKeywords ? "animate-spin" : ""}`} />
                Đồng bộ tất cả
              </button>
            </div>
            <div className="p-6 flex gap-4 items-end">
              <div className="flex-1 space-y-2">
                <label className="text-sm text-zinc-400">Từ khóa cần theo dõi</label>
                <input 
                  placeholder="Ví dụ: công nghệ AI" 
                  value={newKeyword} 
                  onChange={(e) => setNewKeyword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button onClick={handleAddKeyword} disabled={addingKeyword} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-md flex items-center font-medium">
                {addingKeyword ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Thêm
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {loadingKeywords ? (
              <div className="col-span-full flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
              </div>
            ) : keywords.length === 0 ? (
              <div className="col-span-full text-center p-12 border border-dashed border-zinc-800 rounded-xl text-zinc-500">
                Chưa có từ khóa nào. Thêm từ khóa để bắt đầu theo dõi.
              </div>
            ) : (
              keywords.map(kw => (
                <div key={kw.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-medium text-white truncate pr-2" title={kw.keyword}>{kw.keyword}</h3>
                  </div>
                  <div className="mt-auto flex justify-between items-end">
                    <div>
                      <p className="text-xs text-zinc-500">Search Volume</p>
                      <p className="text-xl font-bold text-white">{kw.volume?.toLocaleString() || "N/A"}</p>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full font-medium ${kw.trend === 'UP' ? 'bg-green-500/10 text-green-500' : kw.trend === 'DOWN' ? 'bg-red-500/10 text-red-500' : 'bg-zinc-800 text-zinc-400'}`}>
                      {kw.trend || "FLAT"}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "alerts" && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="p-6 pb-2">
              <h2 className="text-xl font-semibold text-white">Thêm Cảnh Báo</h2>
            </div>
            <div className="p-6 flex gap-4 items-end">
              <div className="flex-1 space-y-2">
                <label className="text-sm text-zinc-400">Tên Cảnh báo</label>
                <input 
                  placeholder="Ví dụ: Brand Mention" 
                  value={newAlertName} 
                  onChange={(e) => setNewAlertName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex-[2] space-y-2">
                <label className="text-sm text-zinc-400">Từ khóa cần tìm</label>
                <input 
                  placeholder="Ví dụ: Vingroup" 
                  value={newAlertKeyword} 
                  onChange={(e) => setNewAlertKeyword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button onClick={handleAddAlert} disabled={addingAlert} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-md flex items-center font-medium">
                {addingAlert ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Thêm
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingAlerts ? (
              <div className="col-span-full flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
              </div>
            ) : alerts.length === 0 ? (
              <div className="col-span-full text-center p-12 border border-dashed border-zinc-800 rounded-xl text-zinc-500">
                Chưa có thiết lập cảnh báo nào.
              </div>
            ) : (
              alerts.map(alert => {
                const keyword = alert.keywords?.[0] || "";
                return (
                  <div key={alert.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col">
                    <h3 className="text-lg font-semibold text-white mb-1">{alert.name}</h3>
                    <p className="text-sm text-zinc-400 mb-4">Keywords: {alert.keywords?.join(", ")}</p>
                    
                    <div className="mt-auto flex justify-between items-center">
                      <div className="text-xs text-zinc-500">
                        Status: <span className={alert.isActive ? "text-green-500" : "text-zinc-500"}>{alert.isActive ? "Active" : "Inactive"}</span>
                      </div>
                      <button 
                        onClick={() => handleSyncAlerts(keyword)}
                        disabled={syncingAlerts || !keyword}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-md flex items-center text-sm transition-colors"
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${syncingAlerts ? "animate-spin" : ""}`} />
                        Sync News
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
