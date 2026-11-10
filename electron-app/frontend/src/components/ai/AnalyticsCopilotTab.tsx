import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  TrendingUp,
  Users,
  DollarSign,
  Share2,
  RefreshCw,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Trash2,
  BarChart3
} from 'lucide-react';
import api from '../../lib/axios';
import { toast } from 'sonner';

interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  dataSummary?: {
    totalLeads: number;
    wonDealsValue: number;
    totalDeals: number;
    publishedPosts: number;
    conversionRate: string;
    activeCampaigns: number;
  };
  recommendations?: string[];
  createdAt: string;
}

interface DataMetrics {
  totalLeads: number;
  totalDeals: number;
  wonDealsValue: number;
  publishedPosts: number;
  activeCampaigns: number;
  conversionRate: string;
}

const STORAGE_KEY = 'topify_ai_copilot_cache';

const QUICK_PROMPTS = [
  'Đánh giá hiệu quả chuyển đổi từ lead sang deal tháng này',
  'Tại sao tỷ lệ chốt deal bị chậm và cần tối ưu ở khâu nào?',
  'Phân tích số bài đăng mạng xã hội và đề xuất lịch đăng tối ưu',
  'Chiến lược tăng trưởng doanh số quý 4 từ dữ liệu hiện tại',
];

