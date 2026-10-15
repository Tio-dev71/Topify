'use client';

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, AlertCircle, Wand2, ChevronDown, ChevronUp, Film, RefreshCw, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type DuplicateMatch = {
  postId: string;
  title: string;
  captionSnippet: string;
  similarity: number;
  isMediaMatch: boolean;
  status: string;
  createdAt: string | Date;
  publishedAt: string | Date | null;
};

export type DuplicateCheckResult = {
  hasDuplicates: boolean;
  maxSimilarity: number;
  riskLevel: 'SAFE' | 'MODERATE' | 'HIGH';
  isMediaDuplicate: boolean;
  matches: DuplicateMatch[];
  checkedCount: number;
};

interface DuplicateWarningCardProps {
  result: DuplicateCheckResult | null;
  loading: boolean;
  onSpinCaption?: () => void;
  isSpinning?: boolean;
}

export function DuplicateWarningCard({
  result,
  loading,
  onSpinCaption,
  isSpinning = false,
}: DuplicateWarningCardProps) {
  const [showMatches, setShowMatches] = useState(false);

  if (!result && !loading) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
        <span>Đang quét kiểm tra trùng lặp trong Workspace...</span>
      </div>
    );
  }

  if (!result) return null;

  const { maxSimilarity, riskLevel, isMediaDuplicate, matches } = result;

  const isSafe = riskLevel === 'SAFE';
  const isModerate = riskLevel === 'MODERATE';
  const isHigh = riskLevel === 'HIGH';

  // Badge config
  const statusConfig = {
    SAFE: {
      borderColor: 'border-emerald-200 dark:border-emerald-900/40',
      bgColor: 'bg-emerald-50/70 dark:bg-emerald-950/20',
      textColor: 'text-emerald-700 dark:text-emerald-400',
      progressColor: 'bg-emerald-500',
      icon: CheckCircle2,
      label: 'Độc nhất (An toàn)',
      subtext: 'Nội dung nguyên bản, không phát hiện trùng lặp đáng kể.',
    },
    MODERATE: {
      borderColor: 'border-amber-200 dark:border-amber-900/40',
      bgColor: 'bg-amber-50/70 dark:bg-amber-950/20',
      textColor: 'text-amber-700 dark:text-amber-400',
      progressColor: 'bg-amber-500',
      icon: AlertCircle,
      label: 'Tương đồng vừa phải',
      subtext: 'Có vài câu hoặc ý tương tự bài viết cũ. Gợi ý làm mới bằng AI để đạt reach cao nhất.',
    },
    HIGH: {
      borderColor: 'border-rose-200 dark:border-rose-900/40',
      bgColor: 'bg-rose-50/70 dark:bg-rose-950/20',
      textColor: 'text-rose-700 dark:text-rose-400',
      progressColor: 'bg-rose-500',
      icon: AlertTriangle,
      label: 'Trùng lặp cao (Nguy hiểm)',
      subtext: isMediaDuplicate
        ? 'Phát hiện dùng lại Media/Video đã xuất bản trong Workspace!'
        : 'Nội dung trùng khớp nhiều với bài cũ. Mạng xã hội có thể bóp tương tác!',
    },
  }[riskLevel];

  const IconComponent = statusConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-4 transition-all duration-200 ${statusConfig.borderColor} ${statusConfig.bgColor}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left header */}
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 p-1.5 rounded-lg bg-white dark:bg-slate-900 shadow-sm ${statusConfig.textColor}`}>
            <IconComponent className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${statusConfig.textColor}`}>
                {statusConfig.label}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 shadow-2xs">
                {maxSimilarity}% trùng khớp
              </span>
              {isMediaDuplicate && (
                <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                  <Film className="w-3 h-3" /> Trùng Media
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              {statusConfig.subtext}
            </p>
          </div>
        </div>

        {/* Right action button */}
        {(isModerate || isHigh) && onSpinCaption && (
          <button
            type="button"
            onClick={onSpinCaption}
            disabled={isSpinning}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors shrink-0 disabled:opacity-60 cursor-pointer"
          >
            <Wand2 className={`w-3.5 h-3.5 ${isSpinning ? 'animate-spin' : ''}`} />
            <span>{isSpinning ? 'Đang viết lại...' : 'AI Spin làm mới'}</span>
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="mt-3 w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 rounded-full ${statusConfig.progressColor}`}
          style={{ width: `${Math.max(4, Math.min(100, maxSimilarity))}%` }}
        />
      </div>

      {/* Matches list toggle */}
      {matches.length > 0 && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60">
          <button
            type="button"
            onClick={() => setShowMatches(!showMatches)}
            className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
          >
            <span>{showMatches ? 'Ẩn chi tiết bài trùng' : `Xem ${matches.length} bài viết tương đồng trong Workspace`}</span>
            {showMatches ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <AnimatePresence>
            {showMatches && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 space-y-2 overflow-hidden"
              >
                {matches.map((item) => (
                  <div
                    key={item.postId}
                    className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 text-xs flex flex-col gap-1 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {item.title || 'Bài viết không tên'}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.isMediaMatch && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400 font-medium">
                            Trùng media
                          </span>
                        )}
                        <span className="font-bold text-slate-600 dark:text-slate-400">
                          {item.similarity}%
                        </span>
                      </div>
                    </div>
                    {item.captionSnippet && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 italic">
                        "{item.captionSnippet}"
                      </p>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
