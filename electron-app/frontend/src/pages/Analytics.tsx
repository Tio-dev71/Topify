import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  Sparkles,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  RefreshCw,
  Zap,
  Repeat,
  AlertTriangle,
  CheckCircle2,
  PieChart,
  Target,
  Flame,
  Globe,
  Share2,
  Calendar,
  Clock,
  Lightbulb,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/axios';
import { useNavigate } from 'react-router-dom';

interface PostMetric {
  id: string;
  title: string;
  platform: string;
  publishedAt: string;
  reach: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  conversions: number;
  reachScore: number;
  engagementScore: number;
  clickScore: number;
  conversionScore: number;
  overallScore: number;
  tier: 'VIRAL' | 'GOOD' | 'UNDERPERFORMING';
  isEvergreen?: boolean;
}

interface CampaignRoiItem {
  id: string;
  name: string;
  status: string;
  budget: number;
  spent: number;
  revenue: number;
  netProfit: number;
  roi: number;
  leadsCount: number;
  wonDealsCount: number;
  cpl: number;
  cpa: number;
}

interface FunnelData {
  stages: Array<{
    id: string;
    name: string;
    count: number;
    percentageFromTop: number;
    dropOffRate: number;
  }>;
  totalInteractions: number;
  totalLeads: number;
  totalDeals: number;
  totalWon: number;
  overallConversionRate: number;
  leadToDealRate: number;
  dealToWonRate: number;
  bottlenecks: string[];
}

interface AiInsightsData {
  summary: string;
  keyDrivers: Array<{
    factor: string;
    impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    description: string;
  }>;
  recommendations: Array<{
    id: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    title: string;
    action: string;
    expectedOutcome: string;
  }>;
  benchmarkFeedback: string;
  isAiGenerated: boolean;
  modelUsed?: string;
}

interface ChannelBenchmarkItem {
  platform: string;
  displayName: string;
  postsCount: number;
  totalReach: number;
  totalEngagements: number;
  avgEngagementRate: number;
  avgPerformanceScore: number;
  dealsGenerated: number;
}

// F050 Period Comparison Interfaces
interface MetricGrowth {
  current: number;
  prior: number;
  difference: number;
  growthRate: number;
  isPositive: boolean;
}

interface PeriodTrajectoryPoint {
  index: number;
  dateLabel: string;
  currentDate: string;
  priorDate: string;
  currentViews: number;
  priorViews: number;
  currentReach: number;
  priorReach: number;
  currentEngagements: number;
  priorEngagements: number;
  currentLeads: number;
  priorLeads: number;
}

interface PeriodComparisonData {
  timeframe: string;
  comparisonType: 'prior_period' | 'same_period_last_year';
  currentPeriodLabel: string;
  priorPeriodLabel: string;
  metrics: {
    views: MetricGrowth;
    reach: MetricGrowth;
    engagements: MetricGrowth;
    likes: MetricGrowth;
    comments: MetricGrowth;
    shares: MetricGrowth;
    clicks: MetricGrowth;
    leads: MetricGrowth;
    wonDeals: MetricGrowth;
    revenue: MetricGrowth;
    spent: MetricGrowth;
    roi: MetricGrowth;
    avgScore: MetricGrowth;
  };
  trajectory: PeriodTrajectoryPoint[];
}

