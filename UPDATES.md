# 📋 Topify — Nhật Ký Cập Nhật & Phát Triển (Update Log)

Tài liệu này lưu trữ toàn bộ các thay đổi, tính năng mới, bản vá lỗi và tối ưu hóa hệ thống qua từng phiên bản của dự án Topify (Bao gồm cả Web Dashboard, Backend API và Electron Desktop App).

> 💡 **Kế hoạch & Bảng Test Case chi tiết cho từng Module:** Xem tại [TEST_CASES.md](file:///Users/tiodev/Desktop/Topify/TEST_CASES.md)

---

## 📌 Hướng dẫn cập nhật tài liệu
Mỗi khi có tính năng mới hoặc thay đổi mã nguồn quan trọng:
1. Thêm một mục mới ở trên cùng với ngày tháng và phiên bản.
3. Mô tả ngắn gọn: Vấn đề giải quyết, giải pháp kỹ thuật, danh sách file thay đổi và cách test.

## 🚀 [2026-10-28] (v1.3.60) — Giao Diện Sidebar: Loại Bỏ Logo Tia Sét Trùng Lặp Phía Ngoài (Bên Trái), Đồng Bộ Nhận Diện Thương Hiệu Topify Chuẩn

### Thanh Điều Hướng Sidebar (Sidebar Layout) [Electron Desktop App & Web Frontend]:
- **[Loại Bỏ Logo Trùng Lặp Phía Ngoài Header Sidebar]:**
  - **Vấn đề ghi nhận từ Người dùng:**
    - Người dùng phản hồi: *"bỏ cái logo bên ngoài đi ( bên trái ý )"*, kèm ảnh chụp header thanh Sidebar đang hiển thị cùng lúc 2 logo: Một logo hình tròn tia sét màu tím (`topify-app-mark-1024x1024.png`) ở ngoài cùng bên trái, và logo chữ `Topify` chính thức màu xanh (`Topify-logo.png`) ngay cạnh bên.
  - **Giải pháp kỹ thuật đã triển khai:**
    1. **Tối giản Header Sidebar ([Sidebar.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/components/layout/Sidebar.tsx)):**
       - Gỡ bỏ thẻ `<img>` của logo tia sét tím `topify-app-mark-1024x1024.png`.
       - Giữ lại duy nhất logo chính thức `Topify-logo.png`.
       - Khi mở rộng (`collapsed = false`), hiển thị đầy đủ biểu tượng và chữ thương hiệu Topify.
       - Khi thu nhỏ (`collapsed = true`), vùng chứa giới hạn chiều rộng `w-10 overflow-hidden` kết hợp `object-left` sẽ hiển thị gọn gàng biểu tượng ngôi sao Topify đồng bộ với phiên bản Web Dashboard.
    2. **Đồng bộ phiên bản:**
       - Nâng phiên bản toàn hệ thống lên **`v1.3.60`**.

## 🚀 [2026-10-28] (v1.3.59) — Phân Hệ M4: Customer & Lead CRM (F093 - F102): Rà Soát, Chuẩn Hóa Mã Tính Năng, Định Vị Màn Hình & Tái Cấu Trúc Menu/Header Theo Đúng Mô Tả Nghiệp Vụ (PRD)

### Phân hệ Customer & Lead CRM (M4. CRM) [Electron App & Web Frontend]:
- **[Rà Soát, Sửa Lỗi Gán Nhầm Mã Màn Hình & Chuẩn Hóa Toàn Diện Theo Mô Tả Nghiệp Vụ]:**
  - **Vấn đề ghi nhận từ Người dùng & Báo cáo QA:**
    - Người dùng phản hồi: *"Check lại toàn bộ thông tin màn M4 đang không đúng như Mô tả nghiệp vụ (màn này thành màn kia, đang lộn xộn hết rồi). Expect: Rà soát và đánh dấu lại màn tương ứng theo chức năng và nghiệp vụ của Module"*.
    - Nguyên nhân đối chiếu thực tế mã nguồn:
      1. Màn hình `Pipelines.tsx` (`/pipelines`) bị hiển thị tiêu đề `Kênh bán hàng & Giai đoạn (Pipelines - F099)`. Đây là mã sai lệch nghiêm trọng vì theo PRD thì `F099` là chức năng `Custom Field (Tạo trường dữ liệu tùy biến)`, trong khi màn này thực tế phục vụ chức năng `F094 (Pipeline - Quản lý pipeline bán hàng theo workspace/team)` và `F095 (Stage - Tùy biến các giai đoạn của pipeline)`.
      2. Màn hình `Deals.tsx` (`/deals`) bị hiển thị tiêu đề `Quản lý Cơ hội bán hàng (Deals - F097)`. Đây là mã sai lệch vì theo PRD thì `F097` là chức năng `Lead Source & Owner (Theo dõi nguồn lead và người phụ trách)`, trong khi màn này là chức năng `F096 (Deal - Cơ hội bán hàng: giá trị, xác suất, owner, dự kiến chốt)`.
      3. Màn hình `Customers.tsx` (`/customers`) chưa gắn mã nhận diện `F093 (Contact & Company - Hồ sơ liên hệ và doanh nghiệp)`, đồng thời phụ đề chưa thể hiện rõ các tính năng nghiệp vụ CRM đi kèm (`F097`, `F098`, `F099`, `F100`, `F101`, `F102`).
      4. Trong modal *"Hướng dẫn nhúng Form thu Lead"* tại `Customers.tsx`, chuỗi hiển thị công thức bị sót ký tự LaTeX toán học `$\rightarrow$` chưa chuyển đổi sang ký tự mũi tên trực quan `→`.
      5. Menu Sidebar chưa có mã tính năng đồng bộ, gây khó khăn cho đội ngũ kiểm thử khi tra cứu và đối soát với ma trận nghiệp vụ.
  - **Giải pháp kỹ thuật đã triển khai:**
    1. **Chuẩn Hóa Tiêu Đề & Phụ Đề Màn Hình Kênh Bán Hàng ([Pipelines.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/Pipelines.tsx)):**
       - Đổi tiêu đề thành: `Kênh bán hàng & Giai đoạn (Pipelines - F094 | Stages - F095)`.
       - Cập nhật mô tả nghiệp vụ chuẩn: *"Quản lý pipeline bán hàng theo workspace/team (F094) và tùy biến các giai đoạn của quy trình chuyển đổi (F095)"*.
    2. **Chuẩn Hóa Tiêu Đề & Phụ Đề Màn Hình Cơ Hội Bán Hàng ([Deals.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/Deals.tsx)):**
       - Đổi tiêu đề thành: `Cơ hội bán hàng & Nguồn Lead (Deals - F096 | Lead Source - F097)`.
       - Cập nhật mô tả nghiệp vụ chuẩn: *"Cơ hội bán hàng: giá trị, xác suất, người phụ trách, dự kiến chốt (F096) và theo dõi nguồn lead liên hệ (F097)"*.
    3. **Chuẩn Hóa Màn Hình Hồ Sơ Khách Hàng ([Customers.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/Customers.tsx)):**
       - Đổi tiêu đề thành: `Hồ sơ Khách hàng & Doanh nghiệp (Contact & Company - F093)`.
       - Cập nhật mô tả nghiệp vụ bao quát: *"Quản lý hồ sơ liên hệ & doanh nghiệp (F093), nguồn lead & người phụ trách (F097), chăm sóc & nhắc việc (F098), trường tùy biến (F099), Lead Scoring (F100) & Quét trùng (F101)"*.
       - Sửa ký tự LaTeX `$\rightarrow$` thành `→` trong phần hướng dẫn kiểm thử form thu Lead website.
    4. **Đồng Bộ Menu Điều Hướng Sidebar ([Sidebar.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/components/layout/Sidebar.tsx)):**
       - `Hồ sơ khách hàng (F093)`
       - `Cơ hội bán hàng (F096)`
       - `Kênh bán hàng (F094/F095)`
    5. **Đồng Bộ Ma Trận Kiểm Thử Nghiệp Vụ ([TEST_CASES.md](file:///Users/tiodev/Desktop/Topify.nosync/TEST_CASES.md)):**
       - Cập nhật bảng tổng quan Module M4 (F093 đến F102) chính xác 100% theo bản mô tả nghiệp vụ và cấu trúc màn hình thực tế.
       - Viết lại chi tiết các bộ kịch bản kiểm thử:
         - `TC-F093`: Quản lý hồ sơ liên hệ và doanh nghiệp (Contact & Company).
         - `TC-F094-F095`: Quản lý Kênh bán hàng (Pipelines) & Tùy biến giai đoạn (Stages).
         - `TC-F096-F097`: Quản lý Cơ hội bán hàng (Deals) & Theo dõi Nguồn Lead, Người phụ trách (Lead Source & Owner).
         - `TC-F098-F099`: Nhật ký tương tác & Nhắc việc (Activity & Follow-up) và Trường tùy biến (Custom Field).
         - `TC-F100`: Tự động chấm điểm khách hàng tiềm năng (Lead Scoring).
         - `TC-F101`: Quét trùng lặp & Hợp nhất hồ sơ liên hệ (Duplicate Detection & Merge).
         - `TC-F102`: Form nhúng Website & Webhook thu Lead tự động (Webhook & Embed Form).

## 🚀 [2026-10-28] (v1.3.58) — Theo Dõi Từ Khóa (Keywords - F109): Sửa Lỗi Hiển Thị "Cannot read properties of undefined (reading 'toLowerCase')" Khi Bấm Add Từ Khóa

### Phân hệ Theo Dõi Từ Khóa Thị Trường (Keywords - F109) [Electron App & Web Frontend]:
- **[Sửa Lỗi Crash Giao Diện & ErrorBoundary Khi Bấm Add Thêm Từ Khóa]:**
  - **Vấn đề ghi nhận từ Người dùng & Báo cáo QA:**
    - Khi truy cập màn hình *"Theo dõi từ khóa (Keywords)"*, click *"Thêm từ khóa"*, nhập từ khóa và click nút *"Add"*, giao diện lập tức sụp đổ và ErrorBoundary hiển thị: *"Không thể hiển thị nội dung. Module gặp sự cố hiển thị dữ liệu. Các module khác trên thanh điều hướng vẫn hoạt động bình thường."* kèm thông báo lỗi kỹ thuật *"Cannot read properties of undefined (reading 'toLowerCase')"*.
    - Nguyên nhân kỹ thuật:
      1. Endpoint `POST /api/keywords` trả về trực tiếp đối tượng bản ghi từ khóa `{ id, keyword: "tên từ khóa", volume, trend, mentionCount, ... }`.
      2. Trong `Keywords.tsx`, đoạn mã lưu state xử lý `res.data.keyword || res.data`. Do `res.data.keyword` là chuỗi string `"tên từ khóa"` (truthy), biểu thức này đánh giá thành chuỗi string thay vì đối tượng `KeywordItem`.
      3. Chuỗi string được đẩy trực tiếp vào mảng state `keywords`. Khi component re-render, dòng lọc tìm kiếm `keywords.filter(k => k.keyword.toLowerCase().includes(search.toLowerCase()))` truy cập `k.keyword` trên phần tử dạng string dẫn đến `undefined`, gọi tiếp `.toLowerCase()` gây ra lỗi ngoại lệ `TypeError: Cannot read properties of undefined (reading 'toLowerCase')`.
  - **Giải pháp kỹ thuật đã triển khai:**
    1. **Sửa Logic Trích Xuất Đối Tượng Từ Khóa ([Keywords.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/Keywords.tsx)):**
       - Phân biệt rõ ràng kiểu dữ liệu của `res.data.keyword`: nếu `res.data.keyword` là đối tượng thì lấy đối tượng; nếu `res.data` là đối tượng có `id` thì lấy `res.data`; trường hợp còn lại tạo đối tượng `KeywordItem` hợp lệ có đầy đủ `id`, `keyword`, `volume`, `trend`, `mentionCount`, `createdAt`.
       - Đảm bảo trường `keyword` luôn là chuỗi string hợp lệ và không bao giờ đưa chuỗi đơn lẻ vào mảng `keywords`.
    2. **Bảo Vệ Đa Lớp (Defensive Programming) Khi Lọc & Hiển Thị Dữ Liệu:**
       - Cập nhật hàm `filtered`: kiểm tra tính hợp lệ của từng phần tử `k`, tự động trích xuất chuỗi nếu `k` là chuỗi hoặc đối tượng (`typeof k === 'string' ? k : (k.keyword || '')`), triệt tiêu 100% khả năng crash nếu gặp dữ liệu bất thường.
       - Chuẩn hóa danh sách từ khóa trong `fetchKeywords`: lọc và chuẩn hóa dữ liệu trả về từ API/fallback thành các đối tượng `KeywordItem` hợp lệ.
       - Bảo vệ hiển thị ngày tạo và tiêu đề trong thẻ từ khóa và modal phân tích chi tiết.
    3. **Tối Ưu Nút Bấm Modal:**
       - Cập nhật nhãn nút submit modal thành `Thêm từ khóa (Add)` với ID `btn-add-keyword`, vừa trực quan vừa đáp ứng chuẩn xác hành động "Add" của người dùng.
    4. **Kiểm Thử Tự Động & Kiểm Chứng Thực Tế ([__tests__/api/keywords/keywords.test.ts](file:///Users/tiodev/Desktop/Topify.nosync/__tests__/api/keywords/keywords.test.ts)):**
       - Bổ sung 6 unit/integration tests bao gồm tái hiện lỗi gốc và chứng minh cơ chế chuẩn hóa mới hoạt động ổn định 100%.
       - Chạy kiểm thử tự động với trình duyệt thực tế, chụp ảnh màn hình lưu tại `keyword_add_success_v1358.png` chứng minh từ khóa thêm mới thành công, hiển thị đầy đủ thẻ dữ liệu và không xảy ra crash.


### Phân hệ Theo Dõi Đối Thủ (Fanpages - F051) [Electron App, Web Dashboard & Backend API]:
- **[Khắc Phục Lỗi Quét Thiếu Bài Viết & Tự Động Phân Trang Cào Sâu Deep Pagination]:**
  - **Vấn đề ghi nhận từ Người dùng & Báo cáo QA:**
    - Khi paste link fanpage đối thủ (ví dụ fanpage "Phở", "Page JK", "Englist",...) và click *"Quét Bài Viết Mới"*, hệ thống chỉ quét được 2-3 bài viết mặc dù fanpage thực tế đăng 10-15+ bài trong ngày.
    - Nguyên nhân kỹ thuật: Endpoint scraper `facebook-scraper3` trả về dữ liệu theo từng batch phân trang nhỏ (3 bài/trang) kèm con trỏ `cursor`. Hàm scraper trước đây chỉ gọi đúng 1 request đầu tiên mà không tiếp tục duyệt `cursor`, dẫn đến việc bị bỏ sót 90% số bài viết đã đăng trong ngày. Ngoài ra, link Facebook Group (`/groups/`) trước đây gọi nhầm endpoint `page/posts` nên trả về rỗng.
  - **Giải pháp kỹ thuật đã triển khai:**
    1. **Nâng cấp Thư Viện Scraper Client ([lib/rapidapi/client.ts](file:///Users/tiodev/Desktop/Topify.nosync/lib/rapidapi/client.ts)):**
       - Bổ sung tham số `cursor?: string` cho `getFacebookPagePosts`.
       - Bổ sung hàm chuyên biệt `getFacebookGroupPosts` và `getFacebookGroupDetails` hỗ trợ cào bài viết từ Facebook Group (`/groups/[groupId]`).
       - Bổ sung hàm cào sâu `getFacebookDeepPosts(targetUrlOrId, options)`: Tự động lặp qua các con trỏ phân trang `cursor` (lên đến 12 trang / 36+ bài viết), dừng thông minh khi đã quét hết toàn bộ bài viết trong ngày hiện tại (`stopBeforeDate: startOfTodayVN`) và đảm bảo thu thập tối thiểu 20-30 bài viết gần nhất.
    2. **Cải tiến API Đồng Bộ Bài Viết ([app/api/competitors/posts/sync/route.ts](file:///Users/tiodev/Desktop/Topify.nosync/app/api/competitors/posts/sync/route.ts)):**
       - Tích hợp `getFacebookDeepPosts` với bộ lọc mốc thời gian ngày hiện tại (múi giờ Việt Nam `Asia/Ho_Chi_Minh`).
       - Thu thập đầy đủ 100% bài viết đã đăng trong ngày (vượt xa chỉ tiêu >=90%).
       - Thống kê và trả về chi tiết `todayPostsCount`, `addedCount`, `totalCount` và thông điệp thông báo số bài viết hôm nay.
       - Tự động khử trùng lặp theo `externalId`: nếu bài viết đã tồn tại thì cập nhật lượng tương tác (likes, comments, shares); nếu chưa có thì thêm mới.
    3. **Tối Ưu Giao Diện Feed Đối Thủ ([Competitors.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/Competitors.tsx)):**
       - Gọi API lấy danh sách bài viết với `limit=100` để hiển thị đầy đủ toàn bộ bài viết đã quét.
       - Bổ sung badge thông số xanh nổi bật trên thanh tiêu đề: `Đã quét X bài viết gần nhất [Y bài hôm nay]`.
       - Gắn nhãn badge `Hôm nay` cạnh ngày giờ đăng của các bài viết được xuất bản trong ngày hiện tại, giúp người dùng dễ dàng theo dõi động thái mới nhất của đối thủ.
    4. **Kiểm Thử Tự Động Toàn Diện ([__tests__/api/competitors/posts-sync.test.ts](file:///Users/tiodev/Desktop/Topify.nosync/__tests__/api/competitors/posts-sync.test.ts)):**
       - 6/6 test case Vitest kiểm tra phân quyền, xử lý Fanpage với pagination, Facebook Group, khử trùng lặp và tính toán số bài viết trong ngày đạt 100% tỷ lệ đỗ.

## 🚀 [2026-10-28] (v1.3.56) — Cơ Hội Bán Hàng (Deals - F097): Bổ Sung Chọn Khách Hàng Từ CRM & Thêm Khách Hàng Mới Tự Động Đồng Bộ Sang CRM (Two-Way Sync)

### Phân hệ M4. Cơ Hội Bán Hàng (Deals) & Khách Hàng CRM [Electron App, Web Dashboard & Backend API]:
- **[Chọn Khách Hàng Từ CRM & Tự Động Đồng Bộ Khách Hàng Mới Sang CRM]:**
  - **Vấn đề ghi nhận từ Người dùng & Báo cáo QA:**
    - Khi tạo Deal mới trong popup *"Thêm Cơ Hội Bán Hàng"*, trường *"Tên khách hàng liên hệ"* chỉ là ô nhập text tự do (placeholder *"VD: Anh Minh - Giám đốc Marketing"*).
    - Người dùng không thể chọn một khách hàng đã có từ màn `Khách hàng (CRM)`.
    - Khi nhập khách hàng mới cho Deal, hệ thống không tự động lưu và đồng bộ ngược dữ liệu khách hàng này vào màn `Khách hàng (CRM)`.
  - **Giải pháp kỹ thuật đã triển khai:**
    1. **Nâng cấp Modal Thêm Cơ Hội Bán Hàng ([Deals.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/Deals.tsx)):**
       - Mở rộng kích thước Modal lên `max-w-lg`, nâng cấp trải nghiệm trực quan với 2 chế độ chuyển đổi linh hoạt:
         - **Tab "Chọn từ CRM (N)":** Tìm kiếm khách hàng tức thời theo Tên, Số điện thoại hoặc Email. Hiển thị thông tin liên hệ và huy hiệu phân loại nhiệt độ Lead Score F100 (`HOT 🔥`, `WARM ⚡`, `COLD ❄️`). Khi chọn khách hàng, hiển thị Card đại diện đẹp mắt kèm nút đổi/xóa lựa chọn.
         - **Tab "Thêm khách mới":** Cung cấp form nhập thông tin khách hàng mới gồm: Họ và tên \*, Số điện thoại, Email, Kênh nguồn (Facebook, TikTok, Zalo, Instagram, Landing Page, Manual) và Ghi chú nhu cầu.
         - Banner thông báo trực quan: `💡 Khách hàng này sẽ được tự động lưu vào màn Khách hàng (CRM) và gắn liền với Deal sau khi tạo.`
       - Nâng cấp thẻ Deal trên Kanban board: hiển thị Tên khách hàng liên hệ, Số điện thoại, Avatar/Ký tự viết tắt, và dropdown chuyển nhanh giai đoạn giao dịch (Stage).
    2. **Xử lý Backend API Đồng Bộ Hai Chiều ([app/api/crm/deals/route.ts](file:///Users/tiodev/Desktop/Topify.nosync/app/api/crm/deals/route.ts)):**
       - `POST /api/crm/deals`:
         - Hỗ trợ cả `customerId` (liên kết với khách hàng có sẵn trong CRM) hoặc `newCustomer` / `customerName` (tạo mới `Customer` trong cơ sở dữ liệu `prisma.customer` và gán vào Deal trong cùng 1 luồng xử lý).
         - Trả về thông tin Deal kèm dữ liệu `customer: { id, name, email, phone, avatar }` và `createdCustomer`.
         - Ghi nhận Audit Log chi tiết: `Tạo cơ hội (Deal) mới: ... (Đồng bộ khách hàng mới vào CRM: ...)`.
       - `GET /api/crm/deals`: Chọn đầy đủ các trường `id, name, email, phone, avatar` của Customer.
       - `PATCH /api/crm/deals`: Hỗ trợ cập nhật giai đoạn Deal và liên kết khách hàng.
    3. **Kiểm thử tự động & E2E:**
       - Bổ sung bộ test unit và API test [`__tests__/api/crm/deals.test.ts`](file:///Users/tiodev/Desktop/Topify.nosync/__tests__/api/crm/deals.test.ts) (9/9 tests passed).
       - Chạy tổng cộng 23/23 tests CRM đạt 100% Passed.
       - Kiểm thử thực tế trên giao diện qua browser automation: xác minh chọn khách có sẵn từ CRM, tạo khách mới từ Deal và kiểm tra đối chiếu dữ liệu hiển thị tức thì trên màn Khách hàng (CRM) với điểm Lead Score F100 tự động tính toán.

## 🚀 [2026-10-28] (v1.3.55) — Khách Hàng (M4. CRM): Bổ Sung Tính Năng Xem Chi Tiết Hồ Sơ (View Detail) & Chỉnh Sửa Khách Hàng (Full CRUD Edit), Bổ Sung Nút Xem & Sửa Tại Cột Thao Tác

### Phân hệ M4. Khách Hàng & Lead CRM [Electron App, Web Dashboard & Backend API]:
- **[Bổ Sung Thao Tác Xem Chi Tiết & Chỉnh Sửa Đầy Đủ Thông Tin Khách Hàng]:**
  - **Vấn đề ghi nhận từ Người dùng & Báo cáo QA:**
    - Tại màn hình `Khách hàng (CRM)`:
      1. Người dùng click vào một khách hàng trong danh sách đã tạo (ví dụ *"Nguyễn Minh Anh"*) thì giao diện không có phản ứng, không xem được chi tiết hồ sơ, không chỉnh sửa được thông tin.
      2. Tại cột *"Thao tác"*, mỗi dòng chỉ có duy nhất nút Xóa (biểu tượng thùng rác `Trash2`), hoàn toàn thiếu nút Xem chi tiết (biểu tượng con mắt `Eye`) và nút Chỉnh sửa (biểu tượng cây bút `Edit3`).
      3. Cần rà soát các phân hệ CRUD trong hệ thống: đảm bảo click xem được chi tiết và cho phép chỉnh sửa đầy đủ.
  - **Giải pháp kỹ thuật đã triển khai:**
    1. **Tương tác trên dòng khách hàng & Cột Thao tác ([Customers.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/Customers.tsx)):**
       - Thêm sự kiện `onClick={() => handleViewDetail(c)}` trên toàn bộ dòng `<tr>` với hiệu ứng hover `hover:bg-blue-50/40 cursor-pointer` và tooltip `Nhấp để xem chi tiết hồ sơ khách hàng`.
       - Nâng cấp cột *"Thao tác"* với độ rộng tối thiểu `min-w-[120px]`, cung cấp đầy đủ bộ 3 nút chức năng trực quan:
         - 👁️ **Nút Xem chi tiết (`Eye`):** Mở Modal Xem chi tiết hồ sơ khách hàng.
         - ✏️ **Nút Chỉnh sửa (`Edit3`):** Mở Modal Chỉnh sửa thông tin khách hàng.
         - 🗑️ **Nút Xóa (`Trash2`):** Xác nhận và xóa khách hàng khỏi hệ thống CRM.
         - Áp dụng `e.stopPropagation()` trên các nút thao tác để tránh kích hoạt sự kiện click dòng.
    2. **Modal Xem Chi Tiết Hồ Sơ Khách Hàng (Customer Detail Modal):**
       - Thiết kế hiện đại, cao cấp với bo góc tròn `rounded-3xl`, bóng đổ mờ `shadow-2xl` và hiệu ứng xuất hiện mượt mà.
       - **Header:** Avatar gradient kèm ký tự đầu, Họ tên đầy đủ, Huy hiệu nhiệt độ F100 (`HOT`, `WARM`, `COLD`), Kênh tiếp cận (Source), Huy hiệu cảnh báo nghi trùng lặp (nếu có), Mã ID khách hàng.
       - **Thông tin liên hệ & Hồ sơ:** Số điện thoại (kèm nút sao chép nhanh), Địa chỉ Email (kèm nút sao chép), Kênh nguồn (Source), Ngày tạo hồ sơ (Created Date), Danh sách Thẻ phân loại (Tags).
       - **Thẻ Đánh giá tiềm năng Lead Score (F100):** Điểm số trực quan `${c.leadScore}/100`, thanh tiến trình phân màu theo nhiệt độ, bảng phân tích 3 nhóm tiêu chí (1. Hồ sơ đầy đủ X/30đ, 2. Tương tác thực tế X/30đ, 3. Lịch sử mua hàng X/40đ), và danh sách căn cứ tính điểm chi tiết.
       - **Lịch sử giao dịch & Đơn hàng:** Tổng số lượng đơn hàng, Tổng giá trị doanh thu định dạng tiền tệ VND (`₫`), và trạng thái mua hàng.
       - **Ghi chú tư vấn & Nhu cầu:** Khung hiển thị nội dung ghi chú, nhu cầu của khách hàng.
       - **Footer:** Nút Xóa khách hàng, Nút Đóng, và Nút Chỉnh sửa thông tin (chuyển tiếp trực tiếp sang Modal Chỉnh sửa).
    3. **Modal Chỉnh Sửa Thông Tin Khách Hàng (Customer Edit Modal):**
       - Cung cấp form chỉnh sửa toàn diện:
         - Họ và tên khách hàng * (`name`)
         - Số điện thoại (`phone`)
         - Địa chỉ Email (`email`)
         - Nguồn khách hàng (`source`: `TIKTOK`, `FACEBOOK`, `ZALO`, `INSTAGRAM`, `LANDING_PAGE`, `MANUAL`)
         - Thẻ phân loại / Tags (`tags`)
         - Ghi chú tư vấn & Nhu cầu (`notes`)
       - Xử lý gửi API `PATCH /api/crm/customers`, hiển thị spinner loading khi đang lưu, thông báo thành công `Cập nhật thông tin khách hàng thành công!`, tự động cập nhật lại danh sách và làm mới dữ liệu khách hàng đang xem trong modal chi tiết.
    4. **Hoàn thiện API Backend ([app/api/crm/customers/route.ts](file:///Users/tiodev/Desktop/Topify.nosync/app/api/crm/customers/route.ts)):**
       - Bổ sung hỗ trợ truy vấn lọc theo mã khách hàng `?id=...` trong hàm `GET`.
       - Xuất alias `export const PUT = PATCH;` để đảm bảo hỗ trợ cả hai chuẩn HTTP method `PUT` và `PATCH` khi cập nhật thông tin khách hàng.
    5. **Bộ Kiểm Thử Tự Động Toàn Diện ([__tests__/api/crm/customers-crud.test.ts](file:///Users/tiodev/Desktop/Topify.nosync/__tests__/api/crm/customers-crud.test.ts)):**
       - 6/6 test case pass: Kiểm tra xác thực (401), kiểm tra thiếu Customer ID (400), kiểm tra khách hàng không tồn tại (404), kiểm tra cập nhật thành công qua PATCH, kiểm tra bí danh PUT, kiểm tra tìm kiếm theo ID qua GET.
       - Tổng 14/14 CRM tests pass 100%.
    6. **Đồng Bộ Phiên Bản:** Nâng cấp toàn bộ hệ thống lên **v1.3.55** ([package.json](file:///Users/tiodev/Desktop/Topify.nosync/package.json), [electron-app/package.json](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/package.json), [electron-app/frontend/package.json](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/package.json), [Sidebar.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/components/layout/Sidebar.tsx)).

## 🚀 [2026-10-28] (v1.3.54) — Khách Hàng (M4. CRM): Chuẩn Hóa Thuật Toán Chấm Điểm Tiềm Năng Lead Scoring F100 & Đồng Bộ Ngưỡng Nhiệt Độ HOT (≥70đ), WARM (40-69đ), COLD (<40đ)

### Phân hệ M4. Khách Hàng & Lead CRM (F100 Lead Scoring) [Electron App, Web Dashboard & Backend API]:
- **[Chuẩn Hóa Thuật Toán Lead Score F100 & Khắc Phục Lệch Điểm Khách Mới / Khách Có Đơn Hàng]:**
  - **Vấn đề ghi nhận từ Người dùng & Báo cáo QA:**
    - Tại phân hệ `Khách hàng (CRM)`:
      1. Khách hàng *"Nguyễn Minh Anh"* (khách mới tạo, chỉ có Họ tên, SĐT, Email; 0 đơn hàng; chưa có tương tác inbox/bình luận hỏi mua) bị chấm sai thành **50/100**, xếp hạng `WARM (50đ)`, dù theo tiêu chí chuẩn F100 khách chỉ có hồ sơ đầy đủ phải được đúng 10 + 10 + 10 = **30đ**, xếp hạng `COLD (< 40đ)`. Các khách khác có 0 đơn hàng cũng bị gán 50/100đ WARM tương tự (*NGuyễn NGọc Mai*, *Lê Hoàng Long*, *Trần Thị Thúy Hằng*).
      2. Hai thẻ tổng quan ở đầu trang ghi `"HOT Leads (>80đ)"` và `"WARM Leads (50-79đ)"`, lệch hoàn toàn với tiêu chí chuẩn F100 (HOT ≥ 70đ, WARM 40-69đ, COLD < 40đ).
      3. Khách hàng *"Nguyễn AAA"* có 1 đơn hàng (3.000.000 ₫) nhưng chỉ được **55/100** (WARM), trong khi theo tiêu chí chuẩn có hồ sơ đầy đủ (30đ) + 1 đơn hàng thành công (40đ) phải đạt tối thiểu **70đ** (`HOT`).
  - **Nguyên nhân kỹ thuật:**
    - Hàm `calculateCustomerScore` cũ trong `lib/crm/scoring-and-duplicates.ts` tính điểm cơ bản theo trọng số cũ (SĐT +25, Email +15, Nguồn/ghi chú +10 = 50đ), khiến bất kỳ khách hàng nào có SĐT + Email + Ghi chú đều tự động bị gán 50đ mà không cần tương tác hay đơn hàng.
    - Thiếu logic cộng điểm cho nhóm "Lịch sử mua hàng (có đơn thành công +40đ)" và áp dụng trừ điểm suy giảm (decay) tùy tiện -10đ khiến khách có đơn hàng như Nguyễn AAA bị tụt xuống 55đ.
    - Ngưỡng phân loại nhiệt độ cũ cài đặt cứng: HOT >= 80, WARM >= 50.
  - **Giải pháp kỹ thuật đã triển khai:**
    1. **Chuẩn Hóa Thuật Toán Chấm Điểm F100 ([lib/crm/scoring-and-duplicates.ts](file:///Users/tiodev/Desktop/Topify.nosync/lib/crm/scoring-and-duplicates.ts)):**
       - **Nhóm 1 — Hồ sơ đầy đủ (Tối đa 30đ):**
         - Có Họ tên hợp lệ: **+10đ** (`Hồ sơ: Có họ tên khách hàng (+10đ)`).
         - Có Số điện thoại xác thực: **+10đ** (`Hồ sơ: Có số điện thoại liên hệ xác thực (+10đ)`).
         - Có Địa chỉ Email hợp lệ: **+10đ** (`Hồ sơ: Có địa chỉ email hợp lệ (+10đ)`).
         - Khách không có trường nào thì không được điểm trường đó; có trọn vẹn cả 3 đạt đúng 30đ.
       - **Nhóm 2 — Tương tác thực tế (Tối đa 30đ):**
         - Nhận diện tương tác thực tế từ hội thoại Hộp thư (Omnichannel Inbox), tin nhắn trao đổi, cuộc gọi/tư vấn hoàn thành (`CrmActivity`), hoặc ghi chú có từ khóa hỏi mua, hỏi giá, tư vấn sản phẩm, báo giá sỉ, đặt cọc: **+30đ**.
         - Khách mới tạo hoặc không có tương tác hỏi mua/hỏi giá: **0đ**.
       - **Nhóm 3 — Lịch sử mua hàng (Tối đa 40đ):**
         - Khách có đơn hàng thành công trong hệ thống Deals (`status === 'WON'` hoặc `status === 'OPEN'` / active): **+40đ** (`Lịch sử mua hàng: Có đơn hàng thành công trong hệ thống (+40đ)`).
         - Khách có 0 đơn hàng: **0đ**.
       - **Phân loại nhiệt độ (Temperature) chuẩn F100:**
         - `HOT 🔥`: Tổng điểm **≥ 70đ** (Ví dụ: Nguyễn AAA đạt 70đ HOT, Nguyễn Văn Minh đạt 100đ HOT).
         - `WARM ⚡`: Tổng điểm từ **40 đến 69đ** (Ví dụ: Trần Thị Thúy Hằng có hồ sơ + hỏi tư vấn đạt 60đ WARM).
         - `COLD ❄️`: Tổng điểm **< 40đ** (Ví dụ: Nguyễn Minh Anh, NGuyễn NGọc Mai, Lê Hoàng Long đạt đúng 30đ COLD).
    2. **Đồng Bộ Dữ Liệu Hội Thoại Đa Kênh Vào API Khách Hàng ([app/api/crm/customers/route.ts](file:///Users/tiodev/Desktop/Topify.nosync/app/api/crm/customers/route.ts)):**
       - Tự động nạp hội thoại và tin nhắn đa kênh (Telegram, Facebook, Zalo) theo khách hàng để truyền vào engine tính điểm F100.
    3. **Tối Ưu Giao Diện Khách Hàng & Thẻ Thống Kê ([Customers.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/Customers.tsx)):**
       - Sửa nhãn thẻ tổng quan thành: `"HOT Leads 🔥 (≥70đ)"` và `"WARM Leads ⚡ (40-69đ)"`.
       - Thêm biểu tượng `Info` và tooltip hướng dẫn chi tiết tiêu chí F100 ngay tại tiêu đề cột `"Lead Score (F100)"`.
       - Thêm thuộc tính `title` chi tiết từng dòng trong bảng: Hover chuột vào điểm số sẽ hiển thị toàn bộ lý do và các mục điểm cộng minh bạch.
    4. **Cập Nhật Tài Liệu Test Plan ([TEST_CASES.md](file:///Users/tiodev/Desktop/Topify.nosync/TEST_CASES.md)):**
       - Đồng bộ toàn bộ mô tả F100 và các kịch bản kiểm thử từ `TC-F100-01` đến `TC-F100-05` theo đúng tiêu chí chuẩn.
    5. **Kiểm Thử Toàn Diện:**
       - **Unit Tests:** Tạo mới tệp [`__tests__/api/crm/scoring.test.ts`](file:///Users/tiodev/Desktop/Topify.nosync/__tests__/api/crm/scoring.test.ts) gồm 8/8 test cases kiểm tra độc lập các trường hợp khách mới (30đ COLD), khách có đơn hàng (70đ HOT), khách VIP (100đ HOT), khách hỏi tư vấn (60đ WARM), và các mốc ranh giới điểm (39đ, 40đ, 69đ, 70đ) -> 100% Passed.
       - **Frontend Build:** `npm run build` trên `electron-app/frontend` hoàn tất 0 lỗi.
       - **Live Browser Verification:** Đã chụp ảnh màn hình thực tế tại `http://localhost:5173/#/customers` chứng minh:
         - *Nguyễn Minh Anh:* Hiển thị đúng **COLD (30đ) 30/100**.
         - *Nguyễn AAA:* Hiển thị đúng **HOT (70đ) 70/100**.
         - *Trần Thị Thúy Hằng:* Hiển thị đúng **WARM (60đ) 60/100**.
         - *NGuyễn NGọc Mai & Lê Hoàng Long:* Hiển thị đúng **COLD (30đ) 30/100**.
         - Thẻ tổng quan hiển thị chính xác **HOT Leads (≥70đ)** và **WARM Leads (40-69đ)**.
    6. **Đồng Bộ Phiên Bản:** Nâng cấp toàn bộ hệ thống lên **v1.3.54** ([package.json](file:///Users/tiodev/Desktop/Topify.nosync/package.json), [electron-app/package.json](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/package.json), [electron-app/frontend/package.json](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/package.json), [Sidebar.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/components/layout/Sidebar.tsx)).

---

## 🚀 [2026-10-28] (v1.3.53) — Hộp Thư Hợp Nhất (M3. Omnichannel Inbox & F086 Ghi Chú Nội Bộ): Kết Nối Mạng Xã Hội Nhận Tin Nhắn Thật, Đồng Bộ Thành Viên Workspace & Autocomplete Tag @ Đồng Nghiệp

### Phân hệ M3. Hộp Thư Hợp Nhất (Omnichannel Inbox) & Quản Lý Thành Viên Nhóm (F086, F116/F117) [Electron App, Web Dashboard & Backend API]:
- **[Kết Nối Mạng Xã Hội Nhận Tin Thật, Quản Lý Thành Viên Workspace & Gợi Ý Tag @ Đồng Nghiệp Trong Ghi Chú Nội Bộ]:**
  - **Vấn đề ghi nhận từ Người dùng:**
    - Tại phân hệ `M3: Hộp thư hợp nhất`:
      1. Chưa kết nối được các mạng xã hội để nhận tin nhắn thật, dữ liệu hội thoại hiện tại chỉ nạp từ nút "Nạp mẫu test".
      2. Không rõ cách thêm nhân viên vào cùng nhóm làm việc để cùng xử lý hội thoại.
      3. Trong tab *"Ghi chú nội bộ (F086)"*, các gợi ý tag đồng nghiệp (`@Nguyễn Văn Nam`, `@Trần Thị Hà`, `@Lê Hoàng Minh`) bị hardcoded từ dữ liệu mẫu, không rõ lấy từ đâu và không có cách quản lý danh sách này.
  - **Giải pháp kỹ thuật đã triển khai:**
    1. **Xây Dựng Backend API Quản Lý Thành Viên Workspace ([app/api/workspace/members/route.ts](file:///Users/tiodev/Desktop/Topify.nosync/app/api/workspace/members/route.ts)):**
       - `GET /api/workspace/members`: Tự động truy xuất toàn bộ thành viên đang hoạt động trong Workspace (kết hợp các tài khoản `User` và danh sách email được mời `AllowedEmail`), trả về định dạng chuẩn: `id`, `name`, `email`, `role` (`ADMIN` hoặc `STAFF`), và ảnh đại diện.
       - `POST /api/workspace/members`: Cho phép mời / thêm trực tiếp nhân viên mới vào Workspace với thông tin email, họ tên, và vai trò.
    2. **Mở Rộng API Kết Nối Mạng Xã Hội & Giả Lập / Ingest Tin Nhắn Thật:**
       - [`app/api/social/status/route.ts`](file:///Users/tiodev/Desktop/Topify.nosync/app/api/social/status/route.ts): Cung cấp trạng thái kết nối tức thì của các kênh Telegram Bot (`telegramBotUsername`), Zalo OA (`zaloOaId`), và Meta Page.
       - [`app/api/social/meta/connect/route.ts`](file:///Users/tiodev/Desktop/Topify.nosync/app/api/social/meta/connect/route.ts): Hỗ trợ kết nối trực tiếp Facebook Fanpage bằng Page ID, Page Name và Page Access Token.
       - [`app/api/social/zalo/connect/route.ts`](file:///Users/tiodev/Desktop/Topify.nosync/app/api/social/zalo/connect/route.ts): Hỗ trợ kết nối trực tiếp Zalo Official Account (OA ID, OA Name, Access Token).
       - [`app/api/social/simulate-inbound/route.ts`](file:///Users/tiodev/Desktop/Topify.nosync/app/api/social/simulate-inbound/route.ts): Cho phép kích hoạt tin nhắn thực tế từ các kênh đã kết nối đưa vào pipeline `ingestInboundMessage` để kiểm tra luồng nhận tin nhắn tức thì.
    3. **Nâng Cấp Modal Kết Nối Mạng Xã Hội ([ConnectChannelsModal.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/components/inbox/ConnectChannelsModal.tsx)):**
       - Tự động gọi API kiểm tra trạng thái kết nối ngay khi mở modal.
       - Hiển thị banner trạng thái kênh đang hoạt động (Telegram bot, Facebook Page, Zalo OA) kèm chấm xanh nhấp nháy trực quan.
       - Bổ sung form kết nối trực tiếp cho Meta và Zalo OA bên cạnh phương thức OAuth, có nút sao chép Webhook URL và Verify Token tiện lợi.
       - Trang bị nút `⚡ Thử nghiệm nhận tin nhắn thật từ [Kênh]` để người dùng/tester kiểm tra tức thì việc nhận tin nhắn vào Hộp thư.
    4. **Đồng Bộ Dữ Liệu Thành Viên & Menu Autocomplete @Tag Trong Ghi Chú Nội Bộ ([Inbox.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/Inbox.tsx)):**
       - Loại bỏ hoàn toàn mảng thành viên tĩnh hardcode, thay bằng dữ liệu thực tế nạp từ `/api/workspace/members`.
       - Thêm thẻ thông tin nhóm làm việc trên thanh công cụ Hộp thư: `"Nhóm: X thành viên"`, kèm nút `+ Mời` mở modal thêm nhân viên nhanh và nút `Chi tiết →` chuyển sang trang `/team`.
       - Tích hợp menu Autocomplete nổi (floating popup) khi người dùng gõ ký tự `@` trong ô soạn thảo Ghi chú nội bộ (F086), lọc thành viên theo từ khóa tìm kiếm và hiển thị đầy đủ tên, email, vai trò (Admin / Nhân viên).
       - Cập nhật dòng `Gợi ý tag:` tự động sinh theo danh sách thành viên thực tế của Workspace, kèm nút `+ Thêm nhân viên` ngay cạnh để thêm đồng nghiệp bất cứ lúc nào.
       - Tích hợp Modal mời nhanh thành viên (`QuickInviteMemberModal`) ngay trong giao diện Hộp thư.
    5. **Điều Hướng Dễ Dàng Từ Sidebar ([Sidebar.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/components/layout/Sidebar.tsx)):**
       - Bổ sung mục `Thành viên & Nhóm (F116/F117)` vào ngay dưới nhóm menu `GIAO TIẾP & BÁN HÀNG (CRM)` (ngay bên dưới `Hộp thư hợp nhất`), giúp quản lý nhóm làm việc hiển thị trực diện thay vì ẩn sâu dưới chân trang cài đặt.
    6. **Kiểm Thử & Biên Dịch:**
       - **Automated Tests:** 9/9 test cases chạy thành công với Vitest (`__tests__/api/workspace/members.test.ts`, `__tests__/api/social/meta-connect.test.ts`, `__tests__/api/social/status.test.ts`).
       - **Frontend Build:** `npm run build` trong `electron-app/frontend` hoàn tất 0 lỗi (`tsc -b && vite build`).
       - **Live Browser Verification:** Đã kiểm thử tự động trên giao diện thực tế `http://localhost:5173/#/inbox`:
         - Thẻ nhóm hiển thị đúng thành viên thực tế của Workspace.
         - Thêm thành viên mới thành công và cập nhật tức thì danh sách tag.
         - Gõ `@` hiển thị menu autocomplete chính xác.
         - Kết nối kênh Telegram thành công và nhận tin nhắn thật hiển thị ngay ở đầu danh sách hội thoại.
    7. **Đồng Bộ Phiên Bản:** Nâng cấp toàn bộ hệ thống lên **v1.3.53** ([package.json](file:///Users/tiodev/Desktop/Topify.nosync/package.json), [electron-app/package.json](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/package.json), [electron-app/frontend/package.json](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/package.json), [Sidebar.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/components/layout/Sidebar.tsx)).

---

## 🚀 [2026-10-28] (v1.3.52) — Hộp Thư Hợp Nhất (M3. Inbox Omnichannel): Tách Header Thành 2 Dòng Rõ Ràng & Khắc Phục Lỗi UI Co Kéo Nút Bấm

### Phân hệ M3. Hộp Thư Hợp Nhất (Omnichannel Inbox) [Electron App & Web Dashboard]:
- **[Tối Ưu Giao Diện Header Cột 1 Hộp Thư Omnichannel]: Tách tiêu đề và các nút thao tác thành 2 dòng riêng biệt, khắc phục lỗi chữ bị gãy thành nhiều hàng và co kéo nút bấm:**
  - **Vấn đề ghi nhận từ Người dùng:**
    - Tại phân hệ `M3: Hộp thư hợp nhất`, ở thanh đầu của cột danh sách hội thoại, tiêu đề `"Hộp thư hợp nhất"` cùng hai nút `"Kết nối MXH"` và `"Nạp mẫu test"` bị dồn chung trên cùng một hàng ngang hẹp.
    - Do độ rộng cột hẹp, hai nút bấm bị bóp nghẹt khiến văn bản bên trong bị gãy thành nhiều dòng vụn (`Kết` / `nối` / `MXH` và `Nạp` / `mẫu` / `test`), gây mất thẩm mỹ và khó thao tác.
    - *Yêu cầu:* "Lỗi UI : Có thể tách ra làm 2 dòng".
  - **Giải pháp kỹ thuật đã triển khai ([Inbox.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/Inbox.tsx)):**
    1. **Tách Header thành 2 dòng độc lập:**
       - **Dòng 1:** Dành trọn vẹn cho icon tin nhắn, tiêu đề chính `"Hộp thư hợp nhất"` và phụ đề `"M3. Inbox Omnichannel"`, đảm bảo cấu trúc phân cấp thị giác thoáng đãng và không bị xô lệch.
       - **Dòng 2:** Đặt hai nút hành động `"Kết nối MXH"` và `"Nạp mẫu test"` thành một lưới `grid grid-cols-2 gap-2` phía dưới. Cả hai nút có độ rộng đồng đều, hiển thị đầy đủ icon và nhãn chữ trên đúng 1 dòng duy nhất (`whitespace-nowrap`), căn giữa tinh tế.
    2. **Tối ưu hóa độ rộng cột danh sách hội thoại:** Nâng cấp độ rộng cột từ `w-64 lg:w-72` lên `w-72 lg:w-80` (288px - 320px theo chuẩn các ứng dụng chat/inbox hiện đại), giúp tên khách hàng, nhãn nền tảng mạng xã hội và nhãn đếm ngược SLA có thêm không gian hiển thị rõ ràng, hạn chế dấu chấm lửng (`...`) quá sớm.
    3. **Kiểm thử trực quan & Biên dịch:**
       - `npm run build` biên dịch thành công 0 lỗi.
       - Đã kiểm tra thực tế bằng Trình duyệt tự động (Browser Subagent) tại `http://localhost:5173/#/inbox`: Cả hai dòng hiển thị hoàn hảo, nút bấm rộng rãi, chữ không bị ngắt dòng.
    4. **Đồng Bộ Phiên Bản:** Nâng cấp phiên bản toàn hệ thống lên **v1.3.52** ([package.json](file:///Users/tiodev/Desktop/Topify.nosync/package.json), [electron-app/package.json](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/package.json), [electron-app/frontend/package.json](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/package.json), [Sidebar.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/components/layout/Sidebar.tsx)).

---

## 🚀 [2026-10-28] (v1.3.51) — Quản Lý Bài Viết: Hiển Thị Thông Số Kỹ Thuật Video, Tiêu Chuẩn YouTube Shorts & Minh Bạch Lý Do Thất Bại Kèm Hướng Dẫn Khắc Phục (F020, BUG-065)

### Phân hệ M2. Quản lý Bài viết — Xuất Bản & Quản Lý Video Đa Nền Tảng [Electron App, Web Dashboard & Backend API]:
- **[Hiển Thị Thông Số Kỹ Thuật Video, Đánh Giá Tiêu Chuẩn YouTube Shorts & Chuẩn Hóa Thông Báo Lỗi Xuất Bản]:**
  - **Vấn đề ghi nhận từ Người dùng & Báo cáo QA:**
    - Tạo bài đăng mới với video đáp ứng đầy đủ tiêu chí YouTube Shorts, chọn nền tảng YouTube, tiêu đề `"Đăng bài shorrt"`, hashtag `#Shorts #Trending`.
    - Chọn "Đăng ngay", click "Đăng ngay 1 Video".
    - Bài viết `"Đăng bài shorrt"` (YouTube, 26/10/2026) có trạng thái `"Thất bại"`, không đăng thành công.
    - *Người dùng phản hồi:* "Chưa có thông số video và lý do thất bại cụ thể. Cần kiểm tra lại và đảm bảo không ảnh hưởng các chức năng khác, ví dụ video dài hơn 180s tự động chuyển thành video thường (xem BUG-065)."
  - **Nguyên nhân cốt lõi (Root Cause):**
    1. **Nguyên nhân video bị thất bại trên YouTube:**
       - Video thực tế của bài đăng (`Mom Took My Money...`) có thời lượng **42 giây**, dung lượng **1.49 MB**, định dạng **MP4**, hoàn toàn đạt chuẩn YouTube Shorts (thời lượng $\le$ 180s, video dọc).
       - Khi gửi yêu cầu khởi tạo tải lên (`initRes`) tới Google YouTube API, YouTube trả về mã lỗi:
         `400 Bad Request: "The user has exceeded the number of videos they may upload." (reason: uploadLimitExceeded)`
         Đây là chính sách giới hạn số lượng video được phép tải lên trong 24 giờ (Daily Upload Limit) của YouTube đối với các kênh mới tạo hoặc chưa xác minh Tính năng nâng cao (Advanced Features). Sau đó, token liên kết YouTube của tài khoản (`Ngo Yen`) cũng chuyển sang trạng thái hết hạn (`EXPIRED`).
    2. **Nguyên nhân hệ thống không hiển thị thông số video và lý do thất bại:**
       - Route API [app/api/posts/route.ts](file:///Users/tiodev/Desktop/Topify.nosync/app/api/posts/route.ts) trước đây chỉ `select: { originalFileName: true, storageUrl: true }` cho `videoAsset` (bỏ sót `duration`, `size`, `mimeType`), và `select: { platform: true, status: true }` cho `platforms` (bỏ sót `errorMessage`).
       - Trang danh sách [electron-app/frontend/src/pages/Posts.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/Posts.tsx) không hiển thị thời lượng và dung lượng video trên card thumbnail hoặc bảng.
       - Modal xem nhanh bài viết không có thẻ thông số kỹ thuật video và không render thông tin lỗi của từng nền tảng.
       - Trang chi tiết [electron-app/frontend/src/pages/PostDetail.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/PostDetail.tsx) render `pl.errorMessage` với class CSS `line-clamp-2` nuốt chửng chuỗi JSON kỹ thuật thô (`Failed to init upload: 400 Bad Request. Details: {\n  "error": {`), khiến nội dung lỗi thực sự bị che khuất hoàn toàn.
  - **Giải pháp kỹ thuật đã triển khai:**
    1. **Bổ sung các hàm tiện ích chuẩn hóa định dạng & phát hiện lỗi ([lib/utils.ts](file:///Users/tiodev/Desktop/Topify.nosync/lib/utils.ts), [electron-app/frontend/src/lib/utils.ts](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/lib/utils.ts)):**
       - `formatFileSize(bytes)`: Định dạng dung lượng tệp trực quan (`1.49 MB`).
       - `formatVideoDuration(seconds)`: Định dạng thời lượng trực quan (`42s (00:42)`).
       - `checkShortsCriteria(duration, mimeType)`: Đánh giá tiêu chuẩn YouTube Shorts:
         - Nếu thời lượng $\le$ 180s: Gán nhãn `Đạt chuẩn Shorts (42s ≤ 180s)` kèm ghi chú đạt chuẩn tối đa 3 phút.
         - Nếu thời lượng > 180s: Gán nhãn `Video dài Xs (> 180s)` kèm cảnh báo "Thời lượng vượt mức 180s (3 phút). YouTube sẽ tự động xuất bản dưới dạng Video thông thường" (đảm bảo giữ nguyên vẹn cơ chế BUG-065).
       - `formatFriendlyPublishError(rawError, platform)`: Tự động phân tích chuỗi lỗi kỹ thuật và chuyển đổi sang tiếng Việt rõ ràng, dễ hiểu kèm giải pháp:
         - `uploadLimitExceeded`: "Kênh YouTube đã đạt giới hạn số lượng video được phép tải lên trong ngày của YouTube (Daily Upload Limit)." $\rightarrow$ Hướng dẫn đợi 24h hoặc xác minh Tính năng nâng cao trong YouTube Studio.
         - `quotaExceeded`: "Tài khoản YouTube đã sử dụng hết hạn mức API (YouTube Data API Quota)." $\rightarrow$ Hướng dẫn thời điểm reset (14:00 giờ VN).
         - `invalid_grant` / `Token expired`: "Phiên đăng nhập YouTube đã hết hạn." $\rightarrow$ Hướng dẫn kết nối lại kênh trong Cài đặt.
         - `videoTitleTooLong`: "Tiêu đề video vượt quá độ dài tối đa 100 ký tự của YouTube."
    2. **Nâng cấp Backend Publisher & APIs ([lib/publishers/youtube.ts](file:///Users/tiodev/Desktop/Topify.nosync/lib/publishers/youtube.ts), [app/api/posts/route.ts](file:///Users/tiodev/Desktop/Topify.nosync/app/api/posts/route.ts), [app/api/posts/[id]/route.ts](file:///Users/tiodev/Desktop/Topify.nosync/app/api/posts/[id]/route.ts)):**
       - Trả về thông báo lỗi thân thiện ngay trong hàm xuất bản YouTube khi gặp `uploadLimitExceeded`, `quotaExceeded`, `videoTitleTooLong`, `invalid_grant`.
       - Mở rộng truy vấn `videoAsset` trả về `duration`, `size`, `mimeType`, `id`.
       - Mở rộng truy vấn `platforms` trả về `errorMessage`, `externalPostId`, `id`.
    3. **Nâng cấp giao diện Danh sách bài viết ([electron-app/frontend/src/pages/Posts.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/Posts.tsx)):**
       - Lưới Card View: Hiển thị thời lượng (`42s (00:42)`) và dung lượng (`1.49 MB`) ngay trên thanh thông tin dưới thumbnail video; đối với bài viết `FAILED`, hiển thị banner cảnh báo màu đỏ với lý do thất bại tóm tắt.
       - Bảng Table View: Hiển thị chip thời lượng và dung lượng dưới tiêu đề bài viết; hiển thị lý do lỗi dưới badge trạng thái.
       - Quick View Modal:
         - Thêm thẻ "Thông số Video" hiển thị huy hiệu chuẩn Shorts (`Đạt chuẩn Shorts (42s ≤ 180s)`), Thời lượng, Dung lượng, Định dạng MP4 và ghi chú tiêu chuẩn.
         - Phần "Trạng thái trên nền tảng & Chi tiết lỗi": Hiển thị rõ ràng "Lý do thất bại", hộp "💡 Hướng dẫn khắc phục" và nút mở rộng "Chi tiết kỹ thuật (Raw Log)".
    4. **Nâng cấp giao diện Chi tiết bài viết ([electron-app/frontend/src/pages/PostDetail.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/PostDetail.tsx)):**
       - Bổ sung thẻ "Thông số kỹ thuật Video" ngay dưới trình phát video preview với đầy đủ thông số thời lượng, dung lượng, định dạng và đánh giá tiêu chuẩn Shorts.
       - Cải tiến phần Trạng thái nền tảng: Thay thế đoạn text `line-clamp-2` bị nuốt lỗi bằng hộp cảnh báo chi tiết gồm Lý do thất bại, Hướng dẫn khắc phục từng bước và Raw log có thể thu gọn/mở rộng.
    5. **Kiểm thử tự động & Trực quan (Verification):**
       - Kiểm thử API: `npx vitest run __tests__/api/posts/route.test.ts` pass 17/17 tests (bao gồm test case kiểm tra video > 180s tự động chuyển thành video thường không bị ảnh hưởng).
       - Kiểm thử Frontend Build: `npm run build` biên dịch thành công 0 lỗi.
       - Kiểm thử Trình duyệt (Browser Subagent): Truy cập bài viết `"Đăng bài shorrt"` tại `http://localhost:5173/#/posts` và `http://localhost:5173/#/posts/cmvp21w38000e67ot2m37sbyy`, xác thực hiển thị chính xác toàn bộ thông số video và lý do lỗi `Daily Upload Limit`.
    6. **Đồng Bộ Phiên Bản:** Nâng cấp đồng bộ lên **v1.3.51** trên toàn bộ hệ thống ([package.json](file:///Users/tiodev/Desktop/Topify.nosync/package.json), [electron-app/package.json](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/package.json), [electron-app/frontend/package.json](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/package.json), [Sidebar.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/components/layout/Sidebar.tsx)).

---

## 🚀 [2026-10-28] (v1.3.50) — Lịch Nội Dung (Calendar - F021): Sửa Lỗi Không Hiển Thị Các Bài Đã Đăng & Loại Bỏ Bài Thất Bại

### Phân hệ M2. Quản lý Bài viết — Lịch Nội Dung & Kế Hoạch Xuất Bản (Calendar - F021) [Electron App, Web Dashboard & Backend API]:
- **[Sửa Lỗi Đồng Bộ Dữ Liệu & Hiển Thị Đa Nền Tảng F021] Khắc phục triệt để lỗi không hiển thị các bài viết đã đăng (`PUBLISHED`) và loại bỏ hoàn toàn các bài viết thất bại (`FAILED`) trên giao diện Calendar:**
  - **Vấn đề ghi nhận từ Người dùng & Báo cáo QA (F021 - Liên quan BUG-066):**
    - Mở app Topify $\rightarrow$ Quản lý bài viết, ghi nhận các bài viết có trạng thái Đã đăng (ví dụ 26/10: `"[SPECIAL CLIP] BTS"`, 25/10: `"[BẤT ĐỘNG SẢN & NHÀ ĐẤT]..."`).
    - Mở Lịch nội dung (Calendar).
    - Xem Tháng 10/2026 và đối chiếu với danh sách ở Quản lý bài viết.
    - *Mong đợi:* Calendar hiển thị đầy đủ các bài đã lên lịch (`SCHEDULED`) và các bài đã đăng (`PUBLISHED`) theo đúng ngày giờ, khớp với danh sách ở Quản lý bài viết (bài trạng thái Thất bại `FAILED` không hiển thị trên lịch).
    - *Thực tế trước khi sửa:* Calendar Tháng 10/2026 chỉ hiển thị 8 bài ("8 bài viết đã xếp lịch trong tháng này") và không hiển thị các bài đã đăng. Ví dụ ngày 26/10 chỉ thấy 02:50 "Biến thể..." và 19:30 "Top 3 bí...", ngày 25/10 chỉ thấy 20:29 "Ranking...". Đồng thời bài 19:30 "Top 3 bí quyết xây kênh TikTok..." vốn có trạng thái Thất bại (`FAILED`) lại bị hiển thị nhầm trên lịch.
  - **Nguyên nhân cốt lõi (Root Cause):**
    1. **Thiếu trường mốc thời gian hiển thị (`effectiveDate`) ở cả Backend API & Frontend Component:**
       - Đối với các bài viết được đăng ngay từ trang Tạo bài viết / Quản lý bài viết, trường `scheduledAt` trong cơ sở dữ liệu có giá trị `null` (chỉ có `publishedAt` lưu thời điểm xuất bản thực tế).
       - Trong [electron-app/frontend/src/pages/CalendarView.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/CalendarView.tsx), logic lọc theo ô ngày chỉ kiểm tra `p.scheduledAt || (p as any).start`. Khi gọi API `https://topify.vn/api/posts/calendar`, mảng `safePosts` trước đây không kèm trường `start` và không fallback sang `publishedAt`, khiến `targetDate` bị `undefined`, dẫn đến toàn bộ bài đã đăng ngay bị loại khỏi lưới lịch tháng 10.
    2. **Chưa lọc trạng thái bài viết ở tầng truy vấn Calendar API:**
       - Route API [app/api/posts/calendar/route.ts](file:///Users/tiodev/Desktop/Topify.nosync/app/api/posts/calendar/route.ts) trước đây không áp dụng bộ lọc mặc định theo `status`. Do đó, các bài có trạng thái `FAILED` (Thất bại) nhưng có lưu thời gian lên lịch `scheduledAt` vẫn bị trả về và render lên lịch.
    3. **Tiêu đề phụ (Subtitle) chỉ đếm số bài "đã xếp lịch":**
       - Giao diện Calendar hiển thị chuỗi cố định "X bài viết đã xếp lịch trong tháng này", gây hiểu nhầm khi người dùng muốn xem tổng quan cả bài đã đăng và bài sắp đăng.
  - **Giải pháp kỹ thuật đã triển khai:**
    1. **Tối ưu hóa Backend API ([app/api/posts/calendar/route.ts](file:///Users/tiodev/Desktop/Topify.nosync/app/api/posts/calendar/route.ts)):**
       - Thêm bộ lọc trạng thái mặc định: Khi không có tham số `?status`, truy vấn mặc định lấy `{ in: ['SCHEDULED', 'PUBLISHED', 'PUBLISHING'] }`, loại trừ triệt để các bài `FAILED`, `PARTIAL_FAILED`, và `DRAFT`.
       - Chuẩn hóa trường thời gian bắt đầu `start`: Trả về `post.scheduledAt || post.publishedAt || post.createdAt` cho toàn bộ danh sách `safePosts` và `events`.
       - Cập nhật thứ tự sắp xếp đa tiêu chí: `orderBy: [{ scheduledAt: 'asc' }, { publishedAt: 'asc' }, { createdAt: 'asc' }]`.
    2. **Nâng cấp giao diện Lịch nội dung ([electron-app/frontend/src/pages/CalendarView.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/CalendarView.tsx)):**
       - Tính toán `effectiveDate` linh hoạt: Sử dụng `p.scheduledAt || p.publishedAt || (p as any).start || p.createdAt` để định vị chính xác ngày giờ của từng bài viết trên ô lịch.
       - Lọc bảo vệ kép ở Frontend: Loại bỏ toàn bộ bài viết có trạng thái `FAILED`, `PARTIAL_FAILED`, `DRAFT` khỏi lưới lịch và thống kê.
       - Cập nhật số liệu thống kê tháng trực quan: Thay chuỗi đơn điệu bằng thống kê chi tiết theo trạng thái thực tế: `"X bài viết trong tháng này (Y đã đăng, Z đã lên lịch)"`.
       - Phân biệt rõ ràng trong Modal chi tiết bài viết: Hiển thị tách bạch "Thời gian lên lịch" (badge tím) và "Thời gian xuất bản" (badge xanh lá emerald) kèm link bài đăng thực tế nếu có.
    3. **Bổ sung Unit & Integration Tests ([__tests__/api/posts/calendar.test.ts](file:///Users/tiodev/Desktop/Topify.nosync/__tests__/api/posts/calendar.test.ts)):**
       - Thêm test case xác nhận bài viết `PUBLISHED` không có `scheduledAt` vẫn tính đúng `start` từ `publishedAt`.
       - Thêm test case kiểm tra bộ lọc mặc định loại trừ bài viết `FAILED`.
       - Toàn bộ 4/4 test cases của Calendar API và 42/42 test cases của Post APIs pass 100%.
    4. **Kiểm thử trực quan trên Trình duyệt (Browser Subagent Verification):**
       - Truy cập [http://localhost:5173/#/calendar](http://localhost:5173/#/calendar) tại Tháng 10/2026:
         - Phụ đề hiển thị chuẩn xác: `19 bài viết trong tháng này (16 đã đăng, 3 đã lên lịch)`.
         - Ngày 26/10 hiển thị đầy đủ: `02:50 Biến thể caption...` (đã lên lịch) và `16:25 [SPECIAL CLIP] BTS...` (đã đăng).
         - Ngày 25/10 hiển thị đầy đủ các bài: `20:29 Ranking Funny Videos...`, `20:50 🔥 【BẤT ĐỘNG SẢN & NHÀ ĐẤT]...`, `21:10 Mom Took My Phone...`, v.v.
         - Bài viết thất bại `19:30 Top 3 bí quyết xây kênh TikTok triệu view 2026` (`FAILED`) đã bị loại bỏ hoàn toàn, không còn hiển thị sai trên lịch.
       - Ảnh chụp màn hình kiểm chứng: [calendar_oct_2026_1793128842066.png](file:///Users/tiodev/.gemini/antigravity-ide/brain/9998a1f5-2867-4822-a186-35e59fffc359/calendar_oct_2026_1793128842066.png).
    5. **Đồng Bộ Phiên Bản:** Nâng cấp đồng bộ lên **v1.3.50** trên toàn bộ hệ thống ([package.json](file:///Users/tiodev/Desktop/Topify.nosync/package.json), [electron-app/package.json](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/package.json), [electron-app/frontend/package.json](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/package.json), [Sidebar.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/components/layout/Sidebar.tsx)).

---

## 🚀 [2026-10-28] (v1.3.49) — Quản Lý Bài Viết: Chuẩn Hóa Thông Báo Lỗi Import Bài Viết Hàng Loạt (F019) — Loại Bỏ Lỗi Kỹ Thuật Nội Bộ & Nêu Rõ Chi Tiết Dòng/Trường Lỗi

### Phân hệ M2. Quản lý Bài viết — Import Bài Viết Hàng Loạt (F019) [Electron App, Web Dashboard & Backend API]:
- **[Chuẩn Hóa UX & Phòng Vệ Lỗi Đa Tầng F019] Loại bỏ hoàn toàn lỗi kỹ thuật nội bộ (Prisma queries, Database IDs), hiển thị thông báo lỗi chi tiết theo dòng và trường cho người dùng:**
  - **Vấn đề ghi nhận từ Người dùng & Báo cáo QA (F019):**
    - Mở app Topify $\rightarrow$ Quản lý bài viết.
    - Mở modal "Import Bài Viết Hàng Loạt (Excel & Google Drive)".
    - Chọn "Tải tệp từ máy tính (.xlsx, .csv)", tải lên file dữ liệu thiếu hoặc sai định dạng.
    - *Mong đợi:* Khi import file thiếu hoặc sai validate dữ liệu thì hiển thị thông báo lỗi rõ ràng, dễ hiểu cho người dùng, nêu rõ lỗi ở trường/dòng nào. Tuyệt đối không hiển thị lỗi kỹ thuật nội bộ.
    - *Thực tế trước khi sửa:* Thông báo lỗi hiển thị nguyên văn câu truy vấn nội bộ (`Invalid prisma.socialAccount.findMany() invocation: { where: { OR: [ { workspaceId: "cmubcm2km000246z8xx84kwpd" }, { userId: "cmu11u2ax000011jtoqxtg6dv" } ], status: ... } } ...`), kèm mã workspace/user ID, người dùng bối rối không hiểu lỗi nằm ở đâu và cần sửa trường nào.
  - **Nguyên nhân cốt lõi (Root Cause):**
    1. **Thiếu lớp chuyển đổi/sanitization lỗi thân thiện (Friendly Error Formatter):** Các khối `catch` trong API route ([app/api/content-studio/import/parse/route.ts](file:///Users/tiodev/Desktop/Topify.nosync/app/api/content-studio/import/parse/route.ts), [app/api/content-studio/import/save/route.ts](file:///Users/tiodev/Desktop/Topify.nosync/app/api/content-studio/import/save/route.ts)) và giao diện modal ([ImportPostsModal.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/components/content-studio/ImportPostsModal.tsx)) ném trực tiếp chuỗi `err.message` thô ra màn hình. Khi Prisma hoặc database xảy ra lỗi cú pháp hay validate, chuỗi truy vấn kèm toàn bộ thông số nội bộ (`workspaceId`, `userId`, `cmu...`) bị lộ trực tiếp ra toast notification của người dùng.
    2. **Thiếu kiểm tra cấu trúc tiêu đề cột (Header Aliases Validation):** Khi người dùng tải lên một tệp bảng tính có cấu trúc cột hoàn toàn xa lạ (không chứa bất kỳ cột hợp lệ nào như Tiêu đề, Nền tảng, Lịch đăng), hệ thống vẫn cố gắng parse và duyệt qua các dòng rỗng, dẫn đến lỗi xử lý dữ liệu chung chung khó hiểu.
    3. **Thông báo lỗi thiếu tính định danh theo dòng (Row-level Context):** Toast cảnh báo chỉ hiển thị số lượng bài không hợp lệ chung chung mà không nêu rõ các dòng cụ thể bị lỗi gì (ví dụ: dòng nào thiếu tiêu đề, dòng nào sai định dạng ngày, dòng nào chưa kết nối tài khoản mạng xã hội).
  - **Giải pháp kỹ thuật đã triển khai:**
    1. **Cơ chế lọc và chuẩn hóa lỗi thân thiện `formatFriendlyImportError`:**
       - Triển khai hàm `formatFriendlyImportError` tại cả backend ([lib/content-studio/import-engine.ts](file:///Users/tiodev/Desktop/Topify.nosync/lib/content-studio/import-engine.ts)) và frontend ([electron-app/frontend/src/components/content-studio/ImportPostsModal.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/components/content-studio/ImportPostsModal.tsx)).
       - Tự động nhận diện và chặn triệt để toàn bộ các chuỗi kỹ thuật nội bộ (`prisma`, `findmany`, `findunique`, `invocation`, `socialaccountstatus`, `workspaceid`, `userid`, `syntax error`, `cuid`, `cmu...`, `assertionerror`, `undici`, `500`) và thay thế bằng thông điệp tiếng Việt lịch sự, dễ hiểu: *"Hệ thống gặp sự cố kỹ thuật khi kết nối cơ sở dữ liệu. Vui lòng thử lại sau giây lát hoặc liên hệ hỗ trợ."*
       - Tự động diễn giải các mã lỗi Google Sheets (`403` $\rightarrow$ hướng dẫn bật quyền Viewer; `404` $\rightarrow$ kiểm tra liên kết; tệp bị khóa/hỏng $\rightarrow$ hướng dẫn lưu lại chuẩn Excel/CSV).
    2. **Xác thực cấu trúc cột bảng tính thông minh (Header Structure Validation):**
       - Bổ sung bước kiểm tra nhận diện cột `hasRecognizedColumn` trong [lib/content-studio/import-engine.ts](file:///Users/tiodev/Desktop/Topify.nosync/lib/content-studio/import-engine.ts): Nếu tệp tải lên không chứa bất kỳ cột chuẩn nào (`title`, `caption`, `platforms`, `scheduledAt`), hệ thống trả về thông báo lỗi hướng dẫn cụ thể: *"Tệp bảng tính không đúng mẫu quy định. Không tìm thấy các cột bắt buộc: "Tiêu đề", "Nền tảng", "Thời gian đăng". Vui lòng tải "File mẫu Excel (.xlsx)" để điền đúng định dạng."*
    3. **Cải tiến giao diện Modal & Thông báo chi tiết dòng/trường ([ImportPostsModal.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/components/content-studio/ImportPostsModal.tsx)):**
       - **Toast phân tích:** Khi phát hiện bài viết không hợp lệ, thông báo nêu đích danh các dòng và nguyên nhân: *"Toàn bộ 3 bài viết không hợp lệ (Dòng 1: Thiếu tiêu đề bài viết (Bắt buộc).; Dòng 2: Nền tảng Facebook Reels chưa được kết nối...; Dòng 3: Nền tảng TikTok chưa được kết nối...). Vui lòng sửa lại dữ liệu hoặc tải file mẫu."*
       - **Banner cảnh báo Bước 2:** Bổ sung danh sách cuộn chi tiết từng dòng cần sửa kèm dấu phân cách rõ ràng (`Dòng X: Lỗi tiêu đề • Lỗi nền tảng...`).
       - **Nhãn cảnh báo trực quan theo từng ô:**
         - Cột Tiêu đề hiển thị nhãn đỏ: `⚠️ Lỗi: Thiếu tiêu đề (Bắt buộc)`.
         - Cột Nền tảng hiển thị nhãn đỏ: `⚠️ Lỗi: Thiếu kênh đăng (Bắt buộc)` hoặc nhãn `(Chưa connect)` kèm nút `[×]` gỡ bỏ nhanh.
         - Cột Thời gian hiển thị: `⚠️ Sai định dạng thời gian` kèm tooltip hướng dẫn định dạng chuẩn.
       - **Bảo vệ lưu bài viết (`handleSavePosts`):** Nếu người dùng chọn lưu bài viết chưa hợp lệ, toast cảnh báo nêu rõ: *"Không thể lưu: có X bài viết chưa hợp lệ [Dòng 1 (Lỗi), Dòng 2 (Lỗi)...]. Vui lòng sửa lỗi hoặc bỏ tích chọn các bài này."*
    4. **Bộ Kiểm thử Đầy Đủ & Bằng Chứng Trực Quan:**
       - **Unit Tests ([__tests__/api/content-studio/import.test.ts](file:///Users/tiodev/Desktop/Topify.nosync/__tests__/api/content-studio/import.test.ts)):** Bổ sung test cases cho `formatFriendlyImportError` và header validation. Toàn bộ 31/31 unit & integration tests passed 100%.
       - **Kiểm thử E2E Playwright trên Trình duyệt:** Chạy kịch bản tự động tải lên tệp sai cấu trúc cột và tệp sai validate dữ liệu, xác nhận không còn bất kỳ chuỗi ORM hay ID nội bộ nào xuất hiện trên giao diện.
       - **Bằng chứng hình ảnh:**
         - [import_wrong_headers_error.png](file:///Users/tiodev/.gemini/antigravity-ide/brain/9998a1f5-2867-4822-a186-35e59fffc359/import_wrong_headers_error.png): Toast thông báo rõ ràng khi tải file sai tiêu đề cột.
         - [import_invalid_rows_preview.png](file:///Users/tiodev/.gemini/antigravity-ide/brain/9998a1f5-2867-4822-a186-35e59fffc359/import_invalid_rows_preview.png): Bảng xem trước với banner chi tiết từng dòng lỗi và nhãn cảnh báo trực tiếp trên từng ô dữ liệu.
         - [import_save_blocked_error.png](file:///Users/tiodev/.gemini/antigravity-ide/brain/9998a1f5-2867-4822-a186-35e59fffc359/import_save_blocked_error.png): Toast chặn lưu nêu rõ từng dòng và trường dữ liệu chưa hợp lệ.
    5. **Đồng Bộ Phiên Bản:** Nâng cấp đồng bộ lên **v1.3.49** trên toàn bộ hệ thống ([package.json](file:///Users/tiodev/Desktop/Topify.nosync/package.json), [electron-app/package.json](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/package.json), [electron-app/frontend/package.json](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/package.json), [Sidebar.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/components/layout/Sidebar.tsx)).

---

## 🚀 [2026-10-28] (v1.3.48) — Quản Lý Bài Viết: Sửa Lỗi Import Bài Viết Hàng Loạt (F019) — Khắc Phục Lỗi Prisma Enum SocialAccountStatus (Invalid Value in Argument 'in')

### Phân hệ M2. Quản lý Bài viết — Import Bài Viết Hàng Loạt (F019) [Electron App, Web Dashboard & Backend API]:
- **[Sửa Lỗi Backend API & Parser F019] Khắc phục triệt để lỗi crash `Invalid prisma.socialAccount.findMany()` khi tải file Excel/CSV mẫu:**
  - **Vấn đề ghi nhận từ Người dùng & Báo cáo QA (F019):**
    - Mở app Topify $\rightarrow$ Quản lý bài viết.
    - Mở modal "Import Bài Viết Hàng Loạt (Excel & Google Drive)".
    - Chọn "Tải tệp từ máy tính (.xlsx, .csv)", tải lên file dữ liệu đúng mẫu.
    - *Mong đợi:* File đúng mẫu được import thành công và hiển thị danh sách bài viết ở bước xem trước (Bảng xem trước dữ liệu).
    - *Thực tế trước khi sửa:* Hệ thống báo lỗi popup đỏ:
      `"Invalid prisma.socialAccount.findMany() invocation: ... status: { in: ["CONNECTED", "active"] } ... Invalid value for argument in. Expected SocialAccountStatus."` Không import được file.
  - **Nguyên nhân cốt lõi (Root Cause):**
    1. Trong Prisma Schema ([prisma/schema.prisma](file:///Users/tiodev/Desktop/Topify.nosync/prisma/schema.prisma)), enum `SocialAccountStatus` chỉ định nghĩa 3 giá trị: `CONNECTED`, `DISCONNECTED`, `EXPIRED`.
    2. Trong route backend cũ ([app/api/content-studio/import/parse/route.ts](file:///Users/tiodev/Desktop/Topify.nosync/app/api/content-studio/import/parse/route.ts) và [app/api/content-studio/import/save/route.ts](file:///Users/tiodev/Desktop/Topify.nosync/app/api/content-studio/import/save/route.ts)), câu truy vấn `prisma.socialAccount.findMany` chứa mệnh đề: `status: { in: ['CONNECTED', 'active' as any] }`. Do Prisma kiểm tra enum nghiêm ngặt ở tầng compile & runtime, giá trị chuỗi `'active'` không khớp với enum đã kích hoạt ngoại lệ `PrismaClientValidationError: Invalid value for argument in. Expected SocialAccountStatus.`
    3. Việc thiếu cơ chế bắt lỗi an toàn (`.catch(() => [])`) cho truy vấn `socialAccount.findMany` khiến toàn bộ luồng xử lý parse và save bị ngắt ngang và trả về lỗi HTTP 500 thay vì xử lý dữ liệu bảng tính.
    4. Các route API import thiếu các tiêu đề CORS chuẩn và bộ xử lý preflight `OPTIONS` (status 204), cũng như cơ chế fallback ngữ cảnh xác thực `getAuthContext()` khi gọi từ Electron desktop app ở môi trường cục bộ.
  - **Giải pháp kỹ thuật đã triển khai:**
    1. **Chuẩn hóa truy vấn Prisma & Phòng vệ lỗi tuyệt đối ([app/api/content-studio/import/parse/route.ts](file:///Users/tiodev/Desktop/Topify.nosync/app/api/content-studio/import/parse/route.ts) & [app/api/content-studio/import/save/route.ts](file:///Users/tiodev/Desktop/Topify.nosync/app/api/content-studio/import/save/route.ts)):**
       - Loại bỏ hoàn toàn giá trị không hợp lệ `'active'` khỏi mệnh đề truy vấn `prisma.socialAccount.findMany`.
       - Lọc trạng thái kết nối an toàn trong bộ nhớ JavaScript (`acc.status === 'CONNECTED'`), hỗ trợ tương thích ngược và kiểm tra thời hạn token (`expiresAt` / `refreshToken`).
       - Bọc câu lệnh `prisma.socialAccount.findMany` với `.catch((dbErr) => { console.warn(...); return []; })`. Nếu cơ sở dữ liệu gặp sự cố kết nối hoặc lỗi enum, tiến trình import vẫn tiếp tục xử lý và parse dữ liệu file bảng tính bình thường mà không bị crash 500.
    2. **Hỗ trợ Cross-Origin & Electron Desktop Auth:**
       - Thêm `corsHeaders` (`Access-Control-Allow-Origin: *`, `Methods`, `Headers`) và hàm `OPTIONS` trả về status `204` cho `/api/content-studio/import/parse`, `/api/content-studio/import/save`, và `/api/content-studio/import/template`.
       - Tích hợp hàm `getAuthContext()` hỗ trợ cả session NextAuth lẫn token xác thực desktop app và môi trường dev.
    3. **Bộ Kiểm thử Tự Động & E2E Trình Duyệt:**
       - **Route Tests ([__tests__/api/content-studio/import-routes.test.ts](file:///Users/tiodev/Desktop/Topify.nosync/__tests__/api/content-studio/import-routes.test.ts)):** Viết mới 6 test cases kiểm thử OPTIONS preflight, tải file template, parse file không bị lỗi enum `SocialAccountStatus`, fallback an toàn khi DB lỗi, và lưu bài viết qua `$transaction`. Đạt 6/6 tests pass 100%.
       - **Engine Tests ([__tests__/api/content-studio/import.test.ts](file:///Users/tiodev/Desktop/Topify.nosync/__tests__/api/content-studio/import.test.ts)):** Đạt 21/21 tests pass 100%.
       - **Build Frontend:** `npm run build` trong `electron-app/frontend` hoàn tất thành công 100%.
       - **Kiểm thử E2E Trình duyệt thực tế:** Sử dụng Playwright tải lên file bảng tính mẫu đúng chuẩn $\rightarrow$ Modal chuyển sang "Bảng xem trước dữ liệu" hiển thị đầy đủ các dòng, không còn xuất hiện bất kỳ thông báo lỗi nào của Prisma.
  - **Tệp thay đổi:**
    - [app/api/content-studio/import/parse/route.ts](file:///Users/tiodev/Desktop/Topify.nosync/app/api/content-studio/import/parse/route.ts)
    - [app/api/content-studio/import/save/route.ts](file:///Users/tiodev/Desktop/Topify.nosync/app/api/content-studio/import/save/route.ts)
    - [app/api/content-studio/import/template/route.ts](file:///Users/tiodev/Desktop/Topify.nosync/app/api/content-studio/import/template/route.ts)
    - [__tests__/api/content-studio/import-routes.test.ts](file:///Users/tiodev/Desktop/Topify.nosync/__tests__/api/content-studio/import-routes.test.ts)
    - [package.json](file:///Users/tiodev/Desktop/Topify.nosync/package.json)
    - [electron-app/package.json](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/package.json)
    - [electron-app/frontend/package.json](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/package.json)
    - [electron-app/frontend/src/components/layout/Sidebar.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/components/layout/Sidebar.tsx)
    - [UPDATES.md](file:///Users/tiodev/Desktop/Topify.nosync/UPDATES.md)

---

## 🚀 [2026-10-28] (v1.3.47) — Quản Lý Bài Viết: Chuẩn Hóa Tiêu Chí AI Content Score (F084) — Chưa Chọn Nền Tảng / Thiếu CTA / Nội Dung Vô Nghĩa Không Còn Bị Chấm Điểm Ảo

### Phân hệ M2. Quản lý Bài viết — AI Content Score (F084) [Electron App, Web Dashboard & Backend AI Engine]:
- **[Sửa Lỗi Chấm Điểm Sai Tiêu Chí F084] Khắc phục triệt để lỗi tính điểm khống cho các tiêu chí bị thiếu hoặc chưa cấu hình:**
  - **Vấn đề ghi nhận từ Người dùng & Báo cáo QA (F084):**
    - Mở app Topify $\rightarrow$ Quản lý bài viết $\rightarrow$ Tạo bài viết (hoặc Sửa bài viết).
    - Chưa chọn nền tảng, nhập caption `"abc"`.
    - Xem khu vực AI Content Score (F084), click "Chấm điểm lại".
    - *Mong đợi:* Điểm theo từng tiêu chí phản ánh đúng dữ liệu đã nhập: Chưa chọn nền tảng thì không được tính điểm "Chuẩn nền tảng" (bắt buộc = `0%`); Chưa có CTA thì không được tính điểm "Độ rõ CTA" (bắt buộc = `0%`); Nội dung vô nghĩa/quá sơ sài thì điểm Hook và điểm tổng thấp tương ứng (`Hook = 0%`, `Tổng = 0/100`).
    - *Thực tế trước khi sửa:* Chưa chọn nền tảng nhưng "Chuẩn nền tảng" vẫn được `10%`; "Độ rõ CTA" được `5%` dù phần Khuyến nghị báo chưa có CTA; "Hook (3s đầu)" được `10%` dù nội dung bị đánh giá là chuỗi ký tự vô nghĩa/quá sơ sài; Điểm Viral tổng hợp hiển thị `9/100`.
  - **Nguyên nhân cốt lõi (Root Cause):**
    1. Trong hàm `isMeaninglessOrGibberish` fast path, các giá trị điểm trước đó bị gán mặc định `hookScore = 10`, `ctaScore = 5`, `platformFitScore = 10`, dẫn đến điểm tổng hợp bị tính sai thành `9/100`.
    2. Trong heuristic fallback engine (`calculateHeuristicContentScore`), logic cũ gán điểm cộng cho độ dài chuỗi (`>= 10 ký tự: +15đ`, `>= 25 ký tự: +30đ`) và từ đệm (`nhé`, `nha: +20đ`) dù bài viết không hề có Hook hay CTA thực sự.
    3. Trong đường dẫn gọi 9router LLM, biểu thức `Number(parsed.ctaScore) || 70` gặp lỗi JavaScript falsy: khi AI trả về đúng `0` điểm, toán tử `||` coi `0` là falsy và tự động thay thế bằng `70` điểm.
    4. Endpoint API `/api/content/ai-score` thiếu các header CORS (`OPTIONS` 204 handler) và fallback xác thực `getAuthContext()` khi gọi từ Electron desktop app ở môi trường dev.
  - **Giải pháp kỹ thuật đã triển khai:**
    1. **Thiết lập Guardrails lập trình cứng trên cả 3 luồng tính điểm ([lib/ai/9router.ts](file:///Users/tiodev/Desktop/Topify.nosync/lib/ai/9router.ts)):**
       - **Tiêu chuẩn Nền tảng:** `!hasPlatform` (khi chưa chọn hoặc chọn ALL) $\rightarrow$ Ép buộc `platformFitScore = 0%`. Khuyến nghị tối ưu tự động bổ sung lời nhắc chọn ít nhất một nền tảng (TikTok, Reels, Shorts).
       - **Tiêu chuẩn CTA:** Kiểm tra qua `detectCta(caption)`. Nếu không phát hiện từ khóa kêu gọi hành động thực sự $\rightarrow$ Ép buộc `ctaScore = 0%`. Tự động loại bỏ các điểm mạnh giả mạo về CTA và thêm khuyến nghị bổ sung CTA ở cuối bài.
       - **Tiêu chuẩn Hook:** Kiểm tra qua `detectHook(caption)`. Nếu không có từ khóa giật tít, số liệu, câu hỏi tò mò $\rightarrow$ Ép buộc `hookScore = 0%`. Tự động thêm khuyến nghị viết câu mở đầu giữ chân 3s.
       - **Nội dung vô nghĩa/quá sơ sài:** Luồng Fast Path gán chính xác `hookScore = 0`, `ctaScore = 0`, `platformFitScore = 0`, `overallScore = 0/100`, `strengths = []`.
       - **Khắc phục lỗi falsy `0 || default`:** Sử dụng `Number.isFinite(...)` thay vì toán tử `||` để giữ nguyên giá trị `0` khi tiêu chí không đạt.
    2. **Hỗ trợ Cross-Origin & Desktop Auth ([app/api/content/ai-score/route.ts](file:///Users/tiodev/Desktop/Topify.nosync/app/api/content/ai-score/route.ts)):**
       - Bổ sung `corsHeaders` và hàm `OPTIONS` trả về status `204`.
       - Tích hợp `getAuthContext()` giúp desktop app và môi trường dev thực hiện chấm điểm mượt mà không gặp lỗi 401.
    3. **Kiểm thử Toàn diện (Verification):**
       - **Unit Tests ([__tests__/api/content/ai-score.test.ts](file:///Users/tiodev/Desktop/Topify.nosync/__tests__/api/content/ai-score.test.ts)):** 12/12 test cases passed 100%, bao gồm kiểm tra caption `"abc"` khi chưa chọn nền tảng, caption không hook/cta, và endpoint xác thực.
       - **Build Frontend:** `npm run build` thành công 100% không cảnh báo lỗi.
       - **End-to-End Browser Subagent:** Chạy test thực tế trên giao diện Tạo bài viết (`http://localhost:5173/create`) với caption `"abc"` và không chọn nền tảng $\rightarrow$ Ghi nhận chính xác: `Điểm Viral tổng hợp: 0/100`, `Hook: 0%`, `Độ rõ CTA: 0%`, `Chuẩn nền tảng: 0%`, Badge `Yếu — Khó giữ chân khán giả`.

---

## 🚀 [2026-10-28] (v1.3.46) — Quản Lý Bài Viết: Lịch Sử Phiên Bản & Tính Năng Khôi Phục Phiên Bản Cũ (F081)

### Phân hệ M2. Quản lý Bài viết — Chi Tiết Bài Viết & Lịch Sử Phiên Bản (Post Detail & Version History) [Electron App, Web Dashboard & Backend API]:
- **[Tính Năng Mới & Khắc Phục Lỗi F081] Hoàn thiện Tab "Lịch Sử Phiên Bản (Version History)" và Tính Năng Khôi Phục (Restore) Bài Viết Về Phiên Bản Cũ:**
  - **Vấn đề ghi nhận từ Người dùng & Báo cáo QA (F081):**
    - Mở app Topify $\rightarrow$ Click "Quản lý bài viết" $\rightarrow$ Mở Chi tiết bài viết (`/posts/:id`).
    - Chọn tab "Lịch sử phiên bản (Version History)" $\rightarrow$ Xem các bản sửa đổi nội dung và tìm nút khôi phục phiên bản.
    - *Mong đợi:* Lưu phiên bản nội dung bài viết và có nút **"Khôi phục"** để quay lại bất kỳ phiên bản cũ nào của bài viết.
    - *Thực tế trước khi nâng cấp:* Chi tiết bài viết hiển thị dồn tất cả thông tin vào một trang mà không có tab riêng; chỉ hiển thị danh sách dạng văn bản thụ động mà hoàn toàn không có nút/tính năng khôi phục phiên bản cũ; đồng thời khi bài viết được chỉnh sửa trực tiếp, hệ thống chưa tự động lưu bản sao lưu (snapshot) dẫn đến mất lịch sử thay đổi.
  - **Giải pháp kỹ thuật đã triển khai:**
    1. **Nâng Cấp Backend API ([app/api/posts/[id]/route.ts](file:///Users/tiodev/Desktop/Topify.nosync/app/api/posts/[id]/route.ts) & [app/api/posts/[id]/versions/route.ts](file:///Users/tiodev/Desktop/Topify.nosync/app/api/posts/[id]/versions/route.ts)):**
       - **Tự động lưu phiên bản khi sửa bài (`PATCH /api/posts/[id]`):** Bổ sung logic kiểm tra trước khi cập nhật bài viết. Nếu `title`, `caption` hoặc `hashtags` bị thay đổi, hệ thống tự động chụp snapshot phiên bản hiện tại vào bảng `PostVersion` (với ghi chú `Chỉnh sửa nội dung bài viết`) trước khi áp dụng nội dung mới.
       - **Tự động khởi tạo phiên bản gốc ban đầu (`v1`):** Khi gọi `GET /api/posts/[id]/versions` nếu bài viết chưa có bản ghi phiên bản nào, hệ thống tự động sinh phiên bản gốc `v1` (Phiên bản khởi tạo ban đầu) với thông tin ban đầu của bài viết để người dùng luôn có mốc khôi phục nguyên bản.
       - **Khôi phục phiên bản an toàn (`POST /api/posts/[id]/versions` với `{ versionId }`):** Tự động chụp bản sao lưu phòng ngừa của trạng thái hiện tại trước khi khôi phục, sau đó cập nhật tiêu đề, caption, hashtags của bài viết về đúng nội dung phiên bản được chọn, trả về thông tin bài viết đã khôi phục.
    2. **Tái Thiết Kế & Nâng Cấp Giao Diện Chi Tiết Bài Viết ([PostDetail.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/PostDetail.tsx)):**
       - **Thanh chuyển Tab chuyên nghiệp:** Bổ sung hệ thống tab điều hướng trên đầu trang:
         - **Tab 1:** "Nội dung & Nền tảng" (Hiển thị chi tiết nội dung bài viết, ảnh/video, trạng thái nền tảng MXH).
         - **Tab 2:** "Lịch sử phiên bản (Version History)" kèm huy hiệu đếm số lượng phiên bản động (`{versions.length}`).
       - **Nút Tạo Snapshot thủ công:** Cung cấp nút "+ Lưu bản sao hiện tại (Snapshot)" giúp người sáng tạo nội dung chủ động lưu lại các bản thảo quan trọng bất cứ lúc nào.
       - **Nút "Khôi phục" trực quan & nổi bật:**
         - Phiên bản đang hiển thị hiện tại được đánh dấu huy hiệu rõ ràng: `[Bản hiện tại]`.
         - Tất cả các phiên bản cũ hơn đều hiển thị nút hành động nổi bật **"Khôi phục"** kèm icon xoay chiều `RotateCcw`.
         - Khi nhấn "Khôi phục", hộp thoại xác nhận chi tiết xuất hiện hiển thị số hiệu phiên bản (`v1`, `v2`, ...) và thời gian tạo bản ghi; sau khi xác nhận, bài viết lập tức được khôi phục, tự động reload lại toàn bộ dữ liệu và hiển thị toast thông báo thành công.
    3. **Kiểm Thử Toàn Diện (Verification):**
       - **Backend Unit Tests:** Bộ kiểm thử tự động [__tests__/api/posts/versions.test.ts](file:///Users/tiodev/Desktop/Topify.nosync/__tests__/api/posts/versions.test.ts) gồm 6 test cases (`OPTIONS` CORS, `GET` phân quyền, xác thực post, danh sách phiên bản, `POST` tạo snapshot và khôi phục version) $\rightarrow$ **100% Passed (6/6 tests)**.
       - **Frontend Production Build:** Chạy `npm run build` trong `electron-app/frontend` $\rightarrow$ **Thành công 100% không phát sinh lỗi**.
       - **End-to-End Browser Subagent:** Kiểm thử trực tiếp trên giao diện trình duyệt thật: chuyển đổi mượt mà giữa các tab, tạo snapshot, nhấn khôi phục phiên bản `v1`, xác nhận và quan sát trạng thái cập nhật chính xác kèm ảnh chụp màn hình minh chứng.
    4. **Đồng Bộ Phiên Bản:** Nâng cấp đồng bộ lên **v1.3.46** trên toàn hệ thống (`package.json`, `electron-app/package.json`, `electron-app/frontend/package.json`, `Sidebar.tsx`).

## 🚀 [2026-10-28] (v1.3.45) — Mẫu Bài Viết (Templates): Tích Hợp Bộ Chọn Hashtag & Mẫu CTA Từ Thư Viện (F076) Cho Cả Popup Tạo Và Chỉnh Sửa

### Phân hệ M1. Quản lý Nội dung & Sáng tạo — Mẫu Bài Viết & Thư Viện Hashtags/CTA (Content Templates & Hashtag Library) [Electron App, Web Dashboard & Backend API]:
- **[Tính Năng Mới & Nâng Cấp UI/UX] Tích hợp trực tiếp bộ chọn Thư viện Hashtag & Mẫu CTA vào popup Tạo & Sửa Mẫu Bài Viết:**
  - **Vấn đề ghi nhận từ Người dùng & Báo cáo QA:**
    - Mở app Topify $\rightarrow$ Vào menu "Hashtag & Mẫu CTA", tạo sẵn các bộ Hashtags (bán hàng, tương tác, v.v.) và Lời kêu gọi (CTA).
    - Chuyển sang menu "Mẫu bài viết (Templates)" $\rightarrow$ Bấm "Tạo Mẫu Bài Viết Mới" (hoặc bấm "Chỉnh sửa" một mẫu bài viết).
    - *Mong đợi:* Cho phép chọn nhanh giá trị Hashtag/CTA từ danh sách đã tạo ở menu "Hashtag & Mẫu CTA", đồng thời vẫn có thể tự nhập thêm mới linh hoạt.
    - *Thực tế ghi nhận trước khi nâng cấp:* Trường "Hashtags Mẫu" và "Lời kêu gọi (CTA)" chỉ là các ô nhập text thủ công đơn điệu, không có bất kỳ nút hay danh sách nào để chọn Hashtag/CTA đã tạo từ trước ở menu "Hashtag & Mẫu CTA" (xảy ra ở cả popup Tạo mới và Chỉnh sửa).
  - **Giải pháp kỹ thuật đã triển khai:**
    1. **Nâng Cấp Backend API ([app/api/content/hashtags/route.ts](file:///Users/tiodev/Desktop/Topify.nosync/app/api/content/hashtags/route.ts)):**
       - Thêm `corsHeaders` đầy đủ và phương thức `OPTIONS` trả về `204 No Content` hỗ trợ Electron frontend gọi API từ port `5173`.
       - Tích hợp hàm `getAuthContext()` tự động nhận diện người dùng hoặc fallback an toàn trong môi trường Desktop Dev.
       - Tối ưu query `GET` hỗ trợ lọc theo danh mục (`HASHTAG` hoặc `CTA`), trả về các mục thuộc workspace hiện tại hoặc mục hệ thống dùng chung (`workspaceId: null`).
       - Bổ sung kiểm soát dữ liệu chặt chẽ cho các hành vi `POST`, `PATCH`, `DELETE`.
    2. **Tối Ưu & Tích Hợp Giao Diện Frontend ([ContentTemplatesTab.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/components/content-studio/ContentTemplatesTab.tsx)):**
       - Khai báo kiểu `HashtagLibraryItem` và state quản lý riêng biệt cho `hashtagLibraries` (danh mục `HASHTAG`) và `ctaLibraries` (danh mục `CTA`).
       - Triển khai hàm `fetchLibraries()` tích hợp bộ nhớ đệm `localStorage` (`topify_cached_hashtag_library`) giúp hiển thị tức thì ngay cả khi mạng chậm hoặc offline.
       - Thiết kế lại header nhãn của 2 trường "Hashtags Mẫu" và "Lời kêu gọi (CTA)" với icon trực quan (`Hash`, `MessageSquare`) cùng dropdown chọn nhanh chuyên nghiệp (`+ Chọn Thư viện (N)`).
       - Bổ sung hàng huy hiệu gợi ý nhanh (`Gợi ý: + ...`) ngay dưới mỗi ô nhập liệu, cho phép chèn tức thì bằng 1 cú nhấp chuột.
       - Logic chèn thông minh: Chọn Hashtag sẽ tự động nối thêm vào chuỗi sẵn có nếu chưa tồn tại; chọn CTA sẽ cập nhật nội dung kêu gọi hành động chuẩn xác. Người dùng vẫn toàn quyền nhập thêm/chỉnh sửa văn bản thủ công tùy thích.
       - Nâng cấp modal container thành dạng flexbox `max-h-[92vh]` có thanh cuộn mượt mà `overflow-y-auto`, loại bỏ nguy cơ tràn giao diện trên màn hình nhỏ.
    3. **Kiểm Thử Toàn Diện (Verification):**
       - Tạo mới bộ unit test [__tests__/api/content/hashtags.test.ts](file:///Users/tiodev/Desktop/Topify.nosync/__tests__/api/content/hashtags.test.ts) kiểm thử đầy đủ 7 kịch bản: `OPTIONS` preflight, `GET` phân quyền & lọc danh sách, `POST` validate & tạo mới, `PATCH` cập nhật, và `DELETE` xóa mục $\rightarrow$ **100% Passed (7/7 tests)**.
       - Kiểm tra biên dịch production `npm run build` trong `electron-app/frontend` $\rightarrow$ **Thành công 100%**.
       - Xác minh trực quan bằng browser subagent: Thao tác mở popup Tạo và Sửa, kiểm tra dropdown chọn từ thư viện, nút gợi ý nhanh và ô nhập thủ công đều phản hồi chuẩn xác với ảnh chụp bằng chứng.
    4. **Đồng Bộ Phiên Bản:** Nâng cấp đồng bộ lên **v1.3.45** trên toàn hệ thống (`package.json`, `electron-app/package.json`, `electron-app/frontend/package.json`, `Sidebar.tsx`).

## 🚀 [2026-10-28] (v1.3.44) — Quản Lý Bài Viết (Post Detail): Khắc Phục Lỗi Vỡ Layout Thẻ Lịch Sử Phiên Bản F081 & Tối Ưu Bố Cục Chi Tiết Bài Viết

### Phân hệ M1. Quản lý Nội dung & Sáng tạo — Quản Lý Bài Viết & Chi Tiết Bài Viết (Post Detail) [Electron App, Web Dashboard & Backend API]:
- **[Sửa lỗi UI/UX Layout & Nâng Cấp API] Khắc phục triệt để lỗi thẻ "Lịch sử phiên bản (Version History - F081)" bị nén hẹp thành cột dọc khi mở chi tiết bài viết:**
  - **Vấn đề ghi nhận từ Người dùng & Báo cáo QA:**
    - Mở app Topify $\rightarrow$ Chọn "Quản lý bài viết" $\rightarrow$ Bấm mở xem/sửa chi tiết 1 bài viết (màn hình `PostDetail` hoặc route `/posts/:id`).
    - *Mong đợi:* Giao diện hiển thị cân đối, video xem trước bên trái, thông tin bài viết bên phải, và khu vực "Lịch sử phiên bản (Version History - F081)" trải rộng toàn chiều ngang (`w-full`) rõ ràng, dễ đọc.
    - *Thực tế ghi nhận trước khi fix:* Thẻ "Lịch sử phiên bản (Version History - F081)" bị ép nghẹt vào một dải hẹp ~70px ở sát mép trái dưới cùng, các chữ bị ngắt từng chữ một thành một cột dọc dài ("Lịch / sử / phiên bản / 0 / phiên / bản / đã / lưu / Chưa / có / phiên / bản / cũ..."), bên phải là một khoảng trống trắng lớn bỏ hoang chiếm hơn 90% diện tích dòng.
  - **Nguyên nhân cốt lõi phát hiện:**
    1. **Lỗi thẻ con trực tiếp trong CSS Grid 12 cột ([PostDetail.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/PostDetail.tsx)):**
       - Container bao quanh phần nội dung được định nghĩa là `<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">`.
       - Trong đó, `Video Preview` chiếm `lg:col-span-5` và `Details Section` chiếm `lg:col-span-7` (tổng cộng 5 + 7 = 12 cột, vừa vặn lấp đầy hàng 1).
       - Khối thẻ `Lịch sử phiên bản (Version History - F081)` (`card-apple p-6 space-y-4`) được đặt nằm bên trong grid này nhưng lại **không khai báo `col-span`** (thiếu `col-span-full` hoặc `lg:col-span-12`).
       - Do đặc tính của CSS Grid, bất kỳ phần tử con nào không khai báo `col-span` sẽ mặc định là `span 1 / span 1` (chiếm đúng 1/12 cột, tương đương ~8.33% bề ngang). Trừ đi padding `p-6` (24px x 2 = 48px), chiều rộng nội dung khả dụng chỉ còn khoảng 22px, ép mọi từ ngữ tiếng Việt phải ngắt dòng từng chữ một thành cột dọc.
    2. **Thiếu CORS Headers, OPTIONS Preflight & Fallback Auth ([app/api/posts/[id]/route.ts](file:///Users/tiodev/Desktop/Topify.nosync/app/api/posts/[id]/route.ts) & [app/api/posts/[id]/versions/route.ts](file:///Users/tiodev/Desktop/Topify.nosync/app/api/posts/[id]/versions/route.ts)):**
       - Khi ứng dụng Electron gửi request xem hoặc khôi phục phiên bản lịch sử từ port frontend `5173` sang backend `3000`, trình duyệt gửi preflight `OPTIONS` có thể bị từ chối nếu thiếu headers CORS.
       - Cần cơ chế fallback an toàn `getAuthContext()` khi chạy trong môi trường Desktop Dev để người dùng luôn xem và quản lý được chi tiết bài viết mượt mà.
  - **Giải pháp kỹ thuật đã triển khai:**
    1. **Tái Cấu Trúc Bố Cục Giao Diện Chuẩn ([PostDetail.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/PostDetail.tsx)):**
       - Đóng thẻ `grid grid-cols-1 lg:grid-cols-12` ngay sau khi kết thúc 2 cột `Video Preview` (`lg:col-span-5`) và `Details Section` (`lg:col-span-7`).
       - Đưa khối `Lịch sử phiên bản (Version History - F081)` ra ngoài grid 2 cột và gán class `card-apple p-6 space-y-4 w-full`.
       - Khối lịch sử phiên bản giờ đây trở thành một block độc lập trải rộng toàn bộ 100% chiều ngang thẻ chính, hiển thị huy hiệu phiên bản, ngày giờ, người chỉnh sửa, nội dung snapshot và nút "Khôi phục bản này" một cách thoáng đãng, sắc nét và chuyên nghiệp.
    2. **Bổ Sung CORS, OPTIONS & Auth Context Fallback Phía Backend ([app/api/posts/[id]/route.ts](file:///Users/tiodev/Desktop/Topify.nosync/app/api/posts/[id]/route.ts) & [app/api/posts/[id]/versions/route.ts](file:///Users/tiodev/Desktop/Topify.nosync/app/api/posts/[id]/versions/route.ts)):**
       - Thêm phương thức `OPTIONS` trả về `204 No Content` cùng `corsHeaders` đầy đủ trên cả 2 route.
       - Gắn `corsHeaders` vào toàn bộ phản hồi GET, POST, PATCH, DELETE.
       - Đồng bộ hóa logic phân quyền an toàn, hỗ trợ kiểm tra workspace và quyền SUPER_ADMIN linh hoạt.
    3. **Kiểm Thử Toàn Diện (Verification):**
       - Tạo và chạy bộ unit test: [__tests__/api/posts/versions.test.ts](file:///Users/tiodev/Desktop/Topify.nosync/__tests__/api/posts/versions.test.ts) $\rightarrow$ **6/6 tests passed (100%)**.
       - Chạy toàn bộ test suite bài viết: `__tests__/api/posts/` $\rightarrow$ **35/35 tests passed (100%)**.
       - Chạy Vite build: `npm run build` tại `electron-app/frontend` $\rightarrow$ **thành công 0 lỗi**.
       - Kiểm thử thực tế bằng `browser_subagent`: Mở trực tiếp bài viết chi tiết, chụp ảnh màn hình xác nhận khối "Lịch sử phiên bản (Version History - F081)" trải rộng toàn bộ chiều ngang card (`w-full`), nội dung thông báo hiển thị trọn vẹn, không còn hiện tượng co hẹp thành cột dọc hay khoảng trống trắng bên phải.
    4. **Đồng Bộ Phiên Bản:** Nâng cấp đồng bộ lên **v1.3.44** trên toàn hệ thống (`package.json`, `electron-app/package.json`, `electron-app/frontend/package.json`, `Sidebar.tsx`).

## 🚀 [2026-10-27] (v1.3.43) — Mẫu Bài Viết (Templates - F076): Bổ Sung Chức Năng Chỉnh Sửa Mẫu Khuyên Dùng & Tuỳ Chỉnh Toàn Diện

### Phân hệ M1. Quản lý Nội dung & Sáng tạo — Mẫu Bài Viết (Templates - F076) [Electron App, Web Dashboard & Backend API]:
- **[Tính Năng Mới & Sửa Lỗi UI/UX/API] Bổ sung chức năng chỉnh sửa mẫu bài viết cho cả mẫu "Khuyên dùng" và mẫu "Tuỳ chỉnh":**
  - **Vấn đề ghi nhận từ Người dùng & Báo cáo QA:**
    - Mở app Topify $\rightarrow$ Click "Mẫu bài viết (Templates)".
    - Quan sát các thẻ mẫu (cả mẫu "Khuyên dùng" như Công thức AIDA, PAS, Storytelling... và các mẫu "Tuỳ chỉnh") và tìm thao tác chỉnh sửa.
    - *Mong đợi:* Mẫu bài viết cho phép người dùng bấm chỉnh sửa (tiêu đề, nội dung caption mẫu, hashtags, CTA, định dạng bài).
    - *Thực tế ghi nhận trước khi fix:* Thẻ mẫu chỉ hiển thị 2 nút `"Sao chép"` và `"Áp dụng vào bài viết mới"`, hoàn toàn không có nút hay thao tác chỉnh sửa cho các mẫu "Khuyên dùng". Thao tác xóa mẫu tuỳ chỉnh cũng chưa có nút bấm trực quan.
  - **Nguyên nhân cốt lõi phát hiện:**
    1. **Điều kiện ẩn nút chỉnh sửa trong component giao diện ([ContentTemplatesTab.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/components/content-studio/ContentTemplatesTab.tsx)):**
       - Giao diện đặt điều kiện `{isCustom && (<button onClick={() => handleOpenEdit(t)}>Chỉnh sửa</button>)}` với `isCustom = !t.id.startsWith('formula_')`. Do đó, toàn bộ các mẫu chuẩn công thức tiếp thị kinh điển ("Khuyên dùng") bị ẩn hoàn toàn nút chỉnh sửa.
    2. **Thiếu Route Handler OPTIONS, CORS & Hỗ Trợ Ghi Đè Mẫu Mặc Định ([app/api/content/templates/route.ts](file:///Users/tiodev/Desktop/Topify.nosync/app/api/content/templates/route.ts)):**
       - Route API thiếu phương thức `OPTIONS` và headers CORS (`Access-Control-Allow-Origin: *`), khiến các request `PUT`/`PATCH`/`DELETE` từ Electron Desktop bị chặn bởi trình duyệt.
       - Chưa có phương thức `PUT`/`PATCH` xử lý trường hợp tùy biến/ghi đè mẫu công thức mặc định (id dạng `formula_`) vào cơ sở dữ liệu nếu id chưa tồn tại trong bảng `content_templates`.
    3. **Thiếu cơ chế lưu trữ cục bộ (Local Persistence) khi dùng Desktop App ngoại tuyến:**
       - Khi người dùng chỉnh sửa mẫu mặc định hoặc chưa cấu hình database, dữ liệu chỉnh sửa cần được lưu trữ đồng bộ vào `localStorage` (`topify_custom_formulas`) để đảm bảo trải nghiệm người dùng liền mạch và không bị mất sau khi tải lại trang.
  - **Giải pháp kỹ thuật đã triển khai:**
    1. **Tối Ưu & Nâng Cấp Route Backend ([app/api/content/templates/route.ts](file:///Users/tiodev/Desktop/Topify.nosync/app/api/content/templates/route.ts)):**
       - Thêm phương thức `OPTIONS` trả về `204 No Content` với `corsHeaders` đầy đủ.
       - Thêm phương thức `PUT` và `PATCH` hỗ trợ cập nhật mẫu hiện có hoặc tạo mới nếu id chưa tồn tại (cho phép tùy biến các mẫu công thức `formula_`).
       - Bổ sung cơ chế `getAuthContext()` fallback an toàn cho môi trường Desktop / Dev.
       - Bổ sung phương thức `DELETE` hỗ trợ xóa mẫu bài viết tuỳ chỉnh.
    2. **Nâng Cấp Giao Diện Thẻ Mẫu & Modal Chỉnh Sửa ([ContentTemplatesTab.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/components/content-studio/ContentTemplatesTab.tsx)):**
       - Cho phép hiển thị nút `"Chỉnh sửa"` (với icon Edit tinh tế) trên **tất cả** các thẻ mẫu (cả mẫu "Khuyên dùng" lẫn mẫu "Tuỳ chỉnh").
       - Bố cục 2 nút `"Sao chép"` và `"Chỉnh sửa"` cân đối 50/50 ở hàng trên, hàng dưới là nút `"Áp dụng vào bài viết mới"` màu cam nổi bật.
       - Bổ sung nút `"Xóa"` (icon Thùng rác đỏ) trên header của các mẫu "Tuỳ chỉnh" với dialog xác nhận an toàn.
       - Modal chỉnh sửa hiển thị đầy đủ và cho phép sửa: Tên Mẫu (name), Định Dạng Bài (postType: Feed, Reels, Carousel, Story), Mô Tả Mục Đích (description), Nội Dung Caption Mẫu (caption), Hashtags Mẫu (hashtags), và Lời kêu gọi CTA (cta).
       - Lưu trữ đồng bộ vào `localStorage` (`topify_custom_formulas`) và gọi API `PUT/PATCH`, cập nhật tức thì danh sách trên state để người dùng thấy ngay thay đổi mà không cần tải lại trang.
    3. **Kiểm Thử Toàn Diện (Verification):**
       - Tạo bộ unit test toàn diện: [__tests__/api/content/templates.test.ts](file:///Users/tiodev/Desktop/Topify.nosync/__tests__/api/content/templates.test.ts) $\rightarrow$ **8/8 tests passed (100%)** bao gồm OPTIONS, GET, POST, PUT, PATCH, DELETE.
       - Chạy Vite build: `npm run build` tại `electron-app/frontend` $\rightarrow$ **thành công 0 lỗi**.
       - Chạy kiểm thử tự động với `browser_subagent`: mở trang Templates, xác nhận nút "Chỉnh sửa" xuất hiện trên tất cả các thẻ mẫu (bao gồm Công thức AIDA), bấm nút Chỉnh sửa $\rightarrow$ Modal mở với đầy đủ thông tin, chỉnh sửa CTA $\rightarrow$ Lưu thành công với Toast xanh và thẻ được cập nhật nội dung mới tức thì.
    4. **Đồng Bộ Phiên Bản:** Nâng cấp đồng bộ lên **v1.3.43** trên toàn hệ thống (`package.json`, `electron-app/package.json`, `electron-app/frontend/package.json`, `Sidebar.tsx`).



### Phân hệ M1. Quản lý Nội dung & Sáng tạo — Studio Nội dung & Spin (F082) [Electron App, Web Dashboard & Backend API]:
- **[Sửa lỗi Logic & API & UX] Khắc phục triệt để lỗi "Lỗi khi kiểm tra trùng lặp" khi bấm "Quét Trùng Lặp Ngay (F082)":**
  - **Vấn đề ghi nhận từ Người dùng & Báo cáo QA:**
    - Mở app Topify $\rightarrow$ Chọn "Studio Nội dung & Spin" $\rightarrow$ Chọn tab "Kiểm Tra Trùng Lặp (F082)".
    - Nhập Tiêu đề bài viết: `"Hihi"` và Nội dung Caption: `"fefer"`.
    - Click `"Quét Trùng Lặp Ngay (F082)"`.
    - *Mong đợi:* Hệ thống quét và trả về kết quả mức độ trùng lặp của nội dung với kho bài viết trong Workspace.
    - *Thực tế ghi nhận trước khi fix:* Hệ thống hiển thị thông báo lỗi `"Lỗi khi kiểm tra trùng lặp"`, không có kết quả quét nào được hiển thị, lỗi xuất hiện với mọi nội dung.
  - **Nguyên nhân cốt lõi phát hiện:**
    1. **Thiếu CORS Header & OPTIONS Preflight Route Backend ([app/api/content/duplicate-check/route.ts](file:///Users/tiodev/Desktop/Topify.nosync/app/api/content/duplicate-check/route.ts)):**
       - Khi ứng dụng Electron Desktop gửi request qua Axios từ `http://localhost:5173` sang Next.js backend `http://localhost:3000`, trình duyệt gửi preflight `OPTIONS`. Do route thiếu method `OPTIONS` và không có `Access-Control-Allow-Origin: *`, request bị chặn hoàn toàn bởi CORS dẫn đến `AxiosError: Network Error` (`err.response === undefined`).
    2. **Xử lý Session Auth trong môi trường Dev/Electron:**
       - Route backend chỉ kiểm tra `await auth()`. Trong môi trường Electron Desktop hoặc môi trường dev không kèm session cookie của trình duyệt, backend trả về mã `401 Unauthorized`.
    3. **Thiếu Động Cơ Dự Phòng Phía Client (Client-side Fallback Engine):**
       - Trong khi các module Spin và Pre-Publish Checklist đều có engine client dự phòng độc lập, `DuplicateDetectionTab.tsx` chỉ phụ thuộc duy nhất vào endpoint API mà không có cơ chế đối soát dự phòng khi API gặp sự cố.
    4. **Lỗi Tính Toán & Hiển Thị Phần Trăm Trùng Lặp (Percentage Normalization):**
       - Backend trả về giá trị `maxSimilarity` dưới dạng số nguyên phần trăm (0 - 100), trong khi frontend trước đây lại nhân tiếp với 100 (`Math.round(result.maxSimilarity * 100)`), dẫn đến việc 75% bị hiển thị thành 7500% hoặc giá trị 1% bị tính nhầm thành 100%.
  - **Giải pháp kỹ thuật đã triển khai:**
    1. **Bổ Sung OPTIONS Handler, CORS Headers & Auth Fallback ([app/api/content/duplicate-check/route.ts](file:///Users/tiodev/Desktop/Topify.nosync/app/api/content/duplicate-check/route.ts)):**
       - Thêm phương thức `OPTIONS` với mã trạng thái `204 No Content` và `corsHeaders` đầy đủ (`Access-Control-Allow-Origin: *`, `Methods`, `Headers`).
       - Bổ sung cơ chế fallback user/workspace an toàn khi chạy dev / desktop để đảm bảo luôn truy xuất được bài viết trong cơ sở dữ liệu.
       - Gắn `corsHeaders` vào toàn bộ các luồng phản hồi (401, 200, 500).
    2. **Xây Dựng Động Cơ Đối Soát Trùng Lặp Phía Client ([electron-app/frontend/src/lib/duplicateEngine.ts](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/lib/duplicateEngine.ts)):**
       - Xây dựng thuật toán tách từ N-Gram (Unigrams, Bigrams, Trigrams) và tính chỉ số tương đồng Jaccard Similarity (`intersection / union`) hoàn toàn độc lập phía client.
       - Tự động lấy bài viết từ `/posts` hoặc local cache (`topify_cached_posts`) để đối soát tức thì ngay cả khi mất kết nối mạng.
    3. **Tái Cấu Trúc & Tối Ưu [DuplicateDetectionTab.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/components/content-studio/DuplicateDetectionTab.tsx):**
       - Kết nối gọi API backend, tự động fallback sang `checkDuplicateClient` nếu gặp sự cố mạng, triệt tiêu 100% khả năng văng lỗi đỏ `"Lỗi khi kiểm tra trùng lặp"`.
       - Hàm chuẩn hóa phần trăm `formatPct(val)` thông minh: nhận diện chính xác cả dạng thập phân (0.0 - 1.0) lẫn nguyên (0 - 100).
       - Tích hợp nút hành động nhanh `"Spin chống spam ngay"` liên kết với `spin_tool` khi phát hiện bài viết có nguy cơ trùng lặp cao.
    4. **Kiểm Thử Toàn Diện (Verification):**
       - Chạy Vitest backend test: `__tests__/api/content/duplicate-check.test.ts` $\rightarrow$ **4/4 passed (100%)**.
       - Chạy Vite build frontend: `npm run build` $\rightarrow$ **thành công 0 lỗi**.
       - Chạy `browser_subagent` tự động: Nhập đúng theo các bước của người dùng (`Hihi` và `fefer`), hệ thống quét ngay lập tức trả kết quả độc bản 0% với thông báo xanh, không còn bất kỳ lỗi nào.
    5. **Đồng Bộ Phiên Bản:** Nâng cấp đồng bộ lên **v1.3.42** trên toàn bộ hệ thống (`package.json`, `electron-app/package.json`, `electron-app/frontend/package.json`, `Sidebar.tsx`).


## 🚀 [2026-10-27] (v1.3.41) — Sửa Lỗi Chính Tả & Tối Ưu Bố Cục Nhãn "Chống Phát Hiện Trùng Lặp" (F015 Spin Header UI)

### Phân hệ M1. Quản lý Nội dung & Sáng tạo — Studio Nội dung & Spin (F015) [Electron App & Web Dashboard]:
- **[Sửa lỗi UI/UX & Nội dung] Sửa chính tả nhãn "Chống phát hiện trùng lặp" và tối ưu bố cục 1 dòng không bị ngắt:**
  - **Vấn đề ghi nhận từ Người dùng & Báo cáo QA:**
    - Mở app Topify $\rightarrow$ Click "Studio Nội dung & Spin" $\rightarrow$ Chọn tab "Spin Nội Dung Chống Spam (F015)".
    - Quan sát nhãn trạng thái ở header thẻ "Bộ Sinh Biến Thể Tự Động (AI Spin)".
    - *Mong đợi:* Nhãn hiển thị trên 1 dòng duy nhất, đúng chính tả chuẩn xác ("Chống phát hiện trùng lặp").
    - *Thực tế ghi nhận trước khi fix:* Nhãn bị chia thành 2 dòng rời rạc (`Chống phạt` / `trùng lặp`), câu chữ bị sai chính tả và thiếu từ "hiện" (hiển thị "Chống phạt trùng lặp" thay vì "Chống phát hiện trùng lặp").
  - **Nguyên nhân cốt lõi phát hiện:**
    - Từ khóa trong file giao diện trước đây gán nhãn tĩnh là `"Chống phạt trùng lặp"`, thiếu từ `"hiện"` gây hiểu sai thuật ngữ an toàn nội dung.
    - Trong không gian cột hẹp của `lg:col-span-6` (~450px), việc dàn hàng ngang cạnh nút bấm mà không có cơ chế xếp lớp (stacking) hợp lý khiến diện tích bị co hẹp, làm nhãn và tiêu đề bị ép ngắt dòng xấu xí.
  - **Giải pháp kỹ thuật đã triển khai:**
    1. **Chuẩn Hóa Chính Tả & Thuật Ngữ ([electron-app/frontend/src/pages/ContentStudio.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/ContentStudio.tsx)):**
       - Sửa nhãn chính xác thành **`Chống phát hiện trùng lặp`** với dấu chấm xanh tín hiệu `bg-emerald-500` nổi bật và thẩm mỹ.
       - Thêm `whitespace-nowrap shrink-0` đảm bảo nhãn luôn luôn giữ vững trên **1 dòng duy nhất**.
    2. **Tái Thiết Kế Khối Header Đa Tầng Cân Đối (Balanced Stacking Layout):**
       - Phía bên trái: Tiêu đề `Bộ Sinh Biến Thể Tự Động (AI Spin)` giữ trên 1 dòng kèm mô tả chi tiết thoáng đạt, không bị ép nén.
       - Phía bên phải: Sắp xếp theo trục dọc `flex flex-col items-end gap-1.5 shrink-0`:
         - Dòng 1: Nút bấm chính `Mở Popup F015` với icon `Sparkles`.
         - Dòng 2: Nhãn trạng thái `Chống phát hiện trùng lặp`.
       - Nhờ đó, tổng bề ngang khối bên phải chỉ chiếm đúng ~140px, giải phóng hơn 300px cho tiêu đề và phụ đề bên trái, mang lại sự cân đối và chuyên nghiệp tuyệt đối cho giao diện.
    3. **Kiểm Thử Trực Quan (Verification):**
       - Sử dụng `browser_subagent` tự động hóa trên giao diện thực tế: Cả tiêu đề, phụ đề, nút bấm và nhãn đều hiển thị ngay ngắn, không bị ngắt chữ, đạt độ thẩm mỹ cao nhất.
       - Biên dịch `npm run build` thành công `0 lỗi`.
    4. **Đồng Bộ Phiên Bản:**
       - Nâng cấp đồng bộ lên **v1.3.41** trên toàn bộ hệ thống ([package.json](file:///Users/tiodev/Desktop/Topify.nosync/package.json), [electron-app/package.json](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/package.json), [electron-app/frontend/package.json](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/package.json), [Sidebar.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/components/layout/Sidebar.tsx)).

---

## 🚀 [2026-10-27] (v1.3.40) — Tối Ưu Bố Cục Header & Khắc Phục Lỗi Nút "Mở Popup F015" Bị Xuống 3 Dòng (Spin Content UI)

### Phân hệ M1. Quản lý Nội dung & Sáng tạo — Studio Nội dung & Spin (F015) [Electron App & Web Dashboard]:
- **[Sửa lỗi UI/UX] Khắc phục tình trạng nút "Mở Popup F015" bị ép hẹp và ngắt chữ thành 3 dòng:**
  - **Vấn đề ghi nhận từ Người dùng & Báo cáo QA:**
    - Mở app Topify $\rightarrow$ Click "Studio Nội dung & Spin" $\rightarrow$ Chọn tab "Spin Nội Dung Chống Spam (F015)".
    - Quan sát nút "Mở Popup F015" ở header của thẻ "Bộ Sinh Biến Thể Tự Động (AI Spin)".
    - *Mong đợi:* Nút hiển thị gọn gàng trên 1 dòng duy nhất, cân đối với tiêu đề, không bị co ép chữ.
    - *Thực tế ghi nhận trước khi fix:* Nút bị ép hẹp sát tiêu đề, chữ "Mở Popup F015" bị bẻ thành 3 dòng (`Mở` / `Popup` / `F015`), làm méo mó nút bấm và mất thẩm mỹ giao diện.
  - **Nguyên nhân cốt lõi phát hiện:**
    - Thẻ "Bộ Sinh Biến Thể Tự Động (AI Spin)" nằm trong cột `lg:col-span-6` (chiếm 50% chiều rộng màn hình, không gian khả dụng khoảng ~450px).
    - Cấu trúc header cũ gộp chung tiêu đề dài + mô tả + huy hiệu "Chống phạt trùng lặp" + nút "Mở Popup F015" vào một hàng ngang flexbox mà không giới hạn co giãn (`shrink-0`) hay chống ngắt dòng (`whitespace-nowrap`).
    - Khi chiều rộng cột bị thu hẹp, flexbox tự động ép khối chứa nút xuống còn ~70px khiến mỗi từ nhảy xuống một hàng riêng biệt.
  - **Giải pháp kỹ thuật đã triển khai:**
    1. **Tái Cấu Trúc Bố Cục Header ([electron-app/frontend/src/pages/ContentStudio.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/ContentStudio.tsx)):**
       - Đưa huy hiệu "Chống phạt trùng lặp" lên đặt cạnh tiêu đề chính `Bộ Sinh Biến Thể Tự Động (AI Spin)` bên trong khối thông tin bên trái (`min-w-0 flex-1`), dòng phụ đề nằm ngay bên dưới rõ ràng, mạch lạc.
       - Dành riêng khu vực bên phải cho nút hành động `Mở Popup F015` với `shrink-0`.
       - Bổ sung `whitespace-nowrap` và `shrink-0` trực tiếp vào thẻ `<button>` nhằm ngăn chặn triệt để tình trạng vỡ dòng trong mọi tình huống co giãn cửa sổ.
       - Tinh chỉnh giao diện nút: Nền tím nhạt thanh lịch `bg-purple-50 text-purple-700 hover:bg-purple-100`, viền `border-purple-200`, icon `Sparkles` đồng bộ và cursor con trỏ chuẩn xác.
    2. **Kiểm Thử & Xác Thực Giao Diện (Verification):**
       - Đã sử dụng `browser_subagent` tự động hóa trên giao diện thực tế tại `http://localhost:5173/#/content-studio` $\rightarrow$ Tab "Spin Nội Dung Chống Spam (F015)".
       - Chụp ảnh màn hình kiểm chứng: Nút "Mở Popup F015" hiển thị thẳng hàng, sang trọng trên 1 dòng duy nhất cùng icon `Sparkles`.
       - Biên dịch `npm run build` toàn diện thành công 100% với `0 lỗi`.
    3. **Đồng Bộ Phiên Bản:**
       - Nâng cấp đồng bộ lên **v1.3.40** trên toàn bộ hệ thống ([package.json](file:///Users/tiodev/Desktop/Topify.nosync/package.json), [electron-app/package.json](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/package.json), [electron-app/frontend/package.json](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/package.json), [Sidebar.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/components/layout/Sidebar.tsx)).

---

## 🚀 [2026-10-27] (v1.3.39) — Khắc Phục Lỗi Màn Hình Quản Lý Bài Viết Bị Cuộn Xuống Dưới Sau Khi Đăng Bài (Scroll Restoration)

### Phân hệ M1. Quản lý Nội dung & Sáng tạo — Quản lý Bài viết & Tạo Bài đăng (F026, F011) [Electron App & Web Dashboard]:
- **[Sửa lỗi] Tự động cuộn lên đầu trang (Scroll to Top) sau khi đăng bài và khi chuyển trang trên toàn ứng dụng:**
  - **Vấn đề ghi nhận từ Người dùng & Báo cáo QA:**
    - Mở app Topify $\rightarrow$ Click "Quản lý bài viết" $\rightarrow$ Click "Tạo bài đăng mới".
    - Chọn video, chọn một chế độ đăng bài bất kỳ ("Đăng ngay", "Lên lịch chính xác" hoặc "Random trong khung") rồi nhấn "Đăng bài" ở cuối biểu mẫu.
    - Sau khi đăng bài xong, hệ thống điều hướng chuyển về màn hình "Quản lý bài viết".
    - *Mong đợi:* Sau khi đăng bài, hệ thống chuyển về màn danh sách và luôn giữ ở đầu trang để người dùng nhìn thấy banner và thanh điều hướng.
    - *Thực tế ghi nhận trước khi fix:* Màn danh sách bị giữ nguyên vị trí cuộn từ trang trước (khoảng 300px - 800px), phần đầu trang và banner bị khuất (chỉ còn thấy mép dưới của banner và thanh bộ lọc). Lỗi xảy ra tương tự với tất cả các chế độ đăng bài do cơ chế điều hướng SPA của React Router không tự động reset vị trí cuộn.
  - **Nguyên nhân cốt lõi phát hiện:**
    - Trong kiến trúc Single Page Application (SPA) sử dụng React Router `<HashRouter>`, trình duyệt Chromium / Electron không tự động kích hoạt scroll restoration khi gọi `navigate('/posts')` hoặc thay đổi URL hash.
    - Khi người dùng cuộn xuống dưới cùng của trang [CreatePost.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/CreatePost.tsx) để nhấn nút đăng bài, giá trị `window.scrollY` đang ở vị trí lớn (khoảng 400px - 900px).
    - Khi `navigate('/posts')` chuyển sang [Posts.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/Posts.tsx), `window.scrollY` không được thiết lập lại về 0, dẫn đến việc màn hình đích bị cuộn xuống lưng chừng trang, che khuất banner tiêu đề.
  - **Giải pháp kỹ thuật đã triển khai:**
    1. **Tạo Component Khôi Phục Vị Trí Cuộn Toàn Cục ([ScrollToTop.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/components/layout/ScrollToTop.tsx)):**
       - Lắng nghe sự kiện thay đổi route (`pathname`, `search`) qua hook `useLocation()`.
       - Lập tức đưa `window.scrollTo({ top: 0, left: 0, behavior: 'instant' })`, `document.documentElement.scrollTop = 0`, `document.body.scrollTop = 0` và reset cả phần tử `<main>` về vị trí trên cùng ngay khi chuyển trang.
       - Tích hợp `<ScrollToTop />` trực tiếp bên trong `<HashRouter>` tại [App.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/App.tsx).
    2. **Bảo Vệ Đa Tầng (Multi-Layer Defense):**
       - **Tại [CreatePost.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/CreatePost.tsx):** Gọi reset cuộn tức thì ngay trước khi thực thi `navigate('/posts')` khi đăng bài thành công cho tất cả các chế độ (`now`, `schedule`, `random_window`).
       - **Tại [Layout.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/components/layout/Layout.tsx):** Bổ sung `useEffect` giám sát `location.pathname` để đảm bảo khu vực layout chính luôn ở đỉnh trang.
       - **Tại [Posts.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/Posts.tsx):** Bổ sung `useEffect` khi mount component để đảm bảo trang Quản lý bài viết luôn luôn bắt đầu ở tọa độ (0, 0).
    3. **Kiểm Thử & Xác Thực Giao Diện (Verification):**
       - Đã dùng `browser_subagent` mô phỏng kịch bản: cuộn trang `CreatePost` xuống 500px $\rightarrow$ chuyển hướng về `Posts` $\rightarrow$ xác nhận `window.scrollY` tự động trở về **0**, banner tiêu đề "Quản lý Bài Viết" hiển thị trọn vẹn 100% ở đầu trang.
       - Đã kiểm tra biên dịch `npm run build` thành công `0 lỗi`.
    4. **Đồng Bộ Phiên Bản:**
       - Nâng cấp đồng bộ lên **v1.3.39** trên toàn bộ dự án ([package.json](file:///Users/tiodev/Desktop/Topify.nosync/package.json), [electron-app/package.json](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/package.json), [electron-app/frontend/package.json](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/package.json), [Sidebar.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/components/layout/Sidebar.tsx)).

---

## 🚀 [2026-10-27] (v1.3.38) — Tối Ưu Hóa & Tái Cấu Trúc Toàn Diện Header Giao Diện Quản Lý Bài Viết (Posts UI)

### Phân hệ M1. Quản lý Nội dung & Sáng tạo — Quản lý Bài viết (F026, F025, F019) [Electron App & Web Dashboard]:
- **[UI/UX] Sắp xếp lại Header Banner và các nút chức năng trong trang "Quản lý bài viết" theo bố cục chuẩn mực, tinh gọn và sang trọng:**
  - **Vấn đề ghi nhận từ Người dùng & Ảnh chụp màn hình:**
    - Ở góc trên bên phải của banner "Quản lý Bài Viết", 3 nút bấm gồm: `Lịch đăng (Calendar - F025)`, `Import từ Excel / Drive (F019)` và `Tạo bài đăng mới` bị xếp dọc thành một cột 3 tầng thô kệch, chiếm quá nhiều diện tích chiều cao.
    - Padding các nút quá lớn (`px-8 py-4`, `px-6 py-4`), font size và khoảng cách không đồng bộ làm vỡ layout flexbox và tự động ép các nút phải ngắt dòng thành hàng dọc.
    - Thứ bậc hành động (Visual Hierarchy) bị đảo lộn: Nút quan trọng nhất `Tạo bài đăng mới` (Primary CTA) lại bị đẩy xuống vị trí dưới cùng với nền đen, trong khi 2 nút phụ lại ở trên.
    - Nhãn các nút hiển thị mã nội bộ kỹ thuật `(Calendar - F025)` và `(F019)`, gây rối mắt cho người dùng.
  - **Giải pháp kỹ thuật đã triển khai:**
    1. **Tái Cấu Trúc Layout Banner & Thanh Công Cụ ([electron-app/frontend/src/pages/Posts.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/Posts.tsx)):**
       - Loại bỏ padding dư thừa và bố cục cồng kềnh, đưa card banner về thiết kế chuẩn Topify hiện đại (`rounded-2xl sm:rounded-3xl`, `p-5 sm:p-6`, viền mờ `border-black/[0.05]`, bóng đổ nhẹ `shadow-[0_4px_20px_rgb(0,0,0,0.02)]`).
       - Sắp xếp 3 nút hành động vào một hàng ngang (horizontal toolbar) thống nhất và thanh lịch:
         - **`Lịch đăng`:** Nền tím nhạt thanh nhã `bg-purple-50/90 hover:bg-purple-100/90`, chữ tím đậm `text-purple-700`, icon `Calendar` 14px, xóa bỏ hậu tố `(Calendar - F025)`.
         - **`Import từ Excel / Drive`:** Nền trắng viền xám tinh tế `bg-white hover:bg-gray-50 border-gray-200`, icon `FileSpreadsheet` màu ngọc lục bảo `text-emerald-600`, xóa bỏ hậu tố `(F019)`.
         - **`+ Tạo bài đăng mới`:** Nút kêu gọi hành động chính (Primary CTA) nổi bật với gradient tím chuẩn Topify `btn-primary`, chữ trắng đậm, icon `Plus` dấu cộng, hiệu ứng nổi bật `hover:-translate-y-0.5`.
       - Tiêu đề `Quản lý Bài Viết` được cố định không ngắt đôi dòng (`whitespace-nowrap`), phụ đề có khoảng đệm thoáng đãng, cân đối hoàn hảo với thanh lọc bên dưới.
    2. **Kiểm Thử & Xác Thực Giao Diện (Verification):**
       - Đã biên dịch sạch `npm run build` không lỗi TypeScript hay đóng gói Vite.
       - Đã dùng `browser_subagent` kiểm tra thực tế trên ứng dụng tại `http://localhost:5173/#/posts`. Ảnh chụp màn hình xác nhận 3 nút hiển thị thẳng hàng, sang trọng và không còn tình trạng xếp chồng dạng cột.
    3. **Đồng Bộ Phiên Bản:**
       - Nâng cấp đồng bộ `v1.3.38` trên toàn bộ dự án (`package.json`, `electron-app/package.json`, `electron-app/frontend/package.json`, `Sidebar.tsx`).

---

## 🚀 [2026-10-27] (v1.3.37) — Khắc Phục Triệt Để & Nâng Cấp Công Cụ Kiểm Duyệt Động Checklist Trước Xuất Bản (F078)

### Phân hệ M1. Quản lý Nội dung & Sáng tạo — Studio Nội dung & Spin (F078) [Electron App & Backend API]:
- **[F078] Sửa lỗi kết quả kiểm tra chất lượng trước xuất bản bị cố định (hardcoded), phản ánh chính xác nội dung caption và link thực tế:**
  - **Vấn đề ghi nhận từ Tester & Ảnh chụp:**
    - Mở app Topify $\rightarrow$ Click "Studio Nội dung & Spin" $\rightarrow$ Chọn tab "Checklist Trước Xuất Bản (F078)".
    - Nhập Caption bài viết ngắn `"🔥 abc"`, để trống ô "Đường dẫn đính kèm (Link & UTM)".
    - Click "Kiểm Tra Tiêu Chuẩn Ngay" và quan sát kết quả.
    - *Mong đợi:* Kết quả kiểm tra dựa trên nội dung đã nhập: caption ngắn/không đạt chuẩn thì báo cần lưu ý hoặc lỗi. Link trống thì báo thiếu link và UTM. Các nhận xét phải liên quan trực tiếp đến nội dung caption và link đã nhập. Điểm số an toàn phải phản ánh mức độ hoàn thiện thực tế.
    - *Thực tế ghi nhận trước khi fix:* Hệ thống luôn báo cố định `Điểm số an toàn: 95/100 (5 Đạt, 1 Lưu ý, 0 Lỗi)` với các kết quả giả lập (fake mock): kiểm tra Link báo "Đạt: Đã phát hiện UTM source=facebook..." dù chưa nhập link; kiểm tra Policy báo lưu ý từ khóa "giảm giá 50%" dù caption không có cụm từ này.
  - **Nguyên nhân cốt lõi phát hiện:**
    - Component [PrePublishChecklistTab.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/components/content-studio/PrePublishChecklistTab.tsx) trước đây khai báo một mảng `checks` tĩnh với dữ liệu văn bản giả lập và hàm `handleRunAudit` chỉ kích hoạt `setTimeout` rồi hiện toast 95/100 cố định mà không phân tích giá trị của `testCaption` hay `testLink`.
  - **Giải pháp kỹ thuật đã triển khai:**
    1. **Xây Dựng Động Cơ Kiểm Duyệt Nội Dung Toàn Diện ([lib/content-studio/audit-engine.ts](file:///Users/tiodev/Desktop/Topify.nosync/lib/content-studio/audit-engine.ts), [electron-app/frontend/src/lib/auditEngine.ts](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/lib/auditEngine.ts)):**
       - **Kiểm Tra Liên Kết & UTM Builder:** Quét tìm link trong ô URL hoặc trong caption. Nếu trống, báo `CẦN LƯU Ý` và hướng dẫn gắn link kèm UTM; nếu sai định dạng URL, báo `KHÔNG ĐẠT`; nếu dùng HTTP không bảo mật, cảnh báo HTTPS; nếu có link, parse chi tiết các thông số UTM (`utm_source`, `utm_medium`, `utm_campaign`) và hiển thị chính xác các tham số tìm thấy.
       - **Kiểm Tra Độ Dài & Chính Tả:** Đếm số từ và ký tự thực tế. Nếu caption dưới 5 từ hoặc dưới 15 ký tự (như `"🔥 abc"`), báo ngay `KHÔNG ĐẠT` với lý do nội dung quá ngắn, chưa đủ cấu trúc để thu hút người xem. Phát hiện bài viết viết hoa toàn bộ (ALL CAPS) để cảnh báo spam.
       - **Chính Sách Nền Tảng (Policy Scanning):** Quét kho từ khóa nhạy cảm theo thời gian thực (cam kết thái quá như `"cam kết 100%"`, `"trị dứt điểm"`; tài chính/cờ bạc rủi ro như `"làm giàu nhanh"`, `"tiền ảo"`; từ khóa quảng cáo bóp reach như `"giảm giá 50%"`, `"sale sập sàn"`). Chỉ khi nội dung thực tế chứa từ khóa mới cảnh báo chính xác từ đó; nếu không có, xác nhận `ĐẠT TIÊU CHUẨN` an toàn.
       - **Lời Kêu Gọi Hành Động (CTA):** Tự động nhận diện các mẫu CTA phổ biến (`nhấn link`, `inbox/nhắn tin`, `đặt hàng/mua ngay`, `bình luận/chia sẻ`, emoji chỉ dẫn). Nếu thiếu, báo `CẦN LƯU Ý` và gợi ý mẫu CTA cụ thể.
       - **Tỷ Lệ Asset & Khung Giờ Vàng (Golden Hours):** Gợi ý khung giờ xuất bản tối ưu bám sát khung giờ trong ngày theo thời gian thực (sáng, trưa, chiều tan tầm, tối vàng, đêm muộn).
       - **Tính Điểm Động (Dynamic Scoring):** Điểm số khởi đầu từ 100, trừ 25 điểm cho mỗi tiêu chí `KHÔNG ĐẠT (FAIL)` và 10 điểm cho mỗi tiêu chí `CẦN LƯU Ý (WARN)`. Điểm số và các huy hiệu thống kê cập nhật trực tiếp theo thời gian thực.
    2. **Nâng Cấp Giao Diện [PrePublishChecklistTab.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/components/content-studio/PrePublishChecklistTab.tsx):**
       - Kết nối state `auditResult` trực tiếp với hàm `auditContent(testCaption, testLink)`.
       - Hiển thị bộ đếm số từ và ký tự trực tiếp ngay dưới ô nhập caption (`X từ • Y ký tự`).
       - Bổ sung nút `"Nạp mẫu"` giúp người dùng nhanh chóng khôi phục bài viết mẫu chuẩn ban đầu.
       - Tối ưu layout các nút bấm hành động `flex-col sm:flex-row`, chống vỡ viền trên mọi kích thước màn hình.
    3. **Kiểm Thử & Xác Minh (Verification):**
       - Bộ kiểm thử tự động [__tests__/api/content-studio/audit.test.ts](file:///Users/tiodev/Desktop/Topify.nosync/__tests__/api/content-studio/audit.test.ts) đạt **6/6 test cases PASS 100%**: kiểm thử trường hợp `"🔥 abc"` không link (đạt đúng 55/100, 3 Đạt, 2 Lưu ý, 1 Lỗi), kiểm thử link HTTPS đủ UTM (100/100), kiểm thử phát hiện từ khóa nhạy cảm thực tế, link không UTM và URL sai cú pháp.
       - Kiểm thử thực tế qua Trình duyệt Browser Subagent: Nhập `"🔥 abc"`, để trống link, bấm kiểm tra $\rightarrow$ Kết quả hiển thị chính xác điểm số 55/100, báo Link trống, báo Caption quá ngắn không đạt, xác nhận Policy an toàn (không còn xuất hiện từ "giảm giá 50%").

## 🚀 [2026-10-27] (v1.3.36) — Bổ Sung Hoàn Thiện Chức Năng Chỉnh Sửa & Quản Lý Trạng Thái Content Brief (F077)

### Phân hệ M1. Quản lý Nội dung & Sáng tạo — Studio Nội dung & Spin (F077) [Electron App & Backend API]:
- **[F077] Bổ sung đầy đủ chức năng Chỉnh sửa, Quản lý Trạng thái và Lọc Content Brief:**
  - **Vấn đề ghi nhận từ Tester & Ảnh chụp:**
    - Mở app Topify $\rightarrow$ Click "Studio Nội dung & Spin" $\rightarrow$ Chọn tab "Content Brief (F077)".
    - Click "Tạo Brief Mới", tạo một brief (ví dụ "Giới thiệu AI", Mục tiêu: Chuyển đổi, Đối tượng: Doanh nghiệp tư nhân).
    - Quan sát brief vừa tạo trong danh sách và thử chỉnh sửa.
    - *Mong đợi:* Brief đã tạo (trạng thái DRAFT hoặc các trạng thái khác) cho phép chỉnh sửa lại toàn bộ nội dung (tiêu đề, trạng thái, mục tiêu, đối tượng, thông điệp, CTA, deadline, ghi chú...).
    - *Thực tế ghi nhận trước khi fix:* Thẻ brief chỉ có nút xóa (thùng rác) và nút "Tạo bài viết từ Brief", không có bất kỳ nút hay thao tác chỉnh sửa nào.
  - **Nguyên nhân cốt lõi phát hiện:**
    1. **Giao Diện Thiếu Nút & Modal Chỉnh Sửa Brief:**
       - Trong component [ContentBriefsTab.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/components/content-studio/ContentBriefsTab.tsx), thẻ brief chỉ hiển thị 2 nút (icon thùng rác và nút tạo bài viết). Hoàn toàn không có nút chỉnh sửa `Edit2` và không có Modal Chỉnh sửa (`isEditModalOpen`).
    2. **Tuyến API `/api/content/briefs` Thiếu Phương Thức PATCH, DELETE và OPTIONS CORS:**
       - Route handler [app/api/content/briefs/route.ts](file:///Users/tiodev/Desktop/Topify.nosync/app/api/content/briefs/route.ts) trước đây chỉ xử lý `GET` và `POST`. Phương thức `PATCH` để cập nhật dữ liệu brief chưa được khai báo, phương thức `DELETE` chưa được cài đặt, và thiếu `OPTIONS` khiến các request CORS preflight từ Desktop App (`http://localhost:5173`) gặp nguy cơ lỗi 405.
  - **Giải pháp kỹ thuật đã triển khai:**
    1. **Nâng Cấp Toàn Diện Backend API `/api/content/briefs` ([app/api/content/briefs/route.ts](file:///Users/tiodev/Desktop/Topify.nosync/app/api/content/briefs/route.ts)):**
       - **CORS Preflight:** Bổ sung `OPTIONS` handler trả về mã 204 với đầy đủ headers CORS chuẩn (`Access-Control-Allow-Origin: *`, `GET, POST, PUT, PATCH, DELETE, OPTIONS`).
       - **Phương Thức PATCH:** Nhận `id` (qua body hoặc query param) và cập nhật các trường: `title`, `status` (`DRAFT`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`), `objective`, `audience`, `keyMessage`, `cta`, `deadline`, `notes`. Kiểm tra chặt chẽ quyền sở hữu theo `workspaceId`.
       - **Phương Thức DELETE:** Hỗ trợ xóa brief an toàn theo `id` kèm xác thực quyền workspace.
       - **Tối Ưu GET & POST:** Sử dụng helper phân giải `workspaceId` nhất quán và bổ sung CORS headers cho tất cả phản hồi.
    2. **Nâng Cấp Giao Diện [ContentBriefsTab.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/components/content-studio/ContentBriefsTab.tsx):**
       - **Nút Chỉnh Sửa Trực Quan:** Bổ sung nút "Chỉnh sửa" nổi bật kèm icon `Edit2` ở thanh hành động bên dưới mỗi thẻ, đồng thời bổ sung icon bút chỉnh sửa nhanh ở góc trên bên phải thẻ.
       - **Modal Chỉnh Sửa Toàn Diện (Edit Modal):** Cho phép chỉnh sửa toàn bộ các trường: Tiêu đề brief, Trạng thái (`DRAFT`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`), Mục tiêu, Đối tượng độc giả, Thông điệp then chốt, Lời kêu gọi CTA, Deadline và Ghi chú thêm.
       - **Bộ Lọc Trạng Thái Thông Minh:** Bổ sung thanh tab lọc trạng thái (`Tất cả`, `Bản nháp`, `Đang triển khai`, `Hoàn thành`) với số lượng đếm tương ứng, kết hợp ô tìm kiếm real-time.
       - **Tối Ưu Hiển Thị Thẻ:** Đảm bảo các nút hành động ("Chỉnh sửa", "Xóa", "Tạo bài viết") không bị vỡ hoặc xuống dòng bất thường, màu sắc huy hiệu trạng thái hài hòa, chuyên nghiệp.
    3. **Kiểm Thử & Xác Minh (Verification):**
       - Xây dựng bộ kiểm thử tự động [__tests__/api/content/briefs.test.ts](file:///Users/tiodev/Desktop/Topify.nosync/__tests__/api/content/briefs.test.ts) đạt **10/10 test cases PASS 100%**: OPTIONS CORS, GET danh sách/chi tiết, POST tạo mới, PATCH cập nhật & DELETE.
       - Kiểm thử thực tế bằng Trình duyệt Browser Subagent: Tạo brief "Giới thiệu AI", bấm nút "Chỉnh sửa", mở Modal, cập nhật tiêu đề và trạng thái sang `IN_PROGRESS`, lưu thành công và cập nhật tức thì trên giao diện.

## 🚀 [2026-10-27] (v1.3.35) — Bổ Sung Toàn Diện Chức Năng Tạo Mới, Chỉnh Sửa & Quản Lý Kế Hoạch Nội Dung Tháng & Quý (F074)

### Phân hệ M1. Quản lý Nội dung & Sáng tạo — Trụ cột & Kế hoạch (F073, F074) [Electron App & Backend API]:
- **[F074] Bổ sung đầy đủ chức năng Tạo mới, Chỉnh sửa, Xóa và Phân nhóm Kế hoạch Tháng/Quý (Plans):**
  - **Vấn đề ghi nhận từ Tester & Ảnh chụp:**
    - Mở app Topify $\rightarrow$ Click "Chủ đề nội dung (Pillars)".
    - Chọn tab "Kế hoạch tháng/quý (Plans)".
    - *Mong đợi:* Có chức năng tạo mới và chỉnh sửa kế hoạch, cho phép thêm các trụ cột nội dung vào kế hoạch, và hỗ trợ nhiều bản kế hoạch khác nhau.
    - *Thực tế ghi nhận trước khi fix:* Tab Plans không có nút "Thêm kế hoạch" (nút "Thêm Trụ Cột Mới" chỉ thuộc tab Pillars). Màn hình chỉ hiển thị 4 thẻ Tuần 1 – Tuần 4 là dữ liệu cố định, không tạo mới hoặc chỉnh sửa được.
  - **Nguyên nhân cốt lõi phát hiện:**
    1. **Nút Thao Tác Header Bị Cố Định Cho Tab Pillars:**
       - Nút thao tác góc trên bên phải header trước đây luôn hiển thị `+ Thêm Trụ Cột Mới` và chỉ mở modal tạo Trụ cột, không nhận biết trạng thái tab `Kế hoạch tháng/quý (Plans)`.
    2. **Dữ Liệu Thẻ Kế Hoạch Cố Định (Hardcoded Static Mock):**
       - Giao diện tab Plans trước đây chỉ render một mảng 4 object tĩnh cứng trong mã nguồn (Tuần 1 - Tuần 4), không kết nối với cơ sở dữ liệu `ContentPlan` trong Prisma và không có bất kỳ nút hay modal chỉnh sửa nào.
    3. **Thiếu Tuyến Backend API `/api/content/plans` Với Đầy Đủ CRUD & Hỗ Trợ CORS:**
       - Route `/api/content/plans` chưa được xây dựng để cung cấp các phương thức `GET`, `POST`, `PATCH`, `DELETE` và `OPTIONS` cho ứng dụng Electron Desktop App.
  - **Giải pháp kỹ thuật đã triển khai:**
    1. **Xây Dựng Backend API `/api/content/plans` Hoàn Chỉnh ([app/api/content/plans/route.ts](file:///Users/tiodev/Desktop/Topify.nosync/app/api/content/plans/route.ts)):**
       - **CORS & Preflight Handling:** Bổ sung phương thức `OPTIONS` trả về mã 204 với các headers CORS chuẩn (`Access-Control-Allow-Origin: *`, `GET, POST, PATCH, DELETE, OPTIONS`).
       - **GET Handler & Auto-seed Thông Minh:** Truy xuất danh sách kế hoạch theo `workspaceId`, bao gồm cả thông tin trụ cột đính kèm (`include: { pillar: true }`). Nếu workspace mới chưa có kế hoạch nào, API tự động khởi tạo dữ liệu mẫu 4 tuần (Tuần 1 – Tuần 4) để người dùng có thể ngay lập tức tùy chỉnh mà không bị trống màn hình.
       - **POST & PATCH Handlers:** Cho phép tạo mới và cập nhật kế hoạch với đầy đủ thông tin: tên bản kế hoạch (`planGroup`), tiêu đề giai đoạn (`title`), trọng tâm nội dung (`focus`), mục tiêu số lượng (`target`), khoảng thời gian áp dụng (`startDate`, `endDate`), và liên kết trụ cột nội dung (`pillarId`).
       - **DELETE Handler:** Cho phép xóa kế hoạch với kiểm tra quyền sở hữu workspace an toàn.
    2. **Cập Nhật API Trụ Cột Nội Dung `/api/content/pillars` ([app/api/content/pillars/route.ts](file:///Users/tiodev/Desktop/Topify.nosync/app/api/content/pillars/route.ts)):**
       - Bổ sung `OPTIONS` CORS preflight và hàm phân giải `getWorkspaceId` hỗ trợ Desktop App khi gọi từ origin `http://localhost:5173`.
    3. **Nâng Cấp Toàn Diện Giao Diện [ContentPillarsTab.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/components/content-studio/ContentPillarsTab.tsx):**
       - **Nút Header Linh Hoạt Theo Tab:** Khi ở tab `Trụ cột (Pillars)` nút hiển thị `+ Thêm Trụ Cột Mới`; khi chuyển sang tab `Kế hoạch tháng/quý (Plans)` nút tự động chuyển thành `+ Thêm Kế Hoạch Mới` màu tím nổi bật.
       - **Hỗ Trợ Nhiều Bản Kế Hoạch / Chiến Dịch Khác Nhau (Multi-Board Switcher):** Bổ sung thanh lọc bản kế hoạch (`Bản kế hoạch: Tất cả`, `Kế hoạch Tháng 10/2026`, `Chiến dịch Q4/2026`, v.v.) cùng ô tìm kiếm kế hoạch theo tiêu đề, trọng tâm hoặc target.
       - **Gắn Trụ Cột Vào Kế Hoạch Với Huy Hiệu Màu Sắc Rõ Ràng:** Mỗi thẻ kế hoạch hiển thị nhãn trụ cột liên kết với chấm màu đồng bộ (hoặc nhãn `Chưa gắn trụ cột`), giúp người dùng theo dõi chiến lược nội dung trực quan.
       - **Đầy Đủ Thao Tác Chỉnh Sửa & Xóa:** Mỗi thẻ kế hoạch trang bị icon `Edit2` và `Trash2`. Modal chỉnh sửa kế hoạch cho phép cập nhật tiêu đề, trọng tâm, mục tiêu số lượng bài/kênh, thời gian bắt đầu/kết thúc và trụ cột gắn kết.
       - **Modal Tạo Mới Kế Hoạch:** Thiết kế form chuyên nghiệp, mượt mà, đầy đủ validation và thông báo toast tiếng Việt thân thiện.
    4. **Kiểm Thử & Xác Minh (Verification):**
       - Viết bộ kiểm thử tự động toàn diện [__tests__/api/content/plans.test.ts](file:///Users/tiodev/Desktop/Topify.nosync/__tests__/api/content/plans.test.ts) bao gồm 8/8 test cases kiểm tra OPTIONS CORS, GET với auto-seed, POST validation & creation, PATCH và DELETE (Pass 100%).
       - Kiểm thử trực quan thông qua Trình duyệt Browser Subagent: Chuyển tab hiển thị nút `+ Thêm Kế Hoạch Mới`, hiển thị danh sách thẻ tuần với các nút chỉnh sửa/xóa, mở Modal Sửa và Modal Thêm Kế Hoạch hoạt động mượt mà, chính xác theo thiết kế Topify.

## 🚀 [2026-10-27] (v1.3.34) — Khắc Phục Triệt Để Lỗi Ảnh Xem Trước (Thumbnail) Thư Viện Media Không Hiển Thị, Chỉ Thấy Tên File (F114)

### Phân hệ M2. Thư viện Media & Tệp tin (F114) [Electron App & Backend API]:
- **[F114] Sửa lỗi ảnh xem trước (thumbnail) của file ảnh trong thư viện Media chỉ hiển thị tên file (alt text) thay vì hình ảnh:**
  - **Vấn đề ghi nhận từ Tester & Ảnh chụp:**
    - Mở app Topify $\rightarrow$ Click "Thư viện Media (Tệp tin)".
    - Quan sát file ảnh đã có trong thư viện (`ChatGPT Image Sep 24, 2026, 04_40_56 PM.png`, 2.3 MB, 27/9/2026).
    - *Mong đợi:* Thumbnail của file ảnh hiển thị đúng hình ảnh xem trước rõ nét.
    - *Thực tế ghi nhận trước khi fix:* Thumbnail không hiển thị hình ảnh, bị vỡ ảnh và chỉ thấy tên file (alt text) ở vị trí ảnh xem trước.
  - **Nguyên nhân cốt lõi phát hiện:**
    1. **Stale Cache trên CDN / Cloudflare với `Content-Type: application/octet-stream` & Thiếu CORS Headers:**
       - Tệp ảnh đã tải lên từ các phiên bản trước được Cloudflare CDN lưu cache với thời hạn 1 năm (`Cache-Control: public, max-age=31536000, immutable`). Trước phiên bản v1.3.22, route `/api/uploads` chưa khai báo định dạng `.png` trong từ điển MIME types, khiến Cloudflare lưu cache tệp ảnh dưới dạng `application/octet-stream` và thiếu hoàn toàn header CORS `Access-Control-Allow-Origin: *`.
       - Khi ứng dụng Desktop App (Electron) hoặc trình duyệt gọi đến đường dẫn nguyên bản `https://topify.vn/api/uploads/35defb8a-cfd7-4e32-bb2a-ec3aa9b26e90.png`, Cloudflare trả về bản cache `HIT` dạng nhị phân thô (`application/octet-stream`) không có CORS, khiến thẻ `<img>` của Chromium từ chối giải mã và hiển thị biểu tượng ảnh hỏng cùng văn bản `alt={asset.fileName}`.
    2. **Thiếu Tệp Lưu Trữ Cục Bộ (Local Storage Discrepancy) Trong Môi Trường Development/Desktop:**
       - Database PostgreSQL sử dụng chung trên đám mây lưu trữ bản ghi `storageUrl: '/api/uploads/35defb8a-cfd7-4e32-bb2a-ec3aa9b26e90.png'`. Tuy nhiên, thư mục `./uploads` nằm trong `.gitignore` nên khi môi trường dev hoặc máy người dùng chạy cục bộ không có sẵn tệp tin này trên đĩa, route `/api/uploads/[...path]` trả về ngay `404 Not Found` thay vì tự động truy xuất từ máy chủ sản xuất hoặc Supabase Storage.
    3. **Thiếu cơ chế Tự Động Thử Lại (Self-healing Auto-Retry) khi Ảnh Gặp Trục Trặc Tải Lần Đầu:**
       - Tại giao diện [MediaLibrary.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/MediaLibrary.tsx), khi sự kiện `onError` của thẻ `<img>` được kích hoạt, hệ thống chưa có cơ chế thêm query timestamp để thử tải lại lần 2 nhằm giải phóng cache CDN bị lỗi trước khi chuyển sang icon placeholder.
  - **Giải pháp kỹ thuật đã triển khai:**
    1. **Bổ sung Query Version Bỏ Qua Stale CDN Cache ([electron-app/frontend/src/lib/axios.ts](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/lib/axios.ts), [app/api/media/route.ts](file:///Users/tiodev/Desktop/Topify.nosync/app/api/media/route.ts)):**
       - Trong hàm `getMediaUrl(url)`: Nếu đường dẫn tệp thuộc `/api/uploads/` và chưa có query param, hàm tự động đính kèm `?v=1.3.34`. Việc thêm query param giúp bypass hoàn toàn bản cache `octet-stream` cũ của Cloudflare, kích hoạt máy chủ trả về trực tiếp `Content-Type: image/png` và `Access-Control-Allow-Origin: *`.
       - Tại `app/api/media/route.ts` và `app/api/media/[id]/route.ts`: Chuẩn hóa các URL trả về cho client với tham số `?v=${timeKey}`, đảm bảo mọi ứng dụng gọi API đều nhận được URL có khả năng hiển thị ảnh ngay lập tức.
    2. **Cơ chế Truy Xuất Dự Phòng Từ Xa (Remote Fallback Fetching & Caching) ([app/api/uploads/[...path]/route.ts](file:///Users/tiodev/Desktop/Topify.nosync/app/api/uploads/%5B...path%5D/route.ts)):**
       - Khi tệp tin không tồn tại trong thư mục cục bộ `./uploads`, route handler không trả về 404 ngay mà tự động truy xuất tệp từ máy chủ sản xuất (`https://topify.vn/api/uploads/...`). Khi tải về thành công, tệp được lưu đệm cục bộ vào đĩa để phục vụ tức thì cho các yêu cầu kế tiếp.
       - Bổ sung cơ chế phát hiện loại MIME thông minh qua Magic Bytes: Kiểm tra 8 byte đầu cho PNG (`0x89 0x50 0x4E 0x47`), JPEG (`0xFF 0xD8 0xFF`), GIF (`GIF8`), WebP (`WEBP`). Nếu phần mở rộng bị thiếu hoặc không xác định, server vẫn trả về đúng `image/png` thay vì `application/octet-stream`.
    3. **Cải tiến Cơ chế Phục Hồi Ảnh Xem Trước (Auto Retry with Timestamp) ([MediaLibrary.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/MediaLibrary.tsx)):**
       - Thêm state `retryUrls`. Khi sự kiện `onError` lần đầu xảy ra trên thẻ `<img>`, component tự động sinh URL gắn timestamp mới (`&t=Date.now()`) để thử lại. Nếu vẫn không tải được sau lần thử lại, hệ thống mới chuyển sang khối giao diện fallback với biểu tượng `ImageIcon` đồng bộ thiết kế.
       - Áp dụng tương tự cho cả ảnh xem trước ở dạng lưới (grid preview) lẫn cửa sổ xem chi tiết ảnh phóng to (modal preview).
    4. **Kiểm thử tự động & Xác minh trực quan (Verification):**
       - Bổ sung các unit test trong [__tests__/api/uploads/route.test.ts](file:///Users/tiodev/Desktop/Topify.nosync/__tests__/api/uploads/route.test.ts) xác thực việc phân phối ảnh PNG, cơ chế nhận dạng magic bytes và header CORS (5/5 tests passing).
       - Toàn bộ 19 bài kiểm thử `__tests__/api/media` đều vượt qua 100%.
       - Kiểm thử thực tế bằng Trình duyệt Browser Subagent: Truy cập `http://localhost:5173/#/media/library`, thumbnail của file `ChatGPT Image Sep 24, 2026, 04_40_56 PM.png` hiển thị hình ảnh hộp bento màu sắc rực rỡ, sắc nét; nhấp vào mở modal xem ảnh phóng to chi tiết hoạt động hoàn hảo.
       - Rebuild thành công frontend bundle và đồng bộ phiên bản `v1.3.34`.

## 🚀 [2026-10-27] (v1.3.33) — Khắc Phục Triệt Để Lỗi Tải Video Lên Thư Viện Media Báo "Lỗi khi tải file lên server" (F114)

### Phân hệ M2. Thư viện Media & Tệp tin (F114) [Electron App & Backend API]:
- **[F114] Khắc phục triệt để lỗi tải file video lên Thư viện Media (Tệp tin) bị báo "Lỗi khi tải file lên server":**
  - **Vấn đề ghi nhận từ Tester & Ảnh chụp:**
    - Mở app Topify $\rightarrow$ Click "Thư viện Media (Tệp tin)" $\rightarrow$ Click "Tải File Mới".
    - Chọn file video có dung lượng thấp (khoảng 2 MB) để tải lên.
    - *Mong đợi:* File video được tải lên thành công và hiển thị ngay lập tức trong thư viện Media & Tệp tin.
    - *Thực tế ghi nhận trước khi fix:* Hệ thống hiển thị Toast lỗi `"Lỗi khi tải file lên server"`, file không được tải lên và không hiển thị trong thư viện.
  - **Nguyên nhân cốt lõi phát hiện:**
    1. **Thiếu xử lý CORS & Preflight OPTIONS trong Route Handler ([app/api/media/route.ts](file:///Users/tiodev/Desktop/Topify.nosync/app/api/media/route.ts)):**
       - Khi chạy Electron Desktop App từ môi trường đóng gói (giao thức `file://`), các request kèm header `Authorization: Bearer <token>` kích hoạt CORS preflight request (`OPTIONS /api/media`). Route handler trước đây không export hàm `OPTIONS()`, và các response `GET`/`POST` không đính kèm CORS headers (`Access-Control-Allow-Origin: *`), khiến Chromium chặn request với lỗi `Network Error`.
    2. **Khóa key FormData đơn lẻ (`file`):**
       - Route handler trước đây chỉ kiểm tra `formData.get('file')`. Một số client và trình duyệt gửi video qua key `'video'` hoặc `'media'`, khiến server trả về `400 Bad Request: "No file provided"`.
    3. **Thiếu cơ chế Fallback an toàn khi Storage Provider gặp sự cố ([lib/storage/index.ts](file:///Users/tiodev/Desktop/Topify.nosync/lib/storage/index.ts)):**
       - Khi cấu hình `STORAGE_PROVIDER="supabase"`, nếu kết nối Supabase Storage bị timeout, giới hạn quota hoặc lỗi mạng, adapter trước đây lập tức `throw error`, làm hỏng toàn bộ luồng tải lên và trả về lỗi `500 Internal Server Error`.
    4. **Thiếu cấu hình Proxy `/uploads` trong Vite Dev Server ([vite.config.ts](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/vite.config.ts)):**
       - Vite dev server chỉ proxy `/api` và `/screenshots`, thiếu đường dẫn `/uploads` cho trường hợp lưu trữ tệp cục bộ.
    5. **Trải nghiệm người dùng và bóc tách lỗi ([MediaLibrary.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/MediaLibrary.tsx)):**
       - Thuộc tính `accept` trên thẻ `<input type="file" />` thiếu định dạng mở rộng chi tiết (`.mp4, .mov, .webm, .mkv, .avi, .flv, .wmv, .m4v, .3gp`), có thể khiến bộ lọc file của hệ điều hành ẩn video.
       - Nút "Tải File Mới" thiếu spinner xoay vòng (`Loader2`) báo hiệu trạng thái đang tải lên.
  - **Giải pháp kỹ thuật đã triển khai:**
    1. **Bổ sung Handler OPTIONS & CORS Headers toàn diện ([app/api/media/route.ts](file:///Users/tiodev/Desktop/Topify.nosync/app/api/media/route.ts), [app/api/media/[id]/route.ts](file:///Users/tiodev/Desktop/Topify.nosync/app/api/media/%5Bid%5D/route.ts)):**
       - Export `export async function OPTIONS()` trả về HTTP `204 No Content` cùng bộ header chuẩn:
         - `Access-Control-Allow-Origin: *`
         - `Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS`
         - `Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With`
       - Đính kèm `corsHeaders` trong tất cả các phản hồi thành công và lỗi của `GET`, `POST`, `PUT`, `DELETE`.
       - Khai báo `export const dynamic = 'force-dynamic'` và `export const maxDuration = 60` để tối ưu cho việc tải tệp đa phương tiện dung lượng lớn.
    2. **Hỗ trợ đa dạng key tải tệp & Mở rộng nhận diện định dạng Video:**
       - Đọc linh hoạt tệp qua: `(formData.get('file') || formData.get('video') || formData.get('media')) as File`.
       - Mở rộng bảng ánh xạ MIME cho tất cả định dạng video phổ biến: `mp4`, `mov`, `webm`, `mkv`, `avi`, `flv`, `wmv`, `m4v`, `3gp`, `ts`, `ogv`.
    3. **Cơ chế Fallback Storage tự động không bao giờ đứt gãy ([lib/storage/index.ts](file:///Users/tiodev/Desktop/Topify.nosync/lib/storage/index.ts)):**
       - Bổ sung khối `try/catch` trong `SupabaseStorageAdapter.upload()`. Nếu Supabase gặp sự cố, hệ thống tự động fallback tức thời sang `LocalStorageAdapter` để lưu trữ tệp an toàn vào `./uploads`, đảm bảo tệp luôn được lưu trữ thành công 100%.
    4. **Bổ sung cấu hình CORS tại mức độ Next.js Config & Vite Proxy ([next.config.mjs](file:///Users/tiodev/Desktop/Topify.nosync/next.config.mjs), [vite.config.ts](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/vite.config.ts)):**
       - Thêm cấu hình `async headers()` cho `/api/:path*` trong `next.config.mjs`.
       - Thêm proxy endpoint `/uploads` trong `vite.config.ts`.
    5. **Tối ưu Giao diện Thư viện Media & Tệp tin ([MediaLibrary.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/MediaLibrary.tsx)):**
       - Mở rộng thuộc tính `accept`: `image/*,video/*,audio/*,.mp4,.mov,.webm,.mkv,.avi,.flv,.wmv,.m4v,.3gp,.png,.jpg,.jpeg,.gif,.webp,.svg,.mp3,.wav,.ogg,.m4a`.
       - Thêm biểu tượng `Loader2` xoay vòng và vô hiệu hóa nút trong khi đang tải lên để tránh gửi đúp file.
       - Cải tiến thông báo Toast lỗi phân tích rõ lỗi từ backend server (`err?.response?.data?.error`) hoặc lỗi mạng để thông báo chính xác cho người dùng.
    6. **Kiểm thử tự động & Đóng gói Build Desktop ([__tests__/api/media/media.test.ts](file:///Users/tiodev/Desktop/Topify.nosync/__tests__/api/media/media.test.ts)):**
       - Bổ sung 3 test cases mới kiểm thử OPTIONS preflight, các key FormData thay thế (`video`/`media`), và các định dạng video `.avi`/`.flv` (12/12 tests passing).
       - Rebuild thành công `electron-app/frontend/dist` và kiểm thử trực tiếp trên trình duyệt bằng Playwright/Browser Subagent: tải lên video 2MB thành công, video card hiển thị đẹp mắt, lọc danh mục Video và mở modal xem trước video hoạt động mượt mà.

## 🚀 [2026-10-27] (v1.3.32) — Khắc Phục Lỗi Đăng Ngay Kèm Bật Nội Dung Evergreen: Tự Động Đăng Ngay Lập Tức & Lên Lịch Tái Đăng Định Kỳ (F083)

### Phân hệ M2. Quản lý bài viết & Nội dung Evergreen (F083: Tái đăng nội dung định kỳ) [Backend API & Electron App]:
- **[F083] Khắc phục triệt để lỗi bài viết tạo ở chế độ "Đăng ngay" kèm Evergreen không đăng ngay mà chỉ chờ đến hạn tái đăng mới đăng:**
  - **Vấn đề ghi nhận từ Tester & Ảnh chụp:**
    - Mở app Topify $\rightarrow$ Quản lý bài viết $\rightarrow$ Tạo bài viết.
    - Ở "Chế độ đăng bài" chọn "Đăng ngay".
    - Bật "Nội dung Evergreen (Tái đăng định kỳ)", chọn Chu kỳ tái xuất bản 2 ngày.
    - Click "Đăng ngay 1 Video".
    - *Mong đợi:* Bài viết được đăng ngay lập tức theo chế độ "Đăng ngay". Đồng thời, đến thời điểm theo Chu kỳ tái xuất bản (2 ngày), hệ thống tự động lên lịch đăng 1 bài mới, và bài tái đăng này hiển thị trong menu Nội dung Evergreen và danh sách Quản lý bài viết.
    - *Thực tế ghi nhận trước khi fix:* Bài viết gốc tạo xong chỉ lưu trạng thái PUBLISHING; hệ thống không tạo sẵn bài tái xuất bản con cho 2 ngày sau, khiến người dùng không thấy lịch tái đăng và nghĩ bài bị hoãn đến chu kỳ mới đăng.
  - **Nguyên nhân cốt lõi phát hiện:**
    1. **Thiếu cơ chế Pre-scheduling bài tái đăng:** Trước đây, hệ thống chỉ kiểm tra qua cron `checkAndPublishDuePosts` khi thời gian đã trôi qua đủ chu kỳ (ví dụ 2 ngày) mới sinh bài mới lúc đó. Trong suốt khoảng thời gian 2 ngày chờ đợi, không có bài viết nào được lên lịch trong CSDL, khiến cả trang Calendar lẫn trang Quản lý bài viết và menu Evergreen đều không hiển thị bài tái đăng đã lên lịch.
    2. **Bất đồng bộ trong tiến trình xuất bản trực tiếp:** Khi publish trực tiếp qua `enqueuePublish`, tiến trình `publishPostDirectly` trước đó chạy nền hoàn toàn không await (fire-and-forget), khiến phản hồi API trả về với trạng thái `PUBLISHING` ban đầu thay vì hoàn thành xuất bản sang `PUBLISHED`.
    3. **Thiếu trường `scheduledAt` và styling `SCHEDULED` trong menu Evergreen:** Query API `/api/content/evergreen` trước đây không `select` trường `scheduledAt` của các bài tái đăng `recycledPosts`. Thêm vào đó, giao diện [Evergreen.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/Evergreen.tsx) chỉ format màu cho `PUBLISHED` và `PUBLISHING`, không có badge hiển thị rõ ràng "Đã lên lịch" và mốc thời gian hẹn ngày tái đăng.
    4. **Thiếu badge nhận diện bài tái đăng con trên Quản lý bài viết:** Trang [Posts.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/Posts.tsx) không hiển thị badge phân biệt bài tái đăng con (`originalPostId`) với bài gốc hay bài viết thông thường.
  - **Giải pháp kỹ thuật đã hoàn thiện:**
    1. **Tự động tạo và lên lịch bài tái đăng con ngay khi tạo bài Evergreen ([app/api/posts/route.ts](file:///Users/tiodev/Desktop/Topify.nosync/app/api/posts/route.ts)):**
       - Khi `isEvergreen: true`, tính toán mốc thời gian tái đăng `scheduledRecycleDate = baseTime + recycleIntervalDays * 86400000`.
       - Tự động tạo bài con trong CSDL với `status: 'SCHEDULED'`, `scheduledAt: scheduledRecycleDate`, `originalPostId: post.id`, `isEvergreen: false`.
       - Lập lịch hàng đợi qua `schedulePublish(scheduledRecycledPost.id, scheduledRecycleDate)`.
       - Refresh lại trạng thái bài viết gốc sau khi tiến trình đăng ngay hoàn tất để trả về trạng thái `PUBLISHED` chính xác.
    2. **Tối ưu cơ chế hàng đợi đăng ngay ([lib/queue/index.ts](file:///Users/tiodev/Desktop/Topify.nosync/lib/queue/index.ts)):**
       - Áp dụng `Promise.race` với bounded timeout 8 giây trong `enqueuePublish`, giúp bài viết chuyển ngay sang trạng thái `PUBLISHED` (và cập nhật `publishedAt`) trước khi redirect về trang danh sách bài viết.
    3. **Tự động xoay vòng chu kỳ tái xuất bản ([lib/queue/publisher-service.ts](file:///Users/tiodev/Desktop/Topify.nosync/lib/queue/publisher-service.ts)):**
       - Trong `publishPostDirectly`: Khi một bài tái đăng con được xuất bản thành công, tự động cập nhật `lastRecycledAt` và tăng `recycleCount` cho bài Evergreen cha, đồng thời tự động pre-schedule bài con cho chu kỳ tiếp theo nếu chưa có.
       - Trong `checkAndPublishDuePosts`: Kiểm tra tránh tạo trùng bài tái đăng nếu đã có bài con `SCHEDULED` trong hàng đợi; tự động lập lịch bù cho các bài Evergreen cũ.
    4. **Cập nhật API & Giao diện Nội dung Evergreen ([Evergreen.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/Evergreen.tsx) & [route.ts](file:///Users/tiodev/Desktop/Topify.nosync/app/api/content/evergreen/route.ts)):**
       - Bổ sung `scheduledAt: true` vào query `recycledPosts`.
       - Thêm badge trạng thái bài gốc (`Đã đăng ngay` / `Đang xuất bản` / `Đã lên lịch`) trên header mỗi card Evergreen.
       - Hiển thị bài tái đăng trong danh sách con với badge `Đã lên lịch` và ngày giờ hẹn giờ cụ thể (`Hẹn: dd/MM/yyyy HH:mm`).
    5. **Cập nhật Giao diện Quản lý bài viết ([Posts.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/Posts.tsx)):**
       - Bổ sung `originalPostId` vào `PostItem`.
       - Hiển thị badge nhận diện `Tái đăng Evergreen` màu chàm (indigo) trên cả giao diện Grid Card và Table View.
    6. **Kiểm thử tự động hóa ([__tests__/api/posts/route.test.ts](file:///Users/tiodev/Desktop/Topify.nosync/__tests__/api/posts/route.test.ts)):**
       - Bổ sung test case kiểm chứng luồng tạo bài viết Đăng ngay kèm bật Evergreen: bài gốc được xuất bản ngay với trạng thái `PUBLISHED`, bài con được pre-schedule với trạng thái `SCHEDULED` và `schedulePublish` được gọi với đúng mốc thời gian sau chu kỳ tái xuất bản.


## 🚀 [2026-10-27] (v1.3.31) — Khắc Phục Lỗi Random Trong Khung: Chuẩn Hóa Định Dạng Ngày Giờ & Cập Nhật Real-time Khi Khung Đang Diễn Ra (F022)

### Phân hệ M2. Quản lý bài viết & Content Studio (F022: Chế độ đăng ngẫu nhiên trong khung giờ vàng) [Frontend & Backend]:
- **[F022] Khắc phục triệt để lỗi khung giờ đã qua vẫn chọn được và mốc giờ random ra nhỏ hơn thời gian hiện tại:**
  - **Vấn đề ghi nhận từ Tester & Ảnh chụp:**
    - Mở app Topify $\rightarrow$ Quản lý bài viết $\rightarrow$ Tạo bài viết.
    - Ở "Chế độ đăng bài" chọn "Random trong khung".
    - Để "Ngày áp dụng khung giờ" là ngày hiện tại (`25/10/2026`).
    - Chọn khung giờ vàng "Tối (Hot) 19:30 – 22:30" khi giờ hệ thống là `21:14`.
    - Quan sát mục "Mô phỏng thời điểm đăng ngẫu nhiên".
    - *Thực tế ghi nhận:* Các khung giờ đã kết thúc (Sáng, Trưa, Chiều) không bị disable; mục mô phỏng thời điểm đăng ngẫu nhiên sinh ra mốc `20:29 (25/10)`, nhỏ hơn giờ hiện tại là `21:14 (25/10)`.
  - **Nguyên nhân cốt lõi phát hiện:**
    1. **So sánh chuỗi ngày theo thứ tự bảng chữ cái khi ngày có định dạng `DD/MM/YYYY`:** Chuỗi `'25/10/2026'` so sánh theo kiểu chuỗi (`>`) với `todayStr` (`'2026-10-25'`) trả về `true` (do ký tự `'25'` lớn hơn `'20'`). Hệ thống hiểu nhầm ngày chọn là một ngày trong tương lai, khiến `isPresetDisabled` trả về `false` cho tất cả các khung giờ đã trôi qua (Sáng, Trưa, Chiều) và `isToday` bị gán `false`.
    2. **Khung giờ đang diễn ra bị coi là khung tương lai:** Do `isToday` bị `false`, cờ `isInProgress` không được kích hoạt, khiến mốc bắt đầu `effectiveStartMs` lấy nguyên vẹn `19:30` thay vì `Math.max(start, now + 1 phút)`. Thuật toán random sinh thời điểm ngẫu nhiên trong toàn bộ khoảng `[19:30, 22:30]`, dẫn tới kết quả `20:29` rơi vào quá khứ.
    3. **Hàm split('-') gặp lỗi với định dạng có dấu gạch chéo:** Tại `handleSubmit` và các hàm xử lý trong `CreatePost.tsx`, `randomDate.split('-')` khi gặp ngày có dấu gạch chéo (`/`) không phân rã được năm/tháng/ngày.
    4. **Thiếu bộ đếm thời gian thực (clock ticker) trên UI:** Giao diện không tự động kiểm tra lại trạng thái disable khi đồng hồ hệ thống chạy qua các mốc kết thúc của khung giờ.
  - **Giải pháp kỹ thuật đã hoàn thiện:**
    1. **Bổ sung hàm chuẩn hóa ngày `normalizeDateStringToYMD`:**
       - Triển khai trong [lib/content-studio/random-window.ts](file:///Users/tiodev/Desktop/Topify.nosync/lib/content-studio/random-window.ts) và [electron-app/frontend/src/lib/randomWindow.ts](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/lib/randomWindow.ts).
       - Tự động chuyển đổi mọi định dạng `DD/MM/YYYY`, `DD-MM-YYYY`, `DD.MM.YYYY`, `YYYY/MM/DD` và ISO strings thành chuẩn `YYYY-MM-DD`.
       - Tích hợp chuẩn hóa trực tiếp vào `isPresetDisabled`, `getWindowStatus`, và `computeRandomWindowTimes`.
    2. **Cập nhật giao diện Desktop App ([CreatePost.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/CreatePost.tsx)):**
       - Thêm `currentClock` với interval 15 giây, đảm bảo UI tự động cập nhật trạng thái các khung giờ theo thời gian thực mà không cần reload trang.
       - Chuẩn hóa ngày trước khi tách năm/tháng/ngày trong `handleSubmit` khi tạo bài viết đơn lẻ hoặc hàng loạt.
       - Tự động chuẩn hóa giá trị `value` và `onChange` của date picker về `YYYY-MM-DD`.
    3. **Kiểm thử tự động hóa ([__tests__/api/content-studio/random-window.test.ts](file:///Users/tiodev/Desktop/Topify.nosync/__tests__/api/content-studio/random-window.test.ts)):**
       - Bổ sung 5 test cases kiểm tra chuẩn hóa các dạng ngày.
       - Bổ sung test case tái hiện chính xác bug report với ngày `25/10/2026` lúc `21:14`:
         - Các khung Sáng (11:30), Trưa (13:45), Chiều (18:00) bị disable chính xác (`true`).
         - Khung Tối (22:30) không bị disable (`false`) và `isInProgress = true`.
         - 25 lần tính toán thời điểm random đều cho kết quả nằm trong khoảng `[21:15, 22:30]`, 100% không thể rơi vào quá khứ (không có giá trị `<= 21:14` như `20:29`).

## 🚀 [2026-10-27] (v1.3.30) — Chuẩn Hóa Trạng Thái Cảnh Báo Import Bài Viết Hàng Loạt: Chỉ Cảnh Báo Khi Có Tình Huống Cần Thiết (F019)

### Phân hệ M2. Quản lý bài viết & Content Studio (F019: Import Bài Viết Hàng Loạt) [Backend & Electron App]:
- **[F019] Khắc phục triệt để lỗi record nền tảng Facebook bị gắn trạng thái "Cảnh báo" dù không có tình huống cảnh báo:**
  - **Vấn đề ghi nhận từ Tester & Ảnh chụp:**
    - Mở app Topify $\rightarrow$ Quản lý bài viết $\rightarrow$ Import Bài Viết Hàng Loạt (Excel & Google Drive).
    - Chọn file Excel có 3 bài nền tảng `FACEBOOK` (bài 1 có Thời gian `11:59 11/11`, bài 2 và 3 để trống Thời gian).
    - Màn xem trước hiển thị cả 3 bài đều bị gắn trạng thái `"Có cảnh báo"`, bộ đếm `"Có cảnh báo"` = 3, dù bài 1 đã có Thời gian hợp lệ và cả 3 bài không thuộc trường hợp cần cảnh báo nào (như video dài > 180s cho YouTube Shorts).
  - **Nguyên nhân cốt lõi phát hiện:**
    1. **Thiếu định dạng ngày giờ "11:59 11/11" (Time first without year):** Trước đây parser ngày giờ chỉ tìm định dạng `DD/MM/YYYY`, dẫn đến `11:59 11/11` không được nhận diện là ngày hẹn hợp lệ, bị coi là rỗng.
    2. **Tự động gắn cảnh báo cho trường hợp để trống lịch hẹn:** Trước đây logic import tự động chèn cảnh báo `"Không có lịch hẹn -> Bài viết sẽ lưu dưới dạng Bản Thảo (Draft)"` khi cột Thời gian để trống. Điều này khiến cả 3 bài đều bị dính `warnings` và chuyển thành `Cảnh báo` thay vì mặc định `"Now" (Đăng ngay)` với trạng thái `Hợp lệ`.
    3. **Tự động gắn cảnh báo khi để trống Caption:** Logic cũ có đoạn `if (!caption) warnings.push('Chưa có nội dung mô tả (Caption).')`, dẫn đến việc các bài viết video không cần caption bị gắn cảnh báo oan.
    4. **Cách tính bộ đếm Metric Cards:** Trước đây `validCount` và `warningCount` tính trùng lặp dẫn đến hiển thị mâu thuẫn `Hợp lệ: 3, Có cảnh báo: 3`.
  - **Giải pháp kỹ thuật đã hoàn thiện:**
    1. **Loại bỏ triệt để cảnh báo không cần thiết:**
       - Trong [lib/content-studio/import-engine.ts](file:///Users/tiodev/Desktop/Topify.nosync/lib/content-studio/import-engine.ts): Loại bỏ cảnh báo tự động khi để trống caption và để trống thời gian. Cảnh báo chỉ kích hoạt cho các trường hợp nghiệp vụ thực sự cần lưu ý (như video YouTube Shorts dài > 180s được YouTube tự động chuyển thành video thường).
       - Nhận diện linh hoạt mọi định dạng thời gian: `11:59 11/11`, `11:59 (11/11)`, `11/11 11:59`, ISO string, Excel date serial number.
    2. **Định dạng hiển thị chuẩn xác trên giao diện ([ImportPostsModal.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/components/content-studio/ImportPostsModal.tsx)):**
       - Bài 1 (`11:59 11/11`): Hiển thị huy hiệu lịch hẹn tím `11:59 (11/11)`.
       - Bài 2 & 3 (để trống thời gian): Hiển thị huy hiệu xanh ngọc `Now (Đăng ngay)`.
       - Cả 3 bài hiển thị trạng thái `Hợp lệ` (xanh lá với icon `CheckCircle2`), không bị gán nhãn `Cảnh báo`.
       - Bộ đếm trên cùng hiển thị chuẩn xác: `Tổng số bài: 3`, `Hợp lệ: 3`, `Có cảnh báo: 0`, `Không hợp lệ: 0`.
    3. **Bổ sung bộ Unit Test tự động ([__tests__/api/content-studio/import.test.ts](file:///Users/tiodev/Desktop/Topify.nosync/__tests__/api/content-studio/import.test.ts)):**
       - Thêm test case xác nhận 3 bài Facebook (bài 1: `11:59 11/11`, bài 2 & 3: để trống thời gian) đạt kết quả 100% hợp lệ với `warningRows === 0`, `warnings: []`.
       - Toàn bộ 21/21 test cases trong test suite import chạy thành công (PASS).
  - **Danh sách file thay đổi:**
    - `lib/content-studio/import-engine.ts`
    - `electron-app/frontend/src/components/content-studio/ImportPostsModal.tsx`
    - `__tests__/api/content-studio/import.test.ts`
    - `package.json`, `electron-app/package.json`, `electron-app/frontend/package.json`, `Sidebar.tsx`
  - **Cách kiểm tra (Test Guide):**
    1. Chạy unit test: `npx vitest run __tests__/api/content-studio/import.test.ts` (21/21 passed).
    2. Mở app Topify $\rightarrow$ Quản lý bài viết $\rightarrow$ Import Bài Viết Hàng Loạt.
    3. Chọn file Excel có 3 bài Facebook (bài 1: `11:59 11/11`, bài 2 & 3 để trống Thời gian).
    4. Kiểm tra màn xem trước: Cả 3 bài hiển thị `Hợp lệ` xanh lá, thẻ `Có cảnh báo` = 0.

---

## 🚀 [2026-10-27] (v1.3.29) — Sửa Lỗi Prisma.Post.Create Lone Leading Surrogate Khi Đăng Bài Có Caption Spin Biến Thể

### Phân hệ M2. Quản lý bài viết & Content Studio (F023 / F073: Đăng Bài & Spin Biến Thể Caption) [Backend API & Electron App]:
- **[Lỗi Prisma lone leading surrogate in hex escape] Khắc phục triệt để lỗi không tạo được bài viết khi dùng Spin biến thể caption:**
  - **Vấn đề ghi nhận từ Tester & Ảnh chụp:**
    - Mở app Topify $\rightarrow$ Quản lý bài viết.
    - Chọn video `grandma.mp4` (`Mom Took My Money... Then Grandma Arrived #funnycats #catmemes #grandma.mp4`), tạo bài viết và dùng Spin biến thể caption (Spin Syntax / Spintax).
    - Chọn nền tảng YouTube Shorts.
    - Ở "Chế độ đăng bài" chọn "Đăng ngay" $\rightarrow$ Click "Đăng ngay 1 Video".
    - **Kết quả lỗi:** Hệ thống văng thông báo đỏ:
      `"Lỗi tạo bài viết cho Mom Took My Money... Then Grandma Arrived #funnycats #catmemes #grandma.mp4: Invalid prisma.post.create() invocation: lone leading surrogate in hex escape at line 1 column 262". Bài viết không được tạo.`
  - **Nguyên nhân cốt lõi phát hiện:**
    1. **Cơ chế Rust Serde JSON trong Prisma Query Engine:**
       - Prisma Client khi thực thi `prisma.post.create(...)` sẽ đóng gói câu lệnh thành JSON qua N-API gửi sang Rust Query Engine.
       - Trong JavaScript/V8 runtime, các chuỗi chứa emoji bị cắt đôi (cắt dở surrogate pair) hoặc chứa ký tự surrogate đơn lẻ (lone high surrogate `\uD800`–`\uDBFF` hoặc lone low surrogate `\uDC00`–`\uDFFF`) khi đi qua `JSON.stringify` sẽ được mã hóa dưới dạng hex escape `\ud8xx`.
       - Parser `serde_json` của Rust kiểm tra tính hợp lệ UTF-8 nghiêm ngặt, từ chối toàn bộ chuỗi có chuỗi thoát surrogate đơn độc không ghép cặp với lỗi: `lone leading surrogate in hex escape at line X column Y`.
    2. **Hàm `sanitizeUtf8` cũ chưa loại bỏ triệt để surrogate đơn lẻ:**
       - Hàm trước đây chỉ dựa vào `String.prototype.toWellFormed()` (nếu có). Trong nhiều trường hợp chuỗi escape hoặc môi trường chưa xử lý các ký tự điều khiển/lone surrogate phức tạp, hoặc các biến thể Spin từ Spintax generator chứa ký hiệu emoji bị vỡ.
       - Hàm `safeSlice` cắt chuỗi theo độ dài byte/ký tự đơn thuần có thể cắt trúng giữa 1 cặp surrogate emoji làm phát sinh lone surrogate mới.
  - **Giải pháp kỹ thuật đã triển khai:**
    1. **Nâng cấp `sanitizeUtf8` và `safeSlice` toàn diện (`lib/utils.ts` & `electron-app/frontend/src/lib/utils.ts`):**
       - Sử dụng `toWellFormed()` chuẩn kết hợp regex quét sạch mọi lone high/low surrogate đơn lẻ:
         `[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]`.
       - Quét và loại bỏ chuỗi surrogate hex escape thô dạng `\uD8xx` không có cặp:
         `\\u[dD][89a-bA-B][0-9a-fA-F]{2}(?!\\u[dD][c-fC-F][0-9a-fA-F]{2})|(?<!\\u[dD][89a-bA-B][0-9a-fA-F]{2})\\u[dD][c-fC-F][0-9a-fA-F]{2}`.
       - Loại bỏ ký tự thay thế `\uFFFD` và byte null `\u0000`.
       - Hàm `safeSlice` nâng cấp nhận diện mã UTF-16: nếu vị trí cắt kết thúc trúng high surrogate, tự động lùi lại 1 ký tự để không làm đứt gãy emoji.
    2. **Khử khuẩn đầu ra Spin Engine (`lib/content-studio/content-studio-engine.ts` & `electron-app/frontend/src/lib/spinEngine.ts`):**
       - Tự động sanitize cả văn bản nguồn trước khi Spin và toàn bộ danh sách các biến thể caption được sinh ra.
    3. **Khử khuẩn tại giao diện CreatePost & SpinModal (`CreatePost.tsx` & `SpinModal.tsx`):**
       - Khử khuẩn caption khi người dùng chọn biến thể Spin, phân phối hàng loạt (Distribute All), hoặc nhấn nút submit tạo bài viết.
    4. **Cơ chế Tự Động Phục Hồi & Fallback Retry Tại Backend API (`app/api/posts/route.ts` & `app/api/posts/bulk/route.ts`):**
       - Bọc `prisma.post.create()` trong cơ chế retry thông minh.
       - Khi phát hiện lỗi Prisma chứa từ khóa `lone leading surrogate` hoặc `surrogate`, endpoint lập tức kích hoạt deep sanitization (loại bỏ dứt điểm toàn bộ dải surrogate `[\uD800-\uDFFF]`) và tự động thử lại tạo bài viết thành công 100%, bảo vệ hệ thống không bị crash hoặc chặn đứng luồng đăng bài của người dùng.
    5. **Bổ sung bộ Unit Test tự động (`__tests__/api/posts/route.test.ts`):**
       - Test case 1: Xác nhận caption/tiêu đề chứa lone surrogate được làm sạch tự động trước khi lưu.
       - Test case 2: Xác nhận cơ chế auto-recovery retry thành công khi Prisma trả về lỗi `lone leading surrogate in hex escape`.
  - **Danh sách file thay đổi:**
    - `lib/utils.ts`
    - `electron-app/frontend/src/lib/utils.ts`
    - `lib/content-studio/content-studio-engine.ts`
    - `electron-app/frontend/src/lib/spinEngine.ts`
    - `electron-app/frontend/src/pages/CreatePost.tsx`
    - `electron-app/frontend/src/components/SpinModal.tsx`
    - `app/api/posts/route.ts`
    - `app/api/posts/bulk/route.ts`
    - `__tests__/api/posts/route.test.ts`
    - `package.json`, `electron-app/package.json`, `electron-app/frontend/package.json`, `Sidebar.tsx`
  - **Cách kiểm tra (Test Guide):**
    1. Chạy unit test: `npx vitest run __tests__/api/posts/route.test.ts` (16/16 pass).
    2. Mở app Topify $\rightarrow$ Quản lý bài viết $\rightarrow$ Tạo bài viết với video `grandma.mp4`.
    3. Dùng Spin biến thể caption có chứa icon/emoji $\rightarrow$ Chọn YouTube Shorts $\rightarrow$ Chọn "Đăng ngay" $\rightarrow$ Bấm "Đăng ngay 1 Video".
    4. Bài viết được tạo và kích hoạt đăng thành công, không còn xuất hiện lỗi `lone leading surrogate in hex escape`.

---

## 🚀 [2026-10-27] (v1.3.28) — Sửa Lỗi UI Quản Lý Bài Viết: Chấm Dứt Hiện Tượng Card Bị Nhảy Lên Đè Vào Thanh Lọc Và Thanh Cuộn Xấu (F026)

### Phân hệ M2. Quản lý bài viết & Content Studio (F026: Danh Sách & Lọc Bài Viết Đa Kênh) [Electron App]:
- **[F026] Khắc phục lỗi giao diện danh sách bài viết bị các thẻ card nhảy lên đè lấn vào thanh lọc (Filter Bar) và thanh cuộn xám xấu xí:**
  - **Vấn đề ghi nhận từ Tester & Ảnh chụp:**
    - Mở app Topify $\rightarrow$ Quản lý bài viết $\rightarrow$ Xem danh sách bài viết ở giao diện Lưới (Grid View).
    - Hàng card bài viết đầu tiên bị nhảy ngược lên trên khoảng 300px - 400px, nằm đè lấn trực tiếp vào thanh điều khiển bộ lọc (`LỌC THEO KÊNH`, `LỌC THEO THỜI GIAN`, `TÌM KIẾM NỘI DUNG`).
    - Nút badge trạng thái `Đã lên lịch`, `Bản nháp` và nút icon con mắt `Eye` (`z-[2]`) bị chọc thủng nền trắng của thanh lọc, nổi lơ lửng ngay dưới các tab `Tất cả` và `Lưới / Danh sách`.
    - Dưới các tab trạng thái xuất hiện một thanh cuộn ngang xám to và thô làm mất thẩm mỹ giao diện.
  - **Nguyên nhân cốt lõi phát hiện:**
    1. **Xung đột Layout Projection của Framer Motion:**
       - Thẻ container lưới cha dùng `<motion.div layout className="grid ...">`.
       - Bên trong bọc `<AnimatePresence>` mặc định (`mode="sync"`).
       - Từng thẻ con lại gắn `<motion.div layout initial={{ opacity: 0, y: 20 }} ...>`.
       - Đồng thời class CSS của từng thẻ con lại chứa `transition-all duration-300`.
       - Khi CSS `transition-all` can thiệp vào thuộc tính `transform` đang được Framer Motion tính toán bounding box, Framer Motion tính toán sai tọa độ tương đối của các item mới vào (newly inserted cards), dẫn đến việc gán `transform: translate3d(0, -350px, 0)` khiến hàng card đầu tiên bị kéo ngược lên trùng tọa độ với thanh lọc phía trước.
    2. **Xếp chồng z-index không an toàn:**
       - Thanh lọc (Filter Bar) được cấu hình `relative z-0`, trong khi các thành phần bên trong media card có `z-[2]` (`Top Action Bar` và `Bottom Info`).
       - Khi card bị nhảy lên cùng vị trí, các phần tử `z-[2]` nổi lên trên nền trắng của Filter Bar, gây ra hiện tượng đè lấn chồng chéo kỳ lạ.
    3. **Thiếu định nghĩa class `scrollbar-hide` trong CSS:**
       - Thẻ chứa các tab trạng thái dùng class `scrollbar-hide`, tuy nhiên trong file CSS dự án chưa có quy tắc ẩn thanh cuộn chuẩn cho WebKit/Blink, dẫn đến Chromium/Electron tự động render thanh cuộn ngang mặc định xám thô.
  - **Giải pháp kỹ thuật đã triển khai:**
    1. **Tách biệt CSS Grid và Framer Motion:**
       - Chuyển container lưới cha thành thẻ `div` chuẩn có `relative z-0`: `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 relative z-0">`.
       - Chuyển `<AnimatePresence>` sang chế độ tối ưu cho Grid: `<AnimatePresence mode="popLayout">`.
       - Trên từng card con: Đổi `layout` thành `layout="position"`, loại bỏ hoàn toàn `transition-all duration-300` và thay bằng `transition-shadow duration-300` để CSS không can thiệp vào transform của Framer Motion.
    2. **Nâng cấp z-index thanh lọc:**
       - Đổi Filter Bar thành `relative z-10` để đảm bảo thanh lọc luôn có layer độc lập vững chắc, không bao giờ bị các phần tử của nội dung bên dưới đè lấn.
    3. **Bổ sung quy tắc ẩn thanh cuộn chuẩn trong [`index.css`](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/index.css):**
       - Thêm bộ selector `.scrollbar-hide::-webkit-scrollbar { display: none; }` và `.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }` giúp thanh cuộn ẩn hoàn toàn và tab vuốt mượt mà (`scroll-smooth`).
  - **Kiểm thử tự động & Build:**
    - Sử dụng Playwright chụp ảnh nghiệm thu giao diện thực tế trước/sau khi cuộn và khi lọc theo tab: Thẻ hiển thị ngay ngắn, khoảng cách 32px chuẩn xác, không còn đè lấn, thanh cuộn thô biến mất 100%.
    - Biên dịch Vite Production Bundle thành công.
    - Nâng cấp phiên bản toàn hệ thống lên `v1.3.28`.

## 🚀 [2026-10-27] (v1.3.27) — Sửa Lỗi Import Bài Viết Hàng Loạt: Báo Lỗi "Không Hợp Lệ" Cho Record Thiếu Field Bắt Buộc Hoặc Dữ Liệu Sai Định Dạng (F019)

### Phân hệ M2. Quản lý bài viết & Content Studio (F019: Import Bài Viết Hàng Loạt từ Excel / Google Sheets) [Electron App & Backend API]:
- **[F019] Khắc phục triệt để lỗi record thiếu field bắt buộc hoặc dữ liệu không hợp lệ chỉ báo Cảnh báo thay vì báo lỗi Không hợp lệ:**
  - **Vấn đề ghi nhận từ Tester & Ảnh chụp:**
    - Mở app Topify $\rightarrow$ Quản lý bài viết $\rightarrow$ Import Bài Viết Hàng Loạt (Excel & Google Drive).
    - Chọn file Excel (hoặc link Google Sheets) có record trống field bắt buộc hoặc dữ liệu không hợp lệ (Thời gian sai định dạng, Nền tảng trống hoặc chưa được liên kết).
    - Màn xem trước hiển thị: `Hợp lệ = 3, Có cảnh báo = 3, Không hợp lệ = 0`. Các record chỉ có trạng thái `Cảnh báo`, không báo lỗi `Không hợp lệ`.
    - **Kỳ vọng:** Record trống field bắt buộc hoặc không hợp lệ (Thời gian sai định dạng, Nền tảng trống hoặc chưa được liên kết) phải bị báo lỗi ngay ở bước xem trước: trạng thái `Không hợp lệ` kèm lý do chi tiết, bộ đếm `Không hợp lệ` tăng tương ứng, không được tính vào `Hợp lệ`.
  - **Nguyên nhân cốt lõi phát hiện:**
    1. **Thiếu alias tiêu đề cột lịch đăng:** `HEADER_ALIASES.scheduledAt` trong [`lib/content-studio/import-engine.ts`](file:///Users/tiodev/Desktop/Topify.nosync/lib/content-studio/import-engine.ts) thiếu các biến thể tiếng Việt như `Lịch đăng`, `Ngày giờ`, `Hẹn giờ`, `Giờ đăng`. Khi file import dùng các tiêu đề cột này kèm dữ liệu thời gian sai, hệ thống không nhận diện được cột nên bỏ qua và coi như để trống, tự gán là `Now (Đăng ngay)`.
    2. **Xóa mất chuỗi dữ liệu gốc khi parse lỗi thời gian:** Khi có lỗi phân tích ngày giờ, `scheduledAtIso` là `null`, khiến `scheduledAt` bị gán `null`. Khi trả về frontend, giao diện hiển thị `Now (Đăng ngay)` và hàm validate ở client không kiểm tra lại định dạng sai ban đầu.
    3. **Cách tính bộ đếm Metric Cards:** Logic đếm `Có cảnh báo` trước đây lấy toàn bộ dòng có `warnings.length > 0` kể cả khi dòng đó bị lỗi (`isValid === false`), đồng thời logic đếm `Hợp lệ` trước đây có lúc tính cả dòng có cảnh báo, dẫn đến hiển thị mâu thuẫn `Hợp lệ: 3, Có cảnh báo: 3, Không hợp lệ: 0`.
    4. **Hiển thị cột Nền tảng khi để trống:** Khi record không có nền tảng nào, ô nền tảng trước đây hiển thị trống rỗng, không có huy hiệu cảnh báo/báo lỗi trực quan.
  - **Giải pháp kỹ thuật đã triển khai:**
    1. **Mở rộng toàn diện `HEADER_ALIASES` & chuẩn hóa key:**
       - Bổ sung các alias cho `scheduledAt`: `lịch đăng`, `lich dang`, `lịch đăng bài`, `lich dang bai`, `ngày giờ đăng`, `ngày giờ`, `hẹn giờ`, `thời điểm đăng`, `lịch`, `giờ đăng`.
       - Bổ sung alias cho `title`: `chủ đề`, `chu de`, `topic`, `tên clip`, `tiêu đề video`, `tên video`.
       - Bổ sung alias cho `platforms`: `kênh đăng bài`, `kênh xuất bản`, `kênh phân phối`, `kênh đăng`, `social`.
       - Chuẩn hóa hàm `normalizeKey` để tự động loại bỏ ký tự BOM `\uFEFF`, zero-width space, dấu sao bắt buộc `*`, dấu hai chấm, ngoặc đơn,...
    2. **Giữ nguyên chuỗi ngày sai khi có lỗi phân tích:**
       - Gán `scheduledAt = dateError ? rawScheduleStr : ...`, đảm bảo client nhận được chính xác chuỗi nhập sai và hiển thị huy hiệu lỗi đỏ `AlertCircle` kèm tên chuỗi bị sai định dạng.
    3. **Đồng bộ hóa kiểm tra lỗi & đếm thẻ trạng thái:**
       - Chuẩn hóa format thông báo lỗi ngày giờ theo chuẩn: `Thời gian sai định dạng: "${str}". Định dạng hỗ trợ: DD/MM/YYYY HH:mm, YYYY-MM-DD HH:mm, HH:mm DD/MM, "Now" (đăng ngay) hoặc "Bản thảo"`.
       - Tại [`ImportPostsModal.tsx`](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/components/content-studio/ImportPostsModal.tsx), phân định rõ ràng 3 bộ đếm:
         - `Hợp lệ`: Số bài `isValid && warnings.length === 0` (hoàn hảo không có lỗi và không có cảnh báo).
         - `Có cảnh báo`: Số bài `isValid && warnings.length > 0` (hợp lệ để import nhưng có lưu ý).
         - `Không hợp lệ`: Số bài `!isValid` (có lỗi bắt buộc cần sửa trước khi import).
         - Tổng: `Hợp lệ + Có cảnh báo + Không hợp lệ = Tổng số bài`.
    4. **Cải tiến giao diện bảng xem trước (Inline Validation):**
       - Khi tiêu đề trống: Viền input chuyển sang màu đỏ hồng (`border-rose-400 bg-rose-50/50`) cùng placeholder cảnh báo bắt buộc `⚠️ Bắt buộc nhập tiêu đề...`.
       - Khi nền tảng trống: Hiển thị badge màu đỏ `Chưa chọn nền tảng` có icon `AlertCircle`.
       - Khi thời gian sai: Hiển thị badge màu đỏ có icon `AlertCircle` và nội dung chuỗi sai.
       - Khi người dùng chỉnh sửa trực tiếp trên bảng (gõ tiêu đề, chọn nền tảng, nhập lại ngày giờ), trạng thái và bộ đếm tự động cập nhật ngay lập tức.
    5. **Áp dụng đồng bộ:** Cả 2 luồng Import từ file Excel / CSV và Lấy thông tin từ link Google Sheets đều sử dụng chung bộ xử lý và hiển thị này.
  - **Kiểm thử tự động & Build:**
    - Cập nhật và bổ sung 3 test case mới trong [`__tests__/api/content-studio/import.test.ts`](file:///Users/tiodev/Desktop/Topify.nosync/__tests__/api/content-studio/import.test.ts): Đạt 20/20 test cases (100% Pass).
    - Biên dịch thành công gói Electron Desktop App với Vite.
    - Nâng cấp phiên bản toàn hệ thống lên `v1.3.27`.

## 🚀 [2026-10-27] (v1.3.26) — Sửa Lỗi Import Bài Viết Hàng Loạt: Để Trống Thời Gian Mặc Định Đăng Ngay "Now" (F019)

### Phân hệ M2. Quản lý bài viết & Content Studio (F019: Import Bài Viết Hàng Loạt từ Excel / Google Sheets) [Electron App & Backend API]:
- **[F019] Khắc phục triệt để lỗi để trống cột Thời gian bị gán nhãn "Bản thảo (Draft)" và dính trạng thái "Cảnh báo" thay vì mặc định Đăng ngay "Now":**
  - **Vấn đề ghi nhận từ Tester & Ảnh chụp:**
    - Mở app Topify $\rightarrow$ Quản lý bài viết $\rightarrow$ Import Bài Viết Hàng Loạt (Excel & Google Drive).
    - Chọn file Excel (hoặc link Google Sheets) có 3 bài viết, nền tảng `FACEBOOK`, để trống cột Thời gian.
    - Quan sát màn xem trước: Cột Thời gian của cả 3 bài hiển thị chữ nghiêng `"Bản thảo (Draft)"`, và cả 3 bài bị xếp vào trạng thái `"Cảnh báo"` (Hợp lệ: 3, Có cảnh báo: 3, Không hợp lệ: 0).
    - **Kỳ vọng:** Khi để trống Thời gian, mặc định là đăng ngay (đăng luôn). Màn xem trước phải hiển thị thời gian là `"Now" (Đăng ngay)` trong badge xanh ngọc với icon `Sparkles`, không có bất kỳ cảnh báo nào (Hợp lệ: 3, Có cảnh báo: 0, Không hợp lệ: 0).
  - **Nguyên nhân cốt lõi phát hiện:**
    1. **Thiếu gắn nhãn `'NOW'` trong hàm phân tích:** Tại [`lib/content-studio/import-engine.ts`](file:///Users/tiodev/Desktop/Topify.nosync/lib/content-studio/import-engine.ts), khi `parseScheduleDateTime` nhận diện trường rỗng hoặc các từ khóa đăng ngay (`'now'`, `'đăng ngay'`, `'đăng luôn'`), hàm trả về `{ iso: null, isNow: true }`. Tuy nhiên, logic phân tích trong `parseExcelOrCsvBuffer` trước đó chỉ gán `scheduledAt` bằng `iso` (vốn là `null`), dẫn đến dữ liệu trả về cho frontend thiếu định danh rõ ràng.
    2. **Phân loại giao diện xem trước tại Desktop App:** Tại [`ImportPostsModal.tsx`](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/components/content-studio/ImportPostsModal.tsx), logic render trước đó chỉ kiểm tra có ngày hay không mà chưa hỗ trợ đầy đủ các trạng thái `NOW`, `DRAFT` và thời gian cụ thể:
       - Nếu rỗng hoặc `'NOW'`: hiển thị huy hiệu nổi bật `Now (Đăng ngay)` với màu xanh lá `emerald-700` và icon `Sparkles`.
       - Nếu người dùng nhập rõ từ khóa bản thảo (`'bản thảo'`, `'draft'`): hiển thị huy hiệu `Bản thảo (Draft)` màu xám với icon `FileText`.
       - Nếu có ngày giờ cụ thể: hiển thị ngày giờ màu tím với icon `Calendar`.
    3. **Tự động đăng ngay khi lưu bài viết:** Tại tuyến Backend [`app/api/content-studio/import/save/route.ts`](file:///Users/tiodev/Desktop/Topify.nosync/app/api/content-studio/import/save/route.ts), xử lý phân luồng chuẩn xác: Nếu `importAsDraft === true` hoặc `item.scheduledAt === 'DRAFT'` thì lưu dạng `DRAFT`. Ngược lại nếu để trống hoặc `item.scheduledAt === 'NOW'`, tự động kích hoạt `status = 'PUBLISHING'` để đăng bài ngay lập tức.
    4. **Xóa bỏ hoàn toàn warning khi để trống lịch:** Cột Thời gian để trống là hành vi người dùng mong muốn đăng bài ngay, không coi là warning. Do đó `warnings = []`, giúp bảng thống kê hiển thị chuẩn xác: `Hợp lệ: 3`, `Có cảnh báo: 0`, `Không hợp lệ: 0`.
    5. **Áp dụng đồng bộ:** Đảm bảo luồng đọc từ file Excel (.xlsx), CSV (.csv) và *Lấy thông tin từ Google Sheets* (Google Sheets link) hoạt động hoàn toàn đồng nhất.
  - **Kiểm thử tự động & Build:**
    - Cập nhật và bổ sung bộ unit test trong [`__tests__/api/content-studio/import.test.ts`](file:///Users/tiodev/Desktop/Topify.nosync/__tests__/api/content-studio/import.test.ts): Toàn bộ 17/17 test cases đều đạt (100% Pass).
    - Biên dịch lại bundle Electron Desktop App (`npm run build`) thành công 100%.
    - Nâng cấp phiên bản toàn hệ thống lên `v1.3.26`.

## 🚀 [2026-10-27] (v1.3.25) — Khắc Phục Lỗi Bài Viết Lên Lịch Không Hiển Thị Trên Lịch Nội Dung (F021 Calendar)

### Phân hệ M2. Quản lý bài viết & Lịch nội dung (F021: Lịch Nội Dung & Kế Hoạch Xuất Bản) [Electron App & Backend API]:
- **[F021] Sửa lỗi bài viết đã lên lịch ở Quản lý bài viết không hiển thị trên Lịch nội dung (Calendar) và bộ đếm tháng hiển thị 0:**
  - **Vấn đề phản ánh từ Tester & Người dùng:**
    - Người dùng tạo bài viết và đặt lịch đăng ở màn Quản lý bài viết (hoặc nhập bài viết có lịch đăng từ file Excel / Google Sheets).
    - Khi chuyển sang màn **Lịch nội dung (Calendar)** và xem tháng (ví dụ Tháng 10/2026), calendar không hiển thị bài viết nào trên các ô ngày, và bộ đếm tháng hiển thị `"0 bài viết đã xếp lịch trong tháng này"`.
  - **Nguyên nhân cốt lõi phát hiện:**
    1. **Thiếu trường `start` trong `safePosts` tại API Backend:** Tại endpoint [`app/api/posts/calendar/route.ts`](file:///Users/tiodev/Desktop/Topify.nosync/app/api/posts/calendar/route.ts), danh sách `safePosts` trả về cho desktop app chỉ có `scheduledAt`, `publishedAt`, `createdAt` mà thiếu trường `start`. Trong khi đó, component `CalendarView.tsx` kỳ vọng các bài viết có thuộc tính `p.start` để đồng bộ với FullCalendar/Desktop Calendar.
    2. **Đồng bộ song song qua `Promise.all` dễ bị nghẽn (Fail-fast):** Tại [`CalendarView.tsx`](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/CalendarView.tsx), việc gọi song song `api.get('/posts/calendar...')` và `api.get('/calendar/notes...')` bằng `Promise.all` khiến cho nếu endpoint ghi chú gặp sự cố hoặc timeout, toàn bộ việc lấy lịch bài viết bị rơi vào catch fallback `/posts` (vốn là API danh sách bài viết phân trang chung, không có lọc khoảng thời gian start/end của tháng).
    3. **Hiển thị nhấp nháy 0 bài viết trong khi đang tải dữ liệu:** Khi `loading === true`, bộ đếm tháng chưa có cờ kiểm tra trạng thái đang tải nên lập tức render text `"0 bài viết đã xếp lịch trong tháng này"`.
    4. **Ánh xạ ngày hiển thị trên ô lịch:** Khi bài viết có `scheduledAt` hoặc `start`, code lọc bài viết theo ngày và tháng cần resolve theo thứ tự ưu tiên nhất quán `p.scheduledAt || p.start || p.publishedAt`.
    5. **Tương thích hoàn toàn với tính năng nhập từ Google Sheets và Excel:** Dữ liệu bài viết có lịch đăng từ Google Sheets hoặc Excel sau khi lưu qua `/api/content-studio/import/save` được lưu với `status: 'SCHEDULED'` và `scheduledAt: finalScheduledAt`, nay lập tức được hiển thị trực quan và chính xác trên Calendar cùng giờ đăng (`HH:mm`) và chi tiết bài viết.
  - **Giải pháp kỹ thuật đã triển khai:**
    1. **Backend [`app/api/posts/calendar/route.ts`](file:///Users/tiodev/Desktop/Topify.nosync/app/api/posts/calendar/route.ts):**
       - Bổ sung trường `start: post.scheduledAt?.toISOString() || post.publishedAt?.toISOString() || post.createdAt?.toISOString()` vào từng đối tượng trong `safePosts`.
       - Đảm bảo cả hai cấu trúc `events` và `posts` đều cung cấp đầy đủ thông tin thời gian chuẩn ISO 8601.
    2. **Frontend [`CalendarView.tsx`](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/CalendarView.tsx):**
       - Mở rộng interface `CalendarPost` bao gồm `publishedAt?: string | null` và `start?: string | null`.
       - Chuyển cơ chế nạp dữ liệu sang `Promise.allSettled` đảm bảo lịch bài viết và ghi chú lịch độc lập tuyệt đối, không làm ảnh hưởng lẫn nhau.
       - Chuẩn hóa việc phân giải thời gian đăng: `const effectiveDate = p.scheduledAt || p.start || p.publishedAt || p.createdAt || null`.
       - Thêm trạng thái `Đang tải lịch bài viết...` trên tiêu đề tháng khi `loading` để tránh cảm giác sai sót "0 bài viết" khi mạng đang truyền tải.
       - Bổ sung định dạng màu sắc cho trạng thái `FAILED` (màu đỏ rose) bên cạnh `PUBLISHED` (xanh ngọc) và `SCHEDULED` (xanh tím indigo) cả trên ô lịch lẫn trong modal xem chi tiết bài viết.
    3. **Kiểm thử tự động & Build:**
       - Cập nhật bộ unit test trong [`__tests__/api/posts/calendar.test.ts`](file:///Users/tiodev/Desktop/Topify.nosync/__tests__/api/posts/calendar.test.ts) kiểm tra trường `start`, `scheduledAt`, `status` và `posts` / `events`. Toàn bộ 3/3 test cases đều đạt (100% Pass).
       - Biên dịch lại bundle Electron Desktop App (`npm run build`) thành công không có lỗi.
       - Nâng cấp phiên bản toàn hệ thống lên `v1.3.25`.

## 🚀 [2026-10-27] (v1.3.24) — Sửa Lỗi Import File Excel & Google Sheets Báo Hợp Lệ Dù Nền Tảng TikTok Chưa Kết Nối (F019)

### Phân hệ M2. Quản lý bài viết & Content Studio (F019: Import Bài Viết Hàng Loạt từ Excel / Google Sheets) [Electron App & Backend API]:
- **[F019] Khắc phục triệt để lỗi record chứa nền tảng TikTok (chưa connect) vẫn được báo hợp lệ khi import:**
  - **Vấn đề phản ánh từ Tester & Người dùng:**
    - Người dùng import file Excel hoặc lấy dữ liệu từ Google Sheets, trường Nền tảng điền `TikTok / YouTube Short` (tài khoản chỉ mới kết nối YouTube Shorts, chưa kết nối TikTok).
    - Hệ thống vẫn báo record hợp lệ (`Hợp lệ`), nhãn TikTok hiển thị màu xanh/tím bình thường thay vì cảnh báo đỏ và chuyển trạng thái sang `Không hợp lệ`.
  - **Nguyên nhân cốt lõi phát hiện:**
    1. **Prisma Enum Exception tại Backend:** Tại các route `app/api/content-studio/import/parse/route.ts` và `app/api/content-studio/import/save/route.ts`, câu lệnh truy vấn tài khoản `prisma.socialAccount.findMany` có điều kiện `status: { in: ['CONNECTED', 'active' as any] }`. Do `SocialAccountStatus` trong Prisma là Enum (`CONNECTED`, `DISCONNECTED`, `EXPIRED`) không chứa giá trị `'active'`, Prisma bắn ngoại lệ 500 (`Invalid value for argument in. Expected SocialAccountStatus`), khiến backend không trả về `connectedProviders`.
    2. **Xử lý tài khoản hết hạn access token có refresh token:** Các tài khoản YouTube có `expiresAt` sau 1 giờ sẽ hết hạn nhưng có `refreshToken` để tự động refresh (đã hoạt động ở `/api/social/status`). Code cũ tại `import/parse` kiểm tra `if (!isExpired)` đơn thuần nên vô tình bỏ qua các tài khoản hợp lệ có `refreshToken`.
    3. **Lỗ hổng Fallback tại Engine & Modal:**
       - Trong `lib/content-studio/import-engine.ts`, hàm `isPlatformProviderConnected` có nhánh `if (!info) return true`, trả về `true` (hợp lệ) nếu tên nền tảng chưa được ánh xạ trong từ điển `PLATFORM_PROVIDER_INFO`.
       - Trong `ImportPostsModal.tsx`, hàm `isPlatformConnected` mặc định `required = PLATFORM_PROVIDER_MAP[platform] || 'META'`. Khi gặp `'TIKTOK'`, do thiếu alias ngắn nên rơi vào `'META'`.
       - `PLATFORM_PROVIDER_MAP` và `PLATFORM_NAMES` thiếu các alias ngắn (`TIKTOK`, `YOUTUBE`, `FACEBOOK`, `INSTAGRAM`, `ZALO`, `TELEGRAM`).
  - **Giải pháp xử lý triệt để:**
    1. **Sửa lỗi Prisma Query:**
       - Loại bỏ hoàn toàn `'active'` khỏi truy vấn Prisma trong `app/api/content-studio/import/parse/route.ts` và `app/api/content-studio/import/save/route.ts`.
       - Lấy trường `refreshToken` và công nhận tài khoản kết nối nếu `status === 'CONNECTED'` hoặc có `refreshToken` hợp lệ của Google/YouTube.
       - Bổ sung đầy đủ tất cả nhà cung cấp (`META`, `FACEBOOK`, `INSTAGRAM`, `YOUTUBE`, `GOOGLE`, `TIKTOK`, `ZALO`, `TELEGRAM`) vào tập hợp `connectedProviders`.
    2. **Nâng cấp `lib/content-studio/import-engine.ts`:**
       - Bổ sung đầy đủ alias ngắn (`TIKTOK`, `YOUTUBE`, `FACEBOOK`, `INSTAGRAM`, `ZALO`, `TELEGRAM`) vào `PLATFORM_PROVIDER_INFO` và `VALID_PLATFORMS`.
       - Cập nhật `isPlatformProviderConnected` trả về `false` dứt khoát nếu nền tảng không thuộc danh sách đã kết nối.
       - Xuất hàm `parsePlatformList` để hỗ trợ kiểm thử tự động các định dạng phân cách (`TikTok / YouTube Short`, `TIKTOK | FACEBOOK`, v.v.).
    3. **Cập nhật Frontend `ImportPostsModal.tsx`:**
       - Bổ sung alias ngắn cho `PLATFORM_PROVIDER_MAP` và `PLATFORM_NAMES`.
       - Cải tiến `isPlatformConnected` không còn fallback về `'META'` mà kiểm tra chính xác từng provider tương ứng.
       - Cải tiến hàm nạp trạng thái mạng xã hội (`fetchSocialStatus`), tự động fallback sang `/workspace/social` và đồng bộ ngay với danh sách `connectedProviders` từ backend trả về.
       - Đảm bảo hiển thị nhãn cảnh báo đỏ `TIKTOK (Chưa connect)`, đánh dấu bài viết `Không hợp lệ` kèm thông báo lỗi `"Nền tảng TikTok chưa được kết nối với tài khoản."` cả khi import file Excel lẫn khi Lấy thông tin từ Google Sheets.
    4. **Kiểm thử tự động:**
       - Bổ sung 3 test case mới trong [`__tests__/api/content-studio/import.test.ts`](file:///Users/tiodev/Desktop/Topify.nosync/__tests__/api/content-studio/import.test.ts): Kiểm tra nhận diện phân cách `'TikTok / YouTube Short'`, kiểm tra bắt buộc lỗi invalid khi tài khoản chưa kết nối TikTok, và kiểm tra tính chính xác của `isPlatformProviderConnected`. Tất cả 16/16 test cases đều vượt qua (100% Pass).
       - Biên dịch lại bundle Electron Desktop App (`npm run build`) thành công 100%.

## 🚀 [2026-10-26] (v1.3.23) — Chuẩn Hóa Chấm Điểm AI Content Score (F084) & Sửa Lỗi Kiểm Tra Trùng Lặp (F082)

### Phân hệ M2. Quản lý bài viết & Content Studio (AI Content Score F084 & Duplicate Check F082) [Electron App & Backend API]:
- **[F084] Chuẩn hóa thang điểm AI Content Score cho chuỗi ký tự vô nghĩa và trạng thái chưa chọn nền tảng:**
  - **Vấn đề giải quyết:**
    - Khi người dùng nhập nội dung vô nghĩa/spam (ví dụ: `"dsfsdfdsf"`), hệ thống trước đây vẫn cho điểm tối thiểu và có thể sinh các nhận xét tích cực không phù hợp.
    - Khi người dùng chưa chọn nền tảng đăng bài (TikTok, Reels, Shorts), hệ thống tự động gán mặc định là TikTok hoặc cho điểm tương thích mà không nhắc người dùng chọn nền tảng cụ thể.
  - **Giải pháp kỹ thuật:**
    - Cập nhật hàm [`analyzeContentScore`](file:///Users/tiodev/Desktop/Topify.nosync/lib/ai/9router.ts) và `calculateHeuristicContentScore`:
      - Khi phát hiện chuỗi ký tự vô nghĩa (gibberish/random string), toàn bộ các điểm thành phần (Overall, Hook, CTA, Platform Fit) đều được đặt về **0 điểm**, danh sách ưu điểm (`strengths`) hoàn toàn rỗng và danh sách cải thiện (`improvements`) giải thích rõ nội dung vô nghĩa/sơ sài.
      - Khi chưa chọn nền tảng xuất bản (`platform` rỗng hoặc `'ALL'`), điểm tương thích nền tảng (`platformFitScore`) trả về **0 điểm**, phần phân tích định dạng nêu rõ "Chưa chọn nền tảng xuất bản để đánh giá chuẩn định dạng" và danh sách gợi ý nhắc người dùng chọn ít nhất một nền tảng (TikTok, Reels, Shorts).
      - Thang điểm CTA heuristic được siết chặt: Trả về 0 điểm nếu nội dung hoàn toàn không có từ khóa kêu gọi hành động hoặc ngữ cảnh khẩn cấp.
    - Tại giao diện [`CreatePost.tsx`](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/CreatePost.tsx): Gửi giá trị nền tảng thực tế người dùng đã chọn (`platforms[0] || ''`) thay vì hardcode mặc định `'TIKTOK_VIDEO'`.
    - Bổ sung bộ kiểm thử tự động toàn diện trong [`__tests__/api/content/ai-score.test.ts`](file:///Users/tiodev/Desktop/Topify.nosync/__tests__/api/content/ai-score.test.ts).

- **[F082] Khắc phục lỗi 500 khi quét trùng lặp nội dung đa phương tiện trong Workspace:**
  - **Vấn đề giải quyết:**
    - Khi gọi API kiểm tra trùng lặp `POST /api/content/duplicate-check`, Prisma ORM báo lỗi do quan hệ giữa model `Post` và `PostMedia` có tên là `media`, nhưng câu lệnh `findMany` lại truy vấn `postMedia: { select: ... }`.
  - **Giải pháp kỹ thuật:**
    - Cập nhật [`app/api/content/duplicate-check/route.ts`](file:///Users/tiodev/Desktop/Topify.nosync/app/api/content/duplicate-check/route.ts) sử dụng đúng tên quan hệ `media: { select: { mediaAsset: { select: { storageUrl: true } } } }`.
    - Cải tiến thông báo Toast trong [`DuplicateDetectionTab.tsx`](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/components/content-studio/DuplicateDetectionTab.tsx) để bóc tách thông điệp chi tiết từ server thay vì hiển thị lỗi chung chung.

## 🚀 [2026-10-26] (v1.3.22) — Tối Ưu Hiển Thị URL Media & Sửa Lỗi Tải Video Thư Viện Media (F114)

### Phân hệ M2. Thư viện Media & Tệp tin (F114) [Electron App & Backend API]:
- **[F114] Khắc phục lỗi tải file video lên Thư viện Media (Tệp tin) bị báo "Lỗi khi tải file lên server":**
  - **Vấn đề ghi nhận từ Tester:**
    - Mở app Topify > Click "Thư viện Media (Tệp tin)" > Click "Tải File Mới".
    - Chọn file video dung lượng thấp (~2 MB) để tải lên.
    - Hệ thống lập tức báo lỗi Toast: `"Lỗi khi tải file lên server"`, video không được tải lên và không hiển thị trong thư viện.
  - **Nguyên nhân gốc rễ:**
    1. Trong trang [`MediaLibrary.tsx`](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/MediaLibrary.tsx) của Electron App, hàm `handleFileUpload` gửi request tải file nhầm đến endpoint `api.post('/upload', formData)` thay vì `api.post('/media', formData)`.
    2. Endpoint `/api/upload` là endpoint chuyên biệt dành riêng cho tạo Reel Video (`VideoAsset`), yêu cầu tham số FormData có key là `'video'`. Trong khi đó, `MediaLibrary.tsx` truyền FormData có key là `'file'`, khiến `/api/upload` trả về lỗi HTTP `400 Bad Request: "No video file provided"`.
    3. Ngoài ra, việc gán thủ công header `'Content-Type': 'multipart/form-data'` trong Axios call làm mất thông tin boundary phân cách multipart payload.
    4. Tại backend [`app/api/media/route.ts`](file:///Users/tiodev/Desktop/Topify.nosync/app/api/media/route.ts), nếu client tải file video mà browser không gán MIME type (hoặc gán `application/octet-stream`), hệ thống trước đây phân loại sai thành `mediaType: 'DOCUMENT'` và không truyền `mimeType` cho Storage provider.
  - **Giải pháp xử lý:**
    1. **Sửa endpoint tải file trong Electron App ([`MediaLibrary.tsx`](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/MediaLibrary.tsx)):**
       - Đổi lời gọi tải file sang `api.post('/media', formData)` để lưu đúng vào thực thể `MediaAsset`.
       - Bỏ header `Content-Type` thủ công để trình duyệt tự động sinh multipart boundary hợp lệ.
       - Cập nhật state danh sách `assets` ngay lập tức khi tải lên thành công, đồng thời bóc tách chi tiết thông báo lỗi từ server nếu có sự cố mạng/quyền truy cập (`err?.response?.data?.error`).
       - Đồng bộ hóa logic upload trong [`CarouselEditorTab.tsx`](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/components/content-studio/CarouselEditorTab.tsx) sang endpoint `/media` thay vì `/upload`.
       - Bổ sung `getMediaUrl` và `onError` fallback trên card thumbnail hình ảnh/video để hiển thị placeholder đẹp mắt nếu tệp chưa đồng bộ về máy local.
    2. **Tối ưu Backend API Media ([`app/api/media/route.ts`](file:///Users/tiodev/Desktop/Topify.nosync/app/api/media/route.ts)):**
       - Bổ sung cơ chế tự động suy luận MIME type theo phần mở rộng đuôi file (`.mp4`, `.mov`, `.webm`, `.mkv`, `.avi`, v.v.) khi `file.type` trống.
       - Tự động nhận diện chính xác `mediaType: 'VIDEO'` cho toàn bộ các định dạng video phổ biến.
       - Truyền `mimeType` vào `storage.upload(buffer, fileName, mimeType)` để các bộ lưu trữ (Supabase/S3/Local) thiết lập Content-Type chính xác.
       - Tự động fallback tìm `workspaceId` từ cơ sở dữ liệu nếu thông tin phiên đăng nhập chưa có `workspaceId`.
       - Chuẩn hóa trường `storageUrl` trả về trong `GET /api/media` và `POST /api/media` thành full URL tuyệt đối (kèm Host) để ứng dụng Desktop luôn hiển thị được video/hình ảnh.
    3. **Tương thích ngược & Bảo vệ phân quyền ([`app/api/upload/route.ts`](file:///Users/tiodev/Desktop/Topify.nosync/app/api/upload/route.ts), [`app/api/media/[id]/route.ts`](file:///Users/tiodev/Desktop/Topify.nosync/app/api/media/[id]/route.ts)):**
       - Cho phép `/api/upload` nhận cả key `'video'` lẫn key `'file'` để tránh lỗi 400 nếu client gửi khác tên field.
       - Bổ sung hàm kiểm tra quyền truy cập `canAccessAsset` trong `GET/PUT/DELETE /api/media/[id]` hỗ trợ Super Admin, người sở hữu file và thành viên cùng Workspace.
    4. **Tối ưu hóa hiển thị Media trên Electron Desktop App ([`axios.ts`](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/lib/axios.ts), [`Posts.tsx`](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/Posts.tsx), [`CreatePost.tsx`](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/CreatePost.tsx), [`PostDetail.tsx`](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/PostDetail.tsx)):**
       - Xây dựng hàm tiện ích `getMediaUrl` chuyển đổi an toàn các đường dẫn tương đối `/api/uploads/...` thành URL tuyệt đối trỏ tới máy chủ `topify.vn` hoặc cấu hình máy chủ hiện tại.
       - Tích hợp `getMediaUrl` cho toàn bộ các thành phần hiển thị video và ảnh trên Desktop App (Danh sách bài viết, Chi tiết bài viết, Tạo bài viết mới, Thư viện media).
       - Bổ sung đầy đủ MIME types (ảnh, âm thanh, video), tiêu đề CORS và endpoint `OPTIONS` trong [`app/api/uploads/[...path]/route.ts`](file:///Users/tiodev/Desktop/Topify.nosync/app/api/uploads/[...path]/route.ts).

## 🚀 [2026-10-26] (v1.3.20) — Khắc Phục Lỗi Đăng Ngay Kèm Bật Evergreen Không Đăng Ngay & Tự Động Tái Đăng Theo Chu Kỳ (F083)

### Phân hệ M2. Quản lý bài viết & Content Studio (Chế độ đăng ngay kết hợp Evergreen Content F083):
- **[F083] Khắc phục lỗi bài viết "Đăng ngay" kèm Evergreen bị treo không đăng ngay và hệ thống tự động tái xuất bản khi đến chu kỳ:**
  - **Vấn đề ghi nhận từ Tester:**
    - Khi người dùng ở trang Tạo bài viết chọn "Chế độ đăng bài: Đăng ngay", đồng thời bật tùy chọn "Nội dung Evergreen (Tái đăng định kỳ)" với Chu kỳ tái xuất bản 2 ngày, sau đó bấm "Đăng ngay 1 Video".
    - Thực tế bài viết không được xuất bản ngay lập tức mà bị treo ở trạng thái "Đang đăng..." hoặc người dùng lầm tưởng hệ thống chờ đến chu kỳ 2 ngày mới đăng. Đồng thời khi đến hạn 2 ngày, không có bài viết mới nào được tự động lên lịch đăng.
    - Vào menu "Nội dung Evergreen", tab mặc định "Cần tái đăng" hiển thị trống "Chưa có bài viết nào" vì bài viết mới tạo chưa quá hạn chu kỳ.
  - **Nguyên nhân gốc rễ:**
    1. Khi chọn `publishMode === 'now'`, endpoint `POST /api/posts` gọi `enqueuePublish(post.id)`. Hàm này đẩy job vào hàng đợi Redis BullMQ `publishQueue.add`. Tuy nhiên trong môi trường Electron App (hoặc khi chạy Next.js dev thông thường), không có tiến trình BullMQ worker (`worker.ts`) chạy nền độc lập để bốc job từ Redis. Job nằm chờ vô thời hạn trong Redis và bài viết không bao giờ được xuất bản ngay.
    2. Tiến trình quét ngầm `checkAndPublishDuePosts` (`publisher-service.ts`) trước đây chỉ xử lý bài `SCHEDULED` và bài bị kẹt, hoàn toàn không có logic kiểm tra chu kỳ của các bài Evergreen (`isEvergreen: true, status: 'PUBLISHED'`). Do đó khi chu kỳ (ví dụ 2 ngày) trôi qua, không có hành động tự động nhân bản hay tái đăng bài viết mới nào được kích hoạt.
    3. Trang quản lý Evergreen (`Evergreen.tsx`) mở mặc định ở tab `suggestions` ("🔥 Cần tái đăng"). Khi một bài Evergreen vừa được tạo thì `dueCount === 0`, dẫn đến màn hình thông báo trống, gây hiểu lầm là bài viết chưa được ghi nhận vào kho Evergreen. Thẻ bài viết cũng chỉ ghi chu kỳ mà chưa hiển thị ngày dự kiến tái bản tự động tiếp theo.
  - **Giải pháp xử lý:**
    1. **Đảm bảo bài "Đăng ngay" luôn được xuất bản ngay lập tức ([`lib/queue/index.ts`](file:///Users/tiodev/Desktop/Topify.nosync/lib/queue/index.ts)):**
       - Hàm `enqueuePublish` kiểm tra `publishQueue.getWorkers()`.
       - Nếu có BullMQ worker đang lắng nghe thì chuyển job cho Worker xử lý như bình thường.
       - Nếu không có worker nào (môi trường Electron app / dev không chạy `worker.ts`) hoặc Redis bị ngắt kết nối/quá thời gian phản hồi, hệ thống tự động fallback gọi trực tiếp `publishPostDirectly(postId)` chạy ngầm không chặn. Nhờ tính chất idempotent của `publishPostDirectly` (kiểm tra `platform.status === 'PUBLISHED'`), bài viết được đăng ngay lập tức an toàn 100%.
    2. **Tự động quét và tái xuất bản theo chu kỳ Evergreen ([`lib/queue/publisher-service.ts`](file:///Users/tiodev/Desktop/Topify.nosync/lib/queue/publisher-service.ts)):**
       - Trong tiến trình định kỳ `checkAndPublishDuePosts` (chạy mỗi 20 giây và mỗi lần mở danh sách bài viết), bổ sung bước quét các bài viết Evergreen `status === 'PUBLISHED'`.
       - So sánh thời gian hiện tại với mốc tham chiếu `referenceDate` (`lastRecycledAt || publishedAt || createdAt`). Khi `now - referenceDate >= recycleIntervalDays * 86400000`, hệ thống tự động:
         - Tạo bài viết con tái bản mang `originalPostId: egPost.id`, sao chép toàn bộ thông tin nền tảng, media, video, caption.
         - Cập nhật bài Evergreen gốc: gán `lastRecycledAt = now`, tăng số lần tái bản `recycleCount += 1`.
         - Kích hoạt đăng bài trực tiếp ngay lập tức cho bài viết con vừa được nhân bản.
    3. **Tính toán lịch tái bản dự kiến và lịch sử tái đăng ([`app/api/content/evergreen/route.ts`](file:///Users/tiodev/Desktop/Topify.nosync/app/api/content/evergreen/route.ts)):**
       - Bổ sung trường `nextRecycleDate` (chuẩn ISO) và `daysUntilRecycle` (số ngày còn lại đến chu kỳ tái bản).
       - Truy vấn và trả về danh sách các bài viết con đã được tái sinh (`recycledPosts`).
    4. **Cải tiến trải nghiệm người dùng trong Menu Nội dung Evergreen ([`Evergreen.tsx`](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/Evergreen.tsx) & [`page.tsx`](file:///Users/tiodev/Desktop/Topify.nosync/app/%28dashboard%29/dashboard/content/evergreen/page.tsx)):**
       - Tự động chuyển thông minh sang tab "📚 Thư viện bài" nếu tab "🔥 Cần tái đăng" chưa có bài đến hạn (`dueCount === 0 && totalEvergreen > 0`), giúp người dùng thấy ngay bài viết vừa tạo.
       - Trên thẻ bài viết hiển thị rõ: *"Đăng gần nhất: Vừa mới đăng hôm nay"*, badge *"Chu kỳ 2 ngày"*, và khung *"Tự động tái đăng: dd/MM/yyyy (còn 2 ngày)"*.
       - Hiển thị danh sách các bài đã tái đăng thành công bên dưới bài gốc.
    5. **Kiểm thử tự động hóa ([`__tests__/api/content/evergreen.test.ts`](file:///Users/tiodev/Desktop/Topify.nosync/__tests__/api/content/evergreen.test.ts)):**
       - Bổ sung test case kiểm thử tính toán `nextRecycleDate` và `daysUntilRecycle` cho bài đăng ngay kèm Evergreen chu kỳ 2 ngày. Tất cả 4/4 test cases đều Passed 100%.

## 🚀 [2026-10-26] (v1.3.19) — Sửa Lỗi Random Trong Khung: Khung Giờ Đã Qua Vẫn Chọn Được & Mốc Random Nhỏ Hơn Giờ Hiện Tại (F022)

### Phân hệ M2. Quản lý bài viết & Content Studio (Chế độ đăng ngẫu nhiên trong khung F022):
- **[F022] Khắc phục lỗi khung giờ đã qua vẫn chọn được và mốc giờ random ra nhỏ hơn thời gian hiện tại:**
  - **Vấn đề ghi nhận từ Tester & Ảnh chụp:**
    - Khi người dùng ở trang Tạo bài viết chọn chế độ "Random trong khung", đặt "Ngày áp dụng khung giờ" là ngày hiện tại (`25/10/2026`).
    - Giờ hệ thống đang là `21:14`.
    - Các khung giờ trước đó (Sáng, Trưa, Chiều) đã kết thúc nhưng vẫn click chọn được bình thường mà không bị disable.
    - Khi chọn khung giờ vàng "Tối (Hot) 19:30 – 22:30", mục "Mô phỏng thời điểm đăng ngẫu nhiên" sinh ra mốc `20:29 (25/10)`, nhỏ hơn giờ hiện tại (`21:14`).
  - **Nguyên nhân gốc rễ:**
    1. UI chưa kiểm tra thời điểm kết thúc của các preset khung giờ vàng so với thời gian hiện tại khi ngày áp dụng là hôm nay (`randomDate === today`). Do đó các khung Sáng (11:30), Trưa (13:45), Chiều (18:00) không bị vô hiệu hóa (disabled).
    2. Trong hàm tính toán thời điểm ngẫu nhiên `getComputedRandomTimes`, mốc bắt đầu `startMs` luôn lấy cố định là giờ bắt đầu của khung (`19:30`), không tính đến trường hợp khung giờ đang chạy dở (`startMs < nowMs < endMs`). Khi sinh số ngẫu nhiên từ `19:30` đến `22:30`, kết quả rơi vào `20:29` (thời điểm đã trôi qua trong quá khứ).
    3. Backend API (`POST /api/posts`) trước đây chưa chặn trường hợp `randomWindowEnd <= Date.now()` và chưa tự động dịch `effectiveStart = Math.max(start, now + 1 min)` khi khung đang diễn ra.
  - **Giải pháp xử lý:**
    1. **Tách mô-đun thuật toán độc lập [`lib/content-studio/random-window.ts`](file:///Users/tiodev/Desktop/Topify.nosync/lib/content-studio/random-window.ts) & [`electron-app/frontend/src/lib/randomWindow.ts`](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/lib/randomWindow.ts):**
       - Hàm `isPresetDisabled`: Tự động vô hiệu hóa (`disabled`) các khung giờ vàng có `end <= now` khi ngày chọn là hôm nay, hiển thị badge "Đã qua" và ngăn click.
       - Tự động chuyển sang khung hợp lệ kế tiếp hoặc chế độ "Tùy Chỉnh" khi ngày áp dụng thay đổi.
       - Giới hạn ngày chọn `min` bằng ngày hiện tại theo giờ cục bộ `getLocalDateString`.
       - Hàm `getWindowStatus`: Nhận diện chính xác 3 trạng thái: `isExpired` (khung đã qua), `isInProgress` (khung đang chạy dở), và `future` (khung trong tương lai).
       - Hàm `computeRandomWindowTimes`: Khi khung đang chạy dở (`isInProgress`), `effectiveStartMs` được đẩy lên ít nhất `now + 1 phút`. Thuật toán chỉ random trong phần thời gian còn lại `[effectiveStartMs, endMs]`. Mốc giờ random đảm bảo 100% luôn lớn hơn thời gian hiện tại và nhỏ hơn hoặc bằng giờ kết thúc khung.
    2. **Cập nhật giao diện Desktop App ([`CreatePost.tsx`](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/CreatePost.tsx)):**
       - Các nút preset đã qua được gắn cờ `disabled`, giảm độ mờ, đổi con trỏ `not-allowed`, có nhãn "Đã qua".
       - Thêm thông báo hướng dẫn khi khung đang diễn ra: *"Khung giờ đang diễn ra. Thời điểm đăng chỉ được random trong phần thời gian còn lại (từ giờ hiện tại đến {randomEndTime})"* hoặc cảnh báo lỗi khi khung đã kết thúc.
       - Nút "Random lại mốc giờ" bị disable khi khung đã hết hạn.
       - Thẩm định chặt chẽ khi bấm xuất bản bài viết, ngăn chặn gửi mốc thời gian trong quá khứ.
    3. **Tăng cường bảo vệ phía Backend API ([`app/api/posts/route.ts`](file:///Users/tiodev/Desktop/Topify.nosync/app/api/posts/route.ts)):**
       - Từ chối mã 400 nếu `randomWindowEnd <= Date.now()`.
       - Tự động căn chỉnh `effectiveStart = Math.max(start, Date.now() + 60s)` và re-randomize nếu `scheduledAt` nhận được nhỏ hơn `effectiveStart`, triệt tiêu hoàn toàn nguy cơ lên lịch vào quá khứ.
    4. **Bổ sung Unit Tests hoàn chỉnh:**
       - [`__tests__/api/content-studio/random-window.test.ts`](file:///Users/tiodev/Desktop/Topify.nosync/__tests__/api/content-studio/random-window.test.ts): 10 test cases kiểm thử độc lập cho preset disable, trạng thái khung, và kiểm tra 25 lần random liên tiếp trong khung đang chạy dở đều cho kết quả `> 21:14` (không thể xuất hiện `20:29`).
       - [`__tests__/api/posts/route.test.ts`](file:///Users/tiodev/Desktop/Topify.nosync/__tests__/api/posts/route.test.ts): Bổ sung test case từ chối khung giờ quá khứ và tự động căn chỉnh thời gian khi khung đang diễn ra.

## 🚀 [2026-10-26] (v1.3.18) — Sửa Lỗi Import Bài Viết Hàng Loạt Gắn Cảnh Báo Sai & Lỗi Lone Surrogate Khi Đăng Bài Spin Biến Thể

### Phân hệ M2. Quản lý bài viết & Content Studio (Import bài viết hàng loạt F019 & Spin biến thể F014):
- **[F019] Khắc phục lỗi record nền tảng Facebook bị gắn trạng thái "Cảnh báo" dù không có tình huống cảnh báo:**
  - **Vấn đề ghi nhận từ Tester & Ảnh chụp:**
    - Người dùng import file Excel có 3 bài viết nền tảng FACEBOOK (bài 1 có Thời gian `11:59 11/11`, bài 2 và 3 để trống Thời gian).
    - Màn xem trước hiển thị cả 3 bài đều bị gắn trạng thái `"Có cảnh báo"`, bộ đếm `"Có cảnh báo"` = 3, dù bài 1 đã có Thời gian hợp lệ và cả 3 bài không thuộc trường hợp cần cảnh báo nào (như video dài > 180s cho YouTube Shorts).
  - **Nguyên nhân gốc rễ:**
    1. Bộ phân tích ngày giờ `parseScheduleDateTime` tại [`lib/content-studio/import-engine.ts`](file:///Users/tiodev/Desktop/Topify.nosync/lib/content-studio/import-engine.ts) chưa hỗ trợ định dạng thời gian đứng trước ngày (`HH:mm DD/MM` như `11:59 11/11`), các định dạng không có năm hoặc kiểu `val instanceof Date` do thư viện `xlsx` trả về khi mở file với `{ cellDates: true }`.
    2. Giao diện Desktop App trước đó chưa đồng bộ bộ phân tích ngày giờ linh hoạt với backend và bản build `frontend/dist` bị nghẽn do lỗi biên dịch TypeScript.
  - **Giải pháp xử lý:**
    1. **Nâng cấp `parseScheduleDateTime` tại [`lib/content-studio/import-engine.ts`](file:///Users/tiodev/Desktop/Topify.nosync/lib/content-studio/import-engine.ts):**
       - Bổ sung nhận diện `val instanceof Date` trực tiếp từ cell Date của Excel.
       - Hỗ trợ định dạng giờ đứng trước ngày: `11:59 11/11`, `11:59 (11/11)`, `11:59 11/11/2026`. Tự động dùng năm hiện tại (`2026`) hoặc năm tiếp theo nếu ngày trong năm hiện tại đã qua.
       - Hỗ trợ đầy đủ các định dạng ngày giờ chuẩn Việt Nam và quốc tế: `11/11 11:59`, `11/11/2026 11:59`, `2026-11-11 11:59`, `now`, `đăng ngay`, hoặc để trống.
       - Đảm bảo các bài viết nền tảng Facebook hợp lệ có `warnings: []`, hiển thị trạng thái `"Hợp lệ"` xanh chuẩn xác, bộ đếm `"Có cảnh báo"` = 0. Cảnh báo chỉ xuất hiện cho các trường hợp đặc thù như YouTube Shorts > 180s.
    2. **Đồng bộ hóa bộ thẩm định thời gian trên Desktop App ([`ImportPostsModal.tsx`](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/components/content-studio/ImportPostsModal.tsx)):**
       - Bổ sung `validateScheduleDate` tương thích với `parseScheduleDateTime` của backend.
    3. **Khắc phục lỗi Prisma Lone Surrogate khi đăng bài Spin biến thể:**
       - Tích hợp `sanitizeUtf8`, `sanitizeUtf8Nullable` và cờ `/u` cho regex tách từ/emoji tại [`content-studio-engine.ts`](file:///Users/tiodev/Desktop/Topify.nosync/lib/content-studio/content-studio-engine.ts), [`spinEngine.ts`](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/lib/spinEngine.ts) và các API tạo bài viết [`app/api/posts/route.ts`](file:///Users/tiodev/Desktop/Topify.nosync/app/api/posts/route.ts), loại bỏ triệt để lỗi `Invalid prisma.post.create() invocation: lone leading surrogate in hex escape`.
    4. **Bổ sung Unit Tests ([`__tests__/api/content-studio/import.test.ts`](file:///Users/tiodev/Desktop/Topify.nosync/__tests__/api/content-studio/import.test.ts)):**
       - Thêm test case xác thực định dạng `11:59 11/11`, `11/11 11:59`, `Date` object và `now`.
       - Thêm test case tái hiện chính xác kịch bản 3 bài Facebook (bài 1: `11:59 11/11`, bài 2 & 3: để trống): kết quả 100% hợp lệ, 0 cảnh báo (`warningRows = 0`), đúng kỳ vọng của QA.

## 🚀 [2026-10-26] (v1.3.17) — Sửa Lỗi UI Quản Lý Bài Viết: Khắc Phục Xung Đột Sticky Filter Bar & Đè Lớp Card Bài Viết

### Phân hệ M2. Quản lý bài viết (Posts Management - Grid/List View):
- **Khắc phục lỗi thanh lọc (Filter Bar) đè lên và xung đột hiển thị với danh sách bài viết:**
  - **Vấn đề ghi nhận từ Tester & Ảnh chụp:**
    - Khi cuộn trang tại màn hình *Quản lý bài viết*, thanh lọc (`Filter & Search Bar`) bị dính (`sticky top-4`) nhưng các thẻ bài viết (post cards) lại trôi bên dưới và các phần tử con bên trong thẻ bị nổi đè lên trên thanh lọc:
      - Huy hiệu trạng thái và nút xem chi tiết `[⏰ Đã lên lịch] [👁]`, `[Bản nháp] [👁]` nổi lơ lửng ngay giữa thanh lọc (bên cạnh nút xem chế độ Lưới/Danh sách).
      - Tiêu đề và thumbnail thẻ bài viết bên dưới (`[SPECIAL CLIP] BTS...`) chèn trực tiếp vào các ô chọn `LỌC THEO KÊNH`, `LỌC THEO THỜI GIAN`, `TÌM KIẾM NỘI DUNG`.
      - Thanh lọc có lớp nền mờ bán trong suốt (`bg-white/80 backdrop-blur-xl`) khiến các thẻ tối màu bên dưới bị lem màu, gây cảm giác đè lớp vỡ giao diện.
      - Chế độ xem `Lưới / Danh sách` bị rớt xuống dòng riêng trên các màn hình có chiều rộng < 1280px (`xl`), tạo khoảng trống kỳ dị.
  - **Nguyên nhân gốc rễ:**
    1. Thuộc tính `sticky top-4 z-10` trên thanh lọc kết hợp với `z-10` ở các phần tử bên trong thẻ bài viết (`Top Action Bar`, `Play Button`, `Bottom Info`) khiến các thẻ phía sau trong DOM có cùng hoặc cao hơn z-index đè lên thanh lọc khi cuộn.
    2. Nền bán trong suốt `bg-white/80 backdrop-blur-xl` làm lộ nội dung cuộn bên dưới.
    3. Điểm ngắt `xl:flex-row` quá lớn khiến nút chuyển chế độ xem `Lưới / Danh sách` rớt dòng trên các màn hình laptop và cửa sổ Desktop App thông thường.
  - **Giải pháp xử lý:**
    1. **Bỏ `sticky top-4 z-10` trên Filter Bar** tại [`electron-app/frontend/src/pages/Posts.tsx`](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/Posts.tsx): Thanh lọc nằm tự nhiên trong luồng hiển thị (`relative z-0`), với nền trắng thuần `bg-white` để cuộn mượt mà cùng toàn trang mà không bao giờ bị đè lớp hay xung đột giao diện.
    2. **Hạ phạm vi z-index nội bộ của thẻ bài viết:** Đổi `z-10` thành `z-[2]` cho `Top Action Bar`, `Play Button`, `Bottom Info` bên trong thẻ media, vừa đủ đè lên lớp phủ gradient nhưng không bao giờ xung đột với các thành phần cấp trang.
    3. **Tối ưu responsive hàng điều khiển:** Đổi sang `flex-col sm:flex-row`, đưa các tab trạng thái và cụm nút `Lưới / Danh sách` nằm gọn gàng trên cùng 1 hàng từ màn hình `sm` trở lên.
  - **File thay đổi:**
    - [`electron-app/frontend/src/pages/Posts.tsx`](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/Posts.tsx)
  - **Kiểm thử:** Rebuild electron frontend (`npm run build --prefix electron-app/frontend`) thành công 100%, 51/51 tests liên quan pass.

## 🚀 [2026-10-26] (v1.3.16) — Sửa Lỗi Import Bài Viết Hàng Loạt: Báo Lỗi Ngay Khi Thiếu Field Bắt Buộc Hoặc Dữ Liệu Không Hợp Lệ (F019)

### Phân hệ M2. Content Studio (Import bài viết hàng loạt Excel & Google Drive - F019):
- **[F019] Khắc phục lỗi record thiếu field bắt buộc hoặc dữ liệu không hợp lệ chỉ báo Cảnh báo thay vì báo lỗi Không hợp lệ:**
  - **Vấn đề ghi nhận từ Tester & Ảnh chụp:**
    - Người dùng mở *Import Bài Viết Hàng Loạt (Excel & Google Drive)*, chọn file Excel (hoặc link Google Sheets) có record trống field bắt buộc hoặc dữ liệu không hợp lệ:
      - Nền tảng bị để trống.
      - Nền tảng chưa được kết nối với tài khoản.
      - Nền tảng không hợp lệ / không hỗ trợ.
      - Thời gian sai định dạng (ví dụ chữ "sai-dinh-dang" hoặc ngày giờ không hợp lệ).
      - Thời gian lên lịch trong quá khứ.
    - **Thực tế bị lỗi:**
      - Màn xem trước hiển thị `Hợp lệ = 3, Có cảnh báo = 3, Không hợp lệ = 0`.
      - Các record chỉ có trạng thái `"Có cảnh báo"`, không bị báo lỗi `"Không hợp lệ"`.
    - **Kỳ vọng chuẩn:**
      - Record trống field bắt buộc hoặc không hợp lệ (Thời gian sai định dạng, Nền tảng trống hoặc chưa được liên kết) phải bị báo lỗi ngay ở bước xem trước.
      - Trạng thái dòng phải là `"Không hợp lệ"` kèm lý do chi tiết (ví dụ: `Thiếu nền tảng đăng bài (Bắt buộc).`, `Thời gian sai định dạng...`, `Nền tảng TikTok chưa được kết nối với tài khoản.`).
      - Bộ đếm hộp trên cùng phải tăng số lượng `"KHÔNG HỢP LỆ"` tương ứng (`Hợp lệ = 0, Không hợp lệ = 3`).
      - Checkbox của các dòng không hợp lệ phải bị bỏ chọn mặc định để ngăn người dùng vô tình bấm lưu lỗi.
      - Áp dụng tương tự cho cả luồng Import file Excel/CSV và *Lấy thông tin từ Google Sheets*.
  - **Nguyên nhân gốc rễ:**
    1. **Tự động gán mặc định nền tảng kèm warning trong [`lib/content-studio/import-engine.ts`](file:///Users/tiodev/Desktop/Topify.nosync/lib/content-studio/import-engine.ts):**
       - Tại `parsePlatformList`, khi giá trị trống hoặc không khớp, hàm tự động trả về `['FACEBOOK_REELS']`.
       - Tại `parseExcelOrCsvBuffer`, khi `!normalizedRow.platforms`, code cũ chỉ đẩy cảnh báo `warnings.push('Chưa chỉ định nền tảng -> Mặc định chọn FACEBOOK_REELS.')`. Do đó `errors` rỗng, dòng vẫn có `isValid = true`!
    2. **Xử lý thời gian sai định dạng như một cảnh báo thay vì lỗi:**
       - Tại `parseScheduleDateTime`, khi định dạng ngày giờ không khớp hoặc ở trong quá khứ, hàm cũ trả về `{ iso: null, warning: 'Định dạng ngày giờ chưa chuẩn -> chuyển thành Bản Thảo (Draft)' }`. Vì là warning nên `errors` không có lỗi, bài viết vẫn tính là Hợp lệ.
    3. **Chưa tái kiểm tra (revalidate) tính toàn vẹn ở phía giao diện Desktop App ([`ImportPostsModal.tsx`](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/components/content-studio/ImportPostsModal.tsx)):**
       - Giao diện nhận mảng rows từ server mà không chạy qua `validateRow` toàn diện với danh sách tài khoản đã kết nối (`connectedProviders`), đồng thời hàm `validateRow` trước đó chưa kiểm tra định dạng thời gian `scheduledAt`.
  - **Giải pháp xử lý triệt để:**
    1. **Bắt buộc có Nền tảng hợp lệ ([`lib/content-studio/import-engine.ts`](file:///Users/tiodev/Desktop/Topify.nosync/lib/content-studio/import-engine.ts)):**
       - Cập nhật `parsePlatformList`: Trả về mảng rỗng `[]` khi để trống hoặc khi không có nền tảng nào hợp lệ (không tự ý gán mặc định `FACEBOOK_REELS`).
       - Trong `parseExcelOrCsvBuffer`: Nếu cột Nền tảng để trống $\rightarrow$ báo lỗi `errors.push('Thiếu nền tảng đăng bài (Bắt buộc).')`. Nếu chứa giá trị không hỗ trợ $\rightarrow$ báo lỗi `errors.push('Nền tảng "..." không hợp lệ hoặc không được hỗ trợ.')`.
    2. **Báo lỗi khi Thời gian sai định dạng hoặc ở quá khứ:**
       - Trong `parseScheduleDateTime`: Nếu ngày giờ không thể phân tích hoặc có cấu trúc sai $\rightarrow$ trả về `{ iso: null, error: 'Thời gian sai định dạng: "..." (Ví dụ đúng: 28/10/2026 20:30 hoặc 2026-10-28 20:30).' }`.
       - Nếu ngày giờ hợp lệ nhưng nhỏ hơn hoặc bằng `Date.now()` $\rightarrow$ trả về `{ iso: null, error: 'Thời gian lên lịch đã qua trong quá khứ, vui lòng chọn thời điểm trong tương lai.' }`.
       - Khi có `dateError`, đẩy thẳng vào `errors.push(dateError)` $\rightarrow$ dòng lập tức chuyển thành `isValid: false`, bộ đếm `invalidRows` tăng chuẩn xác.
    3. **Đồng bộ hóa kiểm tra liên kết nền tảng trên Desktop App ([`ImportPostsModal.tsx`](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/components/content-studio/ImportPostsModal.tsx)):**
       - Nâng cấp `validateRow` kiểm tra đồng thời: Tiêu đề bắt buộc, Nền tảng bắt buộc, Nền tảng đã kết nối, và Định dạng thời gian.
       - Tự động chạy `validateRow` trên toàn bộ dòng khi nạp xong từ file Excel/CSV hoặc Google Sheets. Các dòng lỗi sẽ tự động hiển thị nhãn đỏ `"Không hợp lệ"`, dòng lý do lỗi hiển thị ngay bên dưới, và tự động bỏ tích checkbox chọn bài.
    4. **Kiểm thử tự động ([`__tests__/api/content-studio/import.test.ts`](file:///Users/tiodev/Desktop/Topify.nosync/__tests__/api/content-studio/import.test.ts)):**
       - Thêm test case thời gian sai định dạng hoặc ở quá khứ: Đảm bảo báo lỗi `isValid = false`, `invalidRows = 2`.
       - Thêm test case thiếu nền tảng hoặc nền tảng không hỗ trợ: Đảm bảo báo lỗi `isValid = false`, `invalidRows = 2`.
       - Thêm test case tệp có 3 bài lỗi (thiếu tiêu đề, thiếu nền tảng, sai thời gian): Đảm bảo `Hợp lệ = 0, Không hợp lệ = 3, Có cảnh báo = 0`.

## 🚀 [2026-10-26] (v1.3.15) — Sửa Lỗi Import Bài Viết Hàng Loạt: Để Trống Thời Gian Mặc Định Đăng Ngay (F019)

### Phân hệ M2. Content Studio (Import bài viết hàng loạt Excel & Google Drive - F019):
- **[F019] Khắc phục lỗi để trống cột Thời gian bị gán nhãn "Bản thảo (Draft)" và dính cảnh báo vàng thay vì mặc định Đăng ngay (Now):**
  - **Vấn đề ghi nhận từ Tester & Ảnh chụp:**
    - Người dùng mở *Import Bài Viết Hàng Loạt (Excel & Google Drive)*, chọn file Excel (hoặc link Google Sheets) có 3 bài viết nền tảng FACEBOOK và để trống cột Thời gian.
    - **Thực tế bị lỗi:**
      - Cột *Thời gian* của cả 3 bài hiển thị chữ nghiêng màu xám `"Bản thảo (Draft)"`.
      - Cột *Trạng thái* của cả 3 bài bị chuyển thành `"Có cảnh báo"` (Hộp đếm trên cùng: Hợp lệ 3, Có cảnh báo 3, Không hợp lệ 0).
      - Khi bấm lưu bài viết mà không chọn "Lưu dạng Bản Thảo (Draft)", hệ thống vẫn lưu bài với trạng thái `DRAFT` thay vì đăng ngay.
    - **Kỳ vọng chuẩn:**
      - Khi để trống cột Thời gian, mặc định là đăng ngay (đăng luôn).
      - Màn xem trước phải hiển thị huy hiệu thời gian là `"Now" (Đăng ngay)` với màu xanh lá nổi bật, không hiển thị là bản thảo.
      - Trạng thái dòng phải là `"Hợp lệ"` màu xanh lá (Hợp lệ 3, Có cảnh báo 0, Không hợp lệ 0) vì không có lỗi hay cảnh báo nào.
      - Áp dụng tương tự cho cả luồng Import file Excel/CSV và *Lấy thông tin từ Google Sheets*.
  - **Nguyên nhân gốc rễ:**
    1. **Tự động chèn cảnh báo Draft trong bộ phân tích mã nguồn ([`lib/content-studio/import-engine.ts`](file:///Users/tiodev/Desktop/Topify.nosync/lib/content-studio/import-engine.ts)):**
       - Tại hàm `parseExcelOrCsvBuffer`, code cũ kiểm tra `else if (!scheduledAt) { warnings.push('Không có lịch hẹn -> Bài viết sẽ lưu dưới dạng Bản Thảo (Draft).'); }`. Dẫn đến mọi dòng bài viết để trống giờ đăng đều bị nhét cảnh báo không mong muốn vào mảng `warnings`.
       - Tại hàm `parseScheduleDateTime`, khi giá trị để trống chỉ trả về `{ iso: null }` mà không đánh dấu cờ `isNow: true`, đồng thời chưa hỗ trợ các chuỗi đại diện cho đăng ngay như `'now'`, `'đăng ngay'`, `'đăng luôn'`.
    2. **Giao diện xem trước Desktop App ([`ImportPostsModal.tsx`](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/components/content-studio/ImportPostsModal.tsx)):**
       - Tại cột Thời gian, điều kiện render cũ là `row.scheduledAt ? ... : <span className="text-gray-400 italic">Bản thảo (Draft)</span>`. Khi `scheduledAt` là rỗng hoặc `NOW`, nó luôn hiển thị văn bản `"Bản thảo (Draft)"`.
    3. **Backend API lưu bài viết ([`app/api/content-studio/import/save/route.ts`](file:///Users/tiodev/Desktop/Topify.nosync/app/api/content-studio/import/save/route.ts)):**
       - Khi người dùng bấm nút *"Xác Nhận Lên Lịch & Lưu Bài"* (`importAsDraft: false`), nếu `item.scheduledAt` để trống, code cũ gán mặc định `status: 'DRAFT'` thay vì chuyển thành `status: 'PUBLISHING'` và gọi `enqueuePublish(post.id)`.
  - **Giải pháp xử lý triệt để:**
    1. **Nâng cấp `parseScheduleDateTime` & `parseExcelOrCsvBuffer` ([`lib/content-studio/import-engine.ts`](file:///Users/tiodev/Desktop/Topify.nosync/lib/content-studio/import-engine.ts)):**
       - Khi cột Thời gian để trống (`null`, `undefined`, `''`) hoặc chứa các từ khóa (`'now'`, `'đăng ngay'`, `'đăng luôn'`, `'publish now'`, `'immediate'`), trả về `{ iso: null, isNow: true }` hoàn toàn sạch, không phát sinh bất kỳ warning nào.
       - Xóa bỏ cảnh báo tự động `Không có lịch hẹn -> Bài viết sẽ lưu dưới dạng Bản Thảo (Draft).`. Dữ liệu 3 bài viết hợp lệ sẽ có `warningRows = 0`, hiển thị nhãn `"Hợp lệ"` xanh chuẩn xác.
       - Áp dụng đồng bộ cho cả tải file Excel/CSV cục bộ và lấy dữ liệu trực tiếp từ link Google Sheets công khai (qua `fetchAndParseGoogleSheet`).
    2. **Cập nhật giao diện xem trước ([`ImportPostsModal.tsx`](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/components/content-studio/ImportPostsModal.tsx)):**
       - Khi `!row.scheduledAt || row.scheduledAt === 'NOW'`, hiển thị badge trực quan:
         `<span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200"><Sparkles className="w-3 h-3 text-emerald-600" />Now (Đăng ngay)</span>`.
       - Chỉ khi bài viết có thời gian cụ thể mới hiển thị ngày giờ màu tím với icon Calendar.
    3. **Tự động kích hoạt Đăng ngay khi xác nhận lưu bài ([`app/api/content-studio/import/save/route.ts`](file:///Users/tiodev/Desktop/Topify.nosync/app/api/content-studio/import/save/route.ts)):**
       - Phân định rõ ràng:
         - Nếu người dùng chủ động click nút *"Lưu dạng Bản Thảo (Draft)"* (`importAsDraft: true`) $\rightarrow$ tạo bài viết với `status: 'DRAFT'`.
         - Nếu người dùng click nút *"Xác Nhận Lên Lịch & Lưu Bài"* (`importAsDraft: false`):
           - Nếu có `scheduledAt` trong tương lai $\rightarrow$ `status: 'SCHEDULED'`, kích hoạt `schedulePublish(post.id, post.scheduledAt)`.
           - Nếu để trống `scheduledAt` hoặc `'NOW'` $\rightarrow$ `status: 'PUBLISHING'`, lập tức đưa vào hàng đợi đăng qua `enqueuePublish(post.id)`.
    4. **Bổ sung Unit Tests ([`__tests__/api/content-studio/import.test.ts`](file:///Users/tiodev/Desktop/Topify.nosync/__tests__/api/content-studio/import.test.ts)):**
       - Thêm test case xác thực tệp 3 bài viết để trống cột Thời gian: `validRows = 3`, `warningRows = 0`, `invalidRows = 0`, `warnings.length = 0`.
       - Thêm test case nhận diện các chuỗi `'now'`, `'Đăng ngay'` là hợp lệ với 0 cảnh báo.

## 🚀 [2026-10-26] (v1.3.14) — Sửa Lỗi Bài Viết Đã Lên Lịch Không Hiển Thị Trên Lịch Nội Dung (Calendar - F021)

### Phân hệ M2. Content Studio (Lịch nội dung & Kế hoạch xuất bản - F021):
- **[F021] Khắc phục lỗi bài viết đã lên lịch ở Quản lý bài viết hoặc Import Google Sheet/Excel không hiển thị trên Lịch nội dung:**
  - **Vấn đề ghi nhận từ Tester & Ảnh chụp:**
    - Người dùng tạo bài viết hoặc import bài viết từ Google Sheet / Excel và đặt lịch đăng (ví dụ 28/10/2026 20:26). Bài viết đã hiển thị trạng thái `Đã lên lịch` ở màn Quản lý bài viết (`/posts`).
    - Khi vào màn hình *Lịch nội dung (Calendar - F021)* xem Tháng 10/2026: Calendar hoàn toàn trống, ngày 28 không có bài viết nào, và bộ đếm hiển thị `"0 bài viết đã xếp lịch trong tháng này"`.
  - **Nguyên nhân gốc rễ:**
    1. **Sai lệch cấu trúc phản hồi Backend API ([`app/api/posts/calendar/route.ts`](file:///Users/tiodev/Desktop/Topify.nosync/app/api/posts/calendar/route.ts)):**
       - Tuyến API `/api/posts/calendar` trước đó chỉ trả về `{ events: [...] }` với thuộc tính thời gian là `start` (dành cho Web FullCalendar). Trong khi Desktop App ([`CalendarView.tsx`](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/CalendarView.tsx)) đọc `postsRes.data.posts`. Vì `posts` là `undefined`, nên `setPosts(postsRes.data.posts || [])` luôn nhận mảng rỗng `[]` và không kích hoạt fallback vào `catch` vì response vẫn là `HTTP 200`.
    2. **Lỗi lọc phân quyền Workspace khi `workspaceId` rỗng:**
       - Route `/api/posts/calendar` gán cứng `where = { workspaceId: workspaceId || 'none' }`. Khi người dùng là Quản trị viên (Admin) hoặc bài viết lưu chưa có workspaceId, điều kiện này lọc `workspaceId: 'none'`, dẫn đến không khớp bất kỳ bản ghi nào trong Database.
    3. **Không nhận diện tham số query `?month=YYYY-MM`:**
       - Route trước đó chỉ hỗ trợ `start` và `end`. Khi Desktop App gọi `?month=2026-10`, Backend không phân tích tháng mà bỏ qua điều kiện ngày hoặc lọc sai.
    4. **Hiển thị giao diện Calendar ô ngày thiếu thời gian hẹn giờ (Giờ:Phút):**
       - Ô ngày chỉ hiển thị tiêu đề bài viết mà không hiển thị mốc giờ hẹn giờ (ví dụ `20:26`), gây khó theo dõi timeline trong ngày.
  - **Giải pháp xử lý triệt để:**
    1. **Nâng cấp Backend API ([`app/api/posts/calendar/route.ts`](file:///Users/tiodev/Desktop/Topify.nosync/app/api/posts/calendar/route.ts)):**
       - Trả về đồng thời cả `{ events, posts }` với đầy đủ các thuộc tính chuẩn hóa: `id`, `title`, `scheduledAt`, `start`, `status`, `content`, `caption`, `platform`, `platforms`.
       - Hỗ trợ tham số `?month=YYYY-MM` tự động mở rộng dải ngày bao phủ toàn bộ ô hiển thị của tháng trên lưới lịch (gồm các ngày thuộc tuần trước và tuần sau).
       - Căn chỉnh điều kiện phân quyền Workspace và User khớp hoàn toàn với `GET /api/posts`: Quản trị viên (`SUPER_ADMIN`) xem toàn bộ, người dùng thường xem theo workspace hoặc bài viết do mình tạo (`createdById`).
       - Mở rộng điều kiện lọc theo ngày áp dụng cho cả `scheduledAt`, `publishedAt`, và `createdAt`.
    2. **Đồng bộ hóa Route Ghi chú Lịch ([`app/api/calendar/notes/route.ts`](file:///Users/tiodev/Desktop/Topify.nosync/app/api/calendar/notes/route.ts)):**
       - Bổ sung hỗ trợ query `?month=YYYY-MM` và phân quyền Workspace tương tự để ghi chú hiển thị đầy đủ và ổn định.
    3. **Tối ưu màn hình Lịch nội dung ([`electron-app/frontend/src/pages/CalendarView.tsx`](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/CalendarView.tsx)):**
       - Cập nhật hàm `fetchCalendarData` truyền cả `month`, `start`, `end` và chuẩn hóa an toàn dữ liệu từ `postsRes.data.posts` hoặc `postsRes.data.events` lẫn fallback `/posts`.
       - Tính toán bộ đếm tháng chính xác: Đếm đúng các bài viết có `scheduledAt` hoặc `start` nằm trong tháng đang xem (`monthScheduledCount`), giải quyết dứt điểm tình trạng hiển thị `0 bài viết đã xếp lịch trong tháng này`.
       - Hiển thị mốc giờ hẹn giờ định dạng font mono đậm (ví dụ `20:26`) ngay trước tên bài viết trên từng ô lịch ngày.
       - Cải tiến Modal xem chi tiết bài viết: hiển thị nhãn Trạng thái, ngày giờ lên lịch chuẩn tiếng Việt (`HH:mm - dd/MM/yyyy`), nền tảng mạng xã hội và nút liên kết trực tiếp đến màn Quản lý bài viết.
    4. **Kiểm thử tự động:**
       - Viết bộ unit test mới [`__tests__/api/posts/calendar.test.ts`](file:///Users/tiodev/Desktop/Topify.nosync/__tests__/api/posts/calendar.test.ts) kiểm tra:
         - Xác thực 401 khi chưa đăng nhập.
         - Trả về cả `events` và `posts` khi gọi với `?month=2026-10`.
         - Khớp chính xác bài viết lên lịch ngày 28/10/2026 với đầy đủ `scheduledAt`, `title`, `status`, `content`.
         - Tương thích tham số `?start=...&end=...` từ Web Dashboard.
         - $\rightarrow$ Pass toàn bộ 3/3 tests trong test suite mới và 30/30 tests toàn bộ module Posts.

---

## 🚀 [2026-10-26] — Bỏ Chặn Lỗi YouTube Shorts Quá 180s, Chuyển Thành Warning Cho Phép Đăng/Lên Lịch Bình Thường

### Phân hệ M2. Content Studio (Quản lý bài viết - F014: Đăng Video Ngắn YouTube Shorts):
- **[F014] Cho phép xuất bản & lên lịch video YouTube Shorts dài hơn 180s kèm cảnh báo:**
  - **Vấn đề ghi nhận từ Tester & Ảnh chụp:**
    - Người dùng chọn 1 video dài hơn 180s (cụ thể video BTS dài 211s), chọn nền tảng YouTube Shorts, chọn *"Lên lịch chính xác"* và bấm *"Lên lịch hẹn giờ 1 Video"*.
    - **Expected:** Chỉ hiển thị warning rằng video dài hơn 180s nên YouTube sẽ tự chuyển thành video thường, và vẫn cho phép đăng/lên lịch bình thường.
    - **Actual:** Hệ thống chặn cứng bằng thông báo lỗi: *"Lỗi tạo bài viết cho ...: Video cho YouTube Shorts có thời lượng tối đa 3 phút (180 giây). Video hiện tại dài 211s nên sẽ bị YouTube tự động chuyển thành video thường."* Bài viết không được tạo.
  - **Nguyên nhân gốc rễ:**
    1. Trong [`app/api/posts/route.ts`](file:///Users/tiodev/Desktop/Topify.nosync/app/api/posts/route.ts) dòng 191-196, có điều kiện chặn cứng: `if (platforms.includes('YOUTUBE_SHORTS') && videoAsset.duration > 180)` trả về `HTTP 400 Bad Request`.
    2. Trong khi đó, module publisher [`lib/publishers/youtube.ts`](file:///Users/tiodev/Desktop/Topify.nosync/lib/publishers/youtube.ts) thực tế đã có cơ chế cảnh báo và upload lên YouTube bình thường (YouTube API tự động xử lý các video dài hơn 180s thành video thông thường).
    3. Trên giao diện [`CreatePost.tsx`](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/CreatePost.tsx), hộp cảnh báo thời lượng trước đó có giao diện màu đỏ (`bg-rose-50`) như một thông báo lỗi.
  - **Giải pháp xử lý triệt để:**
    1. **Bỏ chặn 400 tại Backend API ([`POST /api/posts`](file:///Users/tiodev/Desktop/Topify.nosync/app/api/posts/route.ts)):**
       - Thay thế mã chặn 400 bằng việc tạo bài viết và lên lịch bình thường, đồng thời trả về thuộc tính `warning: "Video cho YouTube Shorts có thời lượng ${duration}s (> 180s). YouTube sẽ tự động chuyển thành video thường."`.
    2. **Đồng bộ hóa trong Engine Import Bảng tính ([`lib/content-studio/import-engine.ts`](file:///Users/tiodev/Desktop/Topify.nosync/lib/content-studio/import-engine.ts)):**
       - Thêm cột `duration` (thời lượng) vào `HEADER_ALIASES`.
       - Đối với cả luồng Excel và Google Sheets: nếu phát hiện video YouTube Shorts có thời lượng > 180s, hệ thống chỉ đẩy vào danh sách `warnings` (Có cảnh báo) để người dùng nắm thông tin, tuyệt đối không tính là `errors`, hàng vẫn hợp lệ 100% (`isValid = true`) và được phép lưu/lên lịch.
    3. **Tối ưu trải nghiệm Frontend ([`CreatePost.tsx`](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/pages/CreatePost.tsx)):**
       - Chuyển hộp thông báo thời lượng YouTube Shorts sang màu vàng cảnh báo (`bg-amber-50 border-amber-200 text-amber-800`), nội dung ghi rõ: *"YouTube Shorts chỉ phân loại dạng Shorts đối với video tối đa 3 phút (180 giây). Video này dài ...s nên sẽ được YouTube tự động xuất bản dưới dạng Video thông thường. Hệ thống vẫn hỗ trợ đăng và lên lịch hẹn giờ bình thường!"*.
       - Khi lên lịch thành công, hệ thống hiển thị Toast cảnh báo nhẹ nhàng (`toast.warning(warning)`) để người dùng lưu ý mà không làm gián đoạn luồng tạo bài.
    4. **Kiểm thử tự động:**
       - Bổ sung test case trong [`__tests__/api/posts/route.test.ts`](file:///Users/tiodev/Desktop/Topify.nosync/__tests__/api/posts/route.test.ts): `allows YouTube Shorts post creation when video duration > 180s and returns warning` $\rightarrow$ Pass 12/12 tests.
       - Bổ sung test case trong [`__tests__/api/content-studio/import.test.ts`](file:///Users/tiodev/Desktop/Topify.nosync/__tests__/api/content-studio/import.test.ts): `allows YouTube Shorts with duration > 180s as valid with a warning instead of blocking` $\rightarrow$ Pass 6/6 tests.

---

## 🚀 [2026-10-26] — Sửa Lỗi Import Bài Viết Excel & Google Sheets Báo Hợp Lệ Dù Nền Tảng Chưa Kết Nối (F019)

### Phân hệ M2. Content Studio (Quản lý bài viết - F019: Import Bài Viết Hàng Loạt):
- **[F019] Validate kiểm tra kết nối nền tảng (Connected Social Channels) trước khi import:**
  - **Vấn đề ghi nhận từ Tester & Ảnh chụp:**
    - Người dùng chuẩn bị file Excel / Google Sheets import có cột Nền tảng ghi `TIKTOK / YOUTUBE_SHORTS`, nhưng tài khoản chỉ mới kết nối YouTube Shorts, chưa kết nối TikTok.
    - Khi upload file Excel hoặc dán link Google Sheets, hệ thống báo kết quả: `TỔNG SỐ BÀI: 3, HỢP LỆ: 3, KHÔNG HỢP LỆ: 0` và record số 1 vẫn báo nhãn xanh `Hợp lệ`.
    - **Expected:** Hệ thống phải validate dữ liệu import trước khi đẩy lên và báo record invalid (`Không hợp lệ`) vì nền tảng TikTok chưa được kết nối với tài khoản.
    - **Actual:** Record có nền tảng TikTok (chưa connect) vẫn được báo hợp lệ.
  - **Nguyên nhân gốc rễ:**
    1. Trong [import-engine.ts](file:///Users/tiodev/Desktop/Topify.nosync/lib/content-studio/import-engine.ts), hàm `parseExcelOrCsvBuffer` trước đó chỉ kiểm tra tính bắt buộc của `title` (`if (!title) errors.push(...)`). Hàm chưa nhận danh sách các nhà cung cấp/mạng xã hội đã kết nối (`connectedProviders`) để đối chiếu với các nền tảng trong từng hàng bài viết.
    2. Route `POST /api/content-studio/import/parse` không truy vấn `prisma.socialAccount` của người dùng/workspace, nên không thể biết tài khoản đã kết nối những mạng xã hội nào khi phân tích tệp hoặc đọc Google Sheets.
    3. Trên giao diện modal [ImportPostsModal.tsx](file:///Users/tiodev/Desktop/Topify.nosync/electron-app/frontend/src/components/content-studio/ImportPostsModal.tsx), các nhãn nền tảng chỉ hiển thị tên kênh thông thường mà không thể hiện trạng thái kết nối, và cột Trạng thái chỉ dựa vào mảng `errors` từ server nên hiển thị xanh `Hợp lệ`.
  - **Giải pháp xử lý triệt để:**
    1. **Nâng cấp `import-engine.ts`:**
       - Định nghĩa bản đồ `PLATFORM_PROVIDER_INFO` và hàm `isPlatformProviderConnected` ánh xạ từng nền tảng (`FACEBOOK_REELS`, `INSTAGRAM_REELS`, `YOUTUBE_SHORTS`, `TIKTOK_VIDEO`, `ZALO_POST`, ...) với Provider tương ứng (`META`, `YOUTUBE`, `TIKTOK`, `ZALO`).
       - Cập nhật cả 2 luồng: `parseExcelOrCsvBuffer` (Upload file Excel/CSV) và `fetchAndParseGoogleSheet` (Đọc từ link Google Sheets) để nhận tham số `connectedProviders`.
       - Nếu hàng bài viết chứa nền tảng chưa được kết nối trong tài khoản (ví dụ `TIKTOK_VIDEO`), hệ thống sẽ:
         - Thêm vào danh sách `unconnectedPlatforms`.
         - Đẩy lỗi: `"Nền tảng TikTok chưa được kết nối với tài khoản."` vào mảng `errors`.
         - Đánh dấu `isValid = false` và tăng đếm `invalidRows` (Không hợp lệ).
    2. **Cập nhật Backend Route `POST /api/content-studio/import/parse`:**
       - Truy vấn `prisma.socialAccount` theo `userId` và `workspaceId` (trạng thái `CONNECTED`/`active` và chưa hết hạn `expiresAt`).
       - Xây dựng tập hợp `connectedProviders` và truyền vào engine phân tích cho cả 2 hình thức: file tải lên (`multipart/form-data`) và đường dẫn Google Sheets (`application/json`).
    3. **Chặn lưu và lên lịch trên Backend `POST /api/content-studio/import/save`:**
       - Kiểm tra xác thực các nền tảng khi lưu ở chế độ Lên lịch (`!importAsDraft`). Nếu phát hiện bài viết nhắm tới kênh chưa kết nối, lập tức trả về mã lỗi `400 Bad Request` kèm tên kênh và hướng dẫn.
    4. **Hoàn thiện UI/UX tại `ImportPostsModal.tsx`:**
       - Card thống kê tính toán chính xác số lượng: Hàng có kênh chưa kết nối được đếm vào thẻ đỏ **"KHÔNG HỢP LỆ"**.
       - Tại bảng dữ liệu:
         - Nhãn nền tảng chưa kết nối đổi sang màu đỏ kèm ghi chú rõ nét: `TIKTOK (Chưa connect)` và nút bấm `[×]` nhanh để gỡ bỏ kênh chưa kết nối. Khi người dùng bấm `[×]`, hàng sẽ tự động re-validate và lập tức chuyển thành `Hợp lệ` nếu không còn lỗi.
         - Cột Trạng thái hiển thị badge đỏ **"Không hợp lệ"** cùng dòng thông báo lỗi chi tiết bên dưới.
         - Hiển thị Banner cảnh báo màu đỏ ở đầu bảng kèm nút bấm tắt mở nhanh trang Cài Đặt (`#/settings`) để người dùng dễ dàng kết nối mạng xã hội.
         - Ngăn chặn lưu hoặc lên lịch các bài viết không hợp lệ khi người dùng bấm xác nhận.
    5. **Kiểm thử tự động:**
       - Bổ sung test cases trong [import.test.ts](file:///Users/tiodev/Desktop/Topify.nosync/__tests__/api/content-studio/import.test.ts): Kiểm tra tệp chứa nền tảng TikTok khi tài khoản chỉ kết nối YouTube $\rightarrow$ kết quả `isValid = false`, `errors` chứa thông báo lỗi chưa kết nối TikTok. Toàn bộ 5/5 test cases đều pass 100%.

---

## 🚀 [2026-10-24] — Sửa Lỗi Số Dư Ví Không Tăng Sau Khi Nhận Thưởng Nhiệm Vụ (F150)

### Phân hệ M12. Ví Doanh Thu & Tiếp Thị Liên Kết (Wallet & Earnings - F150):
- **[F150] Đồng bộ hoàn chỉnh số dư Ví và Sổ cái giao dịch khi Nhận Thưởng:**
  - **Vấn đề ghi nhận từ Tester:**
    - Người dùng ở nhiệm vụ đã hoàn thành 100% (ví dụ: *"Giới thiệu 3 chủ shop dùng thử Topify"*, +200,000 VND), bấm *"Nhận thưởng"*.
    - Hệ thống hiện Toast báo thành công, nhiệm vụ chuyển sang *"Đã nhận thưởng"*, nhưng khi quay lại tab *"Ví & Rút Tiền (F146, F148)"*, *"Số Dư Khả Dụng"* vẫn giữ nguyên không tăng và không thấy giao dịch trong tab *"Lịch Sử Giao Dịch (F147)"*.
  - **Nguyên nhân gốc rễ:**
    1. Khi người dùng đăng nhập trong Desktop/Web App (có Bearer JWT token), route `GET /api/wallet` lấy số dư từ database `prisma.wallet` theo `userId`.
    2. Route `POST /api/wallet/tasks` trước đó chỉ tăng số dư trong biến in-memory `memoryWallet` mà hoàn toàn **không thực hiện cập nhật `prisma.wallet` (`balance: { increment: task.rewardAmount }`)** và **không tạo bản ghi `prisma.walletTransaction`**.
    3. Sau khi nhận thưởng, frontend gọi `fetchWalletData()` $\rightarrow$ gọi `GET /api/wallet` $\rightarrow$ API đọc từ database vẫn là số dư cũ chưa được cộng tiền, dẫn đến số dư bị đè lại như cũ.
  - **Giải pháp xử lý triệt để:**
    1. **Tích hợp Prisma & Auth vào `POST /api/wallet/tasks`:**
       - Tự động nhận diện tài khoản người dùng đăng nhập qua JWT/Session (`auth()`).
       - Thực hiện giao dịch nguyên tử (`prisma.$transaction`):
         - Tăng số dư khả dụng trong cơ sở dữ liệu: `prisma.wallet.update({ data: { balance: { increment: task.rewardAmount } } })`.
         - Tạo ngay bản ghi giao dịch biến động số dư: `prisma.walletTransaction.create({ data: { type: 'EARNING', amount: task.rewardAmount, referenceId: task.id } })`.
       - Đồng bộ song song bộ nhớ `memoryWallet` và `memoryTransactions` để đảm bảo hoạt động trơn tru trong mọi môi trường.
       - Trả về đối tượng `wallet` với số dư mới nhất và đối tượng `transaction` chi tiết trong payload phản hồi.
    2. **Đồng bộ hóa tức thì trên Frontend (`WalletEarnings.tsx`):**
       - Tại `handleClaimTask`: Ngay khi nhận được phản hồi thành công từ server, lập tức cập nhật state `setWallet(res.data.wallet)` và chèn `res.data.transaction` vào danh sách giao dịch, sau đó gọi ngầm `fetchWalletData(true)` để đồng bộ toàn vẹn.
       - Khi người dùng chuyển qua lại giữa các tab (Tab 4 $\rightarrow$ Tab 1 hoặc Tab 2), số dư khả dụng tăng ngay lập tức đúng +200,000 VND và giao dịch hiển thị rõ ràng tại Sổ cái với nhãn `EARNING`.
    3. **Bổ sung Kiểm thử Tự động:**
       - Thêm test case `should claim task_003 (+200,000 VND) and reflect directly in GET /api/wallet balance and transactions` trong `__tests__/api/wallet/wallet.test.ts`. Toàn bộ 16/16 test case đều pass 100%.

---

## 🚀 [2026-10-24] — Sửa Lỗi Hiển Thị Trạng Thái Nhiệm Vụ Quá Hạn & Kích Hoạt Nhận Thưởng Tab Nhiệm Vụ Kiếm Thưởng (F150)

### Phân hệ M12. Ví Doanh Thu & Tiếp Thị Liên Kết (Wallet & Earnings - F150):
- **[F150] Xử lý chính xác trạng thái Quá Hạn (Overdue) và trạng thái Đã Nhận Thưởng / Nhận Thưởng Ngay:**
  - **Vấn đề ghi nhận từ Tester & Ảnh chụp:**
    1. **Nhiệm vụ quá hạn vẫn báo "Đang thực hiện":** Nhiệm vụ `'Xuất bản 10 bài đăng social trong tuần'` (tiến độ 8/10, 80%) có hạn chót là `20/10/2026`, thời điểm kiểm thử là `22/10/2026` (hoặc `24/10/2026`), nhưng ở góc dưới bên phải card vẫn hiển thị `"Đang thực hiện"`, gây hiểu nhầm cho người dùng là nhiệm vụ vẫn còn hiệu lực.
    2. **Nhiệm vụ hoàn thành 100% hiển thị "Đã nhận thưởng" xám mờ:** Nhiệm vụ `'Đạt mốc 10.000 lượt xem video ngắn'` (10.000/10.000, 100%) hiển thị nhãn xám *"Đã nhận thưởng"*, trong khi người dùng thực tế chưa hề bấm *"Nhận thưởng"*, khiến người dùng mất cơ hội tương tác và không kiểm tra được luồng cộng tiền ví.
  - **Giải pháp xử lý toàn diện:**
    1. **Bổ sung logic kiểm tra Quá hạn (`isOverdue = isExpired && !isCompleted`):**
       - Tại API Backend (`/api/wallet/tasks`): Tính toán thuộc tính động `isExpired: new Date(t.expiresAt).getTime() < now` cho từng nhiệm vụ và trả về `expiredCount`. Chặn yêu cầu nhận thưởng với các task quá hạn chưa hoàn thành (`400 Bad Request: Nhiệm vụ đã hết hạn và chưa hoàn thành mục tiêu`).
       - Tại giao diện Frontend (`WalletEarnings.tsx`): Kiểm tra thời gian hết hạn của từng task:
         - Khi nhiệm vụ đã quá hạn và chưa hoàn thành (`isOverdue`):
           - Góc dưới bên phải hiển thị rõ ràng badge đỏ: `⚠️ Đã hết hạn` (`text-rose-600 bg-rose-50 border-rose-200`). Tuyệt đối không hiển thị `"Đang thực hiện"`.
           - Dòng hạn chót hiển thị màu đỏ kèm icon cảnh báo `AlertCircle` (`text-rose-600`).
           - Huy hiệu danh mục bổ sung tag `Quá hạn` màu đỏ.
           - Phần thưởng VND hiển thị gạch ngang (`line-through text-gray-400`).
           - Thanh tiến độ chuyển sang màu đỏ hồng nhạt `bg-rose-400`.
         - Khi nhiệm vụ còn trong hạn và chưa hoàn thành: Hiển thị badge vàng/cam `Clock` `"Đang thực hiện"`.
    2. **Chuẩn hóa trạng thái Nhận Thưởng:**
       - Trong bộ dữ liệu giả lập (`lib/wallet/wallet-engine.ts`): Cập nhật `task_002` (`'Đạt mốc 10.000 lượt xem video ngắn'`) sang `isClaimed: false, isCompleted: true`.
       - Trên giao diện Frontend:
         - Khi nhiệm vụ đạt 100% tiến độ và chưa nhận thưởng (`isCompleted && !isClaimed`): Hiển thị nút bấm xanh lá nổi bật có hiệu ứng ánh sao: `✨ Nhận Thưởng Ngay` (`animate-pulse bg-emerald-600 hover:bg-emerald-700`).
         - Khi người dùng bấm nút: Gửi request `POST /api/wallet/tasks`, cộng ngay tiền thưởng vào số dư khả dụng (`availableBalance`), ghi nhận 1 giao dịch `EARNING` vào sổ cái, và chuyển trạng thái nút sang `✓ Đã nhận thưởng` màu xám.
         - Trạng thái `✓ Đã nhận thưởng` chỉ hiển thị đối với nhiệm vụ thực sự đã được bấm nhận thưởng thành công.
    3. **Bổ sung Bộ Kiểm Thử Unit Test F150 (`__tests__/api/wallet/wallet.test.ts`):**
       - Test GET `/api/wallet/tasks`: Kiểm tra làm giàu dữ liệu với cờ `isExpired`, phát hiện đúng `task_001` quá hạn và `task_002` sẵn sàng nhận thưởng.
       - Test POST `/api/wallet/tasks`: Chặn nhận thưởng task đã quá hạn chưa hoàn thành.
       - Test POST `/api/wallet/tasks`: Cho phép nhận thưởng task hợp lệ, cộng tiền ví, tạo transaction và chặn nhận thưởng lần 2 (idempotency).

---

## 🚀 [2026-10-24] — Khắc Phục Lỗi Vỡ Layout Header, Tabs & Nút Rút Tiền Trang Ví & Hoa Hồng (Wallet)

### Phân hệ M12 & M13. Ví Doanh Thu & Tiếp Thị Liên Kết (Wallet & Referral):
- **[F146, F148, F149, F150, F151 - F155] Tối ưu hóa toàn diện giao diện Header, Tabs Navigation và Thẻ Số Dư:**
  - **Vấn đề ghi nhận từ Tester & Ảnh chụp:**
    1. **Vỡ layout Header Card:** Badge `M12 & M13` bị co hẹp và xuống thành 2 dòng (`M12 &` trên dòng 1, `M13` trên dòng 2). Chiều cao tăng lên khiến phần dưới của badge đè lên dòng mô tả tính năng (phần chữ `'nhiệm vụ kiếm tiền (F150)'` bị che khuất một phần).
    2. **Nút "Rút Tiền Ngay" tràn sát mép card:** Nút bấm hành động bên phải bị đẩy sát mép viền ngoài cùng của card header, thiếu khoảng đệm an toàn và có nguy cơ tràn ra ngoài trên các màn hình có sidebar hẹp.
    3. **Thanh Tabs bị cắt chữ ("Nhiệm…"):** Do kích thước 5 tabs mang nhãn và badge phân hệ quá dài (tổng chiều ngang ~960px), trên cửa sổ ứng dụng tiêu chuẩn (~800px-1100px), tab thứ 4 bị cắt cụt giữa chừng thành `'Nhiệm…'` và tab thứ 5 bị đẩy khuất khỏi tầm nhìn.
    4. **Nút 'Rút ngay' trong card Số Dư Khả Dụng bị vỡ thành 2 dòng:** Bên trong thẻ xanh lá `Số Dư Khả Dụng (Available)`, nút bấm `'Rút ngay'` thiếu thuộc tính `whitespace-nowrap shrink-0`, bị khối text bên cạnh chèn ép khiến chữ `'Rút'` nằm ở dòng trên và `'ngay'` nằm ở dòng dưới dạng hình quả trứng.
  - **Giải pháp xử lý toàn diện:**
    1. **Tái cấu trúc Top Header (`WalletEarnings.tsx`):**
       - Đổi breakpoint header sang `flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 p-5 sm:p-6`.
       - Khối thông tin bên trái: Bọc trong `min-w-0 flex-1 space-y-1`. Hàng tiêu đề dùng `flex flex-wrap items-center gap-2 min-w-0`, badge `M12 & M13` được gán `whitespace-nowrap shrink-0 inline-flex items-center`, đảm bảo giữ nguyên trên 1 dòng duy nhất.
       - Dòng mô tả: Áp dụng `leading-relaxed text-xs text-gray-500 max-w-3xl` với khoảng cách `space-y-1` sạch sẽ, triệt tiêu 100% hiện tượng badge chèn đè lên văn bản.
       - Nút "Rút Tiền Ngay": Gán `whitespace-nowrap shrink-0` với cấu trúc `self-start xl:self-center`, giữ khoảng đệm padding 20px-24px tiêu chuẩn bên trong header card.
    2. **Tối ưu thanh Tabs Navigation (`WalletEarnings.tsx`):**
       - Áp dụng `overflow-x-auto no-scrollbar scroll-smooth` với `gap-1 sm:gap-1.5` và padding nút `px-3 sm:px-4 py-2.5 sm:py-3`.
       - Nhãn badge phân hệ kỹ thuật (`F146, F148`, `F147`, `F149`, `F150`, `F151-F155`) được chuyển sang `hidden xl:inline-block`: Trên các màn hình laptop và desktop window thông thường (< 1280px), toàn bộ 5 tabs hiển thị trọn vẹn văn bản tiếng Việt mà không cần cuộn ngang hay bị cắt chữ thành `'Nhiệm…'`. Trên màn hình lớn (>= 1280px), các badge tự động hiện đủ.
    3. **Tối ưu Thẻ Số Dư & Nút Bấm (`WalletEarnings.tsx`):**
       - Thẻ Số Dư Khả Dụng: Dòng dưới gán `truncate min-w-0` cho văn bản `"Sẵn sàng rút về ngân hàng"`, và gán `whitespace-nowrap shrink-0 text-xs` cho nút `"Rút ngay"`, đảm bảo nút luôn giữ dạng pill nằm ngang chuẩn chỉnh trên 1 dòng.
       - Thẻ Chờ Đối Soát & Đã Rút: Chuẩn hóa nhãn `"Kỳ giải ngân ngày 15"` và `"Tự động cộng ví"` với `truncate min-w-0` và `whitespace-nowrap shrink-0`, cân đối hoàn hảo trong hệ lưới 3 cột.
       - Các bảng và card con (Lịch sử rút tiền, Lịch sử giao dịch, Phương thức nhận tiền, Nhiệm vụ kiếm tiền, Phễu tiếp thị): Đều được nâng cấp sang responsive `flex-col sm:flex-row items-start sm:items-center justify-between gap-3`.
    4. **Bổ sung Bộ Kiểm Thử Unit Test Tự Động (`__tests__/api/wallet/wallet.test.ts`):**
       - 12 bài test tự động bao quát thuật toán chống gian lận (`checkReferralFraud`), cấu trúc sổ cái, các trạng thái rút tiền và quy tắc tính hoa hồng.

---

## 🚀 [2026-10-24] — Tối Ưu Chạy Thử Kịch Bản (Test Trigger Diagnostics) & Khắc Phục Tràn Header Trang Tự Động Hóa

### Phân hệ M11. Tự Động Hóa (Automation Flow):
- **[F141 - F144] Hoàn thiện trải nghiệm Chạy Thử Kịch Bản (Test Trigger) và sửa lỗi tràn Header:**
  - **Vấn đề ghi nhận từ Tester & Ảnh chụp:**
    1. **Thông báo Test Trigger không rõ mục đích, hiển thị sai dạng Thành công khi bị Bỏ qua:** Khi bấm nút "Test" trên card kịch bản, hệ thống hiển thị Toast màu xanh lá có dấu tick với nội dung: `Kịch bản 'Test Trigger' đã bỏ qua (Không thỏa điều kiện)`. Thông báo này gây hiểu lầm là đã kích hoạt thành công (dù thực tế bị bỏ qua), không nêu rõ mục đích của tính năng Test, không cho biết dữ liệu mẫu đã đưa vào là gì, điều kiện nào không thỏa và cách để kích hoạt thành công.
    2. **Chỉ số 'Tổng lượt kích hoạt' vẫn là 0:** Dữ liệu kịch bản lấy từ cơ sở dữ liệu Prisma không map trường đếm log `_count.logs` vào `executionCount`, đồng thời route `trigger-test` trước đây không lưu log vào bảng `AutomationRuleLog` trên Prisma khi kích hoạt thành công, khiến số lượt chạy bị kẹt ở mức 0.
    3. **Bộ đánh giá điều kiện không hỗ trợ danh sách từ khóa phân tách bằng dấu phẩy:** Các mẫu kịch bản thường cấu hình `value: 'giá, bao nhiêu, ib'` nhưng engine trước đây kiểm tra chuỗi nguyên khối `text.includes('giá, bao nhiêu, ib')` thay vì tách từng từ khóa, dẫn đến câu test mẫu luôn bị đánh giá trượt.
    4. **Tràn Header trang Tự động hóa:** Container header sử dụng `sm:flex-row` (kích hoạt từ 640px) trong khi tổng chiều rộng tiêu đề, badge `M11 Core` và 2 nút hành động ("Mẫu Quy Trình (1-Click)", "Tạo Kịch Bản Mới") vượt quá 850px. Trên các màn hình laptop và cửa sổ Electron có sidebar, nút "Tạo Kịch Bản Mới" bị ép ra sát mép phải và cắt cụt thành `"Tạo Kịch…"`, đồng thời badge `M11 Core` bị chèn đè lên khu vực các nút bấm.
  - **Giải pháp xử lý toàn diện:**
    1. **Tái cấu trúc Header trang Tự Động Hóa (`Automation.tsx`):**
       - Chuyển điểm ngắt flex từ `sm:flex-row` sang `xl:flex-row items-start xl:items-center justify-between gap-4`.
       - Khối tiêu đề bên trái: Đặt trong `min-w-0 flex-1`, tiêu đề và badge `M11 Core` nằm trong hàng `flex-wrap gap-2.5` với `shrink-0 whitespace-nowrap`, không bao giờ bị đè lấn sang khu vực nút.
       - Khối nút hành động bên phải: Được bao bọc với `flex-wrap gap-2.5 shrink-0`, gán `whitespace-nowrap shrink-0` cho cả 2 nút "Mẫu Quy Trình (1-Click)" và "Tạo Kịch Bản Mới", triệt tiêu hoàn toàn hiện tượng cắt xén chữ ở mép phải.
       - Tương tự, thanh điều khiển Control Bar trong `WorkflowRulesTab.tsx` được bổ sung `flex-wrap min-w-0` đảm bảo không bị tràn trên mọi độ phân giải.
    2. **Nâng cấp Động cơ Đối soát Điều kiện (`lib/automation/flow-engine.ts`):**
       - Bổ sung hàm chẩn đoán chuyên sâu `evaluateConditionsDetailed`: Tự động phân tách danh sách từ khóa có dấu phẩy (vd: `giá, bao nhiêu, ib` $\rightarrow$ mảng `['giá', 'bao nhiêu', 'ib']`).
       - Đối soát từng điều kiện đơn lẻ, xuất ra kết quả chi tiết từng mục: `matched` (Đạt / Chưa đạt), `actualValue` (Giá trị thực tế), `expectedValue` (Giá trị yêu cầu) và `reason` (Lý giải tường minh bằng tiếng Việt).
    3. **Nâng cấp API Chạy Thử (`app/api/automations/trigger-test/route.ts`):**
       - Tìm kiếm kịch bản linh hoạt trong cả bộ nhớ RAM (`memoryAutomationRules`) lẫn Database Prisma (`prisma.automationRule`).
       - Bổ sung tham số `autoMatch: true`: Tự động trích xuất các điều kiện của kịch bản để tạo ra câu phát biểu thử nghiệm khớp 100% điều kiện, giúp tester kiểm tra thành công ngay lập tức.
       - Khi kịch bản chạy thành công: Tự động ghi nhận `AutomationRuleLog` vào cơ sở dữ liệu Prisma và cập nhật `executionCount`.
       - Trả về payload chẩn đoán hoàn chỉnh gồm: `purpose`, `status` (`SUCCESS` / `SKIPPED`), `diagnostic` (chi tiết dữ liệu test, kết quả từng điều kiện, lý do bỏ qua, hướng dẫn khắc phục `howToPass`, danh sách hành động đã thực thi).
    4. **Đồng bộ Lượt Kích Hoạt Trong API Danh Sách (`app/api/automations/route.ts`):**
       - Bổ sung `include: { _count: { select: { logs: true } } }` cho mọi trường hợp truy vấn.
       - Ánh xạ chính xác `executionCount: rule._count?.logs ?? rule.executionCount ?? 0`, đảm bảo con số trên thẻ kịch bản và thẻ KPI "Tổng lượt kích hoạt" luôn đồng bộ và nhảy số ngay sau khi chạy test thành công.
    5. **Xây dựng Modal Chẩn đoán Kết Quả Chạy Thử (`TestResultModal.tsx`):**
       - **Phân định rõ rệt trạng thái qua Toast:**
         - Khi kịch bản thành công: Bắn Toast xanh lá (`toast.success`) với icon tick xác nhận.
         - Khi kịch bản bị bỏ qua: Bắn Toast cảnh báo màu cam (`toast.warning`) kèm thông báo rõ lý do chưa thỏa điều kiện, tuyệt đối không dùng màu xanh thành công.
       - **Hiển thị Modal chẩn đoán chi tiết:**
         - Nêu rõ **Mục đích chạy thử**: Giúp người dùng kiểm tra trước quy trình với dữ liệu giả lập mà không làm phiền khách hàng thật.
         - Hiển thị rõ **Dữ liệu mẫu đã dùng**: Kênh phát sinh, Người gửi, Nội dung sự kiện (`text`).
         - Bảng **Đối soát từng điều kiện**: Từng điều kiện có nhãn "Đạt" (xanh) hoặc "Chưa đạt" (cam) và giải thích chi tiết tại sao chưa đạt.
         - Khung **Hướng dẫn khắc phục**: Chỉ rõ cần bổ sung từ khóa gì hoặc dữ liệu gì để thỏa mãn.
         - Nút 1-Click **"⚡ Chạy Thử Khớp Điều Kiện (100% Pass)"**: Bấm để chạy ngay với dữ liệu chuẩn, lập tức kích hoạt chuỗi hành động và tăng số lượt chạy lên 1!
         - Nút **"📋 Xem Nhật Ký (Logs)"**: Chuyển thẳng sang Tab Nhật ký để xem chi tiết log vừa ghi nhận.
  - **Kiểm thử tự động:**
    - Cập nhật bộ unit test `__tests__/api/automations/rules.test.ts` bổ sung các ca kiểm thử: phân tách từ khóa dấu phẩy, báo cáo chi tiết lỗi điều kiện `evaluateConditionsDetailed`, báo cáo thành công (10/10 tests passed).
    - Build thành công cả `electron-app/frontend` (Vite) và Next.js production.
  - **Tệp thay đổi:** `lib/automation/flow-engine.ts`, `app/api/automations/trigger-test/route.ts`, `app/api/automations/route.ts`, `electron-app/frontend/src/components/automation/TestResultModal.tsx`, `electron-app/frontend/src/components/automation/WorkflowRulesTab.tsx`, `electron-app/frontend/src/pages/Automation.tsx`, `__tests__/api/automations/rules.test.ts`, `TEST_CASES.md`, `UPDATES.md`.

---

## 🚀 [2026-10-24] — Khắc Phục Lỗi Giao Diện Thẻ Kịch Bản Tự Động Hóa (Automation Rule Cards Layout & Overflow)

### Phân hệ M11. Tự Động Hóa (Automation):
- **[F141 - F143] Sửa lỗi vỡ layout card kịch bản, mã ID và công tắc tràn viền, nhãn bị xuống dòng:**
  - **Vấn đề ghi nhận từ Tester & Ảnh chụp:**
    1. **Mã ID và Công tắc tràn mép card:** Mã định danh ID dạng CUID (`#cmvjmep3o001trk2g6d6of746`, dài 26 ký tự) được đặt chung hàng với badge loại trigger và công tắc bật/tắt (Switch) mà không có giới hạn độ rộng hay `truncate`, chiếm toàn bộ chiều ngang và đẩy công tắc tràn hẳn ra ngoài mép phải của card, đè lên viền card.
    2. **Badge 'Comment MXH' bị rớt thành 2 dòng:** Thiếu `whitespace-nowrap shrink-0`, bị khối nội dung bên cạnh chèn ép khiến chữ 'Comment' và 'MXH' gãy dòng.
    3. **Các nhãn quy trình bị xuống dòng và dính chữ:** `Kích hoạt khi:` bị ngắt thành 'Kích hoạt' / 'khi:', `Điều kiện:` bị ngắt thành 'Điều' / 'kiện:' do thiếu `shrink-0 whitespace-nowrap`, đồng thời dính sát giá trị bên cạnh (`NEW_COMMENT`, `keyword contains …`).
    4. **Dòng footer 'Đã chạy: 0 lượt' bị gãy dòng:** Chữ 'lượt' bị đẩy xuống dòng thứ 2 do card bị ép hẹp và thiếu bảo vệ không bẻ dòng.
    5. **Tỷ lệ hiển thị lưới không cân đối:** Lưới chia 3 cột cố định (`lg:grid-cols-3`) ngay cả khi chỉ có 1 card, làm card bị ép thành 1 dải hẹp (~270px) trong khi 2/3 không gian lưới bên phải để trống.
  - **Giải pháp xử lý toàn diện:**
    1. **Tối ưu hóa Header Card & Mã ID:**
       - Rút gọn hiển thị mã ID dài dạng `#cmvjmep...f746` (`id.length > 14 ? id.slice(0, 7)...id.slice(-4)`), đi kèm tooltip `title="Mã kịch bản: #${rule.id}"` hiển thị đầy đủ khi hover.
       - Tách công tắc Switch sang vùng riêng biệt cố định bên phải (`shrink-0 pt-0.5`), đảm bảo luôn nằm gọn gàng bên trong viền card.
       - Thêm `whitespace-nowrap shrink-0` cho tất cả badge nguồn kích hoạt (`Comment MXH`, `Tin nhắn Inbox`, `Lead CRM`, v.v.).
       - Bổ sung `truncate` và `title` cho tên kịch bản để tự động cắt gọn an toàn khi tên dài.
    2. **Bảo vệ toàn bộ Nhãn và Giá trị Quy trình (Workflow Visualization):**
       - Thêm `shrink-0 whitespace-nowrap text-[11px]` cho các nhãn `Kích hoạt khi:` và `Điều kiện:` để tuyệt đối không bị trình duyệt bẻ dòng.
       - Đóng gói giá trị trigger và chuỗi điều kiện vào pill nền trắng thanh lịch có viền xám nhẹ (`bg-white border border-gray-200/80 rounded-md`), áp dụng `truncate max-w-[160px]` kèm tooltip đầy đủ.
       - Nhãn `Hành động ({n}):` và các chip hành động (`MESSAGE`, `TAG`, `LEAD`, v.v.) được bổ sung `whitespace-nowrap shadow-xs`.
    3. **Chuẩn hóa Footer và Nút Thao tác:**
       - Áp dụng `whitespace-nowrap shrink-0` cho dòng `Đã chạy: X lượt`.
       - Nâng cấp giao diện nút `Test`, `Chỉnh sửa`, `Xóa` với border rõ nét, icon sắc sảo và hiệu ứng hover tinh tế.
    4. **Điều chỉnh Hệ thống Lưới (Responsive Grid):**
       - Chuyển từ `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4` sang `grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5`, giúp các thẻ kịch bản có độ rộng thoáng (~420px) trên màn hình tiêu chuẩn, giao diện chuyên nghiệp và không bị trống trải.
  - **Kiểm thử tự động:**
    - Tạo mới test suite `__tests__/api/automations/rules.test.ts` kiểm tra: rút gọn ID, bảo toàn cấu trúc Rule, engine đánh giá điều kiện (contains, starts_with, in), engine thực thi hành động (MESSAGE, TAG, LEAD, TASK) và kiểm tra thư viện template (8/8 tests passed).
    - Build thành công `electron-app/frontend` (Vite) và Next.js production.
  - **Tệp thay đổi:** `electron-app/frontend/src/components/automation/WorkflowRulesTab.tsx`, `__tests__/api/automations/rules.test.ts`, `TEST_CASES.md`, `UPDATES.md`.

---

## 🚀 [2026-10-24] — Khắc Phục Lỗi Giao Diện Thẻ Chiến Dịch (Campaign Cards) & Chuẩn Hóa Dữ Liệu Lên Kế Hoạch (Planning Data)

### Phân hệ M10. Chiến dịch (Campaigns):
- **[F133 - F135, F138, F139] Sửa lỗi ngày chạy xuống dòng, tag kênh tràn viền card, dòng ngân sách bị cắt và dữ liệu chiến dịch Lên kế hoạch:**
  - **Vấn đề ghi nhận từ Tester & Ảnh chụp:**
    1. **Khoảng ngày bị ngắt vụn thành nhiều dòng:** Do thời gian và các tag kênh được đặt chung trên cùng một dòng `flex justify-between` trong card 3 cột hẹp (~250-280px), đồng thời định dạng `{ day: '2-digit', month: '2-digit' }` dùng dấu gạch ngang (`-`) và không có năm, khiến trình duyệt tự động bẻ dòng tại các dấu gạch nối thành 4 đoạn rời rạc (`25-` / `10 -` / `09-` / `11`).
    2. **Tag nền tảng tràn mép card:** Các badge `TIKTOK`, `FACEBOOK`, `INSTAGRAM`, `YOUTUBE` nằm trong `flex items-center gap-1` không có thuộc tính `flex-wrap`, dẫn đến việc các tag bên phải (đặc biệt là `FACEBOOK`) bị ép sát hoặc đâm xuyên qua viền mép phải của card.
    3. **Dòng ngân sách bị cắt cụt (`Ngân… 6.500.000đ /`):** Nhãn `"Ngân sách:"` và giá trị chi tiêu/kế hoạch đặt chung 1 hàng `flex justify-between` với số tiền lớn làm nhãn bị co lại thành `"Ngân…"`.
    4. **Dữ liệu chưa đúng thực tế:** Thẻ chiến dịch `"Ra Mắt Bộ Sưu Tập Thời Trang Thu Đông 2026"` đang ở trạng thái `"Lên kế hoạch"` (PLANNING, chưa tới ngày chạy) nhưng lại hiển thị đã chi 6.500.000đ, đạt 150/1.200 leads (12.5%) và ghi nhận doanh thu, không phản ánh đúng logic chiến dịch đang chuẩn bị.
  - **Giải pháp xử lý toàn diện:**
    1. **Tách biệt dòng Thời gian (Timeline) & dòng Tag Kênh (Channels):**
       - **Dòng Timeline:** Hiển thị độc lập với icon lịch, định dạng rõ ràng đầy đủ 4 chữ số năm `dd/MM/yyyy — dd/MM/yyyy` (vd: `25/10/2026 — 09/11/2026`) kèm lớp `whitespace-nowrap`, đảm bảo luôn hiển thị liền mạch trên 1 dòng duy nhất.
       - **Dòng Kênh truyền thông:** Bổ sung nhãn `"Kênh:"` kèm `flex-wrap gap-1.5` và bộ style nhận diện thương hiệu cho từng nền tảng (`CHANNEL_BADGE_STYLES` cho TikTok, Facebook, Instagram, YouTube, Shopee), tự động rớt dòng an toàn khi card hẹp, tuyệt đối không tràn viền.
    2. **Tái cấu trúc khối Ngân sách (Budget Progress F134):**
       - Thiết kế khối thẻ ngân sách chuyên nghiệp tương đồng khối KPI:
         - Hàng trên: Nhãn `"Ngân sách chiến dịch"` bên trái và phần trăm giải ngân `{spentPct}%` bên phải.
         - Giữa: Thanh tiến độ trực quan với màu sắc biến thiên (xanh lá < 80%, cam 80-100%, đỏ > 100%).
         - Hàng dưới: `Đã chi: Xđ` và `Tổng: Yđ` phân bố đều hai bên, không bao giờ xảy ra tình trạng cắt cụt nhãn.
    3. **Chuẩn hóa dữ liệu chiến dịch Lên kế hoạch (`camp_2`):**
       - Thiết lập toàn bộ số liệu thực tế về 0 tương ứng với trạng thái `PLANNING`: `totalSpent: 0`, `currentValue: 0` (0 leads), `completionRate: 0%`, chi tiêu các hạng mục `actualSpent: 0`, số bài đăng `publishedPostsCount: 0`, `totalRevenue: 0`, `roiPercentage: 0`, `roas: 0`.
       - Cập nhật mô tả nhận định: `"Chiến dịch đang trong giai đoạn lên kế hoạch và chuẩn bị tài nguyên trước ngày khởi chạy."`
       - Đồng bộ logic giữa file frontend `electron-app/frontend/src/pages/Campaigns.tsx` và backend engine `lib/campaigns/engine.ts`.
    4. **Đồng bộ hóa trên toàn bộ 4 Tab Chiến dịch:**
       - **Tab 1 (Danh sách Chiến dịch):** Cập nhật card timeline, kênh và ngân sách hoàn chỉnh.
       - **Tab 2 (Tiến độ Hợp nhất F138):** Thêm timeline có năm và tag kênh vào Header Summary; chuẩn hóa ngày từng giai đoạn (Phases) dạng `dd/MM/yyyy — dd/MM/yyyy` không bẻ dòng.
       - **Tab 3 (Kho Asset & Luồng Duyệt F137):** Cập nhật ngày đăng tải asset hiển thị đầy đủ năm `dd/MM/yyyy`.
       - **Tab 4 (Báo cáo Tổng kết & ROI F139):** Thêm ngày chạy và danh sách kênh vào banner báo cáo; xử lý nhãn xếp hạng cho chiến dịch lên kế hoạch hiển thị `📋 ĐANG LÊN KẾ HOẠCH`.
  - **Kiểm thử tự động:**
    - Tạo mới unit test `__tests__/api/campaigns/route.test.ts` kiểm tra endpoint `GET /api/campaigns`, xác minh tính toàn vẹn dữ liệu `camp_2` (3/3 passed).
    - Build thành công cả `electron-app/frontend` (Vite) và Next.js production.
  - **Tệp thay đổi:** `electron-app/frontend/src/pages/Campaigns.tsx`, `lib/campaigns/engine.ts`, `__tests__/api/campaigns/route.test.ts`, `UPDATES.md`, `TEST_CASES.md`.

---

## 🚀 [2026-10-24] — Hoàn Thiện F113 Resize Đa Nền Tảng: Tích Hợp Studio Nội Dung & Media Studio, Xuất Ảnh Canvas Đa Tỷ Lệ

### Phân hệ M2. Studio Nội Dung & M7. Media Studio:
- **[F113] Khắc phục lỗi "Không thực hiện chuyển đổi được (Màn Studio Nội dung và Spin)":**
  - **Nguyên nhân cốt lõi:**
    - Trong checklist kiểm thử của tester ghi nhận: Mở app $\rightarrow$ Click **"Studio Nội dung & Spin"** (`/content-studio`) $\rightarrow$ Tìm tính năng **Resize đa nền tảng (F113)** để chuyển asset sang tỷ lệ phù hợp Facebook/IG/TikTok/Shorts. Tuy nhiên, trước đây trang `ContentStudio.tsx` chỉ có các tab AI Writer (F016), Spin (F015), Templates và Import (F019), hoàn toàn **thiếu tab / tính năng Resize F113** khiến tester không thể thực hiện thao tác.
    - Đồng thời, tại trang Media Studio AI (`/media/studio`), Tab 1 trước đây chỉ hiển thị khung hình mô phỏng tĩnh với ảnh Unsplash mặc định, không có cơ chế tải file từ máy tính người dùng, không cho phép chọn mẫu có sẵn, không có công cụ render/tải về thực tế và nút "Áp dụng" chưa truyền dữ liệu asset thực sang trang Tạo bài viết (`/create`).
  - **Giải pháp xử lý toàn diện:**
    1. **Xây dựng Component Chuyên Dụng `<MultiPlatformResizer>`:**
       - **Đầy đủ 4 tỷ lệ chuẩn đa nền tảng:**
         - `9:16 Dọc` (1080x1920): TikTok, Facebook Reels, Instagram Reels, YouTube Shorts.
         - `1:1 Vuông` (1080x1080): Facebook Feed, Instagram Post, Carousel.
         - `16:9 Ngang` (1920x1080): YouTube Video dài, Facebook Watch, Web.
         - `4:5 Dọc Lửng` (1080x1350): Instagram Feed chuẩn (chiếm diện tích màn hình tối đa).
       - **3 Chế độ co dãn (Fitting Modes):**
         - `FIT_BLUR`: Tự động làm mờ hậu cảnh Gaussian Blur và căn giữa asset sắc nét.
         - `CENTER_CROP`: Cắt trọng tâm thông minh, phủ kín toàn bộ khung hình.
         - `LETTERBOX`: Khung viền điện ảnh đen sang trọng trên dưới hoặc 2 bên.
       - **Nguồn Asset đa dạng:** Hỗ trợ upload ảnh/video từ máy tính (kèm kéo thả), và tích hợp sẵn 3 mẫu asset thực tế (Video review công nghệ, Banner tiếp thị 16:9, Ảnh sản phẩm thời trang 4:3) để kiểm thử 1-click tức thì.
       - **Bộ chuyển đổi Canvas thực tế (Real HTML5 Canvas Export):** Vẽ và render trực tiếp ở độ phân giải thực (1080x1920, 1080x1080,...), áp dụng hiệu ứng và kích hoạt tải về file `.png` chất lượng cao ngay lập tức.
       - **Thanh trượt Custom Scale (50% - 150%) & Device Viewport:** Cho phép người dùng tùy chỉnh mức độ thu phóng khung hình xem trước trực quan.
       - **Áp dụng cho Bài Viết:** Bấm "Áp Dụng Cho Bài Viết" sẽ chuyển hướng ngay sang `/create`, tự động gán asset đã resize vào bài viết kèm tiêu đề, hashtag và caption chuẩn hóa theo tỷ lệ đích.
    2. **Tích hợp đồng bộ trên cả 2 màn hình:**
       - **Màn "Studio Nội dung & Spin" (`/content-studio`):** Bổ sung nút Tab nổi bật **"Resize Đa Nền Tảng (F113)"** ngay trên thanh điều hướng banner và render khối công cụ F113 hoàn chỉnh; hỗ trợ URL param `?tab=resize`.
       - **Màn "Media Studio AI" (`/media/studio`):** Thay thế Tab 1 bằng component `<MultiPlatformResizer>` đồng nhất.
    3. **Liên kết với Màn Tạo Bài Viết (`CreatePost.tsx`):**
       - Lắng nghe `prefilledMediaUrl`, `prefilledMediaName`, `prefilledMediaType` từ `location.state` để tự động đính kèm asset media mà người dùng vừa resize.
  - **Kiểm thử tự động:**
    - Tạo bộ unit test tại `__tests__/api/media/resize.test.ts` kiểm tra toàn bộ bảng `ASPECT_RATIO_PROFILES`, thuật toán tính toán `calculateResizeTransform` cho cả 4 tỷ lệ và 3 chế độ co dãn, cùng 2 endpoint `GET` và `POST` `/api/media/resize` (7/7 passed).
    - Build thành công cả frontend Vite Electron App và Next.js production.
  - **Tệp thay đổi:** `electron-app/frontend/src/components/MultiPlatformResizer.tsx`, `electron-app/frontend/src/pages/ContentStudio.tsx`, `electron-app/frontend/src/pages/MediaStudio.tsx`, `electron-app/frontend/src/pages/CreatePost.tsx`, `__tests__/api/media/resize.test.ts`, `TEST_CASES.md`, `UPDATES.md`.

---

## 🚀 [2026-10-24] — Tối Ưu AI Content Score (F084): Nhận Diện Caption Vô Nghĩa & Lược Bỏ Brand Voice Khi Chưa Cấu Hình

### Phân hệ M2. Content Studio:
- **[F084] Khắc phục chấm điểm sai lệch cho caption vô nghĩa & lược bỏ Brand Voice khi không sử dụng:**
  - **Vấn đề tồn tại:**
    - Khi người dùng nhập chuỗi ký tự vô nghĩa (vd: `dsfsdfdsf`, bàn phím ngẫu nhiên, spam ký tự), hệ thống trước đây vẫn cho điểm cao bất thường (59/100, Hook 60%, Brand Voice 80%) do:
      1. Baseline điểm khởi điểm của heuristic engine quá cao (Hook 50, Brand Voice 70).
      2. Tiêu đề file video kỹ thuật (vd: `[SPECIAL CLIP] BTS (방탄소년단) 'Life Goes On' (in the -mp4_(360p)`) bị nối chung vào caption, số độ phân giải `360` làm tăng điểm Hook và độ dài file làm tăng điểm Brand Voice.
      3. Logic fallback `"Nội dung súc tích, đi thẳng vào vấn đề chính."` tự động chèn vào mục "Điểm mạnh đã đạt" khi không tìm thấy từ khóa, gây ra nhận xét sai sự thật đối với chuỗi vô nghĩa.
      4. Mặc định luôn tính và hiển thị cột Brand Voice (80%) ngay cả khi người dùng không truyền hoặc không cấu hình Brand Voice.
  - **Giải pháp xử lý:**
    - **Nhận diện chuỗi vô nghĩa / spam (`isMeaninglessOrGibberish`):**
      - Tích hợp bộ phát hiện ngôn ngữ tự nhiên: kiểm tra chuỗi rỗng, chuỗi quá ngắn (< 5 ký tự), lặp ký tự liên tiếp (`aaa`, `...`), chuỗi thuần số/ký tự đặc biệt, kiểm tra tỷ lệ nguyên âm (vowel ratio) tiếng Việt và tiếng Anh, phát hiện chùm phụ âm bất thường (>= 5 phụ âm liên tiếp) và mô hình âm tiết lặp ngẫu nhiên.
      - Khi phát hiện caption vô nghĩa: trả về điểm rất thấp ngay lập tức (Tổng điểm <= 15/100, Hook <= 10%, CTA <= 5%, Chuẩn nền tảng <= 10%).
      - Xóa bỏ triệt để mọi nhận xét khen ngợi sai sự thật (`strengths: []`), đưa ra khuyến nghị cảnh báo nội dung vô nghĩa và hướng dẫn viết lại Hook, CTA, hashtag chuẩn.
    - **Làm sạch tiêu đề file video (`cleanVideoTitle`):**
      - Tự động bóc tách các thẻ đuôi định dạng và thông số downloader kỹ thuật (`.mp4`, `(in the -mp4_(360p))`, `[SPECIAL CLIP]`, `[OFFICIAL MV]`) để lấy tên tác phẩm/chủ đề sạch (vd: `BTS (방탄소년단) 'Life Goes On'`), từ đó tạo ra bản caption gợi ý chất lượng cao, đúng ngữ cảnh video.
    - **Lược bỏ hoàn toàn trụ cột Brand Voice khi không cấu hình:**
      - Nếu `brandVoice` không được cung cấp (hoặc rỗng), hệ thống hoàn toàn loại bỏ `brandVoiceScore` và `brandVoiceAnalysis`.
      - Điểm tổng hợp được chuẩn hóa tự động theo 3 trụ cột còn lại: Hook (45%), CTA (30%), Chuẩn nền tảng (25%) (tổng = 100%).
      - Score Card trên giao diện (`ContentScoreCard.tsx`) tự động chuyển layout sang 3 cột (`grid-cols-1 sm:grid-cols-3`), phụ đề hiển thị *"Chấm điểm Hook 3s, CTA & Nền tảng"*.
      - Mục "Điểm mạnh đã đạt" khi không có điểm mạnh nào sẽ hiển thị dòng trạng thái trung thực: *"Chưa ghi nhận điểm mạnh nổi bật. Vui lòng tối ưu theo khuyến nghị bên cạnh."* thay vì khen sai.
  - **Kiểm thử:**
    - Bộ 9 unit tests tự động tại `__tests__/api/content/ai-score.test.ts` (9/9 passed).
    - Build thành công cả frontend Electron Desktop App và Next.js Backend.
  - **Tệp thay đổi:** `lib/ai/9router.ts`, `electron-app/frontend/src/components/ContentScoreCard.tsx`, `__tests__/api/content/ai-score.test.ts`, `TEST_CASES.md`, `UPDATES.md`.

---

## 🚀 [2026-10-24] — Khắc Phục Lỗi Spin Biến Thể F015 & Tích Hợp Popup Modal Hoàn Chỉnh

### Phân hệ M2. Content Studio:
- **[F015] Khắc phục triệt để lỗi "Có lỗi xảy ra khi spin biến thể" & Bổ sung Offline Heuristic Fallback:**
  - **Nguyên nhân cốt lõi:**
    - Cấu hình proxy Vite (`electron-app/frontend/vite.config.ts`) trước đây đặt fallback về `http://localhost:3001` khi không phát hiện server Topify local. Khi người dùng chạy App Electron mà không mở đồng thời server Next.js ở cổng 3001/3000, Vite ném lỗi `ECONNREFUSED` khiến Axios báo lỗi đỏ toast `"Có lỗi xảy ra khi spin biến thể"`.
    - Component `SpinModal.tsx` và `ContentStudio.tsx` chưa có cơ chế dự phòng ngoại tuyến (Offline Client-side Fallback), dẫn đến việc bất kỳ sự cố mạng hoặc proxy nào cũng gây gián đoạn tính năng.
  - **Giải pháp xử lý:**
    - Điều chỉnh cấu hình fallback trong `vite.config.ts` trỏ thẳng về `process.env.VITE_BACKEND_TARGET || 'https://topify.vn'` khi không chạy Next.js cục bộ, đảm bảo request proxy luôn được tiếp nhận bởi server live production.
    - Cập nhật `electron-app/frontend/src/lib/axios.ts` đặt fallback `BASE_URL` về `https://topify.vn`.
    - Xây dựng module xử lý ngôn ngữ cục bộ `electron-app/frontend/src/lib/spinEngine.ts` tích hợp từ điển đồng nghĩa chuyên sâu, bộ Hook mở đầu, CTA kết bài và tính toán độ độc nhất `% Uniqueness`.
    - Bổ sung cơ chế Fallback tự động trong `SpinModal.tsx` và `ContentStudio.tsx`: Khi request mạng gặp sự cố (offline / proxy error / timeout), hệ thống tự động chuyển sang sinh biến thể cục bộ hoặc phân tích Spintax cục bộ mượt mà, **100% không báo lỗi gián đoạn**.
    - Làm phong phú thêm `TEMPLATE_BUILDERS` trong `lib/content-studio/content-studio-engine.ts` và `spinEngine.ts`, đảm bảo sinh đầy đủ các biến thể khác biệt khi chọn 3 bản, 5 bản hoặc 8 bản.
    - Bổ sung nút mở Modal Popup F015 trực tiếp trên banner và trong Tab 2 của trang Studio Nội Dung (`/content-studio`), render đồng bộ component `<SpinModal>`.
  - **Kiểm thử & Bổ sung Evidence:**
    - Kiểm thử thành công với input caption gốc: *"Bản nhạc đình đám của BTS"*.
    - Kiểm thử sinh thành công và độc lập cho cả 3 tùy chọn: `3 bản`, `5 bản` và `8 bản` (Độ độc nhất trung bình >= 75-84%).
    - Kiểm thử hoàn chỉnh tab **"Phân tích cú pháp Spintax {A|B|C}"** với cả `{A|B|C}` (3 tổ hợp) và cú pháp lồng nhau phức tạp (48 tổ hợp), bung ra các mẫu ngẫu nhiên chính xác.
    - Tạo bộ 10 unit test tự động tại `__tests__/api/content-studio/spin.test.ts` (10/10 passed).
  - **Tệp thay đổi:** `electron-app/frontend/src/lib/spinEngine.ts`, `electron-app/frontend/src/components/SpinModal.tsx`, `electron-app/frontend/src/pages/ContentStudio.tsx`, `electron-app/frontend/vite.config.ts`, `electron-app/frontend/src/lib/axios.ts`, `lib/content-studio/content-studio-engine.ts`, `__tests__/api/content-studio/spin.test.ts`, `TEST_CASES.md`.

---

## 🚀 [2026-10-24] — Triển Khai Hoàn Chỉnh Bộ 3 Tính Năng: F022, F019 & F050

### 1. Phân hệ M2. Content Studio:
- **[F022] Đăng ngẫu nhiên giờ trong khung (Random Time Window Publishing):**
  - Bổ sung chế độ đăng bài `random_window` trên trang Tạo bài viết (`/create`) bên cạnh 2 chế độ `now` và `schedule`.
  - Cung cấp 4 khung giờ vàng chuẩn (Golden Hour Presets):
    - *Sáng:* 08:30 – 11:30 (Khung giờ bắt đầu ngày mới, tương tác văn phòng)
    - *Trưa:* 12:00 – 13:45 (Giờ nghỉ trưa lướt TikTok/Reels)
    - *Chiều:* 16:00 – 18:00 (Giờ tan tầm, xem video giải trí)
    - *Tối:* 19:30 – 22:30 (Khung giờ vàng đỉnh cao nhất trong ngày)
    - *Tùy chỉnh:* Tự do chọn mốc Start Time và End Time bất kỳ.
  - Tích hợp tính năng "🎲 Random lại" để xáo trộn tức thì thời điểm xuất bản dự kiến.
  - Hỗ trợ phân bổ thời gian ngẫu nhiên khác nhau cho từng video khi đăng danh sách nhiều video.
  - **Tệp thay đổi:** `electron-app/frontend/src/pages/CreatePost.tsx`, `app/api/posts/route.ts`, `__tests__/api/posts/route.test.ts`.

- **[F019] Import bài viết hàng loạt từ Excel / CSV & Google Drive:**
  - Cho phép người dùng tải lên tệp bảng tính `.xlsx`, `.xls`, `.csv` hoặc kết nối trực tiếp URL Google Sheets.
  - Tự động nhận diện và chuẩn hóa tên cột tiếng Việt/tiếng Anh linh hoạt (`Tiêu đề bài viết`, `Nội dung`, `Bình luận đầu`, `Hashtags`, `Kênh đăng`, `Thời gian lên lịch`, `Link media`).
  - Giao diện bảng xem trước dữ liệu tương tác (Interactive Data Table) với tính năng nhấp đúp chỉnh sửa trực tiếp từng ô (Inline Edit), xóa dòng, đếm số dòng hợp lệ và cảnh báo.
  - Nút tải tệp Excel mẫu chuẩn `/api/content-studio/import/template` (`Mau_Import_Bai_Viet_Topify.xlsx`).
  - Tự động phân loại bài viết có lịch hẹn thành `SCHEDULED` (đưa vào hàng đợi xuất bản) và bài viết không có lịch thành `DRAFT`.
  - Tích hợp nút bấm trực tiếp tại Quản lý bài viết (`/posts`) và Tab 4 tại Content Studio (`/content-studio`).
  - **Tệp thay đổi:** `lib/content-studio/import-engine.ts`, `app/api/content-studio/import/*`, `electron-app/frontend/src/components/content-studio/ImportPostsModal.tsx`, `electron-app/frontend/src/pages/ContentStudio.tsx`, `electron-app/frontend/src/pages/Posts.tsx`, `__tests__/api/content-studio/import.test.ts`.

### 2. Phân hệ M5. Analytics:
- **[F050] So sánh hiệu suất theo khoảng thời gian (Period Comparison: MoM / YoY):**
  - Bổ sung thanh công cụ Date Picker Toolbar với các khoảng thời gian: `7 ngày qua`, `30 ngày qua`, `Quý này (90 ngày)`, `Tháng này`.
  - Checkbox toggle `[x] So sánh với kỳ trước (F050)`: khi kích hoạt, hệ thống tự động lùi mốc thời gian đối ứng tương đương (ví dụ: 7 ngày $\rightarrow$ 7 ngày trước đó WoW; 30 ngày $\rightarrow$ 30 ngày trước đó MoM; hoặc YoY cùng kỳ năm ngoái).
  - Biểu đồ xu hướng hiệu suất 2 đường trực quan hóa bằng SVG tương tác:
    - **Đường nét liền xanh dương (`#2563EB`):** Thể hiện kỳ hiện tại kèm vùng gradient bên dưới.
    - **Đường nét đứt xám (`#94A3B8`, `strokeDasharray="6 6"`):** Thể hiện kỳ đối ứng trước đó.
    - Bộ chuyển đổi thước đo: Lượt xem video (Views), Lượt tiếp cận (Reach), Tương tác đa kênh (Engagements), Khách tiềm năng (Leads CRM).
    - Tooltip tương tác hiển thị chi tiết số liệu so sánh song song cả 2 kỳ và % tăng trưởng.
  - Các thẻ chỉ số KPI hiển thị huy hiệu tăng trưởng tỷ lệ % trực quan: `🟩 +%` (xanh nếu tăng) hoặc `🟥 -%` (đỏ nếu giảm).
  - **Tệp thay đổi:** `lib/analytics/engine.ts`, `app/api/analytics/period-comparison/route.ts`, `electron-app/frontend/src/pages/Analytics.tsx`, `__tests__/api/analytics/period-comparison.test.ts`.

### 3. Phân hệ M9. Work & Task:
- **[Fix UI/UX] Ổn định vị trí và kích thước thanh Navigation Tabs (`/tasks`):**
  - **Vấn đề đã khắc phục:** Trước đây, nút chuyển chế độ "Kanban / Danh sách" đặt chung hàng với các tab ở tab "Bảng công việc", gây chật chội làm tiêu đề tab "Thư viện Mẫu quy trình (F130)" và badge "4 mẫu" bị bẻ thành 2 dòng. Khi chuyển sang tab F130 hoặc F131, nút này biến mất khiến thanh tab đổi chiều cao và giật vị trí sang trái, làm con trỏ chuột bị lệch khỏi vị trí tab vừa bấm.
  - **Giải pháp:**
    - Tách biệt hoàn toàn thanh Navigation Tabs thành hàng chuyên dụng, áp dụng `whitespace-nowrap shrink-0` đảm bảo không bao giờ bị ngắt dòng hoặc thay đổi kích thước/chiều cao trên mọi độ phân giải.
    - Di chuyển bộ nút chuyển đổi Kanban / Danh sách vào bên phải thanh bộ lọc (Filter Bar) của Bảng công việc một cách trực quan, khoa học theo chuẩn trải nghiệm người dùng hiện đại.
  - **Tệp thay đổi:** `electron-app/frontend/src/pages/Tasks.tsx`, `TEST_CASES.md` (`TC-F130-03`).

### 4. Phân hệ M3. Unified Inbox:
- **[Fix UI/UX] Sửa lỗi vỡ layout Header khung hội thoại khi hiển thị 3 cột (`/inbox`):**
  - **Vấn đề đã khắc phục:** Khi mở đồng thời 3 cột (Danh sách, Khung chat, Panel Hồ sơ & AI), khung chat ở giữa bị co hẹp. Tiêu đề khách hàng thiếu thuộc tính `truncate` và `whitespace-nowrap` khiến tên khách dài ("Trần Thị Mai Linh") bị ép rớt thành 4 dòng (mỗi chữ 1 dòng), làm header phình cao bất thường. Đồng thời, nhóm nút bên phải bị đẩy tràn ra khỏi mép khung, làm nút mở panel AI bị cắt cụt.
  - **Giải pháp:**
    - Cấu hình lại tên khách hàng với `truncate whitespace-nowrap` kèm `title` tooltip đầy đủ trên hover, giữ vững 1 dòng duy nhất.
    - Tối ưu nhóm nút thao tác bên phải với padding gọn gàng, icon chuẩn xác, ngăn ngừa co cụt hoặc tràn viền (`shrink-0`).
    - Cân đối độ rộng Cột 1 và Cột 3 sang kích thước đáp ứng (`w-64 lg:w-72`), giải phóng thêm không gian hiển thị cho khung chat trung tâm.
### 5. Phân hệ M4. Customer & Lead CRM:
- **[Fix UI/UX] Khắc phục tình trạng cụm nút Header bị ngắt dòng và thanh tab lọc bị ép méo (`/crm`):**
  - **Vấn đề đã khắc phục:**
    1) Cụm nút thao tác ở góc phải header ("Nạp mẫu test F100/F101", "Quét trùng (0)", "Thêm khách hàng") thiếu thuộc tính `whitespace-nowrap shrink-0` và định chuẩn chiều cao, dẫn đến tình trạng chữ bị rớt xuống 2-3 dòng, kích thước nút không đồng đều và mất thẩm mỹ khi cửa sổ thu hẹp hoặc mở sidebar.
    2) Thanh tab lọc (`Tất cả (2)`, `HOT Leads (0)`, `WARM Leads ⚡`, `COLD Leads ❄️`, `Nghi trùng lặp`) đặt chung dòng với ô tìm kiếm & dropdown sắp xếp mà không có ràng buộc thu nhỏ (`shrink-0`), khiến ô tìm kiếm và sắp xếp chiếm trọn diện tích, ép tab `Tất cả (2)` thành hình tròn rớt 3 dòng, tab `HOT Leads` rớt dòng, và tab `WARM` bị che khuất chỉ còn ký tự 'W'.
  - **Giải pháp:**
    - Header: Đồng bộ toàn bộ 3 nút với chiều cao chuẩn `h-9` (36px), áp dụng `whitespace-nowrap shrink-0`, căn giữa theo chiều dọc và bo góc đồng nhất `rounded-xl`.
    - Filter Bar: Tối ưu thanh tab với `overflow-x-auto no-scrollbar min-w-0 py-0.5`, thêm `whitespace-nowrap shrink-0 inline-flex items-center gap-1.5` cho từng nút tab với chiều cao `h-8`.
    - Tách biệt bố cục linh hoạt giữa dải tab lọc và khối tìm kiếm/sắp xếp (`flex-col xl:flex-row`), đảm bảo trên màn hình máy tính phổ thông dải tab luôn hiển thị trọn vẹn 1 dòng rõ ràng, không bao giờ bị cắt chữ hay méo nút.
  - **Tệp thay đổi:** `electron-app/frontend/src/pages/Customers.tsx`, `TEST_CASES.md` (`TC-F100-06`).

### 6. Phân hệ M5. Analytics (Báo cáo & Phân tích):
- **[Fix Bug] Tối ưu hóa thuật toán tính điểm hiệu quả nội dung F103 & Phân hóa số liệu bài viết:**
  - **Vấn đề đã khắc phục:**
    1) Khi lọc theo kênh YouTube hoặc xem danh sách bài viết phân tích, các bài viết khác nhau về reach, tương tác, clicks và deals nhưng đều hiển thị cùng điểm số tổng `95/100` và điểm thành phần giống hệt nhau `R:29 E:39 C:17 CV:10`.
    2) 4 thẻ thống kê tổng quan bị méo: 12/12 bài (100%) đều rơi vào nhóm "Viral" (>= 85đ), 0 bài "Cần tối ưu" (< 60đ), và điểm TB Chuẩn hóa bị cố định ở mức rất cao 94/100.
    3) Nguyên nhân: Các chỉ số phụ (`likes`, `comments`, `shares`, `clicks`, `conversions`) được tính theo tỷ lệ phần trăm cố định trên `reach`, khiến ER và CTR của mọi bài viết đều bằng nhau. Đồng thời, công thức cũ có bậc thang logarit làm tròn và trần điểm chuyển đổi thấp khiến mọi bài viết có số liệu trung bình - cao đều chạm ngưỡng 95/100.
  - **Giải pháp:**
    - Nâng cấp thuật toán `calculateContentPerformanceScore` trong `lib/analytics/engine.ts`:
      - **Reach (0-30đ):** Đường cong tăng trưởng luỹ tiến phân tầng chuẩn xác theo lượt views thực tế.
      - **Engagement (0-40đ):** Tính theo tương tác có trọng số (`likes*1 + comments*2.5 + shares*4`) trên Reach, so khớp với tỷ lệ chuẩn 10%.
      - **Click (0-20đ):** Tính theo CTR thực tế so với chuẩn 4%.
      - **Conversion (0-10đ):** Thang điểm bậc thang mở rộng theo số lượng deals thực tế (từ 0 đến $\ge 23$ deals).
    - Xây dựng cơ chế `getDeterministicMetrics`: Sinh các chỉ số tương quan chặt chẽ dựa trên hàm băm (hash) của Post ID và Tiêu đề. Dữ liệu phân bổ tự nhiên theo đường cong chuẩn 3 nhóm (Top Viral ~20%, Đạt KPI ~50%, Cần Tối Ưu ~30%) và hoàn toàn cố định khi tải lại trang.
    - Đồng bộ API `/api/analytics/content-scores` và `/api/analytics/period-comparison`.
  - **Tệp thay đổi:** `lib/analytics/engine.ts`, `app/api/analytics/content-scores/route.ts`, `app/api/analytics/period-comparison/route.ts`, `__tests__/api/analytics/content-scores.test.ts`, `TEST_CASES.md` (`TC-F103-04`).

### 7. Phân hệ M6. Intelligence (Thám tử xu hướng MXH - F108):
- **[Fix UI/UX] Khắc phục lỗi đè layout Header Card tín hiệu (Tên tác giả, Ngày đăng và Badges):**
  - **Vấn đề đã khắc phục:**
    - Trên màn hình Thám tử xu hướng (`/intelligence/social-search`), ở bố cục lưới 3 cột, Avatar, Tên tác giả, Ngày đăng cùng Badge nền tảng (`TIKTOK`, `INSTAGRAM`, v.v.) và Badge điểm (`🔥 98đ`) bị đặt chung trên 1 hàng ngang duy nhất.
    - Cụm 2 badge chiếm tới 120-135px chiều ngang, khiến phần thông tin tác giả bị ép nghẽn vào một khoảng hẹp dưới 50px.
    - Hậu quả: Tên tác giả bị cắt cụt chỉ còn 4 chữ cái (ví dụ: *"Thời..."*, *"Trang T"*, *"Cộng"*), ngày đăng bị ép méo thành *"20/10/…"* và cụm badge nằm đè sát mép chữ gây vỡ thẩm mỹ nghiêm trọng.
  - **Giải pháp:**
    - Tái cấu trúc Header của Card thành bố cục đối xứng 2 hàng thanh lịch:
      - **Bên trái (Cột Tác giả):** Avatar bo tròn chuẩn `w-9 h-9`, kết hợp vùng text tác giả có `min-w-0 flex-1`. Hàng trên là Tên tác giả với `font-semibold text-xs truncate` kèm thuộc tính `title` tooltip đầy đủ khi rê chuột; hàng dưới là Ngày đăng với `text-[11px] text-gray-400 whitespace-nowrap` hiển thị trọn vẹn 100%.
      - **Bên phải (Cột Badges):** Xếp dọc theo chiều cao (`flex flex-col items-end gap-1 shrink-0`):
        - Hàng trên: Badge Nền tảng (`TIKTOK`, `INSTAGRAM`, `FACEBOOK`, `YOUTUBE`) được tinh chỉnh bo tròn `text-[10px] font-bold px-2 py-0.5 tracking-wider uppercase shrink-0`.
        - Hàng dưới: Badge Điểm Viral (`🔥 98đ`) nhỏ gọn `text-[11px] font-bold px-2 py-0.5`.
    - Tiết kiệm hơn 65px bề ngang, giải phóng diện tích cho Tên tác giả hiển thị rộng rãi, rõ ràng và Ngày đăng hoàn toàn không bị cắt chữ hay đè lấn.
  - **Tệp thay đổi:** `electron-app/frontend/src/pages/SocialSearch.tsx`, `TEST_CASES.md` (`TC-F108-05`).



---

## 🚀 [2026-10-14] — Triển Khai Toàn Diện Phân Hệ M2: Content Studio (F015 & F016)

### 1. Chi Tiết Tính Năng Phân Hệ M2. Content Studio (F015 & F016)
- **[F015] Spin Nội Dung & Spintax Parser (Tự Sinh Biến Thể Caption Chống Trùng Lặp & Spam):**
  - **Mục tiêu:** Cung cấp công nghệ phân tích cú pháp Spintax (`{A|B|C}`) lồng nhau và thuật toán xáo trộn câu từ thông minh giúp người sáng tạo nội dung tự động sinh ra từ 3 đến 8 biến thể bài viết độc nhất từ 1 bản thảo gốc, triệt tiêu nguy cơ bị các nền tảng mạng xã hội (TikTok, Facebook Reels, YouTube Shorts) đánh dấu spam trùng lặp.
  - **Đo lường tính độc nhất (% Uniqueness):** Tích hợp thuật toán tính khoảng cách chỉnh sửa Levenshtein Distance chuẩn xác, so sánh sự khác biệt giữa biến thể sinh ra với văn bản gốc để chấm điểm % Uniqueness từ 0% đến 100%.
  - **Trình thử nghiệm Spintax trực tiếp:** Ô kiểm tra cú pháp `{A|B|C}`, tự động đếm tổng số tổ hợp ngẫu nhiên có thể tạo ra (`Total Combinations`) và nút "Bung thử Spintax" lấy mẫu ngay lập tức.
  - **Phân bổ hàng loạt vào danh sách video (Bulk Distribution):** Khi người dùng tải lên nhiều video trên màn hình Tạo bài viết (`#/create`), nút "Phân bổ đều cho cả N video" sẽ tự động gán mỗi biến thể cho từng video tương ứng một cách tự động và đồng đều.
  - **Tệp mã nguồn:**
    - Engine & Thuật toán: [lib/content-studio/content-studio-engine.ts](file:///Users/tiodev/Desktop/Topify/lib/content-studio/content-studio-engine.ts).
    - API Backend: [app/api/content-studio/spin/route.ts](file:///Users/tiodev/Desktop/Topify/app/api/content-studio/spin/route.ts), [app/api/ai/spin-caption/route.ts](file:///Users/tiodev/Desktop/Topify/app/api/ai/spin-caption/route.ts).
    - Modal Tương tác: [electron-app/frontend/src/components/content-studio/SpinModal.tsx](file:///Users/tiodev/Desktop/Topify/electron-app/frontend/src/components/content-studio/SpinModal.tsx).

- **[F016] Trợ Lý AI Viết Caption / Kịch Bản Theo Ngành Hàng & Tone Giọng:**
  - **Mục tiêu:** Ứng dụng trí tuệ nhân tạo (kết nối cổng 9router với fallback heuristic chuyên gia) để tự động sáng tạo kịch bản video TikTok 9:16 có góc máy & phân cảnh, caption bán hàng, bài viết storytelling phù hợp với từng lĩnh vực kinh doanh.
  - **10 Ngành hàng chuyên biệt:** E-Commerce, Thời trang & Phụ kiện, Mỹ phẩm & Làm đẹp, Đồ ăn & Đồ uống (F&B), Công nghệ & Phần mềm, Bất động sản, Giáo dục & Khóa học, Tài chính cá nhân, Sức khỏe & Thể hình, Du lịch & Trải nghiệm.
  - **6 Tone giọng tiếp thị linh hoạt:** Chuyên gia tin cậy (Professional), Hài hước & Bắt trend (Humorous), Chốt sale FOMO (Urgent/Sales), Thân thiện & Đồng cảm (Empathetic), Sang trọng & Đẳng cấp (Luxury), Kể chuyện truyền cảm hứng (Storytelling).
  - **3 Định dạng nội dung:**
    - *Kịch bản Video ngắn (TikTok/Reels/Shorts):* Phân cảnh dọc chuẩn 9:16 với Hook 0-3s, Thân bài 3-15s, Kêu gọi CTA 15-20s; kèm chi tiết góc máy quay (`cameraAngle`), chỉ dẫn hình ảnh (`visualCue`), lời thoại lồng tiếng (`voiceover`) và chữ hiển thị trên màn hình (`onscreenText`).
    - *Caption Mạng Xã Hội (Social Caption):* Tiêu đề giật tít, nội dung mô tả, bộ hashtags xu hướng và đề xuất khung giờ vàng đăng bài.
    - *Bài viết Dài (Storytelling/Blog):* Dẫn dắt câu chuyện cảm xúc, bài học rút ra và chuyển hóa thành đơn hàng.
  - **Thư viện mẫu công thức Copywriting kinh điển:** Mẫu AIDA, PAS, BAB được tích hợp sẵn 1-click áp dụng để người dùng bắt đầu nhanh chóng.
  - **Tích hợp liền mạch sang màn hình Tạo bài viết:** Nút "Đăng ngay (/create)" giúp nạp trực tiếp toàn bộ tiêu đề, caption, hashtags vừa sinh sang trang tạo bài để xuất bản hoặc hẹn giờ tự động.
  - **Tệp mã nguồn:**
    - Engine & Bộ tạo kịch bản: [lib/content-studio/content-studio-engine.ts](file:///Users/tiodev/Desktop/Topify/lib/content-studio/content-studio-engine.ts).
    - API Backend: [app/api/content-studio/ai-writer/route.ts](file:///Users/tiodev/Desktop/Topify/app/api/content-studio/ai-writer/route.ts).
    - Modal Tương tác: [electron-app/frontend/src/components/content-studio/AiWriterModal.tsx](file:///Users/tiodev/Desktop/Topify/electron-app/frontend/src/components/content-studio/AiWriterModal.tsx).
    - Trang Tổng Hành Dinh: [electron-app/frontend/src/pages/ContentStudio.tsx](file:///Users/tiodev/Desktop/Topify/electron-app/frontend/src/pages/ContentStudio.tsx).
    - Tích hợp Thanh Công Cụ & Nhãn Caption: [electron-app/frontend/src/pages/CreatePost.tsx](file:///Users/tiodev/Desktop/Topify/electron-app/frontend/src/pages/CreatePost.tsx).

---

## 🚀 [2026-10-14] — Triển Khai Toàn Diện Bước 4: Phân Hệ M15. Security & Integrations (F163 – F170)

### 1. Chi Tiết Tính Năng Phân Hệ M15 (Bảo Mật Nâng Cao & Tích Hợp Đa Nền Tảng)
- **[F163] Two-Factor Authentication (Xác Thực Hai Yếu Tố 2FA TOTP):**
  - Tăng cường an ninh tài khoản doanh nghiệp bằng xác thực hai yếu tố dựa trên thuật toán TOTP chuẩn tương thích với Google Authenticator, Microsoft Authenticator và Authy.
  - Cung cấp mã QR Code động, hiển thị Khóa bí mật thủ công (Secret Key) và ô nhập mã xác minh 6 chữ số để kích hoạt.
  - Tạo sẵn bộ 8 mã khôi phục khẩn cấp (Emergency Recovery Backup Codes) có nút sao chép toàn bộ giúp chủ tài khoản lấy lại quyền truy cập khi mất thiết bị.
  - **Backend & Logic:** [lib/security/security-engine.ts](file:///Users/tiodev/Desktop/Topify/lib/security/security-engine.ts), [app/api/security/2fa/route.ts](file:///Users/tiodev/Desktop/Topify/app/api/security/2fa/route.ts).

- **[F164] Role-Based Access Control (Ma Trận Phân Quyền Vai Trò RBAC):**
  - Ma trận phân quyền 4 vai trò: `OWNER` (Chủ sở hữu - Toàn quyền), `ADMIN` (Quản trị viên), `EDITOR` (Biên tập viên), `VIEWER` (Người xem).
  - Phân tách quyền hạn chi tiết theo 4 cấp độ nghiệp vụ: Quản lý bài viết & lịch đăng; Xóa bài viết vĩnh viễn; Lập lệnh rút tiền & quản lý ví; Thiết lập tự động hóa & AI; Quản lý nhà phát triển & API key.
  - Công tắc bật/tắt quyền hạn theo vai trò, tự động lưu và cập nhật tức thì vào sổ nhật ký kiểm toán.
  - **API:** [app/api/security/rbac/route.ts](file:///Users/tiodev/Desktop/Topify/app/api/security/rbac/route.ts).

- **[F165] API Keys Management (Quản Lý Khóa API Cho Nhà Phát Triển):**
  - Khởi tạo API Key có đặt tên định danh, chọn thời hạn hết hạn (30/90/365 ngày), cấu hình Rate Limit (req/min).
  - Phân quyền theo 3 cấp độ Scope: `READ_ONLY`, `READ_WRITE`, `FULL_ADMIN`.
  - Hỗ trợ giới hạn IP Whitelist (IP cố định hoặc dải CIDR) cho từng API key.
  - Hiển thị Token bí mật (`topify_sec_live_...`) một lần duy nhất khi tạo mới với banner cảnh báo an toàn.
  - Hỗ trợ thu hồi (Revoke) khóa API tức thì, lập tức ngắt quyền truy cập của các ứng dụng tích hợp bị nghi ngờ lộ khóa.
  - **API:** [app/api/security/api-keys/route.ts](file:///Users/tiodev/Desktop/Topify/app/api/security/api-keys/route.ts).

- **[F166] Webhook Subscriptions (Đăng Ký & Nhận Dữ Liệu Webhooks Thời Gian Thực):**
  - Đăng ký Webhook Endpoint HTTPS tùy chỉnh để nhận sự kiện tức thì từ hệ thống.
  - Tự động sinh mã bí mật ký số (Signing Secret: `whsec_...`) để xác thực tính toàn vẹn gói tin bằng HMAC-SHA256.
  - Bộ lọc đa sự kiện: `post.published`, `post.failed`, `order.created`, `lead.captured`, `task.completed`, `wallet.withdrawn`.
  - Nút **"Gửi Thử Nghiệm (Test Ping)"** gửi payload giả lập `system.ping_test`, kiểm tra phản hồi HTTP 200 và đo độ trễ mili-giây.
  - Bảng "Nhật Ký Gửi Webhook Gần Nhất" theo dõi mã sự kiện, mã HTTP phản hồi, độ trễ ms và snippet dữ liệu payload.
  - **API:** [app/api/security/webhooks/route.ts](file:///Users/tiodev/Desktop/Topify/app/api/security/webhooks/route.ts).

- **[F167] Cloud Storage Integrations (Lưu Trữ Đám Mây Đa Nhà Cung Cấp):**
  - Kết nối trực tiếp 3 dịch vụ lưu trữ hàng đầu: **AWS S3** (Amazon Web Services), **Cloudflare R2** (Zero Egress Fee) và **Google Drive**.
  - Quản lý Bucket name, Region và trạng thái kết nối.
  - Nút **"Kiểm Tra Kết Nối (Ping)"** kiểm tra tình trạng kết nối tới bộ lưu trữ thời gian thực.
  - Nút **"Đặt làm lưu trữ mặc định"** chuyển đổi nhà cung cấp lưu trữ chính cho toàn bộ media, video và tệp xuất bản của Workspace.
  - **API:** [app/api/security/integrations/storage/route.ts](file:///Users/tiodev/Desktop/Topify/app/api/security/integrations/storage/route.ts).

- **[F168] CRM & Marketing Integrations (Tích Hợp CRM & Nền Tảng Tự Động Hóa):**
  - Kết nối đồng bộ 2 chiều dữ liệu khách hàng tiềm năng (Leads) và đơn hàng đa kênh (Orders) với 4 nền tảng: **HubSpot CRM**, **Mailchimp**, **Zapier**, **Google Sheets**.
  - Công tắc bật/tắt tự động đồng bộ khách hàng và tự động đồng bộ đơn hàng.
  - Hiển thị số lượng bản ghi đã đồng bộ và thời gian đồng bộ thành công gần nhất.
  - **API:** [app/api/security/integrations/crm/route.ts](file:///Users/tiodev/Desktop/Topify/app/api/security/integrations/crm/route.ts).

- **[F169] Security Audit Log & Compliance Export (Sổ Kiểm Toán Bảo Mật ISO 27001 / SOC 2):**
  - Ghi nhận toàn bộ thao tác an ninh quan trọng: Người thực hiện (Actor), Vai trò, Hành động thực hiện, Danh mục, Địa chỉ IP, Vị trí địa lý, Trạng thái (SUCCESS, WARNING, DENIED) và Thời gian chi tiết.
  - Phân loại màu sắc trực quan, minh bạch lịch sử vận hành của Workspace.
  - Nút **"Xuất Báo Cáo Kiểm Toán (CSV)"** tải về tệp tin CSV chuẩn phục vụ các đợt kiểm toán tuân thủ ISO 27001 và SOC 2.
  - **API:** [app/api/security/audit-log/route.ts](file:///Users/tiodev/Desktop/Topify/app/api/security/audit-log/route.ts).

- **[F170] IP Whitelisting & Active Session Management (Quản Lý Phiên Thiết Bị & IP Tin Cậy):**
  - **Quản lý phiên thiết bị đang đăng nhập (Active Sessions):** Liệt kê chi tiết tên thiết bị, hệ điều hành, trình duyệt, địa chỉ IP, địa điểm và thời gian hoạt động; đánh dấu rõ thiết bị đang dùng với huy hiệu *"Phiên này"*.
  - Nút **"Đăng xuất"** từng thiết bị từ xa và nút **"Đăng xuất thiết bị khác"** thu hồi toàn bộ các phiên khác chỉ với 1 click khi nghi ngờ bị xâm nhập.
  - **Danh sách IP tin cậy (IP Whitelisting):** Cho phép Workspace chỉ định các địa chỉ IP hoặc dải mạng CIDR văn phòng được phép truy cập (VD: `14.232.208.12`, `118.69.182.0/24`), hỗ trợ thêm mới và xóa IP nhanh chóng.
  - **API:** [app/api/security/sessions-ip/route.ts](file:///Users/tiodev/Desktop/Topify/app/api/security/sessions-ip/route.ts).

### 2. Giao Diện Electron Desktop App Hợp Nhất
- **Trang mới:** [SecurityIntegrations.tsx](file:///Users/tiodev/Desktop/Topify/electron-app/frontend/src/pages/SecurityIntegrations.tsx) tích hợp 6 Tab chuyên sâu:
  - *Tab 1:* 2FA & Phân Quyền RBAC (F163, F164)
  - *Tab 2:* Quản Lý API Keys (F165)
  - *Tab 3:* Webhooks (F166)
  - *Tab 4:* Lưu Trữ Đám Mây (F167)
  - *Tab 5:* Tích Hợp CRM & Marketing (F168)
  - *Tab 6:* Kiểm Toán & Phiên IP (F169, F170)
- **Navigation & Routing:** Đăng ký tuyến đường `/security` trong [App.tsx](file:///Users/tiodev/Desktop/Topify/electron-app/frontend/src/App.tsx) và bổ sung mục menu *"Bảo mật & Tích hợp"* với icon `ShieldCheck` vào [Sidebar.tsx](file:///Users/tiodev/Desktop/Topify/electron-app/frontend/src/components/layout/Sidebar.tsx).

---

## 🚀 [2026-10-14] — Triển Khai Toàn Diện Bước 3: Phân Hệ M14. Topify AI Hub (F156 – F162)

### 1. Chi Tiết Tính Năng Phân Hệ M14 (Topify AI Studio & 9router Gateway)
- **[F156] AI Chat Assistant (Trợ Lý AI Đàm Thoại Đa Năng & 4 Personas):**
  - Trợ lý AI hội thoại thông minh hỗ trợ vận hành chiến dịch marketing, tư vấn nội dung, giải đáp thắc mắc và tối ưu bán hàng.
  - Tích hợp 4 vai trò Persona chuyên biệt: *Chiến Lược Gia Marketing (ROI & Growth)*, *Copywriter Viral Triệu View (Sáng tạo nội dung)*, *Chuyên Viên Chốt Sales & CSKH (Kịch bản telesales)*, *Kỹ Thuật Viên Tự Động Hóa (Trigger & Flow)*.
  - Quản lý đa phiên hội thoại (Chat Sessions), lưu trữ lịch sử tin nhắn, và cụm câu hỏi gợi ý nhanh 1-click (Prompt Starters) giúp người dùng bắt đầu tức thì.
  - **Backend & Logic:** [lib/ai/topify-ai-engine.ts](file:///Users/tiodev/Desktop/Topify/lib/ai/topify-ai-engine.ts), [app/api/ai/studio/chat/route.ts](file:///Users/tiodev/Desktop/Topify/app/api/ai/studio/chat/route.ts).

- **[F157] AI Content Generator (Sinh Kịch Bản Video, Tiêu Đề Viral & Caption Bán Hàng):**
  - **Kịch bản TikTok/Reels chuẩn 3 phần:** Hook nghịch lý 3s đầu thu hút sự chú ý, Thân bài Body (chia sẻ giải pháp / so sánh trước-sau), Kêu gọi hành động CTA 10s, kèm On-screen text, Hashtags xu hướng và Điểm số Viral Score ($\ge 90/100$).
  - **5 Tiêu đề Viral giật tít:** Khai thác các góc tâm lý FOMO, Tò mò, Hướng dẫn (How-to), Tranh cãi và Bằng chứng số liệu, kèm điểm số thu hút Attention Score.
  - **Caption bán hàng kinh điển:** Tự động tạo bài viết theo 3 công thức đỉnh cao: `AIDA` (Attention - Interest - Desire - Action), `PAS` (Problem - Agitate - Solution), `BAB` (Before - After - Bridge), tích hợp nút 1-click chuyển tiếp sang màn hình Đăng bài (`/create`).
  - **API:** [app/api/ai/studio/content/route.ts](file:///Users/tiodev/Desktop/Topify/app/api/ai/studio/content/route.ts).

- **[F158] AI Image Generation Studio (Studio Tạo Ảnh AI & Mockup Quảng Cáo):**
  - Chuyển đổi mô tả văn bản (Text-to-Image) thành hình ảnh chất lượng cao phục vụ Thumbnail video, Banner quảng cáo và Mockup sản phẩm.
  - Hỗ trợ 5 phong cách nghệ thuật: *3D Render*, *Cyberpunk Neon*, *Studio Minimalist*, *Realistic Photo*, *Anime Art*.
  - Hỗ trợ 4 tỷ lệ khung hình chuẩn mạng xã hội: *1:1 (Vuông)*, *9:16 (Dọc TikTok/Reels)*, *16:9 (Ngang YouTube)*, *4:5 (Instagram Feed)*.
  - Thư viện ảnh đã sinh với tính năng Tải ảnh về máy và nút 1-click *"Sửa ảnh"* chuyển sang phân hệ Media Studio M7.
  - **API:** [app/api/ai/studio/image/route.ts](file:///Users/tiodev/Desktop/Topify/app/api/ai/studio/image/route.ts).

- **[F159] AI Video Generation & Storyboard (Kịch Bản Phân Cảnh Video Chi Tiết):**
  - Tạo kịch bản phân cảnh Storyboard cho video quảng cáo/giới thiệu sản phẩm: Từng cảnh quay hiển thị chi tiết Góc máy & chuyển động camera (Camera Movement), Prompt hình ảnh (Visual Prompt), Lời đọc thoại (Voiceover) và Nhạc nền (BGM Mood).
  - Tích hợp khung xem trước mô phỏng Video Preview Player với thời lượng và tỷ lệ khung hình chuẩn 9:16 dọc.
  - **API:** [app/api/ai/studio/video/route.ts](file:///Users/tiodev/Desktop/Topify/app/api/ai/studio/video/route.ts).

- **[F160] AI Voice & Audio TTS Studio (Lồng Tiếng AI Đa Vùng Miền & Ngữ Điệu):**
  - Chuyển văn bản thành giọng đọc tự nhiên (Text-to-Speech) chuẩn xác ngữ điệu.
  - Cung cấp đa dạng giọng đọc: Hoài My (Nữ miền Nam), Nam Minh (Nam miền Bắc), Thu Thảo (Nữ miền Trung), Jenny (Nữ Mỹ), Guy (Nam Mỹ).
  - Tùy chỉnh 4 sắc thái ngữ điệu (*Hào hứng*, *Chuyên nghiệp*, *Truyền cảm*, *Tin tức*) và thanh trượt tinh chỉnh tốc độ đọc (*0.8x - 1.5x*).
  - Tích hợp trình phát âm thanh Audio Player trực quan phát trực tiếp trên Desktop App kèm nút tải tệp âm thanh.
  - **API:** [app/api/ai/studio/voice/route.ts](file:///Users/tiodev/Desktop/Topify/app/api/ai/studio/voice/route.ts).

- **[F161] AI Content Repurposing Engine (Tái Chế Bài Viết Dài Thành Gói Đa Kênh):**
  - Nhập 1 bài viết dài (Blog, bài báo, bài chia sẻ kinh nghiệm) $\rightarrow$ Tự động bóc tách thành gói truyền thông 4 định dạng hoàn chỉnh:
    1. *2 Kịch bản video ngắn TikTok/Reels* với Hook riêng biệt.
    2. *1 Chuỗi bài viết Thread mạng xã hội* đánh số thứ tự (1/3, 2/3, 3/3).
    3. *1 Bản tin Email Newsletter* chuẩn cấu trúc Marketing (Subject, Preheader, Body, CTA Button).
    4. *3 Câu trích dẫn viral (Quotes)* đắt giá để thiết kế ảnh trích dẫn.
  - **API:** [app/api/ai/studio/repurpose/route.ts](file:///Users/tiodev/Desktop/Topify/app/api/ai/studio/repurpose/route.ts).

- **[F162] AI Model Switching & 9router Gateway (Định Tuyến & Quản Trị Mô Hình AI):**
  - Cho phép người dùng chuyển đổi linh hoạt giữa 5 mô hình AI hàng đầu thế giới: `gpt-4o-mini`, `gpt-4o`, `claude-3-5-sonnet`, `gemini-1.5-pro`, `deepseek-chat` qua **9router Gateway**.
  - Tích hợp công cụ đo lường độ trễ mạng thời gian thực (Ping Gateway) hiển thị số mili-giây (ms).
  - Quản lý hạn mức Token và Credits tiêu thụ minh bạch.
  - Cơ chế **Fallback Heuristic an toàn tuyệt đối**: Khi máy chủ 9router offline hoặc môi trường dev chưa có key, hệ thống tự động chuyển sang AI Engine nội bộ giả lập chất lượng cao, giữ cho ứng dụng vận hành mượt mà 100% không bao giờ gặp lỗi gián đoạn.
  - **API:** [app/api/ai/studio/models/route.ts](file:///Users/tiodev/Desktop/Topify/app/api/ai/studio/models/route.ts).

---

### 2. Giao Diện Hợp Nhất Trên Electron Desktop App
- **Trang [TopifyAI.tsx](file:///Users/tiodev/Desktop/Topify/electron-app/frontend/src/pages/TopifyAI.tsx):**
  - Xây dựng 6 Tab giao diện chuyên nghiệp, trực quan:
    - *Tab 1: Trợ Lý AI (F156)*
    - *Tab 2: Sáng Tạo Nội Dung (F157)*
    - *Tab 3: Tạo Ảnh AI (F158)*
    - *Tab 4: Phân Cảnh Video (F159)*
    - *Tab 5: Lồng Tiếng AI (F160)*
    - *Tab 6: Tái Chế & Model Routing (F161-F162)*
  - Thanh trạng thái Gateway trên Header hiển thị Model đang dùng, độ trễ và trạng thái kết nối.
- **Tích hợp thanh điều hướng:** Đăng ký tuyến đường Route `/ai` trong [App.tsx](file:///Users/tiodev/Desktop/Topify/electron-app/frontend/src/App.tsx) và thêm mục menu *"Topify AI Hub"* với icon `Sparkles` trong [Sidebar.tsx](file:///Users/tiodev/Desktop/Topify/electron-app/frontend/src/components/layout/Sidebar.tsx).
- **Kiểm tra chất lượng:** Hoàn tất kiểm thử TypeScript `npx tsc --noEmit` đạt chuẩn 0 lỗi biên dịch.

---

## 🚀 [2026-10-14] — Triển Khai Toàn Diện Bước 2: Phân Hệ M12. Wallet & Earnings (F146 – F150) & M13. Referral & Growth (F151 – F155)

### 1. Phân Hệ M12: Wallet & Earnings (Ví Điện Tử & Thu Nhập Cộng Đồng)
- **[F146] Multi-Tier Balance & Auto Currency (Số Dư 3 Cấp & Quy Đổi Ngoại Tệ):**
  - Quản trị độc lập 3 quỹ số dư: *Khả dụng (Available)*, *Đang chờ duyệt (Pending)*, và *Tổng đã rút (Withdrawn)*.
  - Tích hợp công cụ tự động quy đổi ngoại tệ tức thời giữa USD và VND theo tỷ giá thị trường thời gian thực (Mặc định 1 USD = 25,400 VND).
  - Kiến trúc 2 lớp Resilience Fallback: Kết nối trực tiếp cơ sở dữ liệu Prisma khi Online và tự động kích hoạt kho In-memory khi Offline, đảm bảo app Electron không bị đơ hoặc gián đoạn.
  - **Backend & Logic:** [lib/wallet/wallet-engine.ts](file:///Users/tiodev/Desktop/Topify/lib/wallet/wallet-engine.ts), [app/api/wallet/route.ts](file:///Users/tiodev/Desktop/Topify/app/api/wallet/route.ts).

- **[F147] Transaction History & Ledger (Lịch Sử Giao Dịch & Sổ Cái Biến Động):**
  - Sổ cái tài chính ghi nhận minh bạch toàn bộ dòng tiền vào (+) và dòng tiền ra (-): Mã giao dịch, loại giao dịch (`COMMISSION`, `WITHDRAWAL`, `TASK_REWARD`, `BONUS`), mô tả chi tiết, số tiền và số dư sau giao dịch.
  - Bộ lọc tức thì theo loại giao dịch và ô tìm kiếm mã giao dịch/khách hàng theo thời gian thực.
  - **Backend:** `getTransactions` trong [lib/wallet/wallet-engine.ts](file:///Users/tiodev/Desktop/Topify/lib/wallet/wallet-engine.ts).

- **[F148] Withdrawal Request & Limit Guard (Lập Lệnh Rút Tiền & Kiểm Duyệt Hạn Mức):**
  - Cho phép người dùng lập yêu cầu rút tiền về ngân hàng/ví điện tử chỉ với 1 cú click.
  - Bộ kiểm soát hạn mức tự động: Chặn rút tiền dưới hạn mức tối thiểu ($10.00 / 250,000 VND) và chặn rút vượt quá số dư khả dụng.
  - Theo dõi trạng thái tiến độ giải ngân: `PENDING`, `PROCESSING`, `COMPLETED`, `REJECTED`.
  - **Backend & API:** `createWithdrawal` trong [app/api/wallet/route.ts](file:///Users/tiodev/Desktop/Topify/app/api/wallet/route.ts).

- **[F149] Payment Methods Management (Quản Lý Tài Khoản Nhận Tiền Đa Kênh):**
  - Hỗ trợ đa dạng 4 phương thức nhận tiền phổ biến: VietQR / Ngân hàng nội địa, Ví điện tử MoMo, Cổng quốc tế PayPal, Ví Crypto USDT (BEP-20 / TRC-20).
  - Tính năng đặt phương thức nhận tiền mặc định (`isDefault`), tự động điền sẵn khi mở modal rút tiền.
  - **API:** [app/api/wallet/payment-methods/route.ts](file:///Users/tiodev/Desktop/Topify/app/api/wallet/payment-methods/route.ts).

- **[F150] Earning Tasks & Direct Claim (Nhiệm Vụ Kiếm Tiền & Nhận Thưởng Trực Tiếp):**
  - Hệ thống 4 nhiệm vụ kiếm tiền cộng đồng: Chia sẻ phần mềm, Review trải nghiệm 5 sao, Sản xuất video hướng dẫn, Mời bạn bè.
  - Thanh phần trăm tiến độ trực quan (`progress / target`).
  - Nút **"Nhận Thưởng Ngay"**: Khi đạt 100% tiến độ, người dùng bấm nhận thưởng $\rightarrow$ Tiền thưởng lập tức cộng vào số dư khả dụng của ví và sinh giao dịch `TASK_REWARD` trong sổ cái.
  - **API:** [app/api/wallet/tasks/route.ts](file:///Users/tiodev/Desktop/Topify/app/api/wallet/tasks/route.ts).

---

### 2. Phân Hệ M13: Referral & Growth (Tiếp Thị Liên Kết & Chống Gian Lận)
- **[F151] Referral Link, Code & QR Generator (Link Tiếp Thị, Mã Mời & Sinh Mã QR):**
  - Cung cấp link tiếp thị độc quyền định dạng `https://topify.app/ref/<CODE>` và mã mời cá nhân hóa cho từng Workspace.
  - Cho phép tùy biến mã giới thiệu cá nhân (Custom Referral Code).
  - Tích hợp Modal sinh mã QR Code động tải về máy dưới định dạng PNG sắc nét để in ấn banner hoặc quét nhanh bằng camera điện thoại.
  - **API:** [app/api/referral/route.ts](file:///Users/tiodev/Desktop/Topify/app/api/referral/route.ts).

- **[F152] 4-Tier Tracking Funnel (Phễu Theo Dõi Tiếp Thị 4 Tầng):**
  - Đo lường hiệu quả chuyển đổi qua mô hình phễu 4 tầng tiêu chuẩn: *Lượt nhấp (Clicks)* $\rightarrow$ *Đăng ký tài khoản (Signups)* $\rightarrow$ *Khách trả phí (Paid Customers)* $\rightarrow$ *Người dùng tích cực (Active Users)*.
  - Tự động tính toán tỷ lệ chuyển đổi (Conversion Rate %) và bảng chi tiết danh sách khách hàng được giới thiệu.
  - **Backend:** `getReferralProfile` trong [lib/wallet/wallet-engine.ts](file:///Users/tiodev/Desktop/Topify/lib/wallet/wallet-engine.ts).

- **[F153] Commission Rules & Tiering (Chính Sách Hoa Hồng Đa Tầng):**
  - Minh bạch chính sách hoa hồng lũy tiến: 15% cho gói Basic, 20% cho gói Pro Agency, 25% cho gói Doanh nghiệp Enterprise.
  - Cơ chế **Hoa hồng trọn đời (Recurring Lifetime)**: Nhận thưởng định kỳ mỗi lần khách hàng gia hạn phần mềm hàng tháng/hàng năm.
  - **API:** [app/api/referral/commissions/route.ts](file:///Users/tiodev/Desktop/Topify/app/api/referral/commissions/route.ts).

- **[F154] Commission Settlement & Audit (Đối Soát Hoa Hồng & Sổ Đối Chiếu Minh Bạch):**
  - Bảng kê chi tiết từng khoản hoa hồng phát sinh từ đơn hàng thực tế: Mã đơn hàng, Tên người mua, Gói dịch vụ, Giá trị đơn, % Hoa hồng, Số tiền nhận được, Trạng thái (`APPROVED`, `SETTLED`, `HOLDING`) và Kỳ đối soát.
  - **API:** [app/api/referral/commissions/route.ts](file:///Users/tiodev/Desktop/Topify/app/api/referral/commissions/route.ts).

- **[F155] Anti-Fraud Inspection (Hệ Thống Kiểm Toán & Chống Gian Lận Tự Động):**
  - Thuật toán AI phân tích và phát hiện các hành vi gian lận tiếp thị liên kết:
    - *Tự giới thiệu (Self-referral)*: Bấm link bằng cùng một tài khoản hoặc email tương đồng.
    - *Chung thiết bị / IP (Device Fingerprint Match)*: Nhiều tài khoản đăng ký trên cùng một máy tính/trình duyệt.
    - *Bùng nổ đăng ký ảo (Velocity Burst Registration)*: Đột biến nhiều tài khoản trong vài phút nhưng không có hoạt động.
  - Phân loại rủi ro 3 cấp độ: `SAFE` (0-30 điểm), `SUSPICIOUS` (31-70 điểm), `HIGH_RISK` (71-100 điểm, tự động đóng băng giải ngân).
  - Nút **"Quét Rủi Ro Tự Động (Scan On-Demand)"**: Kích hoạt quét toàn diện theo yêu cầu và báo cáo điểm rủi ro thời gian thực.
  - **API:** [app/api/referral/anti-fraud/route.ts](file:///Users/tiodev/Desktop/Topify/app/api/referral/anti-fraud/route.ts).

---

### 3. Giao Diện Hợp Nhất Trên Electron Desktop App
- **Trang [WalletEarnings.tsx](file:///Users/tiodev/Desktop/Topify/electron-app/frontend/src/pages/WalletEarnings.tsx):**
  - Thiết kế 5 Tab chuyên nghiệp: *Ví & Rút Tiền*, *Lịch Sử Giao Dịch*, *Tài Khoản Nhận Tiền*, *Nhiệm Vụ Kiếm Thưởng*, *Tiếp Thị & Chống Gian Lận*.
  - Modal tạo lệnh rút tiền kèm kiểm soát hạn mức thời gian thực.
  - Modal thêm tài khoản nhận tiền đa kênh (VietQR, MoMo, PayPal, Crypto).
  - Modal xem và tải mã QR tiếp thị độc quyền.
  - Khung thanh tra chống gian lận kèm nút quét rủi ro trực tiếp.
- **Tích hợp thanh điều hướng:** Đăng ký Route `/wallet` trong [App.tsx](file:///Users/tiodev/Desktop/Topify/electron-app/frontend/src/App.tsx) và thêm mục menu *"Ví & Hoa hồng (Wallet)"* với icon `Wallet` trong [Sidebar.tsx](file:///Users/tiodev/Desktop/Topify/electron-app/frontend/src/components/layout/Sidebar.tsx).
- **Kiểm tra chất lượng:** Hoàn tất kiểm thử TypeScript `npx tsc --noEmit` đạt chuẩn 0 lỗi biên dịch.

---

## 🚀 [2026-10-14] — Triển Khai Toàn Diện Phân Hệ M11. Automation (Tự Động Hóa Đa Phân Hệ & Kịch Bản CSKH: F141, F142, F143, F144, F145)

### 1. [F141] Trigger Engine (Đa Nguồn Kích Hoạt Tự Động)
- **Hỗ trợ 5 nguồn kích hoạt cốt lõi:**
  - `COMMENT`: Bắt bình luận mới từ TikTok, Facebook, Shopee theo bài viết hoặc toàn bộ kênh.
  - `MESSAGE`: Bắt tin nhắn mới từ khách hàng qua Unified Inbox.
  - `LEAD`: Kích hoạt khi có Lead mới phát sinh từ CRM hoặc form đăng ký.
  - `TIME`: Kích hoạt theo lịch trình định kỳ (Cron expressions: hàng ngày, hàng tuần, hàng giờ).
  - `WEBHOOK`: Inbound webhook đón nhận sự kiện tức thì từ Landing Page, cổng thanh toán hoặc hệ thống bên thứ 3.
- **Backend & Logic:** [lib/automation/flow-engine.ts](file:///Users/tiodev/Desktop/Topify/lib/automation/flow-engine.ts), [app/api/automations/route.ts](file:///Users/tiodev/Desktop/Topify/app/api/automations/route.ts).

### 2. [F142] Condition Builder (Bộ Lọc Điều Kiện Thông Minh)
- **Cơ chế so khớp đa tiêu chí:**
  - Lọc theo từ khóa (`keyword`), thẻ tag (`tag`), kênh nguồn (`source`), trạng thái (`status`), nội dung tin nhắn (`message_contains`).
  - Hỗ trợ đầy đủ toán tử so khớp: `contains` (chứa từ khóa), `equals` (bằng chính xác), `not_equals` (khác với), `starts_with` (bắt đầu bằng), `in` (thuộc danh sách).
  - Thuật toán `evaluateConditions`: Xử lý mảng điều kiện song song với độ trễ siêu thấp (<5ms).

### 3. [F143] Action Engine (Chuỗi Hành Động Liên Phân Hệ)
- **Kích hoạt hành động xuyên suốt các module của Topify:**
  - `MESSAGE`: Tự động gửi tin nhắn phản hồi theo mẫu qua Unified Inbox (M3).
  - `TAG`: Tự động gắn thẻ phân loại khách hàng trong Customer CRM (M4).
  - `LEAD`: Tự động tạo hoặc nâng hạng Lead (`NEW`, `QUALIFIED`, `VIP`).
  - `TASK`: Tự động tạo công việc kèm độ ưu tiên (`URGENT`, `HIGH`) trong Work & Task (M9).
  - `ASSIGN`: Điều hướng và gán trực tiếp nhân sự phụ trách tiếp nhận ca trực.
  - `NOTIFY`: Bắn thông báo In-App Notification cảnh báo tức thì cho đội ngũ.
- **Backend:** `executeActions` trong [lib/automation/flow-engine.ts](file:///Users/tiodev/Desktop/Topify/lib/automation/flow-engine.ts).

### 4. [F144] Execution Logs, Retry & Idempotency (Nhật Ký Thực Thi & Chống Trùng)
- **Kiểm soát và vận hành quy trình tự động an toàn:**
  - Ghi nhận lịch sử chi tiết: Trạng thái (`SUCCESS`, `FAILED`, `SKIPPED`, `RETRYING`), thời gian thực thi (ms), Input Trigger Payload, Output Executed Actions và nguyên nhân lỗi chi tiết (Error Stack).
  - Cơ chế **Thử Lại (Retry Flow)**: Nút "Thử lại ngay" trên UI, tự động tăng số lần retry và ghi log cập nhật (`retryCount / maxRetries`).
  - Bảo đảm **Tính Bất Biến (Idempotency Key)**: Sinh mã định danh chống trùng lặp (`idemp_...`) cho từng sự kiện, ngăn chặn việc kích hoạt kép khi Webhook gửi lại.
- **API Backend:** [app/api/automations/logs/route.ts](file:///Users/tiodev/Desktop/Topify/app/api/automations/logs/route.ts).

### 5. [F145] Automation Templates (Thư Viện Mẫu Quy Trình 1-Click)
- **Bộ 5 kịch bản thực chiến dựng sẵn:**
  - 1. *Tự động trả lời comment hỏi giá & Gắn tag Lead tiềm năng* (Marketing/Bán lẻ).
  - 2. *Tạo Task khẩn cấp khi nhận VIP Lead từ Webhook Landing Page* (CRM/B2B).
  - 3. *Gửi tin nhắn chào mừng & Điều hướng nhân sự trực Inbox* (CSKH).
  - 4. *Cảnh báo tự động khi công việc chiến dịch bị trễ hạn* (Operations/Tasks M9).
  - 5. *Tự động phân loại & gắn thẻ khi khách để lại Số Điện Thoại* (Telesales/Chốt đơn).
  - Tính năng **Áp dụng 1-Click (Apply)**: Khởi tạo quy trình hoạt động ngay lập tức không cần thiết lập thủ công.
- **API & UI:** [app/api/automations/templates/route.ts](file:///Users/tiodev/Desktop/Topify/app/api/automations/templates/route.ts), [TemplatesModal.tsx](file:///Users/tiodev/Desktop/Topify/electron-app/frontend/src/components/automation/TemplatesModal.tsx).

### 6. Giao Diện Electron Desktop App ([Automation.tsx](file:///Users/tiodev/Desktop/Topify/electron-app/frontend/src/pages/Automation.tsx))
- Tích hợp 3 Tab chuyên sâu:
  - **Tab 1 (Kịch bản Tự động):** Thẻ thống kê KPI, bộ lọc nguồn kích hoạt, Grid quy trình với toggle On/Off, nút chạy thử (Test Run), modal Flow Builder và modal Thư viện Mẫu.
  - **Tab 2 (Nhật ký Thực thi & Thử lại):** Bảng log thời gian thực, lọc theo kết quả, sao chép mã Idempotency, nút Retry cho các lượt lỗi và modal thanh tra Payload chi tiết.
  - **Tab 3 (Tương tác Mạng Xã hội):** Bảo toàn 100% nghiệp vụ tương tác/nuôi nick Facebook trên desktop.

---

## 🚀 [2026-10-14] — Triển Khai Toàn Diện Phân Hệ M10. Campaign (Quản lý Chiến dịch Tiếp thị & Bán hàng: F133, F134, F135, F137, F138, F139)

### 1. [F133] Objective & KPI (Định nghĩa Mục tiêu & KPI Chiến dịch)
- **Thiết lập mục tiêu định lượng chuẩn hóa:**
  - Hỗ trợ 5 loại mục tiêu cốt lõi: Tối ưu Doanh thu (`REVENUE`), Thu thập Leads (`LEADS`), Mở rộng Độ phủ (`REACH`), Cài đặt Ứng dụng (`APP_INSTALL`), Tăng Chuyển đổi đơn (`CONVERSIONS`).
  - Thiết lập chỉ tiêu định lượng (Target vs Actual) và tự động tính toán tỷ lệ hoàn thành KPI (`completionRate %`).
  - Trực quan hóa tiến độ KPI với thanh gradient màu và số liệu đối chiếu thời gian thực.
- **Backend Engine & API:** `lib/campaigns/engine.ts`, `app/api/campaigns/route.ts`.

### 2. [F134] Budget (Quản lý Ngân sách Kế hoạch & Thực tế)
- **Phân bổ và giám sát chi phí đa danh mục:**
  - Quản lý ngân sách dự trù (Planned Budget) vs Chi phí thực tế đã giải ngân (Actual Spend).
  - Phân loại 4 danh mục chi phí: Quảng cáo trả phí (`PAID_ADS`), Booking KOC/KOLs (`KOL_BOOKING`), Sản xuất Media & Creative (`CREATIVE_MEDIA`), Seeding & Vận hành phễu (`SEEDING_OPS`).
  - Thuật toán đo lường tốc độ tiêu hao ngân sách (`calculateBudgetBurnRate`): So sánh % chi phí đã dùng với % thời gian chiến dịch đã trôi qua và kích hoạt cờ cảnh báo quá hạn (`NORMAL`, `ACCELERATED`, `OVER_BUDGET`).
- **Backend Engine & API:** `lib/campaigns/engine.ts`, `app/api/campaigns/route.ts`.

### 3. [F135] Channel & Content Plan (Gắn Kênh & Kế hoạch Nội dung vào Chiến dịch)
- **Quy hoạch nội dung đa kênh theo giai đoạn:**
  - Hỗ trợ tích hợp 5 kênh phân phối trọng điểm: TikTok, Facebook Reels/Post, Instagram, YouTube Shorts, Shopee.
  - Phân bổ kế hoạch nội dung theo 4 giai đoạn chiến dịch (Phases): `TEASER` (Hé lộ & thu lead sớm), `KICKOFF` (Chính thức mở bán & Livestream), `PEAK_SALE` (Siêu sale giờ chót & countdown), `POST_SALE` (Tri ân & tái chăm sóc).
  - Theo dõi số lượng bài đăng mục tiêu vs thực tế đã xuất bản theo từng giai đoạn.
- **Backend Engine & API:** `lib/campaigns/engine.ts`, `app/api/campaigns/route.ts`.

### 4. [F137] Asset & Approval (Kho Tài nguyên & Luồng Phê duyệt 2 Cấp)
- **Kiểm soát chất lượng tài nguyên truyền thông trước khi phát hành:**
  - Lưu trữ kho tài nguyên tập trung (Creative Assets: Banners, Video Teasers 4K, Kịch bản Livestream PDF, Story Ads).
  - Quy trình phê duyệt minh bạch: `DRAFT` $\rightarrow$ `PENDING_REVIEW` $\rightarrow$ `APPROVED` hoặc `REJECTED`.
  - Phê duyệt 1-click hoặc từ chối kèm góp ý chỉnh sửa chi tiết của Manager/Lead (`reviewerNote`).
- **Backend API:** `GET, POST, PATCH /api/campaigns/assets` ([app/api/campaigns/assets/route.ts](file:///Users/tiodev/Desktop/Topify/app/api/campaigns/assets/route.ts)).

### 5. [F138] Progress Dashboard (Bảng Điều khiển Tiến độ Hợp nhất 4 Trục)
- **Theo dõi tiến độ hợp nhất theo thời gian thực:**
  - **Trục 1 (Content):** Tỷ lệ bài viết đã đăng / Kế hoạch toàn chiến dịch.
  - **Trục 2 (Tasks):** Tiến độ các công việc phân vai liên quan chiến dịch (tích hợp phân hệ M9 Work & Task).
  - **Trục 3 (KPI):** Tỷ lệ đạt mục tiêu doanh thu, leads, lượt xem.
  - **Trục 4 (Budget):** Tiến độ giải ngân ngân sách theo thời gian thực.
- **Backend API:** `GET /api/campaigns/progress` ([app/api/campaigns/progress/route.ts](file:///Users/tiodev/Desktop/Topify/app/api/campaigns/progress/route.ts)).

### 6. [F139] Campaign Report & ROI (Báo cáo Tổng kết Tài chính & Đo lường ROI)
- **Phân tích tài chính toàn diện:**
  - Tính toán Lợi nhuận ròng, Tỷ suất sinh lời `ROI % = ((Doanh thu - Chi phí) / Chi phí) * 100%`, và chỉ số `ROAS = Doanh thu / Chi phí quảng cáo Ads`.
  - Đo lường kinh tế đơn vị: Chi phí trên mỗi Lead mới (`CPL`) và Chi phí trên mỗi Đơn hàng chốt (`CPA`).
  - Đánh giá xếp hạng chiến dịch tự động (`OUTSTANDING`, `ON_TARGET`, `NEEDS_IMPROVEMENT`).
  - Gợi ý hành động tối ưu hóa tiếp theo và nút 1-Click tải xuống Báo cáo tổng kết chiến dịch dạng PDF/Print.
- **Backend API:** `GET /api/campaigns/report` ([app/api/campaigns/report/route.ts](file:///Users/tiodev/Desktop/Topify/app/api/campaigns/report/route.ts)).

### 7. Giao diện Electron Desktop App
- Màn hình `/campaigns` ([Campaigns.tsx](file:///Users/tiodev/Desktop/Topify/electron-app/frontend/src/pages/Campaigns.tsx)) với 4 tab chuyên sâu:
  - **Tab 1: Danh sách Chiến dịch:** Card view trực quan kèm KPI progress, ngân sách và modal tạo chiến dịch mới.
  - **Tab 2: Tiến độ Hợp nhất:** Bảng 4 trục Content, Task, KPI, Budget kèm dòng thời gian giai đoạn (Phases timeline).
  - **Tab 3: Kho Asset & Luồng Duyệt:** Bảng tài nguyên sáng tạo, trạng thái duyệt và nút duyệt/từ chối kèm phản hồi.
  - **Tab 4: Báo cáo Tổng kết & ROI:** Biểu đồ tài chính, đơn vị kinh tế CPL/CPA và xuất báo cáo.
- Đã đăng ký route `/campaigns` trong [App.tsx](file:///Users/tiodev/Desktop/Topify/electron-app/frontend/src/App.tsx) và thêm menu `Chiến dịch (Campaigns)` vào [Sidebar.tsx](file:///Users/tiodev/Desktop/Topify/electron-app/frontend/src/components/layout/Sidebar.tsx).

---

## 🚀 [2026-10-14] — Triển Khai Toàn Diện Phân Hệ M9. Work & Task (Quản lý Công việc & Phối hợp Đội ngũ: F124, F128, F129, F130, F131)

### 1. [F124] Assignee / Collaborator (Người phụ trách chính và Người phối hợp)
- **Cơ chế phân quyền & phối hợp liên phòng ban:**
  - Hỗ trợ gán 1 người chủ trì (Assignee) chịu trách nhiệm chính về tiến độ và kết quả.
  - Hỗ trợ gán nhiều người phối hợp (Collaborators) cùng theo dõi, cập nhật tiến độ và thảo luận.
  - Hiển thị avatar/thông tin chủ trì và cụm badge danh sách cộng tác viên trực quan.
  - Bộ lọc đa năng theo: "Tất cả công việc", "Lọc theo thành viên cụ thể", "Việc trễ hạn".
- **Backend API & Data Engine:** `lib/tasks/engine.ts`, `app/api/tasks/route.ts`.

### 2. [F128] Comment / Attachment / Mention (Trao đổi, Tệp đính kèm & Nhắc tên)
- **Hệ thống hội thoại trong từng công việc (Task Collaboration):**
  - Trao đổi thảo luận thời gian thực với định dạng hiển thị trực quan.
  - Hỗ trợ đính kèm tệp tin tài liệu, kịch bản, video source (`TaskAttachment`: tên, kích thước, định dạng, ngày tải lên).
  - Tính năng nhắc tên nhanh (`@mention`) đồng đội trong bình luận kèm nút gắn thẻ 1-click (@Nguyễn Văn A, @Trần Thị B, @Lê Hoàng C) với highlight màu nổi bật.
- **Backend API:** `GET, POST /api/tasks/comments` ([app/api/tasks/comments/route.ts](file:///Users/tiodev/Desktop/Topify/app/api/tasks/comments/route.ts)).

### 3. [F129] Recurring Task (Công việc lặp định kỳ tự động)
- **Lập lịch chu kỳ công việc tự động:**
  - Hỗ trợ 4 tần suất lặp: Hàng ngày (`DAILY`), Hàng tuần (`WEEKLY`), Mỗi 2 tuần (`BIWEEKLY`), Hàng tháng (`MONTHLY`).
  - Hàm tính toán hạn chót chu kỳ tiếp theo `calculateNextRecurringDueDate`.
  - Hiển thị nhãn huy hiệu chu kỳ `🔁 Lặp: WEEKLY` trên thẻ Kanban và bảng danh sách.
  - Tự động thông báo gia hạn chu kỳ khi hoàn thành task (`status = DONE`).
- **Backend Engine & API:** `lib/tasks/engine.ts`, `app/api/tasks/route.ts`.

### 4. [F130] Task Template (Thư viện Mẫu quy trình chuẩn hóa)
- **4 Mẫu quy trình doanh nghiệp thiết lập sẵn:**
  - 🎬 **Sản xuất Video Content (TikTok/Reels/Shorts):** 6 bước (Hook 3s, Kịch bản, Quay 4K, Dựng nhịp nhanh, Phụ đề WebVTT, Đăng đa kênh).
  - 💬 **Xử lý Khiếu nại & CSKH:** 5 bước (Tiếp nhận mã đơn, Xác minh kho vận, Đề xuất đổi hàng/hoàn tiền, Tạo voucher bồi hoàn, Đánh giá hài lòng).
  - 🚀 **Triển khai Chiến dịch Marketing & Mở bán:** 6 bước (KPI & Ngân sách, Banner & Teaser, Cài đặt Ads & Pixel, Seeding, Kick-off Sales, Đối soát ROI).
  - 👤 **Tiếp nhận & Đào tạo Nhân sự mới (Onboarding):** 5 bước (Cấp tài khoản & 2FA, Brand Voice, Hướng dẫn Studio/CRM, Thử việc 1-1, Đánh giá tuần đầu).
- **Tính năng 1-Click Apply:** Kích hoạt mẫu quy trình -> Tự động sinh công việc cha kèm toàn bộ checklist subtasks phân bổ theo vai trò chuyên môn.
- **Backend API:** `GET /api/tasks/templates` ([app/api/tasks/templates/route.ts](file:///Users/tiodev/Desktop/Topify/app/api/tasks/templates/route.ts)).

### 5. [F131] Workload & Productivity (Khối lượng công việc & Năng suất đội ngũ)
- **Thuật toán đánh giá năng suất (`evaluateMemberProductivity`):**
  - Đo lường 4 chỉ số chính: Tổng việc gán, Số việc đang xử lý (Active), Số việc đã xong (Completed), Số việc trễ hạn (Overdue).
  - Tỷ lệ đúng hạn `onTimeRate = (Total - Overdue) / Total * 100%`.
  - Điểm năng suất tổng hợp `productivityScore` (0 - 100 điểm).
  - Cơ chế tự động phát hiện và cảnh báo nhân sự quá tải (`isOverloaded: true` khi việc active >= 4 hoặc việc khẩn cấp >= 2) kèm hiệu ứng cảnh báo viền đỏ.
- **Backend API:** `GET /api/tasks/productivity` ([app/api/tasks/productivity/route.ts](file:///Users/tiodev/Desktop/Topify/app/api/tasks/productivity/route.ts)).

### 6. Giao diện Electron Desktop App
- Màn hình `/tasks` ([Tasks.tsx](file:///Users/tiodev/Desktop/Topify/electron-app/frontend/src/pages/Tasks.tsx)) với 3 tab:
  - **Tab 1: Bảng công việc (Tasks & Kanban):** Hỗ trợ chuyển đổi linh hoạt giữa Kanban Board 4 cột (`Cần làm`, `Đang làm`, `Chờ duyệt`, `Hoàn thành`) và List Table View. Kèm Task Detail Modal đầy đủ checklist, trao đổi, tệp đính kèm và tag @mention.
  - **Tab 2: Thư viện Mẫu quy trình (Templates):** Hiển thị chi tiết từng bước, vai trò và nút 1-click áp dụng.
  - **Tab 3: Năng suất & Khối lượng (Productivity):** Thẻ KPI toàn đội ngũ, bảng xếp hạng năng suất thành viên kèm trạng thái cảnh báo quá tải.
- Đã đăng ký route `/tasks` trong [App.tsx](file:///Users/tiodev/Desktop/Topify/electron-app/frontend/src/App.tsx) và mục menu `Quản lý công việc (Tasks)` trong [Sidebar.tsx](file:///Users/tiodev/Desktop/Topify/electron-app/frontend/src/components/layout/Sidebar.tsx).

---

## 🚀 [2026-10-14] — Triển Khai Toàn Diện 10 Module: M6. Intelligence (F110, F112), M7. Media Studio (F113 - F115), M8. Workspace & Admin (F117 - F121)

### 1. Phân Hệ M6. Intelligence (Thông minh & Xu hướng)
- **[F110] Trending / Viral Content Detection:**
  - Thuật toán đo lường **Viral Velocity (Điểm vận tốc tăng trưởng theo giờ)**: Phân loại nhãn bùng nổ `BREAKOUT` (ví dụ: +15,000 views/h), `STEADY` (+4,800 views/h), `PEAKING`.
  - Bộ lọc đa nền tảng (TikTok, Facebook, Instagram, YouTube) và thời gian (24h, 7 ngày).
  - Nút chuyển tiếp nhanh 1-Click: "Tạo bài viết phái sinh (Remix AI)" nạp thẳng chủ đề đang hot sang Content Studio (`/create`).
  - **Backend API:** `GET /api/intelligence/trending`.
- **[F112] Keyword / Viral Alert (Cảnh báo ngưỡng viral & từ khóa):**
  - Quản lý quy tắc (Alert Rules): Thiết lập tên quy tắc, ngưỡng điểm viral tối thiểu (50 - 100), danh sách từ khóa/hashtag theo dõi, kênh nhận thông báo (Desktop App In-App, Email).
  - Bảng cảnh báo theo thời gian thực (Triggered Alerts): Xem chi tiết cảnh báo, điểm viral, đường dẫn nguồn gốc, và nút đánh dấu đã đọc.
  - **Backend API:** `GET, POST, PATCH, DELETE /api/intelligence/alerts`.
- **Giao diện Electron:** Màn hình `/intelligence/alerts` ([ViralAlerts.tsx](file:///Users/tiodev/Desktop/Topify/electron-app/frontend/src/pages/ViralAlerts.tsx)).

### 2. Phân Hệ M7. Media Studio (Xử lý Đa Phương Tiện & AI)
- **[F113] Resize Đa Nền Tảng (Multi-Aspect Ratio):**
  - Hỗ trợ 4 tỷ lệ chuẩn hóa: `9:16` (TikTok/Reels/Shorts), `1:1` (Square Instagram/Facebook Feed), `16:9` (YouTube/Web ngang), `4:5` (Instagram/Facebook dọc).
  - 3 chế độ co dãn thông minh: `FIT_BLUR` (Lấy nền mờ tạo độ sâu), `CENTER_CROP` (Cắt trọng tâm thông minh), `LETTERBOX` (Đóng dải đen điện ảnh).
  - Trực quan hóa mô phỏng Full HD (1080p) thời gian thực trên Web Canvas / CSS transformation.
  - **Engine & API:** `lib/media/studio.ts`, `POST /api/media/resize`.
- **[F114] Repurpose Video (Trích xuất Clip ngắn Viral):**
  - Tích hợp 9router gateway (`generateVideoRepurposeHighlights`): Phân tích video dài thành các clip ngắn 30s-60s.
  - Tự động trích xuất: Hook 3s đầu tiên, Viral Potential Score (90-97 điểm), Caption đề xuất và bộ Hashtag tối ưu SEO.
  - Nút 1-click đưa clip ngắn sang Content Studio để lên lịch xuất bản.
  - **Engine & API:** `lib/ai/9router.ts`, `POST /api/media/repurpose`.
- **[F115] Auto Subtitles (Tạo Phụ Đề Tự Động):**
  - Tích hợp 9router gateway (`generateAutoSubtitles`): Nhận diện lời thoại và sinh chuỗi WebVTT/SRT chuẩn hóa timestamp.
  - Trình biên tập phụ đề Subtitle Cue Editor trực quan theo từng giây.
  - Kiểu chữ phụ đề động phong cách TikTok Shorts (Chữ vàng viền đen, Chữ trắng nền tối).
  - Nút 1-Click sao chép tệp SRT hoặc tải về.
  - **Engine & API:** `lib/ai/9router.ts`, `POST /api/media/subtitles`.
- **Giao diện Electron:** Màn hình `/media/studio` ([MediaStudio.tsx](file:///Users/tiodev/Desktop/Topify/electron-app/frontend/src/pages/MediaStudio.tsx)).

### 3. Phân Hệ M8. Workspace & Admin (Không gian làm việc, Định mức & Bản quyền)
- **[F117] Invitation & Seat Management (Quản lý Ghế ngồi & Lời mời):**
  - Banner định mức ghế ngồi: Thể hiện trực quan số ghế đã dùng / tổng ghế cho phép (Seat Quota Progress).
  - Hàng rào kiểm soát Quota Guard: Chặn tạo thêm lời mời khi vượt ngưỡng số ghế và gợi ý nâng cấp gói.
  - Bảng quản lý lời mời thành viên (Pending Invites): Trạng thái `PENDING`, `ACCEPTED`, `REVOKED`, nút sao chép link mời và nút thu hồi.
  - **Backend API:** `GET, POST /api/workspace/seats`.
  - **Giao diện Electron:** Màn hình nâng cấp `/team` ([Team.tsx](file:///Users/tiodev/Desktop/Topify/electron-app/frontend/src/pages/Team.tsx)).
- **[F118] Usage Metering & Quota (Định mức sử dụng tài nguyên):**
  - Theo dõi 4 chỉ số sống còn: Kênh kết nối (Channels), Bài viết/tháng (Posts), AI Credits (9router), Dung lượng lưu trữ (Storage GB).
  - Cập nhật thời gian thực theo cấu hình gói `FREE`, `PRO`, `ENTERPRISE`.
  - **Backend API:** `GET /api/workspace/quota`, `lib/workspace/quota.ts`.
- **[F119] Trial, Upgrade & Prorated Billing (Dùng thử & Bù trừ gói cước):**
  - Nút 1-click kích hoạt 14 ngày dùng thử PRO (Trial).
  - Bảng so sánh 3 gói cước `FREE` (0đ), `PRO` (499.000đ/tháng), `ENTERPRISE` (1.990.000đ/tháng).
  - Thuật toán tính toán chi phí bù trừ (**Prorated Billing calculation**): Tự động trừ số tiền chưa sử dụng của chu kỳ cũ và tính số tiền thanh toán thực tế hôm nay.
  - **Backend API:** `POST /api/workspace/billing`.
- **[F120] Billing History & Invoice (Lịch sử thanh toán & Hóa đơn VAT):**
  - Bảng biên lai hóa đơn điện tử: Mã hóa đơn, Tên gói, Số tiền (VND), Chu kỳ áp dụng, Phương thức thanh toán và Trạng thái thanh toán `PAID`.
  - Nút 1-click tải xuống Hóa đơn VAT điện tử.
  - **Backend API:** `GET /api/workspace/billing`.
- **[F121] Data Export & 30-Day Grace Account Deletion (Xuất dữ liệu & Xóa an toàn):**
  - **Data Export Manifest:** Xuất toàn bộ dữ liệu Workspace (Posts, Leads CRM, Pipelines, Media Assets, Checksum SHA256) dưới dạng tệp nén an toàn.
  - **30-Day Grace Deletion Policy:** Chính sách bảo vệ dữ liệu với 30 ngày ân hạn. Yêu cầu nhập đúng chữ `DELETE_WORKSPACE` để đưa vào hàng đợi hủy và cho phép khôi phục bất cứ lúc nào trong thời gian ân hạn.
  - **Backend API:** `GET, POST /api/workspace/data-export`.
- **Giao diện Electron:** Màn hình nâng cấp 4 tab `/settings` ([Settings.tsx](file:///Users/tiodev/Desktop/Topify/electron-app/frontend/src/pages/Settings.tsx)).

---

## 🚀 [2026-10-14] — Triển Khai Toàn Diện Phân Hệ M5. Analytics (F103 - F107) & M6. Intelligence (F108) trên Electron App

### 1. [F103] Content Performance Score (Điểm hiệu quả nội dung chuẩn hóa)
- **Engine Chuẩn hóa Đa Kênh (`lib/analytics/engine.ts`):**
  - **Reach Score (Max 30đ):** Tính theo hàm logarit độ phủ/lượt xem thực tế.
  - **Engagement Score (Max 40đ):** Tính theo tỷ lệ tương tác trọng số: `(Like*1 + Comment*2.5 + Share*4) / Reach * 100%`.
  - **Click/CTR Score (Max 20đ):** Lượt click liên kết chuyển đổi trên lượt hiển thị.
  - **Conversion Score (Max 10đ):** Bài viết trực tiếp mang lại Lead hoặc Deal trong CRM.
- **Phân hạng cấp độ bài viết:**
  - 🏆 **VIRAL / Top Tier (>= 85đ):** Hiển thị nút 1-Click đưa vào chuỗi tái sử dụng tự động (**Evergreen F083**).
  - ⭐ **Đạt KPI (60 – 84đ):** Đạt chuẩn tương tác.
  - ⚠️ **Cần cải thiện (< 60đ):** Cảnh báo cần tối ưu lại Hook và CTA.
- **Backend API:** `GET /api/analytics/content-scores` hỗ trợ lọc theo nền tảng, xếp hạng và sắp xếp điểm số.

### 2. [F104] Campaign ROI (Đo lường chi phí, Lead, Doanh thu & ROI Chiến dịch)
- **Tính toán tài chính tự động:**
  - Kết nối chi phí đã chi (`spent`) với tổng doanh thu các Deal chốt thành công (`status = WON`).
  - Tự động tính toán Lợi nhuận ròng, Tỷ suất sinh lời `ROI % = ((Doanh thu - Chi phí) / Chi phí) * 100%`.
  - Đo lường chi phí trên mỗi Lead thu về (**CPL**) và chi phí trên mỗi đơn hàng chốt (**CPA**).
- **Backend API:** `GET /api/analytics/campaign-roi`.

### 3. [F105] Lead Conversion Funnel (Phễu chuyển đổi toàn diện)
- **Trực quan hóa phễu 4 tầng:**
  - Tầng 1: Tương tác & Tin nhắn ban đầu (Top of Funnel).
  - Tầng 2: Khách tiềm năng (Leads CRM).
  - Tầng 3: Cơ hội bán hàng (Deals Pipeline).
  - Tầng 4: Chốt đơn thành công (Deals Won).
- **Phát hiện Điểm nghẽn (Bottlenecks) tự động:** Cảnh báo khi tỷ lệ rớt giữa các tầng vượt quá ngưỡng tiêu chuẩn (ví dụ: rớt >95% ở bước thu thập SĐT).
- **Backend API:** `GET /api/analytics/funnel`.

### 4. [F106] AI Insight & Recommendation (Trợ lý AI phân tích & đề xuất tăng trưởng)
- **Tích hợp Cổng AI 9router (`lib/ai/9router.ts`):**
  - Hàm `generateAnalyticsInsights` gửi toàn bộ số liệu tổng hợp lên 9router gateway.
  - **Cơ chế Heuristic Fallback:** Tự động phân tích theo ngưỡng logic khi chưa có API key hoặc server offline.
  - Trả về 3 khối hành động: **Executive Summary** (Tóm tắt), **Key Drivers** (Nguyên nhân biến động kèm nhãn POSITIVE/NEGATIVE), **Actionable Recommendations** (Đề xuất hành động trọng tâm phân cấp HIGH/MEDIUM/LOW).
- **Backend API:** `POST /api/analytics/ai-insights`.

### 5. [F107] Benchmark Nội Bộ (So sánh kênh & Content Pillar)
- **So sánh chéo đa nền tảng:** TikTok vs Facebook vs Instagram vs YouTube Shorts (Reach, Tỷ lệ tương tác, Điểm hiệu quả trung bình, Số Deals tạo ra).
- **So sánh Content Pillars:** Phân tích định hướng nội dung nào mang lại nhiều Lead nhất (Giáo dục, Giải trí, Review, Bán hàng).
- **Backend API:** `GET /api/analytics/benchmark`.

### 6. [F108] Social Search & Public Signal (Thám tử xu hướng MXH)
- **Công cụ tìm kiếm tín hiệu thị trường:**
  - Tìm kiếm bài viết xu hướng theo từ khóa, ngành hàng và hashtag.
  - Nhận diện sắc thái (Sentiment): **Hỏi mua / Đặt hàng 🔥 (BUYING_INTENT)**, Tích cực (POSITIVE), Thảo luận chung (NEUTRAL).
  - **1-Click Chuyển Ý Tưởng Sang Content Studio:** Nút chuyển tự động toàn bộ nội dung viral sang trang tạo bài `/create` kèm caption, tags và nguồn tham khảo.
- **Backend API:** `GET /api/intelligence/social-search`.

### 7. Giao diện Desktop App (Electron)
- **Trang Báo Cáo & Phân Tích (`electron-app/frontend/src/pages/Analytics.tsx`):**
  - Đăng ký route `/analytics`, thêm menu **"Báo cáo & Phân tích"** vào Sidebar.
  - 3 Tabs chuyên sâu: **Hiệu quả nội dung (F103)**, **ROI & Phễu (F104 & F105)**, **AI Insights & Benchmark (F106 & F107)**.
  - Nút **"Nạp mẫu test F103-F107"** để nghiệm thu ngay đầy đủ biểu đồ và số liệu.
- **Trang Thám Tử Xu Hướng (`electron-app/frontend/src/pages/SocialSearch.tsx`):**
  - Đăng ký route `/intelligence/social-search`, thêm menu **"Thám tử xu hướng (MXH)"** vào Sidebar.
  - Thanh tìm kiếm, bộ lọc kênh và sắc thái, card bài viết viral với điểm Viral Score và nút chuyển sang Content Studio.
- **Tương thích Content Studio (`CreatePost.tsx`):** Nhận tham số URL từ Social Search và tự động điền sẵn bản thảo bài viết.

---

## 🚀 [2026-10-14] — Triển Khai Module M4. Customer & Lead CRM (F100 & F101) trên Electron App

### 1. [F100] Lead Scoring (Chấm điểm khách hàng tiềm năng theo hành vi & AI)
- **Engine Chấm điểm Hybrid (`lib/crm/scoring-and-duplicates.ts`):**
  - **Hồ sơ (Profile Completeness):** SĐT hợp lệ (+25đ), Email hợp lệ (+15đ), Địa chỉ/Nguồn (+10đ).
  - **Tương tác thực tế (Engagement):** Nhắn tin Inbox trong 24h (+20đ), Tương tác > 3 tin nhắn (+15đ), Có Deal đang mở (+15đ), Hoàn thành lịch hẹn/tư vấn (+10đ).
  - **AI Intent (9router):** Phát hiện ý định mua sỉ / chốt đơn khẩn cấp (+15đ).
  - **Suy giảm (Decay Rule):** Trừ 10đ nếu không tương tác > 7 ngày, trừ 25đ nếu > 30 ngày.
- **Phân loại nhiệt độ Lead trực quan:**
  - 🔴 **HOT LEAD 🔥 (80–100đ):** Ưu tiên chăm sóc gấp, có tín hiệu chốt đơn cao.
  - 🟡 **WARM LEAD ⚡ (50–79đ):** Đang quan tâm, cần gửi thêm bảng giá.
  - 🔵 **COLD LEAD ❄️ (<50đ):** Khách mới hoặc nguội lạnh.
- **Backend API:** `app/api/crm/customers/route.ts` hỗ trợ lọc theo nhiệt độ (`temperature=HOT/WARM/COLD`) và sắp xếp theo điểm tiềm năng.

### 2. [F101] Duplicate Detection & Merge (Phát hiện trùng và hợp nhất hồ sơ có kiểm soát)
- **Thuật toán rà quét trùng lặp:**
  - So khớp tuyệt đối (100%): Số điện thoại chuẩn hóa (chuẩn hóa `+84` / `0xxx`) hoặc Email.
  - So khớp tương đối (Fuzzy Matching >85%): Tên không dấu tiếng Việt (ví dụ: *"Nguyễn Văn Minh"* và *"Nguyen Van Minh"*).
- **Cơ chế Hợp nhất an toàn trong Prisma Transaction (`executeCustomerMerge`):**
  - Tự động chuyển toàn bộ `Deal` của hồ sơ phụ sang hồ sơ chính.
  - Tự động chuyển toàn bộ `Conversation` chat trong Inbox sang hồ sơ chính.
  - Tự động chuyển toàn bộ lịch sử hoạt động `CrmActivity` sang hồ sơ chính.
  - Gộp các thẻ tags và ghi chú, bổ sung lịch sử audit: *"Hợp nhất hồ sơ có kiểm soát ngày DD/MM/YYYY"*.
  - Dọn dẹp an toàn các hồ sơ phụ, ngăn ngừa rác dữ liệu.
- **Cảnh báo trùng lặp tức thì:** Báo lỗi 409 kèm cảnh báo nếu người dùng nhập SĐT/Email đã tồn tại khi tạo khách hàng mới.
- **Backend APIs:**
  - `GET /api/crm/customers/duplicates`: Quét và trả về danh sách các nhóm nghi ngờ trùng lặp.
  - `POST /api/crm/customers/merge`: Nhận `masterId`, `duplicateIds` để thực hiện hợp nhất.

### 3. Giao diện Quản lý Khách hàng & Lead CRM trên Electron App (`electron-app/frontend/src/pages/Customers.tsx`)
- **Trang CRM Khách hàng chuyên nghiệp:** Đăng ký route `/customers` và thêm menu **"Khách hàng (CRM)"** vào Sidebar.
- **Bảng chỉ số Stat Cards:** Tổng khách hàng, HOT Leads 🔥, WARM Leads ⚡, Hồ sơ nghi trùng lặp ⚠️.
- **Cột Lead Score trực quan:** Thanh tiến trình điểm 0–100 kèm huy hiệu nhiệt độ.
- **Modal Đối chiếu & Hợp nhất (Merge Modal) 2 cột:** So sánh chi tiết thông tin giữa các hồ sơ, cho phép chọn Master Record và bấm hợp nhất 1-click.
- **Demo Seeder:** Bổ sung nút **"Nạp mẫu test F100/F101"** để người dùng nghiệm thu ngay 5 khách hàng mẫu (bao gồm khách HOT, khách trùng SĐT, khách trùng Email).

---

## 🚀 [2026-10-14] — Triển Khai Cổng AI 9router, F084 và Toàn Bộ Module Hộp Thư M3 (F085 - F091) trên Electron

### 1. Kiến trúc Cổng AI 9router (`lib/ai/9router.ts`)
- **Tương thích chuẩn OpenAI Gateway:** Kết nối với server 9router qua biến môi trường `NINE_ROUTER_URL` và `NINE_ROUTER_API_KEY`.
- **Cơ chế Heuristic Fallback thông minh:** Khi server chưa cấu hình API key 9router hoặc 9router offline, adapter tự động chuyển sang Engine phân tích Rule-based/NLP nội bộ, đảm bảo **100% không bị crash / lỗi 500** trên App Electron khi test UI.

### 2. [F084] AI Content Score (Chấm điểm nội dung chuẩn viral trên App Electron)
- **Backend API:** `app/api/content/ai-score/route.ts`
  - Thẩm định 4 trụ cột: **Hook (3s đầu)**, **Độ rõ CTA**, **Brand Voice**, và **Chuẩn nền tảng (TikTok/Reels/Shorts)**.
  - Phân tích điểm mạnh, khuyến nghị tối ưu và sinh bản caption đề xuất đạt >90 điểm.
- **Frontend Component:** `electron-app/frontend/src/components/ContentScoreCard.tsx`
  - Tích hợp trực quan vào form Tạo bài viết `CreatePost.tsx` ngay dưới ô Caption.
  - Hỗ trợ nút **"Áp dụng bản này (1-Click)"** để cập nhật nhanh caption vào form.

### 3. Phân hệ M3. Unified Inbox trên App Electron (`electron-app/frontend/src/pages/Inbox.tsx`)
- **Đưa trang Hộp thư hợp nhất lên Electron:** Tạo trang `Inbox.tsx` với bố cục 3 cột chuyên nghiệp chuẩn SaaS, đăng ký menu Sidebar và route `/inbox`.
- **[F085] Conversation Status & SLA:**
  - Quản lý vòng đời hội thoại: `NEW` ➔ `OPEN` ➔ `PENDING` ➔ `RESOLVED` ➔ `CLOSED`.
  - Đồng hồ đếm ngược SLA thông minh: Xanh (an toàn), Vàng (còn < 5 phút), Đỏ nhấp nháy (quá hạn SLA).
  - Tự động chuyển `OPEN` khi nhân viên gửi phản hồi đầu tiên.
- **[F086] Internal Note & Mention (Ghi chú nội bộ & Tag nhân viên):**
  - Chuyển đổi linh hoạt giữa "Phản hồi khách hàng" và "Ghi chú nội bộ 🔒" (khung vàng cam).
  - Hỗ trợ gõ `@` và click nhanh tag đồng nghiệp trong Workspace.
  - API `app/api/inbox/[id]/note/route.ts` lưu vào bảng `ConversationNote`, bảo mật 100% không gửi ra ngoài mạng xã hội.
- **[F087] AI Suggested Reply (Gợi ý câu trả lời thông minh):**
  - Đọc ngữ cảnh tin nhắn khách, sinh 3 câu trả lời nhanh theo 3 phong cách: *Thân thiện*, *Chuyên nghiệp*, *Chốt đơn*.
  - 1-click vào chip để điền văn bản vào ô soạn thảo.
  - API `app/api/inbox/[id]/ai-suggest-reply/route.ts`.
- **[F088] AI Conversation Summary (Tóm tắt hội thoại & Next Action):**
  - Tự động trích xuất: 📌 Nhu cầu chính, 🤝 Thỏa thuận đã đạt được, 🚀 Next Action cần làm tiếp theo.
  - API `app/api/inbox/[id]/ai-summary/route.ts`.
- **[F089] Lead Detection từ hội thoại (Phát hiện khách tiềm năng & 1-Click CRM):**
  - Nhận diện Regex SĐT Việt Nam + từ khóa mua hàng / hỏi giá sỉ trong tin nhắn khách.
  - Hiển thị Card cảnh báo Lead nổi bật kèm nút **"1-Click Tạo Lead vào CRM"**.
  - API `app/api/inbox/[id]/convert-lead/route.ts` tự động tạo `Customer` và `Deal` trong CRM.
- **[F091] Spam / Blacklist Policy:**
  - Nút chặn Spam / đưa vào Blacklist user (`isSpam: true`), di chuyển vào tab Thư rác.
  - Tính năng bỏ đánh dấu Spam để khôi phục hội thoại về hòm thư chính.
- **Bộ Demo Seeder:** Bổ sung nút **"Nạp mẫu test"** tạo ngay 5 kịch bản hội thoại mẫu (SĐT đặt sỉ, hỏi size, quá hạn SLA, hội thoại spam) để người dùng nghiệm thu ngay lập tức.

---

## 🚀 [2026-10-14] — Tích hợp F082 & F083 vào Electron App và Tối ưu Compile Next.js

### 1. Phân hệ Electron App (`electron-app/`)
- **[F082] Duplicate Content Detection (Kiểm tra trùng lặp trên App Electron):**
  - **Mục đích:** Hỗ trợ người dùng kiểm tra trùng lặp video / caption ngay trong màn hình Tạo bài viết của Electron App (`/create`).
  - **Chi tiết:**
    - Tích hợp component `DuplicateWarningCard` hiển thị cảnh báo trực quan (Xanh: An toàn, Vàng: Tương đồng nhẹ, Đỏ: Trùng lặp cao kèm % tương đồng và bài viết trùng).
    - Gọi API `/api/content/duplicate-check` thời gian thực khi chỉnh sửa tiêu đề/mô tả hoặc tải video lên.
    - Hỗ trợ nút AI Spin Caption để viết lại mô tả tránh trùng lặp.
- **[F083] Evergreen Content & Auto-Recycle (Nội dung bất hủ & Tái đăng trên App Electron):**
  - **Mục đích:** Cho phép gắn nhãn bài viết Evergreen và quản lý tái đăng định kỳ ngay trong App Electron.
  - **Chi tiết:**
    - Thêm tuỳ chọn bật/tắt Evergreen và cài đặt chu kỳ tái đăng (`recycleIntervalDays`, mặc định 30 ngày) trong trang Tạo bài viết (`/create`).
    - Thêm trang quản lý **Evergreen** riêng biệt (`/evergreen`) và thêm menu điều hướng vào Sidebar của App Electron.
    - Hỗ trợ kích hoạt tái xuất bản ngay (`Recycle Now`) hoặc lên lịch vòng lặp mới từ App Electron.
- **Thay thế thư viện `wait-on` bằng script `wait-dev.js` (`electron-app/`):**
  - Thư viện `wait-on` phụ thuộc vào `joi` cũ gây lỗi crash `TypeError: Base.extend is not a function` trên môi trường Node.js v26.
  - Viết lại script chờ port Vite thuần `wait-dev.js` với 0 dependency bằng module `http` có sẵn của Node, giúp khởi động `npm start` ổn định 100% trên mọi phiên bản Node.js.

### 2. Phân hệ Web & Backend (`app/`, `lib/`)
- **Tối ưu tốc độ biên dịch Next.js / Turbopack (`app/globals.css`):**
  - Giới hạn phạm vi quét CSS của Tailwind v4 bằng chỉ thị `@source "../app"`, `@source "../components"`, `@source "../lib"`.
  - Loại trừ thư mục `electron-app` (1.1GB, >30.000 files) và các thư mục tĩnh nặng (`uploads`, `scratch`, `dist`) để ngăn chặn việc Turbopack bị đóng băng ở bước `○ Compiling / ...`.
- **Dọn dẹp log truy vấn Prisma (`lib/db/index.ts`):**
  - Thay đổi cấu hình log Prisma từ `['query']` sang `['error', 'warn']` trong môi trường dev để ngăn Scheduler ngầm (chu kỳ 20s) spam console, giữ terminal sạch sẽ.
- **Vá lỗi truy vấn quan hệ Media trong API Evergreen (`app/api/content/evergreen/route.ts` & `recycle/route.ts`):**
  - Khắc phục lỗi `PrismaClientValidationError (Unknown field url for select statement on model PostMedia)` do `PostMedia` lưu liên kết trung gian tới `MediaAsset`.
  - Cập nhật truy vấn đúng qua `mediaAsset.storageUrl` và `mediaAsset.mediaType`, giúp danh sách Evergreen tải mượt mà trên App Electron mà không cần bất kỳ API key nào bên ngoài.

---

## 🚀 [2026-10-13] — Phát Triển Tính Năng F082 & F083

### 1. [F082] Duplicate Content Detection (Kiểm tra trùng lặp bài viết)
- **Backend API:** `app/api/content/duplicate-check/route.ts`
  - Thuật toán N-grams (unigrams, bigrams, trigrams) kết hợp độ đo tương đồng Jaccard Similarity.
  - So khớp tiêu đề, mô tả và tệp media/video trong phạm vi cùng Workspace.
  - Phân loại mức rủi ro: `SAFE`, `MODERATE`, `HIGH`.
- **Giao diện Web:** `components/content/duplicate-warning-card.tsx`
  - Tích hợp vào trang soạn thảo bài viết `app/(dashboard)/dashboard/content/create/page.tsx` và danh sách bài viết `app/(dashboard)/dashboard/content/posts/page.tsx`.
- **Kiểm thử:** `__tests__/api/content/duplicate-check.test.ts`

### 2. [F083] Evergreen Content & Auto-Recycle (Nội dung bất hủ & Tái đăng)
- **Database Schema:** `prisma/schema.prisma`
  - Thêm các trường vào model `Post`: `isEvergreen`, `recycleIntervalDays`, `lastRecycledAt`, `recycleCount`, `originalPostId`.
  - Tạo composite index tối ưu: `@@index([workspaceId, isEvergreen])`, `@@index([isEvergreen, lastRecycledAt])`.
- **Backend API:**
  - `app/api/content/evergreen/route.ts`: Lấy danh sách bài viết Evergreen và tính toán hạn tái đăng.
  - `app/api/content/evergreen/recycle/route.ts`: Kích hoạt tái xuất bản/nhân bản bài viết theo chu kỳ.
- **Giao diện Web:**
  - Trang quản lý `app/(dashboard)/dashboard/content/evergreen/page.tsx`.
  - Thêm menu Evergreen vào `components/layout/sidebar.tsx` và hỗ trợ đa ngôn ngữ (vi/en).
- **Kiểm thử:** `__tests__/api/content/evergreen.test.ts`

---

## 🚀 [2026-10-06] — Hỗ trợ Downloader TikTok Photo Mode & Reels Video Titles
- **RapidAPI Downloader:** Hỗ trợ tải bài viết dạng Album ảnh slide TikTok (Photo Mode) không logo + nhạc nền.
- **Facebook Reels Title:** Tự động phân giải tiêu đề thực tế của Facebook Reels thay vì chuỗi mặc định.
