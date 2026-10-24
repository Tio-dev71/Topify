import React from 'react';

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 p-8 sm:p-12">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-8">
          Hướng dẫn Xóa dữ liệu (Data Deletion Instructions)
        </h1>
        
        <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-neutral-300 space-y-6">
          <p>
            Topify là một ứng dụng đăng nhập thông qua tài khoản mạng xã hội (Facebook/Google). 
            Theo các quy định về quyền riêng tư dữ liệu, bạn có quyền yêu cầu xóa hoàn toàn dữ liệu của mình khỏi hệ thống của chúng tôi.
          </p>
          
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Cách 1: Xóa dữ liệu trực tiếp trong ứng dụng</h2>
            <ol className="list-decimal pl-5 mt-2 space-y-2">
              <li>Đăng nhập vào tài khoản Topify của bạn.</li>
              <li>Truy cập vào mục <strong>Cài đặt (Settings)</strong> ở menu bên trái.</li>
              <li>Tìm đến các tài khoản mạng xã hội đã kết nối (Meta / YouTube).</li>
              <li>Bấm vào biểu tượng phích cắm màu đỏ (Disconnect) để ngắt kết nối.</li>
              <li>Hệ thống của chúng tôi sẽ tự động xóa toàn bộ Access Tokens và ID liên quan đến tài khoản mạng xã hội đó khỏi cơ sở dữ liệu.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Cách 2: Gỡ ứng dụng thông qua Facebook (Meta)</h2>
            <p className="mb-2">Nếu bạn không muốn truy cập vào Topify nữa, bạn có thể xóa dữ liệu ủy quyền trực tiếp từ Facebook:</p>
            <ol className="list-decimal pl-5 mt-2 space-y-2">
              <li>Truy cập Facebook cá nhân của bạn và vào mục <strong>Cài đặt & quyền riêng tư</strong> {'>'} <strong>Cài đặt</strong>.</li>
              <li>Ở menu bên trái, cuộn xuống và chọn <strong>Tiện ích tích hợp cho doanh nghiệp (Business Integrations)</strong>.</li>
              <li>Tìm ứng dụng <strong>Topify</strong> trong danh sách.</li>
              <li>Bấm vào nút <strong>Gỡ / Xóa (Remove)</strong>.</li>
              <li>Tùy chọn: Bạn có thể click vào ô kiểm yêu cầu xóa toàn bộ bài đăng mà ứng dụng đã đăng thay bạn.</li>
              <li>Bấm xác nhận. Việc này sẽ thu hồi toàn bộ quyền của Topify và chúng tôi sẽ không thể truy cập bất kỳ dữ liệu nào của bạn nữa.</li>
            </ol>
          </section>

          <section className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">Yêu cầu hỗ trợ xóa tài khoản thủ công</h2>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Nếu bạn muốn xóa vĩnh viễn toàn bộ tài khoản người dùng, lịch sử bài đăng và video đã tải lên khỏi máy chủ của chúng tôi, 
              vui lòng gửi email đến bộ phận hỗ trợ với tiêu đề "Yêu cầu xóa dữ liệu". Chúng tôi sẽ xử lý yêu cầu của bạn trong vòng 48 giờ làm việc.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
