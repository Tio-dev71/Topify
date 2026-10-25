import { ContentTemplatesTab } from '../components/content-studio/ContentTemplatesTab';

export default function ContentTemplates() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Mẫu bài viết & Công thức Content (F076)</h1>
        <p className="text-sm text-gray-500 mt-1">
          Quản lý thư viện mẫu bài viết theo công thức kinh điển (AIDA, PAS, Storytelling) và tùy chỉnh mẫu riêng cho thương hiệu của bạn.
        </p>
      </div>

      <ContentTemplatesTab />
    </div>
  );
}
