# 📋 Topify — Nhật Ký Cập Nhật & Phát Triển (Update Log)

Tài liệu này lưu trữ toàn bộ các thay đổi, tính năng mới, bản vá lỗi và tối ưu hóa hệ thống qua từng phiên bản của dự án Topify (Bao gồm cả Web Dashboard, Backend API và Electron Desktop App).

> 💡 **Kế hoạch & Bảng Test Case chi tiết cho từng Module:** Xem tại [TEST_CASES.md](file:///Users/tiodev/Desktop/Topify/TEST_CASES.md)

---

## 📌 Hướng dẫn cập nhật tài liệu
Mỗi khi có tính năng mới hoặc thay đổi mã nguồn quan trọng:
1. Thêm một mục mới ở trên cùng với ngày tháng và phiên bản.
2. Nêu rõ phân hệ: `[Backend]`, `[Web Dashboard]`, `[Electron App]`, hoặc `[Database]`.
3. Mô tả ngắn gọn: Vấn đề giải quyết, giải pháp kỹ thuật, danh sách file thay đổi và cách test.

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