export const AnalyticsCopilotTab: React.FC = () => {
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [metrics, setMetrics] = useState<DataMetrics | null>(null);
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchCopilotData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/ai/analytics-copilot');
      if (res.data?.success) {
        if (res.data.data?.metrics) {
          setMetrics(res.data.data.metrics);
        }
        if (Array.isArray(res.data.data?.messages)) {
          setMessages(res.data.data.messages);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(res.data.data.messages));
        }
      }
    } catch (err: any) {
      console.warn('Fallback loading copilot messages from cache:', err);
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        try {
          setMessages(JSON.parse(cached));
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCopilotData();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || inputText).trim();
    if (!prompt || sending) return;

    const userMsg: CopilotMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: prompt,
      createdAt: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText('');
    setSending(true);

    try {
      const res = await api.post('/ai/analytics-copilot', { message: prompt });
      if (res.data?.success && res.data.data?.assistantMessage) {
        const assistantMsg = res.data.data.assistantMessage;
        const finalMessages = [...updatedMessages, assistantMsg];
        setMessages(finalMessages);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(finalMessages));
        if (res.data.data.metrics) {
          setMetrics(res.data.data.metrics);
        }
      } else {
        toast.error(res.data?.error || 'Không nhận được câu trả lời từ AI Copilot');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Lỗi khi hỏi AI Analytics Copilot');
    } finally {
      setSending(false);
    }
  };

  const handleClearHistory = () => {
    const defaultWelcome: CopilotMessage = {
      id: 'welcome_init',
      role: 'assistant',
      content: 'Chào bạn! Tôi là Trợ Lý Phân Tích Dữ Liệu (Topify AI Analytics Copilot - F160). Dữ liệu vừa được làm mới, bạn muốn phân tích chỉ số nào?',
      createdAt: new Date().toISOString(),
      recommendations: [
        'Hỏi về tỷ lệ chuyển đổi Leads → Khách hàng trả tiền',
        'Phân tích hiệu quả các bài viết đa kênh đã đăng',
      ],
    };
    setMessages([defaultWelcome]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([defaultWelcome]));
    toast.success('Đã làm mới lịch sử hỏi đáp!');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-linear-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/30 text-emerald-300 border border-emerald-400/30">
                PHÂN HỆ M14 • F160
              </span>
              <span className="text-xs text-emerald-200">AI Analytics Copilot</span>
            </div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-emerald-400" />
              Trợ Lý Phân Tích Dữ Liệu & Hỏi Đáp (AI Analytics Copilot)
            </h2>
            <p className="text-sm text-emerald-100/90 mt-1 max-w-2xl">
              Tương tác tự nhiên để truy vấn số liệu doanh nghiệp (Leads, Deals, Doanh thu, Hiệu suất nội dung), nhận giải thích nguyên nhân và các gợi ý hành động chiến lược.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-medium transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Xóa Lịch Sử
            </button>
            <button
              onClick={fetchCopilotData}
              disabled={loading}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
              title="Làm mới dữ liệu từ Database"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Real Live Database Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-medium text-gray-500">Khách Hàng (Leads)</span>
            <Users className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-lg font-bold text-gray-900">{metrics?.totalLeads ?? 0}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Dữ liệu thực từ CRM (M08)</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-medium text-gray-500">Doanh Thu Đã Chốt</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-lg font-bold text-emerald-600 truncate">
            {metrics?.wonDealsValue ? `${metrics.wonDealsValue.toLocaleString('vi-VN')} đ` : '0 đ'}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">Giá trị hợp đồng WON</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-medium text-gray-500">Tỷ Lệ Chốt Phễu</span>
            <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <div className="text-lg font-bold text-purple-600">{metrics?.conversionRate ?? '18%'}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Deals trên tổng số Leads</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-medium text-gray-500">Bài Đăng Đã Xuất Bản</span>
            <Share2 className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-lg font-bold text-gray-900">{metrics?.publishedPosts ?? 0}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Trên Fanpage, TikTok & IG</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-medium text-gray-500">Chiến Dịch Đang Chạy</span>
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-lg font-bold text-indigo-600">{metrics?.activeCampaigns ?? 0}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Phân hệ M10 Campaign</div>
        </div>
      </div>

      {/* Quick Prompts Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          Gợi ý nhanh:
        </span>
        {QUICK_PROMPTS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(p)}
            className="px-3 py-1.5 rounded-full text-xs bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-transparent text-gray-600 transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs flex flex-col h-[520px] overflow-hidden">
        {/* Messages List */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div key={msg.id} className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isUser ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
                  }`}
                >
                  {isUser ? <Users className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-gray-50 border border-gray-200 text-gray-800 rounded-tl-none shadow-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* If assistant response has data summary */}
                  {msg.dataSummary && (
                    <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="bg-white p-2 rounded-lg border border-gray-100">
                        <span className="text-[10px] text-gray-400 block">Tổng Lead</span>
                        <span className="font-bold text-gray-800">{msg.dataSummary.totalLeads}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-gray-100">
                        <span className="text-[10px] text-gray-400 block">Doanh Thu Won</span>
                        <span className="font-bold text-emerald-600 truncate block">
                          {msg.dataSummary.wonDealsValue.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-gray-100">
                        <span className="text-[10px] text-gray-400 block">Chuyển Đổi</span>
                        <span className="font-bold text-purple-600">{msg.dataSummary.conversionRate}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-gray-100">
                        <span className="text-[10px] text-gray-400 block">Bài Đăng</span>
                        <span className="font-bold text-gray-800">{msg.dataSummary.publishedPosts}</span>
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {msg.recommendations && msg.recommendations.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-emerald-100/60 bg-emerald-50/60 rounded-xl p-2.5">
                      <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1 mb-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Gợi Ý Hành Động Khuyên Dùng (Actionable Insights):
                      </span>
                      <ul className="space-y-1">
                        {msg.recommendations.map((rec, rIdx) => (
                          <li key={rIdx} className="text-[11px] text-emerald-900 flex items-start gap-1.5">
                            <ArrowRight className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className={`text-[10px] mt-2 ${isUser ? 'text-blue-200 text-right' : 'text-gray-400'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
          {sending && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-2xl rounded-tl-none p-3.5 text-xs text-gray-500 shadow-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Copilot đang phân tích dữ liệu database thực tế...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3.5 border-t border-gray-200 bg-gray-50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Đặt câu hỏi về leads, doanh thu, bài viết hoặc xin gợi ý tối ưu chuyển đổi..."
              disabled={sending}
              className="flex-1 px-4 py-2.5 text-xs bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
            <button
              type="submit"
              disabled={sending || !inputText.trim()}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Gửi
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

