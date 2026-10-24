import { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, ArrowRight, Zap, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ContentScoreData {
  overallScore: number;
  hookScore: number;
  ctaScore: number;
  brandVoiceScore?: number | null;
  platformFitScore: number;
  hookAnalysis: string;
  ctaAnalysis: string;
  brandVoiceAnalysis?: string | null;
  platformFitAnalysis: string;
  strengths: string[];
  improvements: string[];
  suggestedCaption: string;
  isAiGenerated: boolean;
  modelUsed?: string;
}

interface ContentScoreCardProps {
  scoreData: ContentScoreData | null;
  loading: boolean;
  onAnalyze: () => void;
  onApplySuggested?: (newCaption: string) => void;
  canAnalyze: boolean;
}

export function ContentScoreCard({
  scoreData,
  loading,
  onAnalyze,
  onApplySuggested,
  canAnalyze,
}: ContentScoreCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Badge & colors based on overall score
  const getScoreTheme = (score: number) => {
    if (score >= 80) {
      return {
        badge: 'Xuất sắc — Sẵn sàng Viral',
        bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
        bar: 'bg-emerald-500',
        ring: 'ring-emerald-500/30',
        textColor: 'text-emerald-600 dark:text-emerald-400',
      };
    }
    if (score >= 60) {
      return {
        badge: 'Khá — Cần tối ưu thêm',
        bg: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400',
        bar: 'bg-amber-500',
        ring: 'ring-amber-500/30',
        textColor: 'text-amber-600 dark:text-amber-400',
      };
    }
    return {
      badge: 'Yếu — Khó giữ chân khán giả',
      bg: 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400',
      bar: 'bg-rose-500',
      ring: 'ring-rose-500/30',
      textColor: 'text-rose-600 dark:text-rose-400',
    };
  };

  const theme = scoreData ? getScoreTheme(scoreData.overallScore) : null;
  const hasBrandVoice = scoreData?.brandVoiceScore !== undefined && scoreData?.brandVoiceScore !== null;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md overflow-hidden shadow-xs">
      {/* Top action / status bar */}
      <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                AI Content Score (F084)
              </h4>
              {scoreData && (
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${theme?.bg}`}>
                  {theme?.badge}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              {hasBrandVoice
                ? 'Chấm điểm Hook 3s, CTA, Brand Voice & Nền tảng'
                : 'Chấm điểm Hook 3s, CTA & Nền tảng'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onAnalyze}
          disabled={loading || !canAnalyze}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
            loading
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800'
              : !canAnalyze
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs hover:shadow-indigo-500/20 active:scale-95'
          }`}
        >
          {loading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span>Đang chấm điểm...</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5" />
              <span>{scoreData ? 'Chấm điểm lại' : 'Chấm điểm ngay'}</span>
            </>
          )}
        </button>
      </div>

      {/* Main score preview when analyzed */}
      {scoreData && (
        <div className="p-3.5 sm:p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Big overall score gauge */}
            <div className="flex items-center gap-3">
              <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold border ${theme?.bg} ${theme?.ring}`}>
                <span className="text-xl leading-none">{scoreData.overallScore}</span>
                <span className="text-[9px] uppercase tracking-wider opacity-75">/ 100</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Điểm Viral tổng hợp
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 max-w-sm mt-0.5">
                  {scoreData.isAiGenerated
                    ? `Phân tích bởi Topify AI Engine`
                    : 'Phân tích nhanh bởi AI Engine'}
                </p>
              </div>
            </div>

            {/* Toggle detail button */}
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="self-end sm:self-auto flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline cursor-pointer"
            >
              <span>{expanded ? 'Thu gọn phân tích' : 'Xem chi tiết & gợi ý sửa'}</span>
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Pillars Progress Bars (3 pillars if no brand voice, 4 pillars if configured) */}
          <div className={`grid gap-2.5 pt-1 ${hasBrandVoice ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'}`}>
            {/* Pillar 1: Hook */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                <span>🪝 Hook (3s đầu)</span>
                <span className="font-bold">{scoreData.hookScore}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${scoreData.hookScore}%` }}
                />
              </div>
            </div>

            {/* Pillar 2: CTA */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                <span>📢 Độ rõ CTA</span>
                <span className="font-bold">{scoreData.ctaScore}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${scoreData.ctaScore}%` }}
                />
              </div>
            </div>

            {/* Pillar 3: Brand Voice (only if brand voice was provided) */}
            {hasBrandVoice && (
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  <span>🎭 Brand Voice</span>
                  <span className="font-bold">{scoreData.brandVoiceScore}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${scoreData.brandVoiceScore}%` }}
                  />
                </div>
              </div>
            )}

            {/* Pillar 4: Platform Fit */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                <span>📱 Chuẩn nền tảng</span>
                <span className="font-bold">{scoreData.platformFitScore}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-sky-500 rounded-full transition-all duration-500"
                  style={{ width: `${scoreData.platformFitScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* Expanded Analysis & Suggested Action */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800"
              >
                {/* Strengths & Improvements */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Strengths */}
                  <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-emerald-800 dark:text-emerald-300 mb-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Điểm mạnh đã đạt:</span>
                    </div>
                    {scoreData.strengths && scoreData.strengths.length > 0 ? (
                      <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                        {scoreData.strengths.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-emerald-500">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-500 dark:text-slate-400 italic">
                        Chưa ghi nhận điểm mạnh nổi bật. Vui lòng tối ưu theo khuyến nghị bên cạnh.
                      </p>
                    )}
                  </div>

                  {/* Improvements */}
                  <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-amber-800 dark:text-amber-300 mb-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Khuyến nghị tối ưu:</span>
                    </div>
                    <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                      {scoreData.improvements.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-amber-500">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* AI Suggested Caption with 1-Click Apply */}
                {scoreData.suggestedCaption && (
                  <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Phiên bản tối ưu hóa đề xuất (&gt; 90 điểm):</span>
                      </div>
                      {onApplySuggested && (
                        <button
                          type="button"
                          onClick={() => onApplySuggested(scoreData.suggestedCaption)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-medium shadow-xs transition-colors"
                        >
                          <span>Áp dụng bản này</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-indigo-100/80 dark:border-indigo-900/60 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                      {scoreData.suggestedCaption}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
