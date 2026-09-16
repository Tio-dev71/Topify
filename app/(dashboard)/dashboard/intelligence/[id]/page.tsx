"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/supabase/useSession";
import { toast } from "sonner";
import { Loader2, ArrowLeft, RefreshCw, ThumbsUp, MessageCircle, Share2, ExternalLink } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

export default function CompetitorDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  
  const [fbAccounts, setFbAccounts] = useState<any[]>([]);
  const [selectedFbAccount, setSelectedFbAccount] = useState("");
  const [scraping, setScraping] = useState(false);

  const fetchPostsAndStats = async () => {
    try {
      setLoading(true);
      const [postsRes, statsRes] = await Promise.all([
        fetch(`/api/intelligence/competitors/${id}/posts`),
        fetch(`/api/intelligence/competitors/${id}/stats`)
      ]);
      
      if (postsRes.ok) {
        setPosts(await postsRes.json());
      }
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const fetchFbAccounts = async () => {
    try {
      const res = await fetch(`/api/automation/accounts`);
      if (res.ok) {
        const data = await res.json();
        setFbAccounts(data);
        if (data.length > 0) {
          setSelectedFbAccount(data[0].id);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchPostsAndStats();
    fetchFbAccounts();
  }, [id]);

  const handleScrape = async () => {
    if (!selectedFbAccount) {
      return toast.error("Vui lòng chọn một tài khoản Facebook để cào dữ liệu");
    }
    
    try {
      setScraping(true);
      const res = await fetch("/api/intelligence/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: id,
          fbAccountId: selectedFbAccount
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể trigger scrape");
      toast.success("Đã đưa vào hàng đợi cào dữ liệu. Vui lòng chờ vài phút.");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setScraping(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 text-zinc-400 hover:text-white rounded-md hover:bg-zinc-800">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Chi Tiết Fanpage Đối Thủ</h1>
          <p className="text-muted-foreground text-zinc-400">Theo dõi và phân tích các bài viết mới nhất</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Thao tác cào dữ liệu (Scrape)</h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1 space-y-2">
            <label className="text-sm text-zinc-400">Chọn tài khoản Facebook sử dụng để cào</label>
            <select 
              value={selectedFbAccount} 
              onChange={(e) => setSelectedFbAccount(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="" disabled>Chọn tài khoản Facebook</option>
              {fbAccounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name} - {acc.uid}</option>
              ))}
            </select>
          </div>
          <button onClick={handleScrape} disabled={scraping || fbAccounts.length === 0} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-md flex items-center font-medium">
            {scraping ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Cập nhật dữ liệu
          </button>
          <button onClick={fetchPostsAndStats} disabled={loading} className="border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-50 px-4 py-2 rounded-md flex items-center font-medium">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Tải lại kết quả
          </button>
        </div>
      </div>

      {/* Stats Section */}
      {stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <p className="text-sm font-medium text-zinc-400">Tổng Bài Viết</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.totalPosts}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <p className="text-sm font-medium text-zinc-400">TB Tương Tác</p>
              <p className="text-3xl font-bold text-white mt-2">
                {(stats.averageLikes + stats.averageComments + stats.averageShares).toLocaleString()}
              </p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <p className="text-sm font-medium text-zinc-400">Tổng Likes</p>
              <p className="text-3xl font-bold text-indigo-400 mt-2">{stats.totalLikes.toLocaleString()}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <p className="text-sm font-medium text-zinc-400">Tổng Comments</p>
              <p className="text-3xl font-bold text-purple-400 mt-2">{stats.totalComments.toLocaleString()}</p>
            </div>
          </div>

          {stats.chartData && stats.chartData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="p-6 pb-2">
                  <h3 className="text-lg font-semibold text-white">Tần Suất Đăng Bài</h3>
                </div>
                <div className="p-6 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                      <XAxis dataKey="date" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                        itemStyle={{ color: '#818cf8' }}
                      />
                      <Bar dataKey="posts" fill="#818cf8" radius={[4, 4, 0, 0]} name="Bài viết" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="p-6 pb-2">
                  <h3 className="text-lg font-semibold text-white">Xu Hướng Tương Tác</h3>
                </div>
                <div className="p-6 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                      <XAxis dataKey="date" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                        itemStyle={{ color: '#c084fc' }}
                      />
                      <Line type="monotone" dataKey="engagement" stroke="#c084fc" strokeWidth={3} dot={{ fill: '#18181b', strokeWidth: 2 }} name="Lượt tương tác" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Các Bài Viết Đã Cào</h2>
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center p-12 border border-dashed border-zinc-800 rounded-xl text-zinc-500">
            Chưa có bài viết nào được lưu. Hãy bấm "Cập nhật dữ liệu" để bắt đầu cào.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(post => (
              <div key={post.id} className="bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col h-full overflow-hidden">
                {post.mediaUrl && (
                  <div className="w-full h-48 bg-zinc-950 flex items-center justify-center overflow-hidden">
                    <img src={post.mediaUrl} alt="Post media" className="object-cover w-full h-full" />
                  </div>
                )}
                <div className="p-4 flex-1 flex flex-col">
                  <p className="text-sm text-zinc-300 line-clamp-4 flex-1 whitespace-pre-wrap">{post.content || "Không có nội dung text"}</p>
                  
                  <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between text-zinc-400">
                    <div className="flex items-center gap-1.5" title="Likes">
                      <ThumbsUp className="w-4 h-4" />
                      <span className="text-sm font-medium">{post.likesCount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Comments">
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">{post.commentsCount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Shares">
                      <Share2 className="w-4 h-4" />
                      <span className="text-sm font-medium">{post.sharesCount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                {post.externalId && (
                  <a href={post.externalId} target="_blank" rel="noreferrer" className="block text-center p-3 text-sm text-indigo-400 hover:bg-zinc-800/50 hover:text-indigo-300 border-t border-zinc-800 transition-colors">
                    Xem bài viết gốc <ExternalLink className="inline w-3 h-3 ml-1" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
