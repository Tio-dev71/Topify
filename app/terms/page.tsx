import React from 'react';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 p-8 sm:p-12">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-8">
          Điều khoản Dịch vụ (Terms of Service)
        </h1>
        
        <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-neutral-300 space-y-6">
          <p>Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}</p>
          
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">1. Chấp nhận điều khoản</h2>
            <p>
              Bằng việc truy cập và sử dụng ứng dụng Topify, bạn đồng ý tuân thủ và bị ràng buộc bởi các Điều khoản Dịch vụ này. 
              Nếu bạn không đồng ý với bất kỳ phần nào của điều khoản, vui lòng không sử dụng dịch vụ của chúng tôi.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">2. Mô tả dịch vụ</h2>
            <p>
              Topify là một công cụ phần mềm cho phép người dùng tải lên, lên lịch và tự động đăng tải các video ngắn (Reels/Shorts) 
              lên các nền tảng mạng xã hội bao gồm Facebook, Instagram và YouTube thông qua các API chính thức do các nền tảng này cung cấp.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">3. Trách nhiệm của người dùng</h2>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Bạn chịu hoàn toàn trách nhiệm về bản quyền và nội dung của các video được đăng tải thông qua hệ thống Topify.</li>
              <li>Bạn cam kết không sử dụng ứng dụng để đăng tải các nội dung vi phạm pháp luật, nội dung đồi trụy, thù địch hoặc vi phạm Tiêu chuẩn cộng đồng của Facebook/YouTube.</li>
              <li>Chúng tôi không chịu trách nhiệm nếu tài khoản mạng xã hội của bạn bị khóa hoặc hạn chế do vi phạm chính sách của các nền tảng đó.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">4. Giới hạn trách nhiệm</h2>
            <p>
              Dịch vụ được cung cấp "nguyên trạng". Chúng tôi không đảm bảo rằng dịch vụ sẽ không bị gián đoạn hoặc không có lỗi. 
              Chúng tôi không chịu trách nhiệm cho bất kỳ tổn thất dữ liệu hoặc thiệt hại kinh doanh nào phát sinh từ việc sử dụng dịch vụ.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">5. Chấm dứt dịch vụ</h2>
            <p>
              Chúng tôi có quyền tạm ngưng hoặc chấm dứt quyền truy cập của bạn vào dịch vụ bất cứ lúc nào, 
              không cần thông báo trước, nếu phát hiện bạn có hành vi vi phạm nghiêm trọng các Điều khoản này.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
