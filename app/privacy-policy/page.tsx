import React from 'react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 p-8 sm:p-12">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-8">
          Chính sách Quyền riêng tư (Privacy Policy)
        </h1>
        
        <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-neutral-300 space-y-6">
          <p>Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}</p>
          
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">1. Thu thập thông tin</h2>
            <p>
              Topify thu thập thông tin cơ bản từ tài khoản Facebook/Instagram/YouTube của bạn (bao gồm Tên, Email, ID Tài khoản, Ảnh đại diện) 
              thông qua cơ chế ủy quyền OAuth chính thức của các nền tảng nhằm mục đích định danh và cung cấp dịch vụ đăng video tự động.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">2. Sử dụng thông tin</h2>
            <p>
              Thông tin và Token truy cập của bạn chỉ được sử dụng duy nhất cho mục đích:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Đăng tải video (Reels/Shorts) lên các trang/kênh mà bạn đã cấp quyền.</li>
              <li>Hiển thị danh sách Fanpage/Kênh để bạn lựa chọn trong ứng dụng.</li>
            </ul>
            <p className="mt-2">Chúng tôi KHÔNG sử dụng thông tin của bạn cho bất kỳ mục đích quảng cáo nào khác, và KHÔNG bán hoặc chia sẻ dữ liệu với bên thứ ba.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">3. Bảo mật dữ liệu</h2>
            <p>
              Mã truy cập (Access Tokens) của bạn được mã hóa an toàn (AES-256) trước khi lưu trữ vào cơ sở dữ liệu. 
              Chỉ hệ thống của Topify mới có thể giải mã để thực hiện tác vụ tự động đăng bài.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">4. Quyền của người dùng</h2>
            <p>
              Bạn có quyền ngắt kết nối và thu hồi quyền truy cập của Topify bất cứ lúc nào thông qua phần "Cài đặt" trên ứng dụng của chúng tôi, 
              hoặc thông qua phần "Tiện ích tích hợp cho doanh nghiệp" trên Facebook cá nhân của bạn.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">5. Liên hệ</h2>
            <p>
              Nếu bạn có bất kỳ câu hỏi nào về Chính sách bảo mật này, vui lòng liên hệ với chúng tôi qua email hỗ trợ trên trang chủ.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