export default function Analytics() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'content' | 'roi_funnel' | 'ai_benchmark'>('content');
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState('30d');

  // F050: Period Comparison State
  const [compareWithPrior, setCompareWithPrior] = useState(false);
  const [comparisonType, setComparisonType] = useState<'prior_period' | 'same_period_last_year'>('prior_period');
  const [periodComparison, setPeriodComparison] = useState<PeriodComparisonData | null>(null);
  const [chartMetric, setChartMetric] = useState<'views' | 'reach' | 'engagements' | 'leads'>('views');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Content Scores State (F103)
  const [posts, setPosts] = useState<PostMetric[]>([]);
  const [contentStats, setContentStats] = useState({
    totalPosts: 0,
    avgScore: 0,
    viralCount: 0,
    goodCount: 0,
    underperformingCount: 0,
  });
  const [platformFilter, setPlatformFilter] = useState('ALL');
  const [tierFilter, setTierFilter] = useState('ALL');

  // ROI State (F104)
  const [campaigns, setCampaigns] = useState<CampaignRoiItem[]>([]);
  const [roiOverview, setRoiOverview] = useState({
    totalSpent: 0,
    totalRevenue: 0,
    totalProfit: 0,
    overallRoi: 0,
    totalLeads: 0,
    totalWonDeals: 0,
    avgCpl: 0,
    avgCpa: 0,
  });

  // Funnel State (F105)
  const [funnel, setFunnel] = useState<FunnelData | null>(null);

  // AI Insights State (F106)
  const [aiInsights, setAiInsights] = useState<AiInsightsData | null>(null);
  const [generatingAi, setGeneratingAi] = useState(false);

  // Benchmark State (F107)
  const [channels, setChannels] = useState<ChannelBenchmarkItem[]>([]);
  const [pillars, setPillars] = useState<Array<{ pillar: string; avgScore: number; totalPosts: number; leadsGenerated: number }>>([]);

  const fetchData = async (seed = false) => {
    setLoading(true);
    try {
      // 1. Fetch content scores
      const contentRes = await api.get(`/analytics/content-scores?platform=${platformFilter}&tier=${tierFilter}${seed ? '&seed=true' : ''}`);
      if (contentRes.data.success) {
        setPosts(contentRes.data.posts || []);
        setContentStats(contentRes.data.stats || {
          totalPosts: 0,
          avgScore: 0,
          viralCount: 0,
          goodCount: 0,
          underperformingCount: 0,
        });
      }

      // 2. Fetch ROI
      const roiRes = await api.get(`/analytics/campaign-roi${seed ? '?seed=true' : ''}`);
      if (roiRes.data.success) {
        setCampaigns(roiRes.data.campaigns || []);
        setRoiOverview(roiRes.data.overview || {});
      }

      // 3. Fetch Funnel
      const funnelRes = await api.get(`/analytics/funnel${seed ? '?seed=true' : ''}`);
      if (funnelRes.data.success) {
        setFunnel(funnelRes.data.funnel || null);
      }

      // 4. Fetch Benchmark
      const benchRes = await api.get(`/analytics/benchmark`);
      if (benchRes.data.success) {
        setChannels(benchRes.data.channels || []);
        setPillars(benchRes.data.pillars || []);
      }

      // 5. Fetch Period Comparison (F050)
      const periodRes = await api.get(`/analytics/period-comparison?timeframe=${timeframe}&comparison=${comparisonType}${seed ? '&seed=true' : ''}`);
      if (periodRes.data.success) {
        setPeriodComparison(periodRes.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      toast.error('Không thể tải đầy đủ số liệu báo cáo');
    } finally {
      setLoading(false);
    }
  };

  const fetchPeriodComparison = async (seed = false) => {
    try {
      const res = await api.get(`/analytics/period-comparison?timeframe=${timeframe}&comparison=${comparisonType}${seed ? '&seed=true' : ''}`);
      if (res.data.success) {
        setPeriodComparison(res.data.data);
      }
    } catch (err) {
      console.warn('Could not load period comparison data:', err);
    }
  };

  const handleGenerateAiInsights = async () => {
    setGeneratingAi(true);
    try {
      const payload = {
        totalPosts: posts.length,
        avgPerformanceScore: contentStats.avgScore,
        topPosts: posts.slice(0, 3).map((p) => ({ title: p.title, score: p.overallScore, platform: p.platform })),
        campaignsRoi: campaigns.map((c) => ({ name: c.name, roi: c.roi, spent: c.spent, revenue: c.revenue })),
        funnelMetrics: funnel
          ? {
              interactions: funnel.totalInteractions,
              leads: funnel.totalLeads,
              deals: funnel.totalDeals,
              won: funnel.totalWon,
              leadConversionRate: funnel.overallConversionRate,
              dealWonRate: funnel.dealToWonRate,
            }
          : undefined,
        channelBenchmarks: channels.map((c) => ({
          platform: c.platform,
          avgScore: c.avgPerformanceScore,
          avgEngagement: c.avgEngagementRate,
        })),
      };

      const res = await api.post('/analytics/ai-insights', payload);
      if (res.data.success && res.data.insights) {
        setAiInsights(res.data.insights);
        toast.success(res.data.insights.isAiGenerated ? 'Đã sinh AI Insights từ Topify AI!' : 'Đã phân tích báo cáo thành công!');
      }
    } catch {
      toast.error('Không thể kích hoạt AI Insight lúc này');
    } finally {
      setGeneratingAi(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [platformFilter, tierFilter]);

  useEffect(() => {
    fetchPeriodComparison();
  }, [timeframe, comparisonType]);

  const formatCompactNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return Math.round(num).toString();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const getTierBadge = (tier: string) => {
    if (tier === 'VIRAL') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Flame className="w-3.5 h-3.5 text-amber-500" />
          VIRAL (Top Tier)
        </span>
      );
    }
    if (tier === 'GOOD') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Đạt KPI
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
        Cần cải thiện
      </span>
    );
  };

  const renderDualLineChart = () => {
    if (!periodComparison || !periodComparison.trajectory || periodComparison.trajectory.length === 0) {
      return null;
    }

    const data = periodComparison.trajectory;
    const svgWidth = 800;
    const svgHeight = 280;
    const padding = { top: 30, right: 35, bottom: 45, left: 60 };
    const chartW = svgWidth - padding.left - padding.right;
    const chartH = svgHeight - padding.top - padding.bottom;

    const getMetricVal = (item: PeriodTrajectoryPoint, isCurrent: boolean) => {
      switch (chartMetric) {
        case 'views': return isCurrent ? item.currentViews : item.priorViews;
        case 'reach': return isCurrent ? item.currentReach : item.priorReach;
        case 'engagements': return isCurrent ? item.currentEngagements : item.priorEngagements;
        case 'leads': return isCurrent ? item.currentLeads : item.priorLeads;
      }
    };

    const currentVals = data.map((d) => getMetricVal(d, true));
    const priorVals = data.map((d) => getMetricVal(d, false));
    const maxVal = Math.max(...currentVals, ...priorVals, 10) * 1.15;

    const getX = (index: number) => padding.left + (index / (data.length - 1)) * chartW;
    const getY = (val: number) => padding.top + chartH - (val / maxVal) * chartH;

    const currentPoints = data.map((d, i) => ({ x: getX(i), y: getY(getMetricVal(d, true)) }));
    const priorPoints = data.map((d, i) => ({ x: getX(i), y: getY(getMetricVal(d, false)) }));

    const currentPathD = currentPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const priorPathD = priorPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const currentAreaD = `${currentPathD} L ${currentPoints[currentPoints.length - 1].x.toFixed(1)} ${padding.top + chartH} L ${currentPoints[0].x.toFixed(1)} ${padding.top + chartH} Z`;

    const gridLinesCount = 4;
    const yTicks = Array.from({ length: gridLinesCount + 1 }).map((_, i) => {
      const val = (maxVal / gridLinesCount) * (gridLinesCount - i);
      const y = padding.top + (i / gridLinesCount) * chartH;
      return { val, y };
    });

    const activeGrowthMetric = periodComparison.metrics[chartMetric];
    const hoveredPoint = hoveredPointIndex !== null ? data[hoveredPointIndex] : null;

    return (
      <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-6 space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold border border-indigo-200 mb-1.5">
              <Layers className="w-3 h-3 text-indigo-600" />
              Đặc Tả F050 &bull; Biểu Đồ So Sánh Kỳ Đối Ứng
            </div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              Xu Hướng Hiệu Suất Kỳ Này vs Kỳ Trước
              {activeGrowthMetric && (
                <span
                  className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                    activeGrowthMetric.isPositive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {activeGrowthMetric.isPositive ? (
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
                  )}
                  {activeGrowthMetric.isPositive ? `+${activeGrowthMetric.growthRate}%` : `${activeGrowthMetric.growthRate}%`} so với kỳ trước
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Đường nét liền xanh thể hiện kỳ này ({periodComparison.currentPeriodLabel}), đường nét đứt xám thể hiện kỳ trước ({periodComparison.priorPeriodLabel}).
            </p>
          </div>

          {/* Metric Switcher */}
          <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl border border-gray-200/60 self-start md:self-auto">
            {[
              { id: 'views', label: 'Lượt xem (Views)' },
              { id: 'reach', label: 'Tiếp cận (Reach)' },
              { id: 'engagements', label: 'Tương tác' },
              { id: 'leads', label: 'Leads CRM' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setChartMetric(m.id as any)}
                className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all ${
                  chartMetric === m.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* SVG Chart Canvas */}
        <div className="relative w-full overflow-hidden">
          <svg
            viewBox="0 0 800 280"
            className="w-full h-64 select-none"
            onMouseLeave={() => setHoveredPointIndex(null)}
          >
            <defs>
              <linearGradient id="currentLineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.20" />
                <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {yTicks.map((tick, i) => (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={tick.y}
                  x2={svgWidth - padding.right}
                  y2={tick.y}
                  stroke="#F1F5F9"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 10}
                  y={tick.y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fontWeight="500"
                  fill="#94A3B8"
                >
                  {formatCompactNumber(tick.val)}
                </text>
              </g>
            ))}

            {/* Area under curve for Current Period */}
            <path d={currentAreaD} fill="url(#currentLineGrad)" />

            {/* Prior Period Line: Dashed Slate */}
            <path
              d={priorPathD}
              fill="none"
              stroke="#94A3B8"
              strokeWidth="2.5"
              strokeDasharray="6 6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Current Period Line: Solid Vibrant Blue */}
            <path
              d={currentPathD}
              fill="none"
              stroke="#2563EB"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* X-axis labels */}
            {data.map((d, i) => (
              <g key={i}>
                <text
                  x={getX(i)}
                  y={svgHeight - 12}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="500"
                  fill={hoveredPointIndex === i ? '#1E293B' : '#94A3B8'}
                >
                  {d.currentDate}
                </text>
              </g>
            ))}

            {/* Interactive hover points & verticals */}
            {data.map((d, i) => {
              const currPt = currentPoints[i];
              const priorPt = priorPoints[i];
              const isHovered = hoveredPointIndex === i;

              return (
                <g key={i}>
                  <rect
                    x={getX(i) - chartW / (data.length - 1) / 2}
                    y={padding.top}
                    width={chartW / (data.length - 1)}
                    height={chartH + padding.bottom}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPointIndex(i)}
                  />

                  {isHovered && (
                    <line
                      x1={currPt.x}
                      y1={padding.top}
                      x2={currPt.x}
                      y2={padding.top + chartH}
                      stroke="#CBD5E1"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                  )}

                  {/* Prior Dot */}
                  <circle
                    cx={priorPt.x}
                    cy={priorPt.y}
                    r={isHovered ? 5.5 : 3.5}
                    fill="#FFFFFF"
                    stroke="#94A3B8"
                    strokeWidth="2"
                  />

                  {/* Current Dot */}
                  <circle
                    cx={currPt.x}
                    cy={currPt.y}
                    r={isHovered ? 6 : 4}
                    fill="#2563EB"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                </g>
              );
            })}
          </svg>

          {/* Legend and Hover Details Bar */}
          <div className="flex flex-wrap items-center justify-between pt-3 border-t border-gray-100 text-xs gap-3">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="w-5 h-0.5 bg-blue-600 rounded-full" />
                <span className="font-semibold text-gray-800">
                  Kỳ này ({periodComparison.currentPeriodLabel}) &bull; <span className="text-blue-600">Nét liền</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-0.5 border-t-2 border-dashed border-gray-400" />
                <span className="font-medium text-gray-500">
                  Kỳ trước ({periodComparison.priorPeriodLabel}) &bull; <span className="text-gray-600">Nét đứt</span>
                </span>
              </div>
            </div>

            {hoveredPoint && (
              <div className="text-xs font-semibold flex items-center gap-2 bg-indigo-50/90 px-3 py-1.5 rounded-xl text-indigo-950 border border-indigo-200">
                <span>{hoveredPoint.currentDate} vs {hoveredPoint.priorDate}:</span>
                <span className="text-blue-700 font-bold">{getMetricVal(hoveredPoint, true).toLocaleString()}</span>
                <span className="text-gray-400">vs</span>
                <span className="text-gray-600 font-medium">{getMetricVal(hoveredPoint, false).toLocaleString()}</span>
                {(() => {
                  const currV = getMetricVal(hoveredPoint, true);
                  const priorV = getMetricVal(hoveredPoint, false);
                  const rate = priorV > 0 ? Math.round(((currV - priorV) / priorV) * 1000) / 10 : 0;
                  const isPos = rate >= 0;
                  return (
                    <span className={`px-1.5 py-0.5 rounded font-bold ${isPos ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {isPos ? `+${rate}%` : `${rate}%`}
                    </span>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-gray-900">
            Báo Cáo & Phân Tích Đa Kênh
          </h1>
          <p className="text-gray-500 mt-1 text-[14px]">
            Chuẩn hóa hiệu quả nội dung (F103), đo lường ROI chiến dịch (F104), phễu chuyển đổi (F105) &amp; AI Insight (F106)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData(true)}
            className="px-3.5 py-2 text-[13px] font-medium rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 transition-colors flex items-center gap-1.5 shadow-xs"
            title="Nạp dữ liệu mẫu để kiểm thử ngay"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            Nạp mẫu test F103-F107
          </button>

          <button
            onClick={() => fetchData(false)}
            disabled={loading}
            className="p-2.5 text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors shadow-xs"
            title="Làm mới số liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Date Picker & F050 Period Comparison Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Timeframe Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mr-1">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>Khoảng thời gian:</span>
            </div>
            {[
              { id: '7d', label: '7 ngày qua' },
              { id: '30d', label: '30 ngày qua' },
              { id: '90d', label: 'Quý này (90 ngày)' },
              { id: 'this_month', label: 'Tháng này' },
            ].map((tf) => (
              <button
                key={tf.id}
                type="button"
                onClick={() => setTimeframe(tf.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  timeframe === tf.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-gray-100/80 text-gray-700 hover:bg-gray-200/80'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* F050 Compare Checkbox */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2.5 cursor-pointer select-none px-3.5 py-2 rounded-xl border transition-all duration-200 bg-indigo-50/70 border-indigo-200 hover:bg-indigo-100/60 text-indigo-900">
              <input
                type="checkbox"
                id="f050-compare-checkbox"
                checked={compareWithPrior}
                onChange={(e) => setCompareWithPrior(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-indigo-300 cursor-pointer"
              />
              <span className="text-xs font-bold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                So sánh với kỳ trước (F050)
              </span>
            </label>

            {compareWithPrior && (
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs">
                <button
                  type="button"
                  onClick={() => setComparisonType('prior_period')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    comparisonType === 'prior_period'
                      ? 'bg-white text-indigo-900 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Kỳ trước (MoM / WoW)
                </button>
                <button
                  type="button"
                  onClick={() => setComparisonType('same_period_last_year')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    comparisonType === 'same_period_last_year'
                      ? 'bg-white text-indigo-900 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Cùng kỳ năm ngoái (YoY)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Active Comparison Status Banner */}
        {compareWithPrior && periodComparison && (
          <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between text-xs text-gray-600 gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-gray-800">Chế độ so sánh F050 đang bật:</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold border border-blue-200">
                <span className="inline-block w-2.5 h-0.5 bg-blue-600 rounded-full" />
                Kỳ này: {periodComparison.currentPeriodLabel}
              </span>
              <span className="text-gray-400 font-medium">&bull; so với &bull;</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-bold border border-gray-300">
                <span className="inline-block w-2.5 h-0.5 border-t border-dashed border-gray-600" />
                Kỳ trước: {periodComparison.priorPeriodLabel}
              </span>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              Tự động lùi mốc thời gian đối ứng tương đương
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 gap-2">
        <button
          onClick={() => setActiveTab('content')}
          className={`flex items-center gap-2 px-5 py-3 text-[14px] font-medium border-b-2 transition-all ${
            activeTab === 'content'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Award className="w-4 h-4" />
          [F103] Điểm Hiệu Quả Nội Dung
        </button>

        <button
          onClick={() => setActiveTab('roi_funnel')}
          className={`flex items-center gap-2 px-5 py-3 text-[14px] font-medium border-b-2 transition-all ${
            activeTab === 'roi_funnel'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          [F104 &amp; F105] ROI Chiến Dịch &amp; Phễu Chuyển Đổi
        </button>

        <button
          onClick={() => {
            setActiveTab('ai_benchmark');
            if (!aiInsights) handleGenerateAiInsights();
          }}
          className={`flex items-center gap-2 px-5 py-3 text-[14px] font-medium border-b-2 transition-all ${
            activeTab === 'ai_benchmark'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          [F106 &amp; F107] AI Insights &amp; Benchmark Nội Bộ
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: [F103] CONTENT PERFORMANCE SCORE */}
      {/* ========================================================================= */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          {/* F050 Dual-Line Period Comparison Chart */}
          {compareWithPrior && renderDualLineChart()}

          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                {compareWithPrior && periodComparison && (
                  <span
                    className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold border ${
                      periodComparison.metrics.views.isPositive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {periodComparison.metrics.views.isPositive ? (
                      <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 text-rose-600" />
                    )}
                    {periodComparison.metrics.views.isPositive
                      ? `+${periodComparison.metrics.views.growthRate}%`
                      : `${periodComparison.metrics.views.growthRate}%`}
                  </span>
                )}
              </div>
              <p className="text-[28px] font-semibold tracking-tight text-gray-900">
                {compareWithPrior && periodComparison
                  ? periodComparison.metrics.views.current.toLocaleString()
                  : contentStats.totalPosts}
              </p>
              <p className="text-[13px] text-gray-500 mt-0.5 font-medium">
                {compareWithPrior ? 'Lượt xem Video (Views)' : 'Tổng bài phân tích'}
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                {compareWithPrior && periodComparison
                  ? `Kỳ trước: ${periodComparison.metrics.views.prior.toLocaleString()}`
                  : 'Đã đồng bộ trên đa kênh'}
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                </div>
                {compareWithPrior && periodComparison && (
                  <span
                    className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold border ${
                      periodComparison.metrics.reach.isPositive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {periodComparison.metrics.reach.isPositive ? (
                      <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 text-rose-600" />
                    )}
                    {periodComparison.metrics.reach.isPositive
                      ? `+${periodComparison.metrics.reach.growthRate}%`
                      : `${periodComparison.metrics.reach.growthRate}%`}
                  </span>
                )}
              </div>
              <p className="text-[28px] font-semibold tracking-tight text-indigo-600">
                {compareWithPrior && periodComparison
                  ? periodComparison.metrics.reach.current.toLocaleString()
                  : `${contentStats.avgScore}/100`}
              </p>
              <p className="text-[13px] text-gray-500 mt-0.5 font-medium">
                {compareWithPrior ? 'Lượt tiếp cận (Reach)' : 'Điểm TB Chuẩn Hóa'}
              </p>
              <p className="text-[11px] text-emerald-600 flex items-center gap-0.5 mt-1 font-medium">
                {compareWithPrior && periodComparison ? (
                  `Kỳ trước: ${periodComparison.metrics.reach.prior.toLocaleString()}`
                ) : (
                  <>
                    <ArrowUpRight className="w-3 h-3" /> +4.2đ so với tuần trước
                  </>
                )}
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-amber-500" />
                </div>
                {compareWithPrior && periodComparison && (
                  <span
                    className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold border ${
                      periodComparison.metrics.engagements.isPositive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {periodComparison.metrics.engagements.isPositive ? (
                      <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 text-rose-600" />
                    )}
                    {periodComparison.metrics.engagements.isPositive
                      ? `+${periodComparison.metrics.engagements.growthRate}%`
                      : `${periodComparison.metrics.engagements.growthRate}%`}
                  </span>
                )}
              </div>
              <p className="text-[28px] font-semibold tracking-tight text-amber-600">
                {compareWithPrior && periodComparison
                  ? periodComparison.metrics.engagements.current.toLocaleString()
                  : `${contentStats.viralCount} bài`}
              </p>
              <p className="text-[13px] text-gray-500 mt-0.5 font-medium">
                {compareWithPrior ? 'Tương tác Đa kênh' : 'Bài viết Viral 🏆'}
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                {compareWithPrior && periodComparison
                  ? `Kỳ trước: ${periodComparison.metrics.engagements.prior.toLocaleString()}`
                  : 'Điểm >= 85 (Ưu tiên Evergreen)'}
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                </div>
                {compareWithPrior && periodComparison && (
                  <span
                    className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold border ${
                      periodComparison.metrics.leads.isPositive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {periodComparison.metrics.leads.isPositive ? (
                      <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 text-rose-600" />
                    )}
                    {periodComparison.metrics.leads.isPositive
                      ? `+${periodComparison.metrics.leads.growthRate}%`
                      : `${periodComparison.metrics.leads.growthRate}%`}
                  </span>
                )}
              </div>
              <p className="text-[28px] font-semibold tracking-tight text-rose-600">
                {compareWithPrior && periodComparison
                  ? `${periodComparison.metrics.leads.current} Leads`
                  : `${contentStats.underperformingCount} bài`}
              </p>
              <p className="text-[13px] text-gray-500 mt-0.5 font-medium">
                {compareWithPrior ? 'Khách Tiềm Năng (Leads)' : 'Cần Tối Ưu Hook/CTA'}
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                {compareWithPrior && periodComparison
                  ? `Kỳ trước: ${periodComparison.metrics.leads.prior} Leads`
                  : 'Điểm hiệu quả < 60'}
              </p>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500 font-medium">Lọc theo nền tảng:</span>
              <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl border border-gray-200/60">
                {['ALL', 'TIKTOK', 'FACEBOOK', 'INSTAGRAM', 'YOUTUBE'].map((plt) => (
                  <button
                    key={plt}
                    onClick={() => setPlatformFilter(plt)}
                    className={`px-3 py-1 text-xs rounded-lg transition-all font-medium ${
                      platformFilter === plt
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {plt === 'ALL' ? 'Tất cả' : plt}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Xếp loại:</span>
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="bg-white border border-gray-200 text-xs text-gray-700 rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-colors"
              >
                <option value="ALL">Mọi xếp loại</option>
                <option value="VIRAL">Viral 🏆 (&gt;=85)</option>
                <option value="GOOD">Đạt KPI ⭐ (60-84)</option>
                <option value="UNDERPERFORMING">Cần cải thiện ⚠️ (&lt;60)</option>
              </select>
            </div>
          </div>

          {/* Posts Score Table */}
          <div className="bg-white border border-gray-200/80 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-gray-50/80 text-xs uppercase text-gray-500 border-b border-gray-200 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Bài viết & Kênh</th>
                    <th className="py-3 px-3 text-center">Độ phủ (Reach)</th>
                    <th className="py-3 px-3 text-center">Tương tác</th>
                    <th className="py-3 px-3 text-center">Clicks / Deals</th>
                    <th className="py-3 px-4">Điểm Thành Phần (0-100)</th>
                    <th className="py-3 px-4 text-center">Xếp loại</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {posts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        Chưa có dữ liệu bài viết nào. Bấm <b>"Nạp mẫu test F103-F107"</b> để kiểm thử ngay!
                      </td>
                    </tr>
                  ) : (
                    posts.map((post) => (
                      <tr key={post.id} className="hover:bg-gray-50/70 transition">
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-semibold text-gray-900 truncate" title={post.title}>
                            {post.title}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-mono border border-gray-200/60">
                              {post.platform}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(post.publishedAt).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <div className="font-semibold text-gray-900">{post.reach.toLocaleString()}</div>
                          <div className="text-[11px] text-gray-400">{post.views.toLocaleString()} views</div>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <div className="font-semibold text-gray-900">
                            {(post.likes + post.comments + post.shares).toLocaleString()}
                          </div>
                          <div className="text-[11px] text-gray-400">
                            {post.likes} ❤️ • {post.comments} 💬 • {post.shares} 🔁
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <div className="font-semibold text-gray-900">{post.clicks} clicks</div>
                          <div className="text-[11px] text-emerald-600 font-semibold">+{post.conversions} deals</div>
                        </td>

                        <td className="py-3.5 px-4 min-w-[200px]">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-bold text-gray-900 text-sm">{post.overallScore}/100</span>
                            <span className="text-[11px] text-gray-400 font-mono">
                              R:{post.reachScore} E:{post.engagementScore} C:{post.clickScore} CV:{post.conversionScore}
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                post.overallScore >= 85
                                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                                  : post.overallScore >= 60
                                  ? 'bg-gradient-to-r from-blue-600 to-emerald-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${post.overallScore}%` }}
                            />
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">{getTierBadge(post.tier)}</td>

                        <td className="py-3.5 px-4 text-right">
                          {post.tier === 'VIRAL' ? (
                            <button
                              onClick={() => {
                                toast.success(`Đã đánh dấu đưa bài "${post.title.slice(0, 20)}..." vào chuỗi Evergreen (F083)!`);
                              }}
                              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition flex items-center gap-1 ml-auto"
                            >
                              <Repeat className="w-3.5 h-3.5 text-amber-600" />
                              Bật Evergreen
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Đã đồng bộ</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: [F104 & F105] ROI CHIẾN DỊCH & PHỄU CHUYỂN ĐỔI */}
      {/* ========================================================================= */}
      {activeTab === 'roi_funnel' && (
        <div className="space-y-6">
          {/* Financial Cards (F104) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-[26px] font-bold text-emerald-600 tracking-tight">{formatCurrency(roiOverview.totalRevenue)}</p>
              <p className="text-[13px] text-gray-500 mt-0.5 font-medium">Tổng Doanh Thu CRM</p>
              <p className="text-[11px] text-gray-400 mt-1">{roiOverview.totalWonDeals} đơn hàng chốt thành công</p>
            </div>

            <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-5">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                <Target className="w-5 h-5 text-gray-600" />
              </div>
              <p className="text-[26px] font-bold text-gray-800 tracking-tight">{formatCurrency(roiOverview.totalSpent)}</p>
              <p className="text-[13px] text-gray-500 mt-0.5 font-medium">Tổng Chi Phí Đã Chi</p>
              <p className="text-[11px] text-gray-400 mt-1">Ngân sách tiếp thị & quảng cáo</p>
            </div>

            <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
                <Award className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-[26px] font-bold text-gray-900 tracking-tight">{formatCurrency(roiOverview.totalProfit)}</p>
              <p className="text-[13px] text-gray-500 mt-0.5 font-medium">Lợi Nhuận Ròng</p>
              <p className="text-[11px] text-gray-400 mt-1">Doanh thu trừ Chi phí thực tế</p>
            </div>

            <div className="bg-white rounded-2xl shadow-xs border border-blue-200/80 bg-blue-50/40 p-5">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
                <Zap className="w-5 h-5 text-blue-700" />
              </div>
              <p className="text-[26px] font-extrabold text-blue-700 tracking-tight">+{roiOverview.overallRoi}%</p>
              <p className="text-[13px] text-blue-900/80 mt-0.5 font-medium">ROI Trung Bình Toàn Bộ</p>
              <p className="text-[11px] text-blue-700/80 mt-1 font-mono">
                CPL: {formatCurrency(roiOverview.avgCpl)} • CPA: {formatCurrency(roiOverview.avgCpa)}
              </p>
            </div>
          </div>

          {/* Funnel Section (F105) */}
          <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[16px] font-semibold text-gray-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-600" />
                  [F105] Phễu Chuyển Đổi Khách Hàng (Lead Conversion Funnel)
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Theo dõi hành trình từ Tương tác ban đầu $\rightarrow$ Lead CRM $\rightarrow$ Deal $\rightarrow$ Chốt đơn
                </p>
              </div>

              {funnel && (
                <div className="text-right">
                  <span className="text-xs text-gray-500">Tỷ lệ chuyển đổi tổng thể: </span>
                  <span className="text-sm font-bold text-emerald-600">{funnel.overallConversionRate}%</span>
                </div>
              )}
            </div>

            {funnel && (
              <div className="space-y-4 pt-2">
                {funnel.stages.map((stage) => (
                  <div key={stage.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-800">{stage.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-gray-900 font-bold text-sm">{stage.count.toLocaleString()}</span>
                        <span className="text-gray-400">({stage.percentageFromTop}% từ đỉnh)</span>
                        {stage.dropOffRate > 0 && (
                          <span className="text-rose-600 text-[11px] font-semibold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            - {stage.dropOffRate}% rớt
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="w-full bg-gray-100 rounded-lg h-3 overflow-hidden">
                      <div
                        className="h-full rounded-lg bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 transition-all duration-700"
                        style={{ width: `${Math.max(5, stage.percentageFromTop)}%` }}
                      />
                    </div>
                  </div>
                ))}

                {/* Bottleneck Alert Box */}
                {funnel.bottlenecks.length > 0 && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200/80 rounded-xl space-y-1">
                    <div className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Điểm nghẽn phễu chuyển đổi cần khắc phục:
                    </div>
                    {funnel.bottlenecks.map((bn, i) => (
                      <p key={i} className="text-xs text-amber-900/90 pl-5">
                        • {bn}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Campaigns ROI Table (F104) */}
          <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 overflow-hidden space-y-3 p-5">
            <h3 className="text-[16px] font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Chi Tiết Tỷ Suất Sinh Lời Theo Từng Chiến Dịch (Campaigns)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-gray-50/80 text-xs uppercase text-gray-500 border-b border-gray-200 font-semibold">
                  <tr>
                    <th className="py-3 px-3">Chiến Dịch</th>
                    <th className="py-3 px-3">Chi phí (Spent)</th>
                    <th className="py-3 px-3">Doanh thu (Won)</th>
                    <th className="py-3 px-3">Lợi nhuận ròng</th>
                    <th className="py-3 px-3 text-center">ROI %</th>
                    <th className="py-3 px-3 text-center">CPL (Giá/Lead)</th>
                    <th className="py-3 px-3 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {campaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/70 transition">
                      <td className="py-3.5 px-3 font-semibold text-gray-900 max-w-xs truncate">{c.name}</td>
                      <td className="py-3.5 px-3 text-gray-600">{formatCurrency(c.spent)}</td>
                      <td className="py-3.5 px-3 font-semibold text-emerald-600">{formatCurrency(c.revenue)}</td>
                      <td className="py-3.5 px-3 font-medium text-gray-800">{formatCurrency(c.netProfit)}</td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-xs ${
                            c.roi > 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {c.roi > 0 ? `+${c.roi}%` : `${c.roi}%`}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono text-xs text-gray-600">{formatCurrency(c.cpl)}</td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: [F106 & F107] AI INSIGHTS & BENCHMARK NỘI BỘ */}
      {/* ========================================================================= */}
      {activeTab === 'ai_benchmark' && (
        <div className="space-y-6">
          {/* AI Strategic Consultation Box (F106) */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-white border border-blue-200/80 shadow-xs space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-[17px] font-semibold text-gray-900 flex items-center gap-2">
                    [F106] Trợ Lý AI Phân Tích & Khuyến Nghị Tăng Trưởng
                    {aiInsights?.isAiGenerated ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                        Topify AI Engine
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 font-mono">
                        Heuristic Analysis
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Tự động giải thích nguyên nhân tăng giảm số liệu và đưa ra hành động tiếp theo
                  </p>
                </div>
              </div>

              <button
                onClick={handleGenerateAiInsights}
                disabled={generatingAi}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 shadow-xs self-start md:self-auto"
              >
                <Sparkles className={`w-3.5 h-3.5 ${generatingAi ? 'animate-spin' : ''}`} />
                {generatingAi ? 'Đang phân tích...' : 'Phân tích lại với AI'}
              </button>
            </div>

            {aiInsights && (
              <div className="space-y-4 pt-2">
                {/* Executive Summary */}
                <div className="p-4 rounded-xl bg-white border border-blue-100 shadow-xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block mb-1">
                    📋 Tóm Tắt Tình Hình Kinh Doanh (Executive Summary)
                  </span>
                  <p className="text-sm text-gray-700 leading-relaxed">{aiInsights.summary}</p>
                </div>

                {/* Key Drivers */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
                    🔍 Các Yếu Tố Tác Động Chính (Key Drivers)
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {aiInsights.keyDrivers.map((driver, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-white border border-gray-200/80 shadow-xs space-y-1">
                        <div className="flex items-center gap-1.5">
                          {driver.impact === 'POSITIVE' ? (
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          ) : driver.impact === 'NEGATIVE' ? (
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-gray-400" />
                          )}
                          <span className="text-xs font-semibold text-gray-900">{driver.factor}</span>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">{driver.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
                    🎯 Đề Xuất Hành Động Trọng Tâm (Actionable Recommendations)
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {aiInsights.recommendations.map((rec) => (
                      <div
                        key={rec.id}
                        className="p-4 rounded-xl bg-white border border-gray-200/80 hover:border-blue-200 shadow-xs space-y-2 flex flex-col justify-between"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-900 line-clamp-1">{rec.title}</span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                rec.priority === 'HIGH'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              Ưu tiên {rec.priority}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">{rec.action}</p>
                        </div>

                        <div className="text-[11px] text-emerald-700 font-medium bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                          ✨ <b>Kỳ vọng:</b> {rec.expectedOutcome}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Internal Benchmark Comparison (F107) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Platform Comparison */}
            <div className="p-6 rounded-2xl bg-white border border-gray-200/80 shadow-xs space-y-3">
              <h3 className="text-[16px] font-semibold text-gray-900 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                [F107] So Sánh Benchmark Giữa Các Kênh
              </h3>
              <p className="text-xs text-gray-500">Đo lường độ phủ và tỷ lệ tương tác trung bình từng nền tảng</p>

              <div className="space-y-3 pt-2">
                {channels.map((ch) => (
                  <div key={ch.platform} className="p-3.5 bg-gray-50/80 border border-gray-200/60 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-gray-900 text-sm">{ch.displayName}</div>
                      <div className="text-xs font-bold text-blue-600">
                        {ch.avgPerformanceScore}/100đ hiệu quả
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 font-mono">
                      <div>Reach: {ch.totalReach.toLocaleString()}</div>
                      <div>Tương tác: {ch.avgEngagementRate}%</div>
                      <div className="text-emerald-600 font-semibold text-right">+{ch.dealsGenerated} Deals</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Content Pillar Comparison */}
            <div className="p-6 rounded-2xl bg-white border border-gray-200/80 shadow-xs space-y-3">
              <h3 className="text-[16px] font-semibold text-gray-900 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-blue-600" />
                Hiệu Suất Theo Định Hướng Nội Dung (Pillars)
              </h3>
              <p className="text-xs text-gray-500">Xác định nhóm chủ đề nào mang lại nhiều Lead nhất</p>

              <div className="space-y-3 pt-2">
                {pillars.map((pil, idx) => (
                  <div key={idx} className="p-3.5 bg-gray-50/80 border border-gray-200/60 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-gray-900 text-sm truncate max-w-[240px]">{pil.pillar}</div>
                      <div className="text-xs font-bold text-emerald-600">+{pil.leadsGenerated} Leads</div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Đã xuất bản: {pil.totalPosts} bài viết</span>
                      <span className="font-mono text-blue-600 font-semibold">Điểm TB: {pil.avgScore}/100</span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-600"
                        style={{ width: `${pil.avgScore}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
