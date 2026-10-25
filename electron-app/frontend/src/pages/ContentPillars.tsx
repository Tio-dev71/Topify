import { ContentPillarsTab } from '../components/content-studio/ContentPillarsTab';

export default function ContentPillars() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Chủ đề nội dung (Content Pillars - F073)</h1>
        <p className="text-sm text-gray-500 mt-1">
          Quản lý các nhóm trụ cột nội dung chiến lược và lập kế hoạch phát hành nội dung theo tuần, tháng và quý (F074).
        </p>
      </div>

      <ContentPillarsTab />
    </div>
  );
}
