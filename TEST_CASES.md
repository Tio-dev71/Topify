# 🧪 Topify — Kế Hoạch & Ma Trận Kiểm Thử Chi Tiết (Test Cases Matrix)

> **Tài liệu này lưu trữ danh sách toàn bộ các Test Case cho từng Module tính năng của Topify** (Tập trung chính vào Electron Desktop App và API Backend Next.js).  
> Người dùng và đội ngũ phát triển có thể dùng tài liệu này làm bảng checklist khi nghiệm thu tính năng (`[ ]` Chưa test, `[x]` Đã pass, `[!]` Cần fix).

---

## 📑 Danh Mục Modules (Roadmap)

| Mã Module | Module Phân Hệ | Tên tính năng | Tóm tắt chức năng | Cổng AI (9router) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **[F015](#f015---spin-nội-dung--spintax-parser-tự-sinh-biến-thể-caption-chống-trùng-lặp--spam)** | M2. Content Studio | Spin Nội Dung & Spintax Parser | Tự động sinh 3-8 biến thể caption, đo lường % Uniqueness, bung Spintax {A\|B\|C} | Hỗ trợ Spin & AI | ✅ Đã sẵn sàng test |
| **[F016](#f016---trợ-lý-ai-viết-caption--kịch-bản-theo-ngành-hàng--tone-giọng)** | M2. Content Studio | AI Writer by Industry & Tone | Viết caption/kịch bản TikTok 10 ngành hàng, 6 tone giọng, xem trước Storyboard | 🤖 9router | ✅ Đã sẵn sàng test |
| **[F019](#f019---import-bài-từ-google-drive--excel)** | M2. Content Studio | Import từ Excel / Google Drive | Nhập bài hàng loạt từ .xlsx, .csv, Google Drive, preview & inline edit, lên lịch tự động | Không dùng | ✅ Đã sẵn sàng test |
| **[F022](#f022---đăng-ngẫu-nhiên-giờ-trong-khung-random-time-window)** | M2. Content Studio | Đăng ngẫu nhiên giờ trong khung | Random Time Window, 4 preset khung giờ vàng, live preview, rải lịch video | Không dùng | ✅ Đã sẵn sàng test |
| **[F050](#f050---so-sánh-hiệu-suất-theo-khoảng-thời-gian-period-comparison)** | M5. Analytics | So sánh hiệu suất theo khoảng thời gian | Checkbox so sánh kỳ trước (MoM / WoW / YoY), % tăng trưởng, biểu đồ 2 đường nét liền/đứt | Analytics Engine | ✅ Đã sẵn sàng test |
| **[F082](#f082---duplicate-content-detection-kiểm-tra-trùng-lặp-nội-dung)** | M2. Content Studio | Duplicate Content Detection | Phát hiện trùng lặp tiêu đề, caption, media | Hỗ trợ Spin | ✅ Đã sẵn sàng test |
| **[F083](#f083---evergreen-content--auto-recycle-nội-dung-bất-hủ--tái-đăng)** | M2. Content Studio | Evergreen Content & Auto-Recycle | Quản lý bài viết bất hủ & Tái bản định kỳ | Hỗ trợ Spin | ✅ Đã sẵn sàng test |
| **[F084](#f084---ai-content-score-chấm-điểm-nội-dung-chuẩn-viral)** | M2. Content Studio | AI Content Score | Chấm điểm Hook, độ rõ CTA, Brand Voice, Nền tảng | 🤖 9router | ✅ Đã sẵn sàng test |
| **[F085](#f085---conversation-status--sla-trạng-thái-hội-thoại--hạn-phản-hồi)** | M3. Unified Inbox | Conversation Status & SLA | New / Open / Pending / Resolved + Hạn SLA phản hồi | Không dùng | ✅ Đã sẵn sàng test |
| **[F086](#f086---internal-note--mention-ghi-chú-nội-bộ--tag-nhân-viên)** | M3. Unified Inbox | Internal Note & Mention | Ghi chú nội bộ vàng/xám & @mention nhân viên | Không dùng | ✅ Đã sẵn sàng test |
| **[F087](#f087---ai-suggested-reply-gợi-ý-câu-trả-lời-thông-minh)** | M3. Unified Inbox | AI Suggested Reply | Đề xuất 2-3 câu trả lời dựa trên lịch sử & Brand Voice | 🤖 9router | ✅ Đã sẵn sàng test |
| **[F088](#f088---ai-conversation-summary-tóm-tắt-hội-thoại--next-action)** | M3. Unified Inbox | AI Conversation Summary | Tóm tắt hội thoại dài & đề xuất hành động tiếp theo | 🤖 9router | ✅ Đã sẵn sàng test |
| **[F089](#f089---lead-detection-từ-hội-thoại-phát-hiện-khách-tiềm-năng)** | M3. Unified Inbox | Lead Detection từ hội thoại | Phát hiện tín hiệu mua hàng & 1-click tạo Lead CRM | 🤖 9router | ✅ Đã sẵn sàng test |
| **[F091](#f091---spamblacklist-chặn-spam--danh-sách-đen)** | M3. Unified Inbox | Spam/Blacklist Policy | Chặn spam, blacklist user / keyword theo policy | Rule / AI | ✅ Đã sẵn sàng test |
| **[F100](#f100---lead-scoring-chấm-điểm-khách-hàng-tiềm-năng)** | M4. Customer & Lead CRM | Lead Scoring | Chấm điểm lead theo hành vi / tương tác / quy tắc | 🤖 9router + Rule | 📋 Đã lên Test Plan |
| **[F101](#f101---duplicate-detection--merge-phát-hiện-trùng--hợp-nhất-hồ-sơ)** | M4. Customer & Lead CRM | Duplicate Detection & Merge | Phát hiện trùng và hợp nhất hồ sơ có kiểm soát | Thuật toán + Fuzzy | 📋 Đã lên Test Plan |
| **[F110](#f110---trending--viral-content-detection-nội-dung-thịnh-hành--bùng-nổ)** | M6. Intelligence | Trending & Viral Velocity | Đo lường vận tốc bùng nổ (Velocity) & 1-click Remix | Thuật toán Velocity | ✅ Đã sẵn sàng test |
| **[F112](#f112---keyword--viral-alert-cảnh-báo-ngưỡng-viral--từ-khóa)** | M6. Intelligence | Keyword & Viral Alert | Quy tắc cảnh báo ngưỡng điểm viral & In-App notification | Rule Engine | ✅ Đã sẵn sàng test |
| **[F113](#f113---resize-đa-nền-tảng-multi-aspect-ratio-video--image)** | M7. Media Studio | Multi-Aspect Ratio Resize | Resize 9:16, 1:1, 16:9, 4:5 kèm Fit Blur / Center Crop | Web Canvas / Studio | ✅ Đã sẵn sàng test |
| **[F114](#f114---repurpose-video-trích-xuất-clip-ngắn-viral)** | M7. Media Studio | Video Repurpose Highlights | Cắt video dài thành clip 30s-60s kèm Hook 3s & Viral Score | 🤖 9router | ✅ Đã sẵn sàng test |
| **[F115](#f115---auto-subtitles-tạo-phụ-đề-tự-động)** | M7. Media Studio | Auto Subtitles & Cue Editor | Sinh phụ đề WebVTT/SRT chuẩn timestamp & kiểu chữ TikTok | 🤖 9router | ✅ Đã sẵn sàng test |
| **[F062](#f062---thanh-toán--gia-hạn-cổng-sepay-vietqr)** | M8. Workspace & Admin | Thanh toán & Gia hạn SePay VietQR | Cổng VietQR tự động, chiết khấu chu kỳ, cộng dồn hạn dùng, cảnh báo & ân hạn 3 ngày | Cổng SePay VietQR | ✅ Đã sẵn sàng test |
| **[F117](#f117---invitation--seat-management-quản-lý-ghế-ngồi--lời-mời)** | M8. Workspace & Admin | Seat Limit & Invites | Kiểm soát hạn mức số ghế, quản lý lời mời & Quota Guard | Quota Engine | ✅ Đã sẵn sàng test |
| **[F118](#f118---usage-metering--quota-định-mức-sử-dụng-tài-nguyên)** | M8. Workspace & Admin | Usage Metering | Đo lường mức sử dụng Channels, Posts, AI Credits, Storage | Quota Engine | ✅ Đã sẵn sàng test |
| **[F119](#f119---trial-upgrade--downgrade-dùng-thử--chuyển-gói-bù-trừ)** | M8. Workspace & Admin | Trial & Prorated Billing | Dùng thử 14 ngày & tính toán chi phí bù trừ khi chuyển gói | Billing Engine | ✅ Đã sẵn sàng test |
| **[F120](#f120---billing-history--invoice-lịch-sử-thanh-toán--hóa-đơn)** | M8. Workspace & Admin | Billing History & Invoices | Bảng biên lai điện tử & tải hóa đơn VAT | Billing Engine | ✅ Đã sẵn sàng test |
| **[F121](#f121---data-export--account-deletion-xuất-dữ-liệu--xóa-an-toàn)** | M8. Workspace & Admin | Data Export & Grace Deletion | Xuất ZIP toàn bộ dữ liệu & xóa an toàn 30 ngày ân hạn | Backup Engine | ✅ Đã sẵn sàng test |
| **[F124](#f124---assignee--collaborator-người-phụ-trách-chính--phối-hợp)** | M9. Work & Task | Assignee / Collaborator | Gán người phụ trách chính & người phối hợp, lọc thành viên | Không dùng | ✅ Đã sẵn sàng test |
| **[F128](#f128---comment--attachment--mention-trao-đổi-tệp-đính-kèm--nhắc-tên)** | M9. Work & Task | Comment / Attachment / Mention | Trao đổi trong task, tệp đính kèm và nhắc tên @mention | Không dùng | ✅ Đã sẵn sàng test |
| **[F129](#f129---recurring-task-công-việc-lặp-định-kỳ-tự-động)** | M9. Work & Task | Recurring Task | Lặp Daily, Weekly, Biweekly, Monthly & tự động gia hạn | Rule Engine | ✅ Đã sẵn sàng test |
| **[F130](#f130---task-template-thư-viện-mẫu-quy-trình-chuẩn-hóa)** | M9. Work & Task | Standardized Task Templates | 4 mẫu quy trình (Content, CSKH, Campaign, Onboarding) | Không dùng | ✅ Đã sẵn sàng test |
| **[F131](#f131---workload--productivity-khối-lượng-việc--năng-suất)** | M9. Work & Task | Workload & Productivity | Đo lường tỷ lệ đúng hạn, điểm năng suất & cảnh báo quá tải | Analytics Engine | ✅ Đã sẵn sàng test |
| **[F133](#f133---objective--kpi-mục-tiêu--chỉ-tiêu-chiến-dịch)** | M10. Campaign | Objective & KPI | Định nghĩa mục tiêu chiến dịch & theo dõi KPI định lượng | Analytics Engine | ✅ Đã sẵn sàng test |
| **[F134](#f134---budget-ngân-sách-kế-hoạch--thực-tế-chiến-dịch)** | M10. Campaign | Budget & Burn Rate | Phân bổ ngân sách 4 nhóm, cảnh báo tiêu hao Burn Rate | Financial Engine | ✅ Đã sẵn sàng test |
| **[F135](#f135---channel--content-plan-kênh--kế-hoạch-nội-dung)** | M10. Campaign | Channel & Content Plan | Gắn 5 kênh phân phối và lập kế hoạch theo 4 giai đoạn | Planner Engine | ✅ Đã sẵn sàng test |
| **[F137](#f137---asset--approval-kho-tài-nguyên--phê-duyệt)** | M10. Campaign | Asset & Approval Flow | Kho lưu trữ Creative Assets & luồng duyệt 2 cấp | Workflow Engine | ✅ Đã sẵn sàng test |
| **[F138](#f138---progress-dashboard-bảng-tiến-độ-hợp-nhất-4-trục)** | M10. Campaign | 4-Axis Progress Dashboard | Tiến độ Content, Task (M9), KPI và Ngân sách | Analytics Engine | ✅ Đã sẵn sàng test |
| **[F139](#f139---campaign-report--roi-báo-cáo-tổng-kết--đo-lường-roi)** | M10. Campaign | Campaign Report & ROI | Đo lường ROI %, ROAS, CPL, CPA, rating và xuất PDF | Financial Engine | ✅ Đã sẵn sàng test |
| **[F141](#f141---trigger-engine-nguồn-kích-hoạt-tự-động)** | M11. Automation | Multi-Source Trigger | Đa nguồn: Comment, Message, Lead, Time (Cron), Webhook | Event Engine | ✅ Đã sẵn sàng test |
| **[F142](#f142---condition-builder-bộ-lọc-điều-kiện-thông-minh)** | M11. Automation | Condition Builder | Điều kiện lọc theo keyword, tag, source, status, time | Rule Engine | ✅ Đã sẵn sàng test |
| **[F143](#f143---action-engine-chuỗi-hành-động-liên-phân-hệ)** | M11. Automation | Cross-Module Actions | Gửi tin nhắn, gắn tag CRM, tạo Lead, tạo Task M9, Assign, Notify | Workflow Engine | ✅ Đã sẵn sàng test |
| **[F144](#f144---execution-log--retry-nhật-ký-thực-thi--thử-lại)** | M11. Automation | Execution Log & Retry | Nhật ký thực thi, phân tích lỗi, nút Retry và Idempotency key | Observability | ✅ Đã sẵn sàng test |
| **[F145](#f145---automation-template-thư-viện-mẫu-quy-trình-1-click)** | M11. Automation | Automation Templates | Bộ 5 kịch bản mẫu CSKH, Marketing, Lead và 1-click áp dụng | Template Engine | ✅ Đã sẵn sàng test |
| **[F146](#f146---multi-tier-balance--auto-currency-số-dư-3-cấp--quy-đổi-ngoại-tệ)** | M12. Wallet & Earnings | Multi-Tier Balance & Currency | Số dư Khả dụng, Chờ xử lý, Đã rút & Tự động quy đổi USD/VND | Financial Engine | ✅ Đã sẵn sàng test |
| **[F147](#f147---transaction-history--ledger-lịch-sử-giao-dịch--sổ-cái-biến-động)** | M12. Wallet & Earnings | Transaction History & Ledger | Sổ cái biến động số dư theo thời gian thực (+/- tiền) | Financial Engine | ✅ Đã sẵn sàng test |
| **[F148](#f148---withdrawal-request--limit-guard-lập-lệnh-rút-tiền--kiểm-duyệt-hạn-mức)** | M12. Wallet & Earnings | Withdrawal Request & Limits | Lập lệnh rút tiền, kiểm soát hạn mức tối thiểu & duyệt tự động | Financial & Security | ✅ Đã sẵn sàng test |
| **[F149](#f149---payment-methods-management-quản-lý-tài-khoản-nhận-tiền-đa-kênh)** | M12. Wallet & Earnings | Payment Methods Management | Quản lý tài khoản nhận tiền: VietQR, Momo, PayPal, Crypto | Payment Engine | ✅ Đã sẵn sàng test |
| **[F150](#f150---earning-tasks--direct-claim-nhiệm-vụ-kiếm-tiền--nhận-thưởng-trực-tiếp)** | M12. Wallet & Earnings | Earning Tasks & Direct Claim | Nhiệm vụ kiếm tiền cộng đồng, thanh tiến độ & nhận thưởng ví | Gamification Engine | ✅ Đã sẵn sàng test |
| **[F151](#f151---referral-link-code--qr-generator-link-tiếp-thị-mã-mời--sinh-mã-qr)** | M13. Referral & Growth | Referral Link, Code & QR | Link giới thiệu độc quyền, mã mời cá nhân hóa & tải mã QR | Growth Engine | ✅ Đã sẵn sàng test |
| **[F152](#f152---4-tier-tracking-funnel-phễu-theo-dõi-tiếp-thị-4-tầng)** | M13. Referral & Growth | 4-Tier Tracking Funnel | Phễu chuyển đổi 4 tầng: Clicks, Signups, Paid, Active | Analytics Engine | ✅ Đã sẵn sàng test |
| **[F153](#f153---commission-rules--tiering-chính-sách-hoa-hồng-đa-tầng)** | M13. Referral & Growth | Commission Rules & Tiering | Chính sách hoa hồng đa tầng 15% - 25% theo gói dịch vụ | Financial Engine | ✅ Đã sẵn sàng test |
| **[F154](#f154---commission-settlement--audit-đối-soát-hoa-hồng--sổ-đối-chiếu-minh-bạch)** | M13. Referral & Growth | Commission Settlement & Audit | Đối soát hoa hồng, lịch sử thanh toán & sổ đối chiếu minh bạch | Financial Engine | ✅ Đã sẵn sàng test |
| **[F155](#f155---anti-fraud-inspection-hệ-thống-kiểm-toán--chống-gian-lận-tự-động)** | M13. Referral & Growth | Anti-Fraud Inspection | Phát hiện gian lận tự giới thiệu, chung thiết bị & spam clone | Security & Anti-Fraud | ✅ Đã sẵn sàng test |
| **[F156](#f156---ai-chat-assistant-trợ-lý-ai-đa-năng--4-personas)** | M14. Topify AI | AI Chat Assistant | Trợ lý đàm thoại đa năng, 4 Persona, quản lý phiên chat | 🤖 9router | ✅ Đã sẵn sàng test |
| **[F157](#f157---ai-content-generator-sinh-kịch-bản-video-tiêu-đề--caption)** | M14. Topify AI | AI Content Generator | Kịch bản TikTok Hook/Body/CTA, 5 Tiêu đề viral, Caption AIDA/PAS/BAB | 🤖 9router | ✅ Đã sẵn sàng test |
| **[F158](#f158---ai-image-generation-studio-tạo-ảnh-ai--mockup)** | M14. Topify AI | AI Image Studio | *(Đã gỡ bỏ khỏi giao diện Studio theo yêu cầu người dùng)* | 🤖 9router | 🚫 Đã gỡ bỏ |
| **[F159](#f159---ai-video-generation--storyboard-kịch-bản-phân-cảnh-video)** | M14. Topify AI | Video & Storyboard | *(Đã gỡ bỏ khỏi giao diện Studio theo yêu cầu người dùng)* | 🤖 9router | 🚫 Đã gỡ bỏ |
| **[F160](#f160---ai-voice--audio-tts-studio-lồng-tiếng-ai-đa-ngữ-điệu)** | M14. Topify AI | AI Voice TTS Studio | Text-to-Speech đa giọng Việt/Anh, nam/nữ, 4 ngữ điệu & Audio Player | 🤖 9router | ✅ Đã sẵn sàng test |
| **[F161](#f161---ai-content-repurposing-engine-tái-chế-nội-dung-đa-kênh)** | M14. Topify AI | Content Repurposing | Tái chế 1 bài dài thành 2 clip ngắn, 1 Thread, 1 Email & 3 Quotes | 🤖 9router | ✅ Đã sẵn sàng test |
| **[F162](#f162---ai-model-switching--routing-gateway-định-tuyến-mô-hình-ai)** | M14. Topify AI | Model Routing & Gateway | Chuyển đổi 5 model AI, đo độ trễ ms, giám sát credit & fallback heuristic | 🤖 9router | ✅ Đã sẵn sàng test |
| **[F163](#f163---two-factor-authentication-xác-thực-hai-yếu-tố-2fa-totp)** | M15. Security & Integrations | 2FA TOTP Authentication | Xác thực 2FA TOTP Authenticator, QR code & 8 mã khôi phục khẩn cấp | Security Engine | ✅ Đã sẵn sàng test |
| **[F164](#f164---role-based-access-control-ma-trận-phân-quyền-rbac)** | M15. Security & Integrations | Role-Based Access Control | Phân quyền 4 vai trò Owner, Admin, Editor, Viewer & toggles quyền | Security Engine | ✅ Đã sẵn sàng test |
| **[F165](#f165---api-keys-management-quản-lý-khóa-api-nhà-phát-triển)** | M15. Security & Integrations | API Keys Management | Tạo API key theo scope, dải IP Whitelist, Rate limit & thu hồi tức thì | Developer Platform | ✅ Đã sẵn sàng test |
| **[F166](#f166---webhook-subscriptions-đăng-ký--kiểm-thử-webhooks)** | M15. Security & Integrations | Webhook Subscriptions | Đăng ký Webhook endpoint, HMAC signing secret, Test ping & delivery log | Developer Platform | ✅ Đã sẵn sàng test |
| **[F167](#f167---cloud-storage-integrations-lưu-trữ-đám-mây-đa-nhà-cung-cấp)** | M15. Security & Integrations | Cloud Storage Integrations | Kết nối AWS S3, Cloudflare R2, Google Drive, kiểm tra ping & default | Storage Engine | ✅ Đã sẵn sàng test |
| **[F168](#f168---crm--marketing-integrations-tích-hợp-crm-và-tự-động-hóa)** | M15. Security & Integrations | CRM & Marketing Integrations | Tích hợp 2 chiều HubSpot, Mailchimp, Zapier, Google Sheets cho leads/orders | Integrations Hub | ✅ Đã sẵn sàng test |
| **[F169](#f169---security-audit-log-sổ-kiểm-toán-bảo-mật-iso-27001soc-2)** | M15. Security & Integrations | Security Audit Log & Export | Sổ kiểm toán bảo mật, lọc hành vi, xuất báo cáo CSV chuẩn ISO/SOC2 | Compliance & Audit | ✅ Đã sẵn sàng test |
| **[F170](#f170---ip-whitelisting--session-management-quản-lý-phiên--ip-tin-cậy)** | M15. Security & Integrations | Sessions & IP Whitelisting | Quản lý phiên đăng nhập thiết bị, đăng xuất từ xa & dải IP tin cậy | Security & Access | ✅ Đã sẵn sàng test |


---

## 🤖 Kiến Trúc Tích Hợp AI Gateway (9router)

Hệ thống thiết kế một lớp Adapter chuẩn hóa duy nhất (`lib/ai/9router.ts` hoặc `/api/ai/*`) tương thích với **9router**:
* **Chuẩn giao tiếp:** OpenAI Chat Completions API (`POST https://<9router-domain>/v1/chat/completions`).
* **Header xác thực:** `Authorization: Bearer ${NINE_ROUTER_API_KEY}`.
* **Cơ chế Fallback Heuristic:** Trong khi server chưa gán key 9router thật, API trả về kết quả phân tích theo Rule-based Heuristic thông minh để UI và các luồng nghiệp vụ trên Electron App hoạt động mượt mà không crash.
* **Format phản hồi:** Luôn trả về định dạng JSON có cấu trúc (`json_object` hoặc schema cố định) để Frontend parse trực tiếp.

## [F015] - Spin Nội Dung & Spintax Parser (Tự sinh biến thể caption chống trùng lặp & spam)

* **Mục tiêu:** Cung cấp công nghệ xử lý ngôn ngữ và phân tích cú pháp Spintax (`{A|B|C}`) cho phép tạo hàng loạt biến thể bài viết tự động (từ 3 đến 8 biến thể), tính toán chỉ số độc nhất % Uniqueness (Levenshtein Distance) để ngăn chặn hoàn toàn việc các nền tảng mạng xã hội bóp tương tác do spam nội dung trùng lặp.
* **Môi trường test:** Electron App (Trang Studio Nội Dung `#/content-studio`, Modal Spin trên trang Tạo bài viết `#/create`, Modal Tái đăng trên `#/evergreen`) & API Backend (`/api/content-studio/spin`, `/api/ai/spin-caption`).

### 📋 Bảng Test Cases F015

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F015-01** | Tạo tự động 3 biến thể từ Caption gốc | 1. Mở trang `#/content-studio` -> Chọn tab **"Spin Nội Dung Chống Spam"**.<br>2. Dán một bài viết gốc vào ô nhập liệu.<br>3. Chọn số lượng biến thể = `3 bản`.<br>4. Nhấp nút **"Tự Động Sinh 3 Biến Thể"**. | Caption: *"Topify là phần mềm tự động hóa marketing đa kênh hàng đầu cho nhà bán hàng..."* | • Nút hiển thị spinner loading.<br>• Trả về chính xác 3 biến thể với tiêu đề, hook mở đầu và thân bài được viết lại.<br>• Hiển thị huy hiệu độ độc nhất trung bình (Ví dụ: `Độ độc nhất: 84%`). | [x] Đã pass |
| **TC-F015-02** | Phân tích và giải mã cú pháp Spintax lồng nhau `{A\|B\|C}` | 1. Tại khung **"Trình Thử Nghiệm Spintax"**.<br>2. Nhập chuỗi spintax có chứa cấu trúc lồng nhau.<br>3. Nhấp nút **"Bung thử Spintax"**. | Chuỗi: `"{Xin chào\|Hi cả nhà}, Topify {bật mí\|chia sẻ} {tuyệt chiêu\|bí quyết} này nhé!"` | • Hệ thống phân tích không lỗi.<br>• Tính toán tổng số kết hợp ngẫu nhiên có thể tạo (2 x 2 x 2 = 8 tổ hợp).<br>• Hiển thị 1 bản mẫu bung ngẫu nhiên hoàn chỉnh. | [x] Đã pass |
| **TC-F015-03** | Mở Modal Spin trực tiếp từ ô Caption trên màn hình Tạo bài viết (`/create`) | 1. Mở trang Tạo bài viết `#/create`.<br>2. Nhập một caption bất kỳ vào ô nhập mô tả.<br>3. Nhấp vào nút **"Spin biến thể (F015)"** trên nhãn Caption. | Caption có sẵn trong form bài viết. | • Modal `SpinModal` bật lên với hiệu ứng trượt mượt mà.<br>• Tự động điền trước nội dung caption hiện tại vào ô gốc.<br>• Cho phép chọn số lượng biến thể (3, 5, 8 bản). | [x] Đã pass |
| **TC-F015-04** | Áp dụng 1 biến thể chọn lọc vào bài viết đơn | 1. Trong `SpinModal`, sinh xong danh sách biến thể.<br>2. Chọn biến thể #2 và nhấp nút **"Dùng bản này"**. | Biến thể #2 | • Modal tự đóng lại.<br>• Nội dung Caption của video được cập nhật ngay lập tức bằng nội dung của biến thể #2.<br>• Toast thông báo thành công. | [x] Đã pass |
| **TC-F015-05** | Phân bổ hàng loạt biến thể cho nhiều video (Bulk Distribute) | 1. Tải lên 3 tệp video trên trang `#/create`.<br>2. Mở `SpinModal` và sinh 3 hoặc 5 biến thể.<br>3. Nhấp nút **"Phân bổ đều cho cả 3 video"**. | 3 Video upload, 3 Biến thể spin | • Hệ thống gán tuần tự từng biến thể độc nhất cho Video #1, Video #2 và Video #3.<br>• Cả 3 video đều có caption khác biệt hoàn toàn, chống spam đa kênh. | [x] Đã pass |
| **TC-F015-06** | Sao chép biến thể vào bộ nhớ tạm (Clipboard) | 1. Nhấp icon Copy bên cạnh mỗi thẻ biến thể. | Click nút Copy | • Icon chuyển sang dấu tick xanh `Check` trong 2s.<br>• Nội dung copy được dán chính xác vào Clipboard.<br>• Toast hiển thị *"Đã sao chép biến thể!"*. | [x] Đã pass |
| **TC-F015-07** | Mở Popup Spin Modal từ Studio Nội Dung (`#/content-studio`) và sinh 3, 5, 8 biến thể độc nhất | 1. Mở trang `#/content-studio`.<br>2. Bấm nút **"Mở Popup Spin (F015)"** trên banner hoặc trong tab Spin.<br>3. Nhập caption gốc: *"Bản nhạc đình đám của BTS"*.<br>4. Lần lượt chọn 3 bản, 5 bản, 8 bản và bấm **"Sinh X Biến Thể Độc Nhất"**. | Caption: *"Bản nhạc đình đám của BTS"*, số lượng: 3, 5, 8 bản | • Popup Modal mở đúng giao diện SO9 Engine F015.<br>• Sinh chính xác 3, 5, 8 biến thể không trùng lặp, độ độc nhất >= 75%.<br>• Hiển thị danh sách kết quả, hook, hashtag và nút Áp dụng/Sao chép đầy đủ. | [x] Đã pass |
| **TC-F015-08** | Phân tích cú pháp Spintax `{A\|B\|C}` trong tab Spintax của Popup Modal | 1. Trong popup Spin Modal, chuyển sang tab **"Phân tích cú pháp Spintax {A\|B\|C}"**.<br>2. Nhập cú pháp `{A\|B\|C}` hoặc `{Xin chào\|Hi cả nhà} các bạn {thân mến\|yêu quý}`.<br>3. Bấm nút **"Bung Thử Spintax"**. | Cú pháp Spintax `{A\|B\|C}` | • Phân tích chính xác số tổ hợp (3 tổ hợp hoặc 4 tổ hợp).<br>• Hiển thị mẫu bung ngẫu nhiên hợp lệ không còn dấu ngoặc nhọn.<br>• Có nút "Dùng mẫu này cho bài viết" hoạt động chính xác. | [x] Đã pass |
| **TC-F015-09** | Cơ chế Offline Fallback & Dev Proxy Resilience (Chống lỗi 'Có lỗi xảy ra khi spin biến thể') | 1. Mở ứng dụng Desktop khi mạng chập chờn hoặc không chạy Next.js cục bộ.<br>2. Nhập caption và bấm sinh biến thể hoặc bung thử Spintax. | Môi trường offline hoặc dev proxy | • Hệ thống tự động kích hoạt bộ sinh dự phòng cục bộ `spinEngine.ts` với đầy đủ từ đồng nghĩa, hook, CTA và tính toán % Uniqueness.<br>• 100% không báo lỗi "Có lỗi xảy ra khi spin biến thể", đảm bảo trải nghiệm người dùng liền mạch. | [x] Đã pass |

---

## [F016] - Trợ Lý AI Viết Caption / Kịch Bản Theo Ngành Hàng & Tone Giọng

* **Mục tiêu:** Tích hợp mô hình AI ngôn ngữ (kết nối cổng 9router với fallback heuristic chuyên gia) để tự động sáng tạo nội dung tiếp thị đỉnh cao: Kịch bản video ngắn (TikTok, Reels, Shorts) theo phân cảnh dọc 9:16 có góc máy & lời thoại, Caption bán hàng chuẩn SEO, Bài viết Storytelling dài theo 10 ngành hàng và 6 tone giọng tùy biến.
* **Môi trường test:** Electron App (Trang Studio Nội Dung `#/content-studio`, Modal AI Writer trên `#/create`) & API Backend (`/api/content-studio/ai-writer`).

### 📋 Bảng Test Cases F016

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F016-01** | Viết Kịch bản Video ngắn TikTok chuẩn 10 ngành hàng & 6 tone giọng | 1. Mở trang `#/content-studio` tab **"Trợ Lý AI Viết Caption / Kịch Bản"**.<br>2. Chọn Ngành hàng: *"Mỹ phẩm & Làm đẹp"*.<br>3. Chọn Tone: *"Hài hước & Bắt trend"*.<br>4. Chọn Định dạng: *"Kịch bản Video ngắn (TikTok/Reels)"*.<br>5. Nhập chủ đề: *"3 Sai lầm rửa mặt khiến da nổi mụn"*.<br>6. Bấm nút **"Sinh Bài Viết Với AI"**. | Ngành: BEAUTY, Tone: HUMOROUS, Format: SHORT_VIDEO_SCRIPT | • Sinh Tiêu đề Viral giật tít bắt trend.<br>• Phân cảnh video rõ ràng (Khung hình 9:16) gồm: Giây 0-3s Hook giữ chân, Giây 3-15s Thân bài, Giây 15-20s Lời kêu gọi CTA.<br>• Kèm góc máy quay (`cameraAngle`), chỉ dẫn hình ảnh (`visualCue`), lời thoại lồng tiếng (`voiceover`) và chữ hiển thị trên màn hình (`onscreenText`). | [x] Đã pass |
| **TC-F016-02** | Viết Caption bán hàng trực tiếp theo công thức AIDA / PAS | 1. Chọn định dạng: *"Caption Mạng Xã Hội"*.<br>2. Tone giọng: *"Chốt sale FOMO"*.<br>3. Mục tiêu: *"Bán hàng trực tiếp (Chốt đơn)"*.<br>4. Nhập Tên sản phẩm & Lợi ích chính.<br>5. Bấm sinh nội dung. | Tên SP: *"Serum Trắng Da B5"*, Lợi ích: *"Mờ thâm mụn chỉ sau 7 ngày"* | • Bài viết có cấu trúc rõ ràng: Tiêu đề thu hút -> Vấn đề cấp bách -> Giới thiệu giải pháp -> Ưu đãi giới hạn và Kêu gọi hành động.<br>• Kèm bộ hashtags chuẩn SEO đề xuất và khung giờ vàng đăng bài. | [x] Đã pass |
| **TC-F016-03** | Mở Modal AI Writer trực tiếp khi đang soạn bài trên `/create` | 1. Tại trang `#/create`, bấm nút **"Trợ Lý AI (F016)"** trên nhãn Caption hoặc trên Content Studio AI Toolbar. | Click nút Trợ lý AI | • Modal `AiWriterModal` xuất hiện toàn màn hình với thanh điều khiển 10 ngành và 6 tone.<br>• Cho phép sinh trực tiếp mà không cần rời trang soạn bài. | [x] Đã pass |
| **TC-F016-04** | Chuyển thẳng nội dung kịch bản/caption từ Studio sang màn hình Tạo bài viết (`/create`) | 1. Sau khi sinh kịch bản/caption ưng ý tại `#/content-studio`.<br>2. Nhấp nút **"Đăng ngay (/create)"**. | Click nút Đăng ngay | • Ứng dụng tự động điều hướng sang `#/create`.<br>• Tự động tạo bản thảo AI với tiêu đề, caption và hashtags được điền sẵn đầy đủ.<br>• Thẻ video hiển thị trạng thái rõ ràng *"Bản thảo kịch bản AI • Chưa có tệp video thực tế"* kèm nút *"Tải video thay thế"*.<br>• Khi người dùng kéo thả hoặc tải video lên, hệ thống tự động thay thế bản thảo AI và giữ nguyên toàn bộ tiêu đề & caption. | [x] Đã pass |
| **TC-F016-05** | Thử nghiệm các mẫu công thức Copywriting kinh điển (AIDA, PAS, BAB) | 1. Mở tab **"Công Thức Copywriting Kinh Điển"** trên `#/content-studio`.<br>2. Chọn thẻ *"Công thức PAS"* và bấm **"Áp dụng mẫu này"**. | Mẫu PAS | • Tự động chuyển sang tab AI Writer với tone `EMPATHETIC`, mục tiêu `LEAD_GEN` và chủ đề được điền sẵn.<br>• Hỗ trợ người dùng mới bắt đầu nhanh chóng. | [x] Đã pass |
| **TC-F016-06** | Chỉnh sửa trực tiếp Tiêu đề & Caption tại khung Preview (In-place Textarea) | 1. Mở trang `#/content-studio` tab **"Trợ Lý AI Viết Caption / Kịch Bản"**.<br>2. Thiết lập thông số và bấm **"Sinh Bài Viết Với AI"**.<br>3. Tại cột *"2. Bản Thảo Hoàn Thiện (Preview)"*, click vào ô Tiêu đề Viral hoặc Caption Chi Tiết.<br>4. Gõ chỉnh sửa câu từ, xóa hoặc thêm hashtags.<br>5. Bấm nút Copy hoặc "Đăng ngay (/create)". | Tiêu đề và caption tùy chỉnh trực tiếp trên khung Preview | • Tiêu đề và Caption hiển thị dạng ô Textarea tương tác trực tiếp, tự co giãn mượt mà.<br>• Tự động cập nhật số ký tự và thời gian đọc theo thời gian thực.<br>• Nút Copy và nút "Đăng ngay (/create)" đồng bộ 100% nội dung đã chỉnh sửa.<br>• Có nút "Khôi phục gốc" giúp hoàn tác nhanh về kết quả AI nguyên bản nếu muốn. | [x] Đã pass |
| **TC-F016-07** | Chặn đăng bài và cảnh báo khi chưa tải video thay thế cho bản thảo AI | 1. Chuyển kịch bản từ Content Studio hoặc AI Writer F016 sang `#/create`.<br>2. Chưa tải tệp video thực tế nào lên.<br>3. Chọn nền tảng và bấm xác nhận Đăng bài viết. | Click Đăng bài khi còn bản thảo AI chưa gắn video | • Hệ thống không gửi `videoAssetId` ảo/draft lên server.<br>• Hiển thị hộp thoại Modal và cảnh báo: *"Vui lòng chọn video thực tế để thay thế bản thảo AI trước khi đăng"*.<br>• Cung cấp nút chọn nhanh video từ máy tính, đảm bảo luồng đăng bài không bị crash hoặc văng lỗi 404 Video asset not found. | [x] Đã pass |

---

## [F082] - Duplicate Content Detection (Kiểm tra trùng lặp nội dung)

* **Mục tiêu:** Ngăn chặn việc đăng lại cùng một video hoặc tiêu đề / mô tả đã đăng trước đó trong Workspace, phòng tránh rủi ro tài khoản bị mạng xã hội (TikTok, Facebook Reels, YouTube Shorts) đánh gậy spam hoặc bóp tương tác.
* **Môi trường test:** Electron App (Trang Tạo bài viết `/create`) & API Backend (`/api/content/duplicate-check`).

### 📋 Bảng Test Cases F082

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F082-01** | Kiểm tra bài viết mới hoàn toàn (Happy Path - An toàn) | 1. Mở trang Tạo bài viết `/create` trên Electron.<br>2. Nhập tiêu đề và caption độc nhất chưa từng dùng.<br>3. Quan sát khung cảnh báo dưới ô Caption. | Tiêu đề: *"Review quán cafe phong cách Nhật Bản tại Quận 1"*<br>Caption: *"Khám phá không gian yên tĩnh cuối tuần cùng mình nhé #review #coffee"* | • Thẻ thông báo hiển thị màu **Xanh lá (An toàn)**.<br>• Mức độ rủi ro: `SAFE`, % trùng lặp thấp (0% - 25%).<br>• Không hiển thị danh sách bài trùng. | [ ] |
| **TC-F082-02** | Cảnh báo tương đồng nhẹ (Moderate Risk) | 1. Nhập một caption có cấu trúc câu và từ khóa tương tự một bài viết đã đăng trước đó.<br>2. Đợi 400ms (debounce). | Caption tương tự 40% - 60% từ ngữ với bài cũ trong cùng Workspace. | • Thẻ cảnh báo chuyển sang màu **Vàng (Tương đồng nhẹ)**.<br>• Hiển thị thanh tiến trình % trùng lặp.<br>• Xuất hiện khuyến nghị nên biên tập lại hoặc dùng AI Spin. | [ ] |
| **TC-F082-03** | Cảnh báo trùng lặp cao (High Risk) | 1. Copy y nguyên tiêu đề và caption của 1 bài viết đã có sẵn trong danh sách bài viết.<br>2. Dán vào ô Caption trên màn hình Tạo bài viết. | Caption hoặc Tiêu đề trùng khớp 80% - 100% với bài cũ. | • Thẻ cảnh báo chuyển sang màu **Đỏ (Rủi ro cao)**.<br>• Hiển thị huy hiệu `HIGH RISK` kèm % tương đồng.<br>• Liệt kê cụ thể tên bài viết cũ bị trùng kèm ngày đăng. | [ ] |
| **TC-F082-04** | Sử dụng nút AI Spin Caption để xử lý trùng lặp | 1. Khi đang ở trạng thái Cảnh báo Vàng hoặc Đỏ.<br>2. Nhấp chuột vào nút **"AI Spin Caption"** bên trong thẻ cảnh báo. | Nút AI Spin Caption trong `DuplicateWarningCard`. | • Hiển thị hiệu ứng loading viết lại.<br>• Caption trong ô nhập tự động được thay thế bằng phiên bản diễn đạt mới mẻ.<br>• Tự động kích hoạt kiểm tra lại $\rightarrow$ Cảnh báo hạ về màu Xanh. | [ ] |
| **TC-F082-05** | Nhập nội dung quá ngắn hoặc ký tự đặc biệt | 1. Nhập 1 hoặc 2 chữ cái (ví dụ: *"Ok"*, *"Hi"*).<br>2. Xóa sạch ô caption để trống. | Caption: `""` hoặc `"A"` | • Không kích hoạt gọi API spam hoặc không báo lỗi crash.<br>• Giữ trạng thái mặc định an toàn. | [ ] |
| **TC-F082-06** | Kiểm tra độc lập theo Workspace (Data Isolation) | 1. Tạo bài viết A ở Workspace 1.<br>2. Đổi tài khoản sang Workspace 2 và nhập lại y hệt nội dung bài viết A. | Cùng caption nhưng thuộc 2 `workspaceId` khác nhau. | • Workspace 2 báo `SAFE` (0% trùng) vì không quét chéo bài của khách hàng khác. | [ ] |
| **TC-F082-07** | Phát hiện trùng lặp tệp Video (Media Duplicate) | 1. Chọn upload cùng một tệp video gốc (`videoAssetId`) đã được dùng trong một bài viết trước đó. | Cùng 1 file video `videoAssetId`. | • Thẻ cảnh báo phát hiện: *"Tệp video này đã từng được sử dụng trong bài viết [Tên bài]"*. | [ ] |

---

## [F083] - Evergreen Content & Auto-Recycle (Nội dung bất hủ & Tái đăng)

* **Mục tiêu:** Cho phép người sáng tạo nội dung gắn cờ những video/bài viết có giá trị vượt thời gian (hướng dẫn, chia sẻ mẹo, thông tin kinh điển) để hệ thống tự động đưa vào danh sách tái xuất bản định kỳ sau N ngày mà không bị trôi bài.
* **Môi trường test:** Electron App (Trang Tạo bài viết `/create`, Trang Quản lý `/evergreen`, Trang Bài viết `/posts`) & Backend API (`/api/content/evergreen`, `/api/content/evergreen/recycle`).

### 📋 Bảng Test Cases F083

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F083-01** | Bật tùy chọn Evergreen khi tạo bài viết | 1. Vào trang Tạo bài viết `/create` trên App Electron.<br>2. Cuộn xuống mục **"3. Tùy chọn Tái đăng (Evergreen Content)"**.<br>3. Gạt công tắc sang Bật.<br>4. Nhập chu kỳ ngày (ví dụ: `45` ngày). | Bật Toggle Evergreen = `true`, Chu kỳ = `45` ngày. | • Ô nhập ngày mở ra cho phép tùy chỉnh.<br>• Khi bấm "Tạo bài viết", payload gửi đi chứa `isEvergreen: true`, `recycleIntervalDays: 45`. | [ ] |
| **TC-F083-02** | Hiển thị huy hiệu Evergreen trên danh sách bài viết | 1. Sau khi tạo bài viết Evergreen thành công.<br>2. Bấm vào menu **"Quản lý bài viết"** (`/posts`). | Danh sách bài viết đã tạo. | • Thẻ bài viết vừa tạo xuất hiện huy hiệu tím: **"Evergreen (45d)"** kèm icon lặp lại. | [ ] |
| **TC-F083-03** | Truy cập trang Quản lý Evergreen | 1. Trên thanh Sidebar của Electron App, click vào mục **"Nội dung Evergreen"** (icon `Repeat`).<br>2. Quan sát giao diện trang. | URL: `#/evergreen` | • Tải trang mượt mà không có thông báo lỗi đỏ.<br>• Hiển thị 3 khối thống kê: **Tổng bài Evergreen**, **Đến hạn tái đăng**, **Lượt đã tái đăng**.<br>• Hiển thị thanh tab bộ lọc và ô tìm kiếm. | [ ] |
| **TC-F083-04** | Bộ lọc Tab "Cần tái đăng" vs "Thư viện bài" | 1. Bấm qua lại giữa 2 tab: **"Cần tái đăng"** và **"Thư viện bài"**. | Click Tabs | • Tab "Thư viện bài" hiển thị toàn bộ bài Evergreen đã lưu.<br>• Tab "Cần tái đăng" chỉ lọc những bài có `isDue = true` (đã quá chu kỳ ngày kể từ lần đăng cuối). | [ ] |
| **TC-F083-05** | Tìm kiếm bài viết Evergreen realtime | 1. Nhập từ khóa vào ô *"Tìm theo tiêu đề, mô tả..."* trên trang `/evergreen`. | Từ khóa: *"mẹo"*, *"hướng dẫn"* | • Danh sách bài lọc chính xác theo từ khóa.<br>• Nếu không có kết quả, hiển thị giao diện trống *"Chưa có bài viết nào"*. | [ ] |
| **TC-F083-06** | Mở Modal Tái bản bài viết (Recycle Modal) | 1. Tại thẻ bài viết trên trang Evergreen, bấm nút **"Tái đăng ngay (Recycle Now)"**. | Click nút Tái đăng | • Modal tái bản mở lên mượt mà.<br>• Tự động điền trước Tiêu đề, Caption và các Nền tảng của bài gốc.<br>• Cho phép chỉnh sửa nội dung trước khi bấm xuất bản. | [ ] |
| **TC-F083-07** | Đổi mới Caption bằng AI Spin trong Modal Tái bản | 1. Trong Modal Tái bản, bấm nút **"AI Spin"** (icon phép thuật). | Click nút AI Spin | • Nút hiển thị loading.<br>• Caption được viết lại tự động với văn phong mới mẻ để tránh bị trùng lặp với lần đăng trước. | [ ] |
| **TC-F083-08** | Thực hiện Tái bản ngay (Publish Now) | 1. Trong Modal Tái bản, chọn chế độ **"Đăng ngay"**.<br>2. Chọn nền tảng (Facebook, TikTok, v.v.).<br>3. Bấm **"Tiến hành Tái bản"**. | Chế độ: `now` | • Thông báo toast thành công.<br>• Hệ thống tạo 1 bài viết con mới với `originalPostId`.<br>• Bài gốc tăng `recycleCount` thêm 1 và cập nhật `lastRecycledAt` về thời gian hiện tại.<br>• Bài viết chuyển khỏi tab "Cần tái đăng" sang chu kỳ mới. | [ ] |
| **TC-F083-09** | Thực hiện Tái bản hẹn giờ (Schedule Recycle) | 1. Trong Modal Tái bản, chọn chế độ **"Hẹn giờ đăng"**.<br>2. Chọn ngày & giờ trong tương lai.<br>3. Bấm **"Tiến hành Tái bản"**. | Chế độ: `schedule`, Chọn ngày giờ | • Bài viết tái bản được tạo ở trạng thái `SCHEDULED` với thời gian hẹn.<br>• Đưa vào hàng đợi tự động đăng khi đến giờ. | [ ] |
| **TC-F083-10** | Tắt chế độ Evergreen của một bài viết | 1. Tại thẻ bài viết trong tab Thư viện bài.<br>2. Bấm nút **"Tắt Evergreen"**. | Click nút Tắt | • Cập nhật bài viết thành `isEvergreen = false`.<br>• Bài viết được xóa khỏi trang quản lý Evergreen ngay lập tức. | [ ] |

---

## [F084] - AI Content Score (Chấm điểm nội dung chuẩn viral)

* **Phân hệ:** M2. Content Studio (Tích hợp trong form Tạo bài viết `/create` trên Electron App).
* **Mục tiêu:** Đánh giá chất lượng nội dung trước khi xuất bản dựa trên 4 trụ cột: **Hook (3 giây đầu / câu mở đầu)**, **Độ rõ ràng của CTA (Kêu gọi hành động)**, **Brand Voice (Giọng điệu thương hiệu)** và **Mức độ phù hợp với Nền tảng** (Reels/TikTok/Shorts).
* **AI Luồng 9router:** Gọi `POST /api/content/ai-score` $\rightarrow$ Định tuyến qua 9router server. Trả về điểm tổng (0-100), điểm chi tiết từng phần, điểm mạnh, điểm yếu và lời khuyên cải thiện.

### 📋 Bảng Test Cases F084

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F084-01** | Bấm Chấm điểm nội dung (Happy Path) | 1. Nhập tiêu đề và caption hoàn chỉnh trong `/create`.<br>2. Chọn nền tảng đích (vd: TikTok + Reels).<br>3. Bấm nút **"Chấm điểm AI"** (icon `Sparkles`). | Tiêu đề: *"5 Bí quyết x2 doanh số không cần chạy ads"*<br>Caption: *"Bạn đã biết cách này chưa? Lưu ngay video này lại nhé..."* | • Hiển thị thanh tiến trình phân tích.<br>• Khung Score Card xuất hiện với điểm tổng (vd: `88/100`).<br>• Đánh giá chi tiết 4 tiêu chí: Hook (9/10), CTA (8/10), Brand Voice (9/10), Platform Fit (9/10). | [ ] |
| **TC-F084-02** | Nội dung thiếu Hook hoặc thiếu CTA | 1. Nhập caption cụt ngủn hoặc chỉ có thông tin mô tả, không có câu mở đầu gây chú ý và không có kêu gọi hành động. | Caption: *"Hôm nay trời đẹp bán áo thun 150k."* | • Điểm Hook thấp (< 50) và điểm CTA thấp (< 40).<br>• AI đưa ra gợi ý cụ thể: *"Thiếu câu hỏi gợi mở ở đầu bài"*, *"Cần thêm CTA: Xem link bio / Comment để nhận ưu đãi"*. | [ ] |
| **TC-F084-03** | Áp dụng gợi ý cải thiện của AI (1-Click Apply) | 1. Khi AI đề xuất phiên bản tối ưu hóa điểm số.<br>2. Bấm nút **"Áp dụng bản gợi ý"**. | Click nút "Áp dụng" | • Tự động cập nhật tiêu đề/caption mới vào form soạn bài.<br>• Điểm Content Score tự động tăng lên mức xanh (> 85). | [ ] |
| **TC-F084-04** | Chấm điểm khi chưa nhập nội dung | 1. Để trống tiêu đề và caption.<br>2. Bấm nút "Chấm điểm AI". | Ô nhập rỗng | • Hiển thị toast nhắc nhở: *"Vui lòng nhập tiêu đề hoặc nội dung trước khi chấm điểm"*, không gửi request lỗi lên server. | [ ] |
| **TC-F084-05** | Hoạt động khi 9router chưa sẵn sàng (Fallback Mode) | 1. Trong môi trường server chưa kết nối 9router hoặc 9router timeout. | Chấm điểm bài viết | • Hệ thống chuyển sang Heuristic Engine nội bộ: tính điểm dựa trên độ dài, từ khóa hook, hashtag, CTA pattern.<br>• Vẫn hiển thị Score Card đầy đủ, không gây lỗi giao diện. | [ ] |
| **TC-F084-06** | Nhận diện nội dung vô nghĩa / spam (vd: `dsfsdfdsf`) | 1. Mở Quản lý bài viết (`/create`).<br>2. Nhập chuỗi vô nghĩa vào Caption (vd: `dsfsdfdsf`).<br>3. Bấm "Chấm điểm ngay" / "Chấm điểm lại". | Caption: *"dsfsdfdsf"* | • Điểm Viral tổng hợp rất thấp (<= 15/100, nhãn *"Yếu — Khó giữ chân khán giả"*).<br>• Tất cả trụ cột Hook, CTA, Nền tảng đều điểm thấp (<= 10%).<br>• Mục *"Điểm mạnh đã đạt"* không đưa nhận xét sai sự thật (trống hoặc hiển thị thông báo chưa có điểm mạnh).<br>• Mục *"Khuyến nghị"* cảnh báo rõ nội dung vô nghĩa và hướng dẫn viết lại. | [x] |
| **TC-F084-07** | Tự động ẩn trụ cột Brand Voice khi không cấu hình | 1. Soạn bài viết khi tài khoản chưa cấu hình Brand Voice.<br>2. Xem khối chấm điểm AI Content Score. | Không truyền `brandVoice` | • Giao diện tự động co về 3 trụ cột (Hook, CTA, Chuẩn nền tảng).<br>• Trụ cột Brand Voice hoàn toàn được ẩn đi.<br>• Phụ đề hiển thị *"Chấm điểm Hook 3s, CTA & Nền tảng"*.<br>• Điểm tổng hợp tính theo trọng số 3 tiêu chí: Hook 45%, CTA 30%, Chuẩn nền tảng 25%. | [x] |

---

## [F085] - Conversation Status & SLA (Trạng thái hội thoại & Hạn phản hồi)

* **Phân hệ:** M3. Unified Inbox (Trang Hộp thư hợp nhất `/inbox` trên Electron App).
* **Mục tiêu:** Quản lý vòng đời hội thoại khách hàng qua các trạng thái chuẩn (`NEW`, `OPEN`, `PENDING`, `RESOLVED`, `CLOSED`), đồng thời đếm ngược thời gian cam kết phản hồi (SLA Response Time, ví dụ: 15 phút cho khách mới, 60 phút cho khách đang chờ) để tránh bỏ quên tin nhắn.

### 📋 Bảng Test Cases F085

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F085-01** | Trạng thái mặc định khi nhận tin nhắn mới | 1. Khách hàng gửi tin nhắn đầu tiên từ Facebook/Zalo/TikTok. | Tin nhắn Inbound mới | • Hội thoại tự động tạo với trạng thái **`NEW`** (Huy hiệu xanh dương rực rỡ).<br>• Tự động gán `slaDeadline` = Thời điểm hiện tại + Cấu hình SLA Workspace (vd: 15 phút). | [ ] |
| **TC-F085-02** | Chuyển trạng thái khi nhân viên trả lời (Auto Open) | 1. Nhân viên gửi tin nhắn phản hồi lại khách hàng. | Tin nhắn Outbound | • Trạng thái tự động đổi từ `NEW` sang **`OPEN`**.<br>• SLA phản hồi lần đầu được đánh dấu là Đã hoàn thành (SLA Met). | [ ] |
| **TC-F085-03** | Đổi trạng thái thủ công (Pending / Resolved) | 1. Tại thanh công cụ đầu hội thoại, click dropdown Trạng thái.<br>2. Chọn **`PENDING`** (Đang chờ khách trả lời) hoặc **`RESOLVED`** (Đã giải quyết xong). | Chọn dropdown | • Badge trạng thái cập nhật tức thì trên cả danh sách bên trái và tiêu đề khung chat.<br>• Khi chọn `RESOLVED`, SLA đếm ngược tạm dừng. | [ ] |
| **TC-F085-04** | Cảnh báo SLA sắp hết hạn (SLA Warning) | 1. Hội thoại còn dưới 5 phút đến hạn `slaDeadline` mà nhân viên chưa phản hồi. | Thời gian còn < 5 phút | • Hiển thị đồng hồ đếm ngược màu **Vàng nhấp nháy**: *"Còn 4m"*. | [ ] |
| **TC-F085-05** | Cảnh báo SLA quá hạn (SLA Breached) | 1. Thời gian hiện tại vượt quá `slaDeadline`. | Đã quá hạn | • Đồng hồ chuyển sang màu **Đỏ rực**: *"Quá hạn 12m"*.<br>• Hội thoại được đẩy lên nhóm ưu tiên hàng đầu trong bộ lọc SLA. | [ ] |
| **TC-F085-06** | Bộ lọc hội thoại theo Trạng thái & SLA | 1. Bấm vào thanh lọc trên Inbox: chọn xem riêng các bài `NEW`, `OPEN`, `PENDING`, `RESOLVED`, hoặc `QUÁ HẠN SLA`. | Chọn filter tab | • Danh sách chỉ hiển thị đúng các hội thoại thỏa mãn điều kiện lọc. | [ ] |
| **TC-F085-07** | Hiển thị Header khung hội thoại khi mở 3 cột | 1. Mở Inbox với đầy đủ 3 cột (Danh sách, Khung chat, Panel Hồ sơ & AI).<br>2. Chọn hội thoại có tên khách dài (vd: "Trần Thị Mai Linh"). | Chế độ xem 3 cột | • Tên khách hiển thị trên 1 dòng duy nhất, nếu hẹp thì cắt gọn bằng "…" kèm tooltip khi hover.<br>• Badge kênh, dropdown trạng thái, nút Spam và nút mở panel nằm thẳng hàng, không bị tràn hay cắt ở mép phải. | [ ] |

---

## [F086] - Internal Note & Mention (Ghi chú nội bộ & Tag nhân viên)

* **Phân hệ:** M3. Unified Inbox (Khung chat hội thoại trên Electron App).
* **Mục tiêu:** Cho phép các nhân viên chăm sóc khách hàng / kỹ thuật ghi chú thông tin bảo mật (giá vốn, lịch sử khiếu nại, dặn dò ca sau) trực tiếp trong luồng chat và `@mention` đồng nghiệp để phối hợp giải quyết mà **khách hàng hoàn toàn không nhìn thấy**.

### 📋 Bảng Test Cases F086

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F086-01** | Tạo Ghi chú nội bộ thành công | 1. Trong khung nhập tin nhắn, chuyển sang Tab **"Ghi chú nội bộ"** (Hoặc gõ icon ổ khóa 🔒).<br>2. Nhập nội dung và nhấn Gửi. | Ghi chú: *"Khách này là khách VIP mua đơn thứ 3, nhớ tặng kèm sample"* | • Tin nhắn xuất hiện trong luồng chat với **khung nền màu Vàng cam đặc trưng** có icon 🔒.<br>• Gắn cờ rõ ràng: *"Chỉ nội bộ nhìn thấy"*, không gửi ra ngoài nền tảng mạng xã hội. | [ ] |
| **TC-F086-02** | @mention đồng nghiệp trong ghi chú | 1. Khi đang gõ trong ô Ghi chú nội bộ, gõ ký tự `@`.<br>2. Danh sách nhân viên trong Workspace xổ ra.<br>3. Chọn nhân viên (vd: `@Nam Nguyễn`). | Nội dung: *"@Nam kiểm tra giúp đơn này ở kho HCM nhé"* | • Tên `@Nam Nguyễn` được highlight nổi bật màu xanh tím.<br>• Bản ghi `ConversationNote` lưu đúng liên kết `mentions`. | [ ] |
| **TC-F086-03** | Thông báo khi được @mention | 1. Nhân viên A tag nhân viên B trong một hội thoại.<br>2. Nhân viên B đang mở App Electron ở máy khác. | Tag `@username` | • Chuông thông báo của nhân viên B đổ chuông / hiện pop-up: *"Nhân viên A đã nhắc đến bạn trong hội thoại với [Tên khách]"*.<br>• Click vào thông báo chuyển thẳng vào đúng hội thoại. | [ ] |
| **TC-F086-04** | Bảo mật: Không gửi nhầm ghi chú sang khách hàng | 1. Viết ghi chú nội bộ và bấm gửi.<br>2. Kiểm tra webhook/nền tảng mạng xã hội thực tế của khách hàng. | Message gửi đi | • Khách hàng không nhận được bất kỳ tin nhắn nào.<br>• Database lưu vào bảng `ConversationNote`, không lưu vào `Message(OUTBOUND)`. | [ ] |

---

## [F087] - AI Suggested Reply (Gợi ý câu trả lời thông minh)

* **Phân hệ:** M3. Unified Inbox (Khu vực soạn tin nhắn trên Electron App).
* **Mục tiêu:** Trợ lý AI đọc hiểu ngữ cảnh câu hỏi của khách hàng, kết hợp với lịch sử chat và tài liệu sản phẩm (Knowledge Base/Brand Voice) để sinh ngay 2-3 câu trả lời mẫu hoàn chỉnh. Nhân viên chỉ cần 1 cú click để chọn và gửi ngay, tăng tốc độ trả lời gấp 5 lần.
* **AI Luồng 9router:** Gọi `POST /api/inbox/[id]/ai-suggest-reply` $\rightarrow$ Định tuyến qua 9router server.

### 📋 Bảng Test Cases F087

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F087-01** | Tự động đề xuất câu trả lời khi có tin nhắn mới | 1. Khách hàng nhắn: *"Sản phẩm này còn size L màu đen không shop? Ship về Cầu Giấy mất bao lâu?"*<br>2. Quan sát dải gợi ý nhanh phía trên ô nhập tin nhắn. | Tin nhắn hỏi sản phẩm & vận chuyển | • Xuất hiện 2-3 chip gợi ý câu trả lời (vd: Gợi ý 1: *"Tư vấn nhiệt tình kèm thời gian ship"*, Gợi ý 2: *"Hỏi thêm chiều cao cân nặng để chọn size chuẩn"*). | [ ] |
| **TC-F087-02** | Xem trước và chọn câu trả lời (1-Click Fill) | 1. Di chuột qua chip gợi ý để xem toàn văn.<br>2. Click chuột vào chip gợi ý. | Click vào Chip gợi ý | • Toàn bộ nội dung trả lời được điền ngay vào ô soạn thảo.<br>• Cho phép nhân viên chỉnh sửa bổ sung trước khi bấm nút Gửi. | [ ] |
| **TC-F087-03** | Tạo lại gợi ý mới (Regenerate) | 1. Bấm nút icon Làm mới (Refresh) bên cạnh dải gợi ý AI. | Click Refresh | • AI kết nối lại 9router và sinh ra 2 phương án trả lời mới với góc độ tiếp cận khác (ngắn gọn hơn hoặc kèm khuyến mãi). | [ ] |
| **TC-F087-04** | Tương thích ngữ điệu Brand Voice | 1. Thiết lập Brand Voice Workspace là *"Thân thiện, trẻ trung, dùng emoji"*. | Tin nhắn khách hàng | • Câu trả lời được tạo tự nhiên, xưng hô phù hợp, có kèm các emoji thích hợp (dạ shop chào bạn ạ ✨...). | [ ] |

---

## [F088] - AI Conversation Summary (Tóm tắt hội thoại & Next Action)

* **Phân hệ:** M3. Unified Inbox (Khung thông tin khách hàng bên phải trên Electron App).
* **Mục tiêu:** Khi một hội thoại kéo dài hàng chục tin nhắn, nhân viên mới tiếp nhận không cần cuộn đọc từ đầu; AI tự động trích xuất: **Nhu cầu chính của khách**, **Thỏa thuận đã đạt được**, **Vấn đề còn tồn đọng** và **Hành động tiếp theo (Next Action)** cần làm.
* **AI Luồng 9router:** Gọi `POST /api/inbox/[id]/ai-summary` $\rightarrow$ Định tuyến qua 9router server.

### 📋 Bảng Test Cases F088

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F088-01** | Tóm tắt hội thoại dài (Happy Path) | 1. Mở một hội thoại có > 10 tin nhắn trao đổi.<br>2. Tại cột bên phải, bấm nút **"Tóm tắt AI"** (icon `FileText` hoặc `Wand2`). | Hội thoại nhiều tin nhắn | • Hiển thị thẻ tóm tắt gồm 3 mục rõ ràng:<br>  - 📌 **Tóm tắt nhu cầu:** Khách muốn đặt 2 set quà tết.<br>  - 🤝 **Đã thỏa thuận:** Đã chọn mẫu A và đồng ý cọc 50%.<br>  - ⚡ **Next Action:** Cần gửi số tài khoản và xin địa chỉ nhận hàng. | [ ] |
| **TC-F088-02** | Lưu tóm tắt vào hồ sơ hội thoại | 1. Sau khi sinh bản tóm tắt.<br>2. Đóng app Electron và mở lại hội thoại đó. | Đọc lại tóm tắt cũ | • Bản tóm tắt gần nhất vẫn hiển thị sẵn không cần phải bấm gọi AI tóm tắt lại từ đầu (tiết kiệm token). | [ ] |
| **TC-F088-03** | Cập nhật tóm tắt khi có diễn biến mới | 1. Sau khi khách nhắn thêm thông tin quan trọng mới.<br>2. Bấm nút **"Cập nhật tóm tắt"**. | Click Update Summary | • AI đọc bổ sung các tin nhắn mới nhất và làm mới mục Next Action. | [ ] |

---

## [F089] - Lead Detection từ hội thoại (Phát hiện khách tiềm năng)

* **Phân hệ:** M3. Unified Inbox & CRM Deals (Liên kết giữa Hộp thư và Quản lý khách hàng).
* **Mục tiêu:** Tự động nhận diện ý định mua hàng (hỏi giá, để lại SĐT, hỏi địa chỉ cửa hàng, chốt đơn) và hiển thị thông báo nổi bật kèm nút **"Tạo Lead / Tạo Đơn"** để chuyển ngay vào bảng CRM/Deals chỉ bằng 1 cú click.
* **AI Luồng 9router:** Phân tích thực thể (Named Entity Recognition - NER) kết hợp Regex nhận dạng SĐT / Email / Địa chỉ.

### 📋 Bảng Test Cases F089

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F089-01** | Phát hiện số điện thoại trong tin nhắn | 1. Khách nhắn: *"Ship cho mình về địa chỉ này nhé, sđt 0912345678"*. | Tin nhắn chứa SĐT | • Khung chat hiển thị huy hiệu: **"Phát hiện Lead tiềm năng"** 🎯.<br>• Tự động trích xuất: SĐT = `0912345678`. | [ ] |
| **TC-F089-02** | 1-Click chuyển đổi sang CRM Lead / Deal | 1. Click vào nút **"Tạo Lead vào CRM"** trên huy hiệu phát hiện. | Click nút Tạo Lead | • Modal Tạo Lead mở ra, tự động điền sẵn Tên khách hàng, SĐT, Nguồn (Facebook/TikTok), và trích dẫn câu chốt đơn.<br>• Bấm Lưu $\rightarrow$ Bản ghi được tạo trong bảng `Customer` & `Deal`. | [ ] |
| **TC-F089-03** | Nhận diện ý định hỏi giá và mua sỉ | 1. Khách nhắn: *"Bên bạn có bán sỉ số lượng 50 cái không, báo giá chiết khấu giúp mình"*. | Ý định mua sỉ | • Hệ thống phân loại độ ưu tiên: `HOT LEAD (Ưu tiên cao)`.<br>• Gợi ý gán nhãn: `Bán sỉ / B2B`. | [ ] |
| **TC-F089-04** | Tránh bắt nhầm tin nhắn thông thường | 1. Khách chỉ nhắn: *"Shop ơi"* hoặc icon vẫy tay 👋. | Tin nhắn chào hỏi | • Không hiển thị cảnh báo Lead, giữ giao diện sạch sẽ. | [ ] |

---

## [F091] - Spam/Blacklist (Chặn spam & Danh sách đen)

* **Phân hệ:** M3. Unified Inbox (Bộ lọc & Cài đặt hệ thống trên Electron App).
* **Mục tiêu:** Bảo vệ nhân viên khỏi các tin nhắn quảng cáo rác, lừa đảo, xúc phạm hoặc spam link; hỗ trợ đưa người dùng vào danh sách đen (Blacklist) và tự động lọc tin nhắn theo từ khóa cấm.

### 📋 Bảng Test Cases F091

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F091-01** | Thêm người dùng vào Blacklist thủ công | 1. Trong hội thoại của một user spam, bấm menu 3 chấm $\rightarrow$ Chọn **"Đưa vào Danh sách đen (Blacklist)"**.<br>2. Chọn lý do (Spam quảng cáo / Lừa đảo / Quấy rối). | Click Blacklist | • Hội thoại tự động chuyển cờ `isSpam = true`.<br>• Ẩn khỏi hòm thư chính, chuyển vào mục **"Hộp thư Rác / Spam"**.<br>• Các tin nhắn tiếp theo từ user này không kích hoạt chuông thông báo và không tính vào SLA. | [ ] |
| **TC-F091-02** | Tự động chặn theo Bộ từ khóa cấm (Keyword Policy) | 1. Cấu hình danh sách từ khóa spam trong cài đặt (vd: *"cho vay", "cờ bạc", "t.me/"*).<br>2. Khách lạ gửi tin nhắn chứa link telegram lừa đảo. | Tin nhắn chứa từ cấm | • Tin nhắn tự động bị đánh dấu Spam ngay khi đến.<br>• Hội thoại không làm phiền nhân viên trực ca. | [ ] |
| **TC-F091-03** | Khôi phục hội thoại từ Spam (Unmark Spam) | 1. Vào thư mục Spam.<br>2. Mở hội thoại bị bắt nhầm $\rightarrow$ Bấm **"Không phải Spam"**.<br>3. Xác nhận. | Click Unmark | • Trạng thái `isSpam` đổi về `false`.<br>• Hội thoại quay trở lại danh sách hòm thư chính bình thường. | [ ] |
| **TC-F091-04** | Danh sách quản lý Blacklist trong Settings | 1. Vào mục Cài đặt $\rightarrow$ Tab **"Chặn & Danh sách đen"**.<br>2. Xem danh sách các UID / số điện thoại đang bị chặn.<br>3. Bấm nút Xóa chặn (Unblock). | Giao diện Settings | • Danh sách hiển thị đầy đủ ngày chặn, lý do.<br>• Khi gỡ bỏ, người dùng đó có thể nhắn tin lại bình thường. | [ ] |

---

## [F100] - Lead Scoring (Chấm điểm khách hàng tiềm năng)

* **Phân hệ:** M4. Customer & Lead CRM (Danh sách Khách hàng & Chi tiết Lead trên Electron App).
* **Mục tiêu:** Tự động tính toán điểm số tiềm năng (Lead Score từ 0 - 100) và phân loại độ nóng (`HOT 🔥`, `WARM ⚡`, `COLD ❄️`) dựa trên mức độ hoàn thiện hồ sơ, tần suất tương tác đa kênh qua Unified Inbox, và đánh giá ý định chốt đơn từ AI 9router.
* **Cơ chế tính điểm:**
  * **Hồ sơ (Profile):** Có SĐT hợp lệ (+25đ), Có Email (+15đ), Có Địa chỉ giao hàng (+10đ).
  * **Tương tác (Engagement):** Nhắn tin trong 24h qua (+20đ), Tương tác > 3 tin nhắn (+15đ), Có Deal đang mở (+15đ).
  * **AI Intent (9router):** AI phân tích hội thoại phát hiện ý định mua sắm khẩn cấp / mua sỉ (+20đ).
  * **Điểm trừ suy giảm (Decay):** Không tương tác > 7 ngày (-10đ), Không tương tác > 30 ngày (-25đ).

### 📋 Bảng Test Cases F100

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F100-01** | Tính điểm khởi tạo khi khách để lại SĐT và Email | 1. Tạo mới hoặc chuyển đổi Lead từ Inbox với đầy đủ Tên, SĐT và Email.<br>2. Xem thẻ khách hàng trong CRM. | Tên: *"Nguyễn Tuấn"*, SĐT: *"0988776655"*, Email: *"tuan@gmail.com"* | • Điểm cơ bản tự động đạt: **40/100 điểm** (SĐT +25, Email +15).<br>• Phân loại tạm thời: `WARM ⚡` (Khách tiềm năng). | [ ] |
| **TC-F100-02** | Cộng điểm tương tác khi khách nhắn tin gần đây | 1. Khách hàng nhắn tin qua Hộp thư Inbox trong ngày hôm nay.<br>2. Mở hồ sơ khách trong CRM. | Tin nhắn mới trong vòng 24h qua | • Tự động cộng **+20 điểm** tương tác gần.<br>• Huy hiệu hiển thị: *"Tương tác gần đây (24h)"*. | [ ] |
| **TC-F100-03** | Khách đạt ngưỡng HOT LEAD (🔥 Điểm &gt; 80) | 1. Khách có SĐT (+25), Email (+15), vừa nhắn tin (+20), và có 1 Deal đang mở (+15) + AI Intent (+15). | Tổng điểm = 90 điểm | • Hiển thị huy hiệu đỏ rực: **"HOT LEAD 🔥 (90/100)"**.<br>• Được tự động đưa lên nhóm ưu tiên cao nhất trong danh sách cần gọi điện chốt đơn. | [ ] |
| **TC-F100-04** | Trừ điểm khi khách không tương tác lâu ngày (Decay) | 1. Khách hàng đã hơn 30 ngày không có bất kỳ tin nhắn hay hoạt động nào. | Lần tương tác cuối > 30 ngày | • Bị trừ tự động **-25 điểm** suy giảm.<br>• Trạng thái hạ xuống **"COLD ❄️"** kèm cảnh báo: *"Khách nguội lạnh, cần tái kích hoạt"*. | [ ] |
| **TC-F100-05** | Bộ lọc danh sách khách theo mức độ Lead Score | 1. Trên trang Khách hàng CRM, bấm lọc theo mức: `Tất cả`, `HOT (>80)`, `WARM (50-79)`, `COLD (<50)`. | Chọn tab lọc HOT | • Danh sách chỉ hiển thị đúng các khách hàng đạt ngưỡng điểm tương ứng. | [ ] |
| **TC-F100-06** | Giao diện Header & Thanh tab lọc không bị xuống dòng hay cắt chữ (UI/UX Responsiveness) | 1. Mở app Topify $\rightarrow$ Khách hàng (CRM).<br>2. Quan sát cụm nút header (*"Nạp mẫu test F100/F101"*, *"Quét trùng (0)"*, *"Thêm khách hàng"*).<br>3. Quan sát thanh tab lọc (*"Tất cả"*, *"HOT Leads"*, *"WARM Leads"*, *"COLD Leads"*, *"Nghi trùng lặp"*). | Màn hình máy tính các độ phân giải phổ thông | • Cả 3 nút header hiển thị thẳng hàng trên 1 dòng duy nhất, đồng đều chiều cao h-9 (36px), không ngắt dòng chữ.<br>• Các tab lọc hiển thị đầy đủ nhãn và số lượng, không bị ép thành hình tròn hay cắt mất chữ; hỗ trợ cuộn ngang mượt mà nếu thiếu chỗ. | [x] |

---

## [F101] - Duplicate Detection & Merge (Phát hiện trùng & Hợp nhất hồ sơ)

* **Phân hệ:** M4. Customer & Lead CRM (Quản lý dữ liệu khách hàng).
* **Mục tiêu:** Tự động rà quét các hồ sơ khách hàng bị trùng lặp do nhắn tin từ nhiều kênh khác nhau (TikTok, Facebook, Zalo) hoặc do nhân viên nhập trùng; cung cấp giao diện đối chiếu 2 cột và cơ chế hợp nhất (Merge) an toàn, tự động chuyển toàn bộ Deals, Conversations và Activities về một hồ sơ chính duy nhất.
* **Quy tắc quét trùng:**
  * **Trùng tuyệt đối (100%):** Trùng số điện thoại hoặc trùng Email.
  * **Trùng tương đối (Fuzzy Matching > 80%):** Trùng họ tên (chuẩn hóa bỏ dấu tiếng Việt) kết hợp cùng social handle hoặc cùng địa chỉ.

### 📋 Bảng Test Cases F101

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F101-01** | Cảnh báo trùng lặp khi thêm mới khách hàng | 1. Bấm "Thêm khách hàng".<br>2. Nhập SĐT hoặc Email đã tồn tại trong hệ thống.<br>3. Bấm Lưu. | SĐT trùng: *"0912345678"* | • Cảnh báo hiển thị ngay: *"Đã tồn tại khách hàng [Tên cũ] với số điện thoại này"*, ngăn chặn tạo bản ghi rác. | [ ] |
| **TC-F101-02** | Rà quét danh sách hồ sơ nghi ngờ trùng lặp | 1. Bấm nút **"Quét hồ sơ trùng"** (Duplicate Scanner) trên CRM. | Cơ sở dữ liệu khách | • Liệt kê các cặp/nhóm hồ sơ bị nghi ngờ trùng lặp (ví dụ: Cùng SĐT nhưng khác tên, hoặc tên không dấu tương tự).<br>• Hiển thị lý do: *"Trùng SĐT (100%)"* hoặc *"Tên tương đồng (85%)"*. | [ ] |
| **TC-F101-03** | Mở Modal Đối chiếu & Hợp nhất (Merge Modal) | 1. Tại cặp hồ sơ nghi trùng, bấm **"Hợp nhất hồ sơ"**.<br>2. Quan sát giao diện mở lên. | Click Hợp nhất | • Modal hiển thị 2 cột đối chiếu rõ ràng: **Hồ sơ A** và **Hồ sơ B**.<br>• Cho phép chọn radio button chọn hồ sơ nào làm **Hồ sơ chính (Master Record)**.<br>• Cho phép tích chọn giữ lại trường thông tin mong muốn (giữ SĐT của A, Email của B). | [ ] |
| **TC-F101-04** | Thực hiện hợp nhất và chuyển đổi dữ liệu liên kết | 1. Xác nhận hợp nhất Hồ sơ B vào Hồ sơ A.<br>2. Bấm nút **"Tiến hành Hợp nhất"**. | Xác nhận Merge | • Thông báo toast thành công.<br>• Toàn bộ `Deal` của hồ sơ B được chuyển sang hồ sơ A.<br>• Toàn bộ `Conversation` chat được cập nhật `contactId` sang hồ sơ A.<br>• Toàn bộ thẻ `tags` và ghi chú được gộp lại, thêm vết audit log: *"Hợp nhất từ hồ sơ B"*.<br>• Hồ sơ B được xóa an toàn hoặc chuyển trạng thái `MERGED`. | [ ] |
| **TC-F101-05** | Bảo toàn tính cô lập Workspace (Data Isolation) | 1. Khách hàng X ở Workspace 1 có SĐT `0900000000`.<br>2. Khách hàng Y ở Workspace 2 có cùng SĐT `0900000000`. | 2 Workspace khác nhau | • Không báo trùng lặp chéo giữa các Workspace khác nhau. | [ ] |

---

## [F103] - Content Performance Score (Điểm hiệu quả nội dung chuẩn hóa)

* **Phân hệ:** M5. Analytics (Màn hình Báo cáo & Phân tích `/analytics` trên Electron App).
* **Mục tiêu:** Chuẩn hóa toàn bộ số liệu phân tán (views, reach, likes, comments, shares, clicks, conversions) thành một thang điểm duy nhất từ 0 - 100 điểm, tự động phân hạng VIRAL 🏆, ĐẠT KPI ⭐, hoặc CẦN CẢI THIỆN ⚠️.

### 📋 Bảng Test Cases F103

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F103-01** | Tính toán điểm hiệu quả chuẩn hóa (0-100) | 1. Mở `/analytics` $\rightarrow$ Tab **"Điểm Hiệu Quả Nội Dung"**.<br>2. Xem danh sách bài viết đã xuất bản. | Bài viết có 52,000 views, 4,200 likes, 890 shares, 28 conversions | • Hệ thống tính đúng 4 thành phần điểm: Reach (30), Engagement (40), Click (20), Conversion (10).<br>• Tổng điểm đạt ngưỡng cao: **> 85/100 điểm**. | [ ] |
| **TC-F103-02** | Phân hạng và hiển thị huy hiệu Viral 🏆 | 1. Quan sát bài viết có điểm tổng >= 85 điểm.<br>2. Kiểm tra cột xếp loại và thao tác nhanh. | Bài viết đạt 95/100đ | • Hiển thị huy hiệu: **VIRAL (Top Tier)** kèm ngọn lửa vàng.<br>• Hiển thị nút **"Bật Evergreen"** để 1-click đưa vào chuỗi tái sử dụng tự động (F083). | [ ] |
| **TC-F103-03** | Bộ lọc theo nền tảng và xếp hạng | 1. Bấm lọc theo nền tảng: `TikTok`, `Facebook`, `Instagram`, `YouTube`.<br>2. Chọn xếp loại `Viral`, `Đạt KPI`, `Cần cải thiện`. | Click bộ lọc | • Bảng lọc danh sách bài viết chính xác theo tiêu chí chọn.<br>• Các thẻ thống kê tổng quan cập nhật theo bộ lọc. | [ ] |
| **TC-F103-04** | Tính toán điểm phân hóa theo số liệu thực tế & Phân bổ tỷ lệ phân hạng tự nhiên | 1. Mở `/analytics` $\rightarrow$ Tab **"Điểm Hiệu Quả Nội Dung"**.<br>2. Chọn lọc theo nền tảng (ví dụ: `YouTube` hoặc `Tất cả`).<br>3. So sánh cột "Điểm thành phần (0-100)" và điểm tổng giữa các bài viết có số liệu reach, tương tác, clicks, deals khác biệt.<br>4. Quan sát 4 thẻ thống kê tổng quan phía trên. | Danh sách bài viết đa dạng chỉ số | • Các bài viết có số liệu khác nhau sẽ có điểm tổng và điểm thành phần (R, E, C, CV) phân hóa khác biệt rõ ràng, phản ánh đúng hiệu quả thực tế.<br>• 4 thẻ thống kê phân bổ tự nhiên theo 3 nhóm (Viral >= 85đ, Đạt KPI 60-84đ, Cần Tối Ưu < 60đ), điểm TB chuẩn hóa phản ánh đúng phân phối. | [x] |


---

## [F104] - Campaign ROI (Đo lường chi phí, Lead, Doanh thu & ROI Chiến dịch)

* **Phân hệ:** M5. Analytics (Màn hình `/analytics` trên Electron App).
* **Mục tiêu:** Tính toán tự động ROI (Return on Investment) của từng chiến dịch tiếp thị dựa trên chi phí thực tế và doanh thu chốt Deal trong CRM.

### 📋 Bảng Test Cases F104

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F104-01** | Tính toán Doanh thu, Lợi nhuận và ROI % | 1. Mở `/analytics` $\rightarrow$ Tab **"ROI Chiến Dịch & Phễu"**.<br>2. Xem bảng chi tiết chiến dịch. | Chiến dịch chi 32 triệu, Doanh thu Deals WON đạt 112 triệu | • Tính đúng Lợi nhuận ròng = **+80 triệu**.<br>• Tỷ suất ROI tính đúng = **+250%** (Hiển thị nhãn xanh lá). | [ ] |
| **TC-F104-02** | Tính toán chỉ số CPL và CPA | 1. Kiểm tra cột CPL (Cost Per Lead) và CPA (Cost Per Acquisition). | Chi phí 32 triệu, 160 Leads, 5 Deals WON | • CPL tính đúng: 200,000đ/Lead.<br>• CPA tính đúng: 6,400,000đ/Khách chốt đơn. | [ ] |
| **TC-F104-03** | Cảnh báo chiến dịch ROI âm | 1. Xem chiến dịch thử nghiệm có chi phí > doanh thu. | Chi phí 9.8 triệu, Doanh thu 7.7 triệu | • ROI hiển thị số âm (ví dụ: **-21%**) kèm màu đỏ cảnh báo. | [ ] |

---

## [F105] - Lead Conversion Funnel (Phễu chuyển đổi toàn diện)

* **Phân hệ:** M5. Analytics (Màn hình `/analytics` trên Electron App).
* **Mục tiêu:** Trực quan hóa 4 tầng phễu (Tương tác $\rightarrow$ Lead $\rightarrow$ Deal $\rightarrow$ Won), tỷ lệ rớt khách qua từng tầng và phát hiện điểm nghẽn (Bottlenecks).

### 📋 Bảng Test Cases F105

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F105-01** | Hiển thị 4 tầng phễu chuyển đổi trực quan | 1. Mở `/analytics` $\rightarrow$ Tab **"ROI Chiến Dịch & Phễu"**.<br>2. Xem biểu đồ phễu chuyển đổi. | Dữ liệu tương tác, lead, deal | • Hiển thị 4 thanh tiến trình tương ứng 4 tầng: 1. Tương tác $\rightarrow$ 2. Lead CRM $\rightarrow$ 3. Deal Pipeline $\rightarrow$ 4. Won Deals.<br>• Hiển thị số lượng và % so với đỉnh phễu. | [ ] |
| **TC-F105-02** | Đo lường tỷ lệ rớt khách (Drop-off rate) | 1. Quan sát phần trăm rớt khách giữa các tầng. | Chênh lệch số lượng giữa các tầng | • Hiển thị nhãn đỏ: `- % rớt` ở mỗi bước chuyển đổi.<br>• Tính đúng tỷ lệ chuyển đổi tổng thể (Overall Conversion Rate). | [ ] |
| **TC-F105-03** | Tự động phát hiện điểm nghẽn (Bottlenecks) | 1. Tỷ lệ chuyển đổi từ Lead sang Deal thấp. | Drop-off > 70% | • Xuất hiện box cảnh báo màu vàng: *"Hơn 70% Lead chưa được tạo Deal. Đội ngũ tư vấn cần chủ động mở cơ hội báo giá trong 15 phút"*. | [ ] |

---

## [F106] - AI Insight & Recommendation (Trợ lý AI phân tích & đề xuất tăng trưởng)

* **Phân hệ:** M5. Analytics (Kết nối cổng AI 9router).
* **Mục tiêu:** Tự động giải thích nguyên nhân biến động số liệu và đưa ra các đề xuất hành động thực tế (Next Best Actions).

### 📋 Bảng Test Cases F106

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F106-01** | Sinh khuyến nghị AI qua 9router | 1. Mở Tab **"AI Insights & Benchmark"**.<br>2. Bấm nút **"Phân tích lại với 9router"**. | Số liệu thống kê Workspace | • Hiển thị bản tóm tắt Executive Summary súc tích.<br>• Hiển thị các yếu tố tác động chính (Key Drivers) với nhãn POSITIVE/NEGATIVE.<br>• Hiển thị 3 đề xuất hành động phân cấp HIGH/MEDIUM/LOW kèm kết quả kỳ vọng. | [ ] |
| **TC-F106-02** | Heuristic Fallback khi chưa cấu hình key 9router | 1. Chạy trên môi trường offline/chưa có API key 9router.<br>2. Bấm phân tích AI. | Dữ liệu số liệu | • Hệ thống tự động phân tích theo Heuristic Engine nội bộ.<br>• Không bao giờ bị crash hoặc lỗi 500.<br>• Hiển thị nhãn `Heuristic Analysis` minh bạch. | [ ] |

---

## [F107] - Benchmark Nội Bộ (So sánh đa nền tảng & Content Pillar)

* **Phân hệ:** M5. Analytics (Màn hình `/analytics` trên Electron App).
* **Mục tiêu:** So sánh chéo hiệu quả giữa các nền tảng (TikTok vs FB vs IG vs YouTube) và các định hướng nội dung (Pillars) trong cùng Workspace.

### 📋 Bảng Test Cases F107

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F107-01** | So sánh hiệu suất đa nền tảng | 1. Mở Tab **"AI Insights & Benchmark"** $\rightarrow$ Xem khối **"So Sánh Benchmark Giữa Các Kênh"**. | Dữ liệu 4 nền tảng | • Hiển thị bảng so sánh 4 kênh: TikTok, Facebook, Instagram, YouTube.<br>• So sánh số bài, tổng reach, % tương tác trung bình, điểm hiệu quả và số Deal tạo ra. | [ ] |
| **TC-F107-02** | Phân tích hiệu suất theo Content Pillars | 1. Xem khối **"Hiệu Suất Theo Định Hướng Nội Dung"**. | Nhóm chủ đề bài viết | • Hiển thị thanh tiến trình so sánh điểm số và số Lead mang lại giữa các nhóm: Giáo dục, Giải trí, Giới thiệu sản phẩm, Review/Feedback. | [ ] |

---

## [F108] - Social Search & Public Signal (Thám tử xu hướng & Tìm kiếm MXH)

* **Phân hệ:** M6. Intelligence (Màn hình `/intelligence/social-search` trên Electron App).
* **Mục tiêu:** Tìm kiếm nội dung viral, tín hiệu công chúng và nhu cầu mua sắm từ đối thủ & thị trường theo từ khóa/chủ đề; hỗ trợ chuyển ý tưởng 1-click sang Content Studio.

### 📋 Bảng Test Cases F108

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F108-01** | Tìm kiếm xu hướng theo từ khóa | 1. Mở menu **"Thám tử xu hướng (MXH)"**.<br>2. Nhập từ khóa: *"áo sơ mi"* hoặc *"máy hút bụi"* $\rightarrow$ Bấm Tìm kiếm. | Từ khóa tìm kiếm | • Trả về danh sách các bài viết viral từ thị trường khớp với từ khóa.<br>• Hiển thị số đo Likes, Comments, Shares, Điểm Viral Score (0-100). | [ ] |
| **TC-F108-02** | Phát hiện tín hiệu hỏi mua (BUYING_INTENT) | 1. Quan sát các bài viết có gắn nhãn xanh lá: **"Tín Hiệu Nhu Cầu Mua Hàng Cao"**. | Bài viết có từ khóa mua sắm | • Hiển thị mô tả tín hiệu (ví dụ: *"Hơn 1,200 bình luận hỏi shop ở đâu, còn size M không"*). | [ ] |
| **TC-F108-03** | 1-Click chuyển ý tưởng sang Content Studio | 1. Tại bài viết viral bất kỳ, bấm nút **"1-Click Chuyển Ý Tưởng Sang Content Studio"**. | Click chuyển ý tưởng | • Hệ thống tự động chuyển hướng sang màn hình `/create`.<br>• Bản thảo bài viết được điền sẵn nội dung mô tả, tiêu đề và hashtag từ bài viral để người dùng chỉnh sửa và đăng ngay. | [ ] |
| **TC-F108-04** | Bộ lọc nền tảng và sắc thái | 1. Lọc theo kênh TikTok, Facebook...<br>2. Lọc theo sắc thái: Hỏi mua, Khen ngợi, Thảo luận. | Chọn filter | • Danh sách cập nhật tức thì, hiển thị đúng các bài viết thỏa mãn điều kiện. | [ ] |
| **TC-F108-05** | Bố cục Header Card tín hiệu: Hiển thị trọn vẹn Tên tác giả, Ngày đăng và Badges | 1. Mở menu **"Thám tử xu hướng (MXH)"**.<br>2. Để mặc định bộ lọc hoặc tìm kiếm bài viết bất kỳ.<br>3. Quan sát phần đầu các card kết quả (Avatar, Tên tác giả, Ngày đăng, Badge nền tảng, Badge điểm viral). | Card kết quả tìm kiếm | • Tên tác giả và ngày đăng hiển thị rõ ràng, đầy đủ; không bị badge đè hay che mất.<br>• Badge nền tảng và badge điểm viral được bố trí ngăn nắp ở góc phải, căn chỉnh theo 2 hàng hài hòa với tên và ngày.<br>• Tên tác giả dài được cắt gọn bằng "..." kèm tooltip hiển thị toàn bộ tên khi rê chuột, ngày đăng hiển thị trọn vẹn 100%. | [x] |


---

## [F110] - Trending / Viral Content Detection (Nội dung thịnh hành & Bùng nổ)

* **Phân hệ:** M6. Intelligence (Màn hình `/intelligence/alerts` Tab **"Nội dung Bùng nổ"**).
* **Mục tiêu:** Nhận diện và xếp hạng video bùng nổ theo vận tốc Viral Velocity, hỗ trợ 1-click Remix sang Content Studio.

### 📋 Bảng Test Cases F110

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F110-01** | Xem danh sách nội dung thịnh hành | 1. Mở menu **"Cảnh báo bùng nổ"** (`/intelligence/alerts`).<br>2. Xem danh sách bài viết tại Tab **"Nội dung Bùng nổ"**. | API trending items | • Hiển thị danh sách thẻ video kèm thumbnail, tác giả, huy hiệu bùng nổ (ví dụ: `🔥 Bùng Nổ (+15,000 views/h)`).<br>• Hiển thị điểm số Viral Velocity (0-100). | [ ] |
| **TC-F110-02** | Lọc theo nền tảng | 1. Bấm chọn nút nền tảng: `TIKTOK`, `FACEBOOK`, `INSTAGRAM`, `YOUTUBE`. | Filter click | • Danh sách chỉ hiển thị video thuộc đúng nền tảng đã chọn. | [ ] |
| **TC-F110-03** | 1-Click tạo bài viết phái sinh (Remix AI) | 1. Bấm nút **"Tạo bài viết phái sinh (Remix AI)"** tại thẻ video viral. | Click remix button | • Hệ thống chuyển hướng sang `/create?trendTopic=...`<br>• Toast thông báo: *"Đã nạp chủ đề viral vào Content Studio để tạo bài viết phái sinh!"*. | [ ] |

---

## [F112] - Keyword / Viral Alert (Cảnh báo ngưỡng viral & từ khóa)

* **Phân hệ:** M6. Intelligence (Màn hình `/intelligence/alerts` Tab **"Cảnh báo Đã kích hoạt & Quy tắc"**).
* **Mục tiêu:** Thiết lập quy tắc ngưỡng điểm viral tối thiểu và danh sách từ khóa theo dõi; nhận thông báo khi có nội dung đột biến.

### 📋 Bảng Test Cases F112

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F112-01** | Tạo quy tắc cảnh báo mới | 1. Bấm nút **"Thiết lập Cảnh báo mới"**.<br>2. Nhập tên quy tắc, kéo thanh điểm ngưỡng (ví dụ: 80đ).<br>3. Thêm từ khóa: `Review`, `Khuyến mãi`<br>4. Bấm Lưu quy tắc. | Rule form modal | • Tạo quy tắc thành công, hiển thị trong cột Quy Tắc Cảnh Báo.<br>• Gọi `POST /api/intelligence/alerts` trả về HTTP 200. | [ ] |
| **TC-F112-02** | Đánh dấu cảnh báo đã đọc | 1. Tại danh sách Cảnh báo đã kích hoạt, bấm **"Đánh dấu đã đọc"** trên một sự kiện chưa đọc. | Click "Đánh dấu đã đọc" | • Thẻ cảnh báo chuyển sang màu nền xám mờ nhạt.<br>• Bộ đếm huy hiệu số thông báo chưa đọc trên tab giảm đi 1. | [ ] |
| **TC-F112-03** | Xóa quy tắc cảnh báo | 1. Bấm biểu tượng thùng rác tại một quy tắc bất kỳ.<br>2. Xác nhận hộp thoại xóa. | Click Delete | • Quy tắc bị xóa khỏi danh sách, toast thông báo xóa thành công. | [ ] |

---

## [F113] - Resize Đa Nền Tảng (Multi-Aspect Ratio Video & Image)

* **Phân hệ:** M7. Media Studio & M2. Studio Nội Dung & Spin (Truy cập tại `/content-studio` Tab **"Resize Đa Nền Tảng (F113)"** hoặc `/media/studio` Tab 1 **"[F113] Resize Đa Nền Tảng"**).
* **Mục tiêu:** Chuyển đổi tỷ lệ asset sang các định dạng phù hợp Facebook / Instagram / TikTok / YouTube Shorts (9:16, 1:1, 16:9, 4:5) kèm 3 chế độ co dãn (Fit Blur, Center Crop, Letterbox), hỗ trợ chuyển đổi Canvas thực tế và tải về hoặc áp dụng sang Tạo bài viết.

### 📋 Bảng Test Cases F113

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F113-01** | Resize đa nền tảng tại Studio Nội dung & Spin | 1. Mở app Topify $\rightarrow$ Click menu **"Studio Nội dung & Spin"** (`/content-studio`).<br>2. Bấm Tab **"Resize Đa Nền Tảng (F113)"**.<br>3. Chọn tỷ lệ 9:16 (TikTok/Shorts) hoặc 1:1 (Facebook/IG) $\rightarrow$ Quan sát khung hình. | Click tab & chọn tỷ lệ | • Hiển thị giao diện MultiPlatformResizer hoàn chỉnh ngay trong Studio Nội dung.<br>• Chuyển đổi khung hình xem trước sang đúng tỷ lệ chuẩn.<br>• Đầy đủ thông số kích thước và nền tảng hỗ trợ. | [x] Đã Đạt |
| **TC-F113-02** | Thay đổi chế độ co dãn (Fit Blur / Center Crop / Letterbox) | 1. Chọn chế độ `Fit Blur (Nền mờ)`.<br>2. Chuyển sang `Center Crop (Cắt tâm)`.<br>3. Chuyển sang `Letterbox (Viền đen)`. | Click radio chế độ | • Chế độ Fit Blur: Asset giữ nguyên vẹn ở giữa, nền sau mờ Gaussian.<br>• Chế độ Center Crop: Asset phủ kín toàn khung hình tập trung vào tâm.<br>• Chế độ Letterbox: Asset giữ tỷ lệ với dải đen điện ảnh. | [x] Đã Đạt |
| **TC-F113-03** | Chuyển đổi và Tải ảnh chuẩn hóa thực tế (Export Canvas) | 1. Bấm nút **"Chuyển Đổi & Tải Về"** (hoặc chọn tỷ lệ). | Click Export | • Hệ thống sử dụng HTML5 Canvas vẽ ảnh ở độ phân giải thực (1080x1920, 1080x1080,...), áp dụng hiệu ứng và kích hoạt tải về file `.png` sắc nét ngay lập tức. | [x] Đã Đạt |
| **TC-F113-04** | Áp dụng Asset đã resize sang Tạo Bài Viết | 1. Bấm nút **"Áp Dụng Cho Bài Viết"**.<br>2. Kiểm tra màn hình Tạo bài viết (`/create`). | Click Áp dụng | • Tự động chuyển hướng sang `/create` kèm asset đã resize làm media chính, điền sẵn tiêu đề và hashtag phù hợp tỷ lệ. | [x] Đã Đạt |

---

## [F114] - Repurpose Video (Trích xuất Clip ngắn Viral)

* **Phân hệ:** M7. Media Studio (Màn hình `/media/studio` Tab **"Trích Xuất Clip Ngắn (Repurpose)"**).
* **Mục tiêu:** Tự động phát hiện và cắt video dài thành các đoạn 30s-60s kèm điểm viral, 3s hook point và hashtag.

### 📋 Bảng Test Cases F114

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F114-01** | Phân tích trích xuất clip ngắn qua AI Gateway | 1. Mở Tab Repurpose.<br>2. Nhập tiêu đề video dài $\rightarrow$ Bấm nút **"Bắt đầu phân tích & trích xuất clip"**. | Video title & duration | • Gửi yêu cầu qua `POST /api/media/repurpose` (9router gateway).<br>• Trả về danh sách 2-3 clip ngắn kèm timestamp, thời lượng 30s-60s, điểm viral (94-96đ). | [ ] |
| **TC-F114-02** | Xem điểm hook và đề xuất caption | 1. Xem chi tiết thẻ Clip 1. | Danh sách clip | • Hiển thị Hook 3s đầu tiên (ví dụ: *"3 sai lầm khiến bàn làm việc bừa bộn..."*).<br>• Caption gợi ý và danh sách hashtag đã được tạo sẵn. | [ ] |
| **TC-F114-03** | 1-Click đưa sang Content Studio | 1. Bấm nút **"1-Click Lên Lịch Bài Viết"** tại clip mong muốn. | Click nút | • Chuyển sang `/create` với tiêu đề, caption và hashtag của clip ngắn đã được nạp sẵn. | [ ] |

---

## [F115] - Auto Subtitles (Tạo Phụ Đề Tự Động)

* **Phân hệ:** M7. Media Studio (Màn hình `/media/studio` Tab **"Tạo Phụ Đề (Auto Subtitle)"**).
* **Mục tiêu:** Nhận diện lời thoại, tạo phụ đề WebVTT/SRT có timestamp và hỗ trợ kiểu chữ động phong cách TikTok.

### 📋 Bảng Test Cases F115

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F115-01** | Tự động tạo phụ đề qua AI | 1. Mở Tab Subtitle.<br>2. Bấm nút **"Tạo phụ đề tự động (9router AI)"**. | Video stream | • Gọi `POST /api/media/subtitles` (9router gateway).<br>• Trả về danh sách các câu phụ đề theo timestamp (Subtitle Cue Editor). | [ ] |
| **TC-F115-02** | Chỉnh sửa nội dung phụ đề trực tiếp | 1. Nhấp chuột vào câu phụ đề thứ 1 trong Subtitle Cue Editor.<br>2. Sửa lại từ ngữ theo ý muốn. | Input text | • Nội dung cập nhật ngay lập tức trên dòng phụ đề và khung xem trước. | [ ] |
| **TC-F115-03** | Chuyển đổi phong cách chữ TikTok | 1. Bấm chọn kiểu chữ **"Vàng Viền Đen (TikTok Style)"** hoặc **"Trắng Nền Tối"**. | Click style | • Phụ đề trên video preview đổi màu chữ, viền text shadow và phông chữ đậm. | [ ] |
| **TC-F115-04** | Sao chép tệp SRT | 1. Bấm nút **"Sao chép tệp SRT"**. | Click copy | • Nội dung chuỗi SRT chuẩn timestamp được lưu vào clipboard của hệ điều hành. | [ ] |

---

## [F117] - Invitation & Seat Management (Quản lý Ghế ngồi & Lời mời)

* **Phân hệ:** M8. Workspace & Admin (Màn hình `/team` trên Electron App).
* **Mục tiêu:** Quản lý hạn mức ghế ngồi (Seat Quota Progress), kiểm soát Quota Guard ngăn mời vượt ngưỡng, và quản lý lời mời thành viên.

### 📋 Bảng Test Cases F117

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F117-01** | Xem định mức ghế ngồi Workspace | 1. Mở menu **"Quản lý nhân sự"** (`/team`).<br>2. Quan sát banner trên cùng. | API `/workspace/seats` | • Hiển thị tổng số ghế đã dùng / tổng ghế cho phép (ví dụ: 3/5 ghế).<br>• Thanh tiến trình phần trăm ghế sử dụng. | [ ] |
| **TC-F117-02** | Gửi lời mời thành viên mới | 1. Bấm nút **"Mời thành viên mới"**.<br>2. Nhập email: `test.staff@example.com`, chọn quyền Staff $\rightarrow$ Bấm Gửi Lời Mời. | Email hợp lệ | • Lời mời hiển thị trong bảng "Lời Mời Đang Chờ Phê Duyệt" với trạng thái `PENDING`. | [ ] |
| **TC-F117-03** | Kiểm soát Quota Guard khi hết ghế | 1. Giả lập mời vượt quá số ghế của gói (ví dụ gói Free chỉ có 1 ghế). | Invite khi seatsAvailable = 0 | • Nút mời bị vô hiệu hóa hoặc API trả về 403 `isOverQuota: true`.<br>• Toast cảnh báo kèm nút gợi ý *"Nâng cấp ngay"*. | [ ] |
| **TC-F117-04** | Sao chép liên kết mời & Thu hồi lời mời | 1. Bấm nút **"Link"** tại một lời mời đang chờ.<br>2. Bấm nút **"Thu hồi"**. | Actions | • Nút Link: Sao chép URL mời vào clipboard.<br>• Nút Thu hồi: Trạng thái lời mời chuyển sang `REVOKED` và giải phóng ghế. | [ ] |

---

## [F118] - Usage Metering & Quota (Định mức sử dụng tài nguyên)

* **Phân hệ:** M8. Workspace & Admin (Màn hình `/settings?tab=quota`).
* **Mục tiêu:** Đo lường và hiển thị trực quan mức tiêu thụ 4 chỉ số: Channels, Posts, AI Credits, Storage GB.

### 📋 Bảng Test Cases F118

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F118-01** | Xem 4 đồng hồ đo mức sử dụng | 1. Mở Cài đặt $\rightarrow$ Chọn Tab **"Gói cước & Định mức"**.<br>2. Xem khối "Định Mức Sử Dụng Tháng Này". | API `/workspace/quota` | • Hiển thị đủ 4 thanh đo: Kênh kết nối, Bài viết trong tháng, AI Credits, Dung lượng Cloud.<br>• Tỷ lệ % và số liệu sử dụng/giới hạn rõ ràng. | [ ] |
| **TC-F118-02** | Cập nhật thời gian thực khi đăng bài | 1. Đăng thêm 1 bài viết mới tại `/create`.<br>2. Quay lại tab Quota. | Bài viết mới | • Bộ đếm số bài viết trong tháng tăng thêm 1 bài. | [ ] |

---

## [F119] - Trial, Upgrade & Prorated Billing (Dùng thử & Bù trừ gói cước)

* **Phân hệ:** M8. Workspace & Admin (Màn hình `/settings?tab=quota`).
* **Mục tiêu:** Kích hoạt 14 ngày dùng thử PRO và tính toán chi phí bù trừ khi nâng cấp/chuyển gói giữa chu kỳ.

### 📋 Bảng Test Cases F119

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F119-01** | Kích hoạt 14 ngày dùng thử PRO | 1. Khi đang ở gói Free, bấm nút **"Kích hoạt 14 ngày dùng thử PRO"**. | Click Start Trial | • Kích hoạt thành công, gói dịch vụ đổi sang PRO kèm nhãn `Trial`. | [ ] |
| **TC-F119-02** | Xem trước chi phí bù trừ (Prorated Billing Modal) | 1. Bấm nút **"Nâng cấp lên Doanh Nghiệp (Enterprise)"** tại bảng so sánh. | Click Upgrade | • Xuất hiện modal tính toán bù trừ:<br>  - Trừ tiền chu kỳ cũ chưa dùng.<br>  - Tính chi phí gói mới theo số ngày còn lại.<br>  - Hiển thị số tiền thực thanh toán hôm nay. | [ ] |
| **TC-F119-03** | Xác nhận chuyển đổi gói | 1. Bấm nút **"Xác nhận chuyển đổi gói"** trong modal. | Confirm | • Gói dịch vụ được cập nhật ngay lập tức sang Enterprise, định mức ghế và kênh được mở khóa không giới hạn. | [ ] |

---

## [F120] - Billing History & Invoice (Lịch sử thanh toán & Hóa đơn)

* **Phân hệ:** M8. Workspace & Admin (Màn hình `/settings?tab=billing`).
* **Mục tiêu:** Quản lý danh sách biên lai, đối soát chu kỳ thuê bao và tải hóa đơn VAT điện tử.

### 📋 Bảng Test Cases F120

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F120-01** | Xem bảng lịch sử hóa đơn | 1. Chọn Tab **"Lịch sử Hóa đơn"** trong Cài đặt. | API `/workspace/billing` | • Hiển thị bảng danh sách các hóa đơn: Mã hóa đơn (INV-...), Tên gói, Số tiền VND, Chu kỳ, Trạng thái `Đã thanh toán`. | [ ] |
| **TC-F120-02** | Tải hóa đơn điện tử | 1. Bấm nút **"PDF"** tại một hóa đơn bất kỳ. | Click PDF | • Toast thông báo đang tải hóa đơn điện tử tương ứng. | [ ] |

---

## [F121] - Data Export & Account Deletion (Xuất dữ liệu & Xóa an toàn)

* **Phân hệ:** M8. Workspace & Admin (Màn hình `/settings?tab=data`).
* **Mục tiêu:** Xuất bản sao lưu toàn bộ dữ liệu Workspace và chính sách xóa an toàn với 30 ngày ân hạn (Grace Period).

### 📋 Bảng Test Cases F121

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F121-01** | Xuất toàn bộ dữ liệu Workspace (.JSON / .ZIP) | 1. Mở Tab **"Xuất dữ liệu & Hủy tài khoản"**.<br>2. Bấm nút **"Tải xuống gói dữ liệu đầy đủ"**. | Click Export | • Trình duyệt tự động tải xuống tệp `Topify_Workspace_Export_....json`.<br>• Tệp chứa toàn bộ thông số Posts, CRM Leads, Deals, và Checksum SHA256. | [ ] |
| **TC-F121-02** | Nhập sai từ khóa xác nhận xóa | 1. Tại khung Xóa Workspace, nhập từ khóa sai (ví dụ: *"xoa"* hoặc để trống) $\rightarrow$ Bấm Xác nhận. | Text sai | • Nút bị vô hiệu hóa hoặc báo lỗi: *"Vui lòng nhập đúng chuỗi DELETE_WORKSPACE"*. | [ ] |
| **TC-F121-03** | Đưa Workspace vào hàng đợi xóa 30 ngày | 1. Nhập chính xác `DELETE_WORKSPACE` $\rightarrow$ Bấm Xác nhận. | Text chuẩn | • Workspace chuyển sang trạng thái `PENDING_DELETION`.<br>• Hiển thị thời điểm xóa vĩnh viễn dự kiến sau 30 ngày. | [ ] |
| **TC-F121-04** | Khôi phục Workspace trong thời gian ân hạn | 1. Bấm nút **"Khôi phục Workspace ngay bây giờ"**. | Click Restore | • Hủy lệnh xóa ngay lập tức, dữ liệu trở về trạng thái hoạt động bình thường an toàn. | [ ] |

---

## [F062] - Thanh toán & Gia hạn (Cổng SePay VietQR)

* **Phân hệ:** M8. Workspace & Admin (Màn hình `/settings?tab=quota`, `/settings?tab=billing` & Web `/thanh-toan/sepay`).
* **Mục tiêu:** Tự động hóa toàn diện quy trình nạp tiền & gia hạn gói cước qua VietQR SePay, chiết khấu chu kỳ (1/6/12 tháng), cộng dồn hạn dùng (`planExpiresAt`), bảo vệ Idempotency chống cộng trùng, quản lý thời gian ân hạn 3 ngày (Grace Period) và xuất hóa đơn điện tử VAT.

### 📋 Bảng Test Cases F062

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F062-01** | Tạo đơn hàng SePay VietQR đa chu kỳ | 1. Mở Cài đặt $\rightarrow$ Tab Gói cước $\rightarrow$ Bấm "Gia hạn qua VietQR (SePay)".<br>2. Chọn chu kỳ 1 tháng, 6 tháng (-10%), 12 tháng (-20%). | POST `/api/payment/sepay/create-order` | • Sinh mã giao dịch độc nhất dạng `TPF{random}`.<br>• Tính đúng số tiền sau chiết khấu (PRO: 499k/tháng, 6mo: 2.694.600đ, 12mo: 4.790.400đ; ENTERPRISE: 1.990k/tháng, 6mo: 10.746.000đ, 12mo: 19.104.000đ).<br>• Trả về link ảnh VietQR SePay chuẩn mẫu Napas247. | [x] |
| **TC-F062-02** | Xử lý Webhook SePay và kích hoạt gói | 1. Giả lập SePay gửi Webhook thanh toán thành công với nội dung chứa mã `TPF...` và đúng số tiền. | POST `/api/webhooks/payment` | • Đơn hàng chuyển sang trạng thái `COMPLETED`.<br>• Gói của Workspace nâng lên PRO/ENTERPRISE.<br>• Trạng thái thuê bao chuyển sang `ACTIVE`. | [x] |
| **TC-F062-03** | Cộng dồn thời hạn sử dụng (Stacking Expiry) | 1. Workspace đang có gói PRO còn hạn 10 ngày.<br>2. Người dùng nạp gia hạn thêm 6 tháng. | Gia hạn khi `planExpiresAt > now` | • Hạn dùng mới = `planExpiresAt hiện tại + 6 * 30 ngày` (không bị mất 10 ngày còn lại). | [x] |
| **TC-F062-04** | Chống trùng lặp Webhook (Idempotency Guard) | 1. SePay gửi lại Webhook trùng lặp cho đơn hàng đã `COMPLETED`. | Webhook retry | • Trả về 200 OK với thông điệp đơn hàng đã được xử lý.<br>• Không thực hiện cộng dồn ngày lần 2, không tạo trùng hóa đơn. | [x] |
| **TC-F062-05** | Tự động lập Hóa đơn điện tử (Invoice) | 1. Sau khi Webhook thanh toán thành công được ghi nhận. | Webhook transaction | • Bản ghi Invoice được tạo tự động với mã `INV-{timestamp}-{code}`.<br>• Hiển thị ngay trên Tab "Lịch sử Hóa đơn (F120)" với số tiền và chu kỳ chính xác. | [x] |
| **TC-F062-06** | Quét hạn dùng & kích hoạt Ân hạn 3 ngày | 1. Gọi Cronjob kiểm tra thuê bao khi `now > planExpiresAt`. | GET `/api/cron/subscription-check` | • Workspace chuyển sang trạng thái `GRACE_PERIOD`.<br>• Thiết lập `gracePeriodEndsAt = now + 3 ngày`.<br>• Tính năng chưa bị khóa ngay nhằm đảm bảo trải nghiệm khách hàng. | [x] |
| **TC-F062-07** | Hạ cấp về FREE khi hết thời gian ân hạn | 1. Gọi Cronjob khi `now > gracePeriodEndsAt` và chưa được thanh toán thêm. | GET `/api/cron/subscription-check` | • Workspace tự động hạ cấp về gói `FREE`.<br>• Trạng thái chuyển sang `EXPIRED`.<br>• Hạn mức ghế và kênh thu hồi về mức mặc định của gói Free. | [x] |
| **TC-F062-08** | Hiển thị Banner cảnh báo đa cấp độ | 1. Workspace còn 7 ngày, 3 ngày, 1 ngày, hoặc đang trong ân hạn. | Kiểm tra UI Tab Quota & Billing | • Còn 7-3 ngày: Banner vàng cảnh báo sắp hết hạn.<br>• Còn 1 ngày: Banner đỏ cam khẩn cấp.<br>• Đang trong Ân hạn: Banner đỏ đậm cảnh báo sắp bị hạ cấp về Free.<br>• Nút "Gia hạn ngay" mở trực tiếp SePay modal. | [x] |

---

## 📌 Hướng Dẫn Nghiệm Thu Theo Giai Đoạn (Testing Walkthrough)

Sau khi lần lượt hoàn thành các module, bạn chỉ cần mở App Electron và chạy theo trình tự:

1. **Giai đoạn 1 (Content Studio):**
   * Mở `/create` $\rightarrow$ Test **F082** (Kiểm tra trùng lặp) + **F083** (Bật Evergreen).
   * Bấm nút *"Chấm điểm AI"* để test **F084** (AI Content Score).
2. **Giai đoạn 2 (Unified Inbox & Quản trị hội thoại):**
   * Mở `/inbox` $\rightarrow$ Kiểm tra các trạng thái `NEW/OPEN/PENDING/RESOLVED` & đồng hồ đếm ngược SLA (**F085**).
   * Viết ghi chú nội bộ màu cam 🔒 và gõ `@` tag đồng nghiệp (**F086**).
   * Kiểm tra tính năng Chặn Spam / Blacklist user (**F091**).
3. **Giai đoạn 3 (Trợ lý AI Hộp thư - Gắn luồng 9router):**
   * Mở cuộc hội thoại khách hàng $\rightarrow$ Test gợi ý câu trả lời mẫu (**F087**).
   * Bấm *"Tóm tắt AI"* xem tóm tắt nhu cầu & Next Action (**F088**).
   * Khách để lại SĐT $\rightarrow$ Bấm nút 1-click tạo Lead CRM (**F089**).
4. **Giai đoạn 4 (Customer & Lead CRM):**
   * Mở màn hình Khách hàng CRM trên App Electron $\rightarrow$ Kiểm tra tính điểm và phân loại nhiệt độ **HOT/WARM/COLD** (**F100**).
   * Chạy công cụ quét trùng và thực hiện hợp nhất 2 hồ sơ đối chiếu (**F101**).
5. **Giai đoạn 5 (Báo cáo & Phân tích M5 & Thám tử xu hướng M6):**
   * Mở menu **"Báo cáo & Phân tích"** (`/analytics`) $\rightarrow$ Bấm nút *"Nạp mẫu test F103-F107"*:
     * Tab 1: Xem bảng xếp hạng điểm chuẩn hóa **F103 (Content Performance Score)** và nút 1-click bật Evergreen.
     * Tab 2: Xem các chỉ số tài chính, CPL, CPA, ROI % theo Campaign (**F104**) và Phễu chuyển đổi 4 tầng (**F105**).
     * Tab 3: Bấm nút phân tích để nhận khuyến nghị chiến lược từ **9router AI (F106)** và xem bảng so sánh chéo Benchmark đa kênh (**F107**).
   * Mở menu **"Thám tử xu hướng (MXH)"** (`/intelligence/social-search`):
     * Tìm kiếm từ khóa, xem nhãn tín hiệu hỏi mua (**F108**).
     * Bấm *"1-Click Chuyển Ý Tưởng Sang Content Studio"* $\rightarrow$ Kiểm tra nội dung tự động điền sẵn tại `/create`.
6. **Giai đoạn 6 (Media Studio AI - Phân hệ M7):**
   * Mở menu **"Media Studio AI"** (`/media/studio`):
     * Tab 1: Thử nghiệm chuyển đổi 4 tỷ lệ khung hình `9:16`, `1:1`, `16:9`, `4:5` và 3 chế độ `Fit Blur`, `Center Crop`, `Letterbox` (**F113**).
     * Tab 2: Bấm phân tích để trích xuất clip ngắn 30s-60s kèm Hook 3s đầu và Viral Potential Score từ **9router (F114)**.
     * Tab 3: Tạo phụ đề tự động (Auto Subtitles), chỉnh sửa câu thoại trong Cue Editor và đổi kiểu chữ TikTok (**F115**).
7. **Giai đoạn 7 (Workspace, Quota & Admin - Phân hệ M8):**
   * Mở menu **"Quản lý nhân sự"** (`/team`):
     * Kiểm tra thanh tiến trình số ghế (Seats Quota) và hàng rào Quota Guard (**F117**).
     * Xem bảng danh sách lời mời đang chờ (`PENDING`), sao chép liên kết mời và thử nghiệm thu hồi (**F117**).
   * Mở menu **"Cài đặt hệ thống"** (`/settings`):
     * Tab 2 (**Gói cước & Định mức**): Xem 4 đồng hồ đo Channels, Posts, AI Credits, Storage (**F118**); bấm nâng cấp để xem bảng tính chi phí bù trừ Prorated Billing (**F119**); bấm **"Gia hạn qua VietQR (SePay)"** để trải nghiệm quét mã QR tự động chọn chu kỳ 1, 6 (-10%), 12 (-20%) tháng và lắng nghe xác nhận thời gian thực (**F062**).
     * Tab 3 (**Lịch sử Hóa đơn**): Xem danh sách biên lai thanh toán và tải hóa đơn điện tử (**F120**).
     * Tab 4 (**Xuất dữ liệu & Hủy tài khoản**): Bấm xuất tệp JSON/ZIP toàn bộ Workspace (**F121**) và nhập `DELETE_WORKSPACE` để kiểm tra chính sách ân hạn 30 ngày an toàn (**F121**).

8. **Giai đoạn 8 (Quản lý Công việc & Phối hợp Đội ngũ - Phân hệ M9):**
   * Mở menu **"Quản lý công việc (Tasks)"** (`/tasks`):
     * Tab 1 (**Bảng công việc & Kanban**):
       * Kiểm tra hiển thị Kanban Board 4 cột và chuyển đổi sang List Table View (**F124**).
       * Mở modal tạo việc mới $\rightarrow$ Gán Assignee chính và chọn nhiều Collaborators phối hợp (**F124**).
       * Bật công việc lặp lại định kỳ `WEEKLY` $\rightarrow$ Chuyển trạng thái sang `DONE` để kiểm tra thông báo tự động gia hạn chu kỳ kế tiếp (**F129**).
       * Bấm mở Task Detail Modal $\rightarrow$ Đánh dấu checklist subtasks, viết bình luận gõ `@` nhắc tên đồng đội và đính kèm tệp tin tài liệu (**F128**).
       * Lọc task theo thành viên cụ thể và nút "Chỉ việc trễ hạn" (**F124**).
     * Tab 2 (**Thư viện Mẫu quy trình F130**):
       * Xem 4 mẫu quy trình (Video Content, CSKH, Campaign Launch, Team Onboarding).
       * Bấm nút *"Áp dụng quy trình (1-Click)"* $\rightarrow$ Tự động sinh công việc cha kèm toàn bộ checklist subtasks phân vai chuyên môn.
     * Tab 3 (**Năng suất & Khối lượng F131**):
       * Xem thẻ tổng quan KPI toàn đội: Tổng số việc, Tỷ lệ đúng hạn (On-time Rate %), Tỷ lệ hoàn thành (Completion %).
       * Quan sát bảng xếp hạng thành viên: Số việc đang làm, việc trễ hạn, điểm năng suất /100 và nhãn cảnh báo đỏ rung nhẹ đối với nhân sự quá tải (`isOverloaded: true`).

9. **Giai đoạn 9 (Quản lý Chiến dịch Tiếp thị & Bán hàng - Phân hệ M10):**
   * Mở menu **"Chiến dịch (Campaigns)"** (`/campaigns`):
     * Tab 1 (**Danh sách Chiến dịch**):
       * Kiểm tra Grid hiển thị danh sách chiến dịch, thanh lọc trạng thái (Active/Draft/Completed) và ô tìm kiếm (**F133**).
       * Bấm *"Tạo Chiến dịch Mới"* $\rightarrow$ Nhập thông tin mục tiêu (Doanh thu/Lead/Awareness), ngân sách kế hoạch, chọn kênh truyền thông, thiết lập KPI định lượng (**F133, F134, F135**).
       * Kiểm tra thẻ chiến dịch hiển thị tiến độ thời gian (Timeline), mức ngân sách đã giải ngân và chỉ số tốc độ đốt ngân sách (Burn Rate Status: Bình thường / Tăng tốc / Vượt ngân sách) (**F134**).
     * Tab 2 (**Tiến độ Hợp nhất**):
       * Chọn 1 chiến dịch cụ thể từ dropdown $\rightarrow$ Xem bảng đồng hồ 4 trục:
         * 1. Tiến độ Content (Đã đăng / Tổng số bài theo kế hoạch).
         * 2. Tiến độ Tasks (Liên kết tự động với module M9 Work & Task).
         * 3. Tiến độ KPI (Tỷ lệ hoàn thành chỉ tiêu kinh doanh).
         * 4. Tiến độ Ngân sách (Kế hoạch vs Thực chi).
       * Xem sơ đồ Gantt/Timeline phân bổ theo các giai đoạn (Teaser, Launch, Mega Sale, Retargeting) (**F138**).
     * Tab 3 (**Kho Asset & Luồng Duyệt**):
       * Lọc tài nguyên sáng tạo theo loại (Hình ảnh banner, Video ngắn, Tài liệu PDF, Bộ copy bài viết) hoặc lọc theo trạng thái duyệt (**F137**).
       * Phê duyệt tài nguyên: Bấm nút "Phê duyệt" $\rightarrow$ Trạng thái chuyển sang `APPROVED` tức thì (**F137**).
       * Từ chối tài nguyên: Bấm nút "Từ chối" $\rightarrow$ Modal ghi chú góp ý mở ra $\rightarrow$ Nhập lý do (VD: *"Chưa đúng guideline màu sắc"*) $\rightarrow$ Tài nguyên chuyển sang `REJECTED` và lưu vết reviewerNote (**F137**).
     * Tab 4 (**Báo cáo Tổng kết & ROI**):
       * Chọn chiến dịch $\rightarrow$ Xem bảng chỉ số tài chính chuyên sâu: Tổng chi phí thực tế, Doanh thu ghi nhận, Lợi nhuận ròng (Net Profit) (**F139**).
       * Kiểm tra tính toán tự động các chỉ số hiệu quả: `ROI %` (Lợi suất đầu tư), `ROAS` (Doanh thu trên chi phí quảng cáo), `CPL` (Chi phí trên mỗi lead), `CPA` (Chi phí trên mỗi đơn hàng) (**F139**).
       * Xem xếp hạng hiệu quả chiến dịch (Xuất sắc / Đạt mục tiêu / Cần tối ưu) và kiểm tra tính năng Xuất báo cáo tổng kết (**F139**).

10. **Giai đoạn 10 (Tự Động Hóa Đa Phân Hệ & Kịch Bản CSKH - Phân hệ M11):**
    * Mở menu **"Tự động hóa"** (`/automation`):
      * Tab 1 (**Kịch bản Tự động - Flow Rules**):
        * Kiểm tra danh sách kịch bản tự động, 4 thẻ thống kê chỉ số (Tổng kịch bản, Đang chạy, Tổng lượt kích hoạt, Thời gian phản hồi ~85ms) (**F141**).
        * Bấm nút *"Mẫu Quy Trình (1-Click)"* $\rightarrow$ Modal hiển thị 5 mẫu thực chiến $\rightarrow$ Bấm "Áp dụng 1-Click" để tự động kích hoạt kịch bản vào Workspace (**F145**).
        * Bấm nút *"Tạo Kịch Bản Mới"* $\rightarrow$ Modal Flow Builder mở ra $\rightarrow$ Thiết lập Nguồn kích hoạt Trigger (Comment/Message/Lead/Time/Webhook) (**F141**), thêm Bộ điều kiện lọc Condition (Keyword/Tag/Source/Status) (**F142**), và chuỗi Hành động liên module Action (Gửi tin nhắn, Gắn tag CRM, Tạo Task M9, Gán người, Bắn notify) (**F143**).
        * Thử nghiệm kịch bản: Bấm nút "Test" trên thẻ kịch bản $\rightarrow$ Kiểm tra thông báo Toast thực thi thành công và lượt chạy tăng lên (**F141-F143**).
        * Bật / Tắt trạng thái hoạt động của kịch bản bằng công tắc Switch (**F141**).
      * Tab 2 (**Nhật Ký Thực Thi & Thử Lại - Logs & Retry**):
        * Quan sát 4 thẻ KPI: Tổng lượt ghi nhận, Thành công, Thất bại, Bỏ qua (**F144**).
        * Lọc danh sách theo trạng thái (`ALL`, `SUCCESS`, `FAILED`, `SKIPPED`) hoặc gõ tìm kiếm theo mã Idempotency Key (**F144**).
        * Kiểm tra dòng log có trạng thái `FAILED` $\rightarrow$ Bấm nút "Thử lại (Retry)" $\rightarrow$ Kiểm tra lượt chạy tự động retry thành công, cập nhật `retryCount / maxRetries` (**F144**).
        * Bấm biểu tượng con mắt trên từng dòng log $\rightarrow$ Modal xem chi tiết Payload (Input trigger, Output actions, Error stack) (**F144**).
        * Bấm biểu tượng Copy cạnh mã `Idempotency Key` $\rightarrow$ Kiểm tra thông báo đã copy thành công vào clipboard (**F144**).
      * Tab 3 (**Tương Tác Mạng Xã Hội - Social Auto-Interact**):
        * Kiểm tra bảng tác vụ nuôi nick Facebook, tạo tác vụ lướt feed, like, share, buff comment AI tự động (**Bảo toàn 100% tính năng gốc**).

11. **Giai đoạn 11 (Ví & Thu Nhập M12, Tiếp Thị Liên Kết & Chống Gian Lận M13):**
    * Mở menu **"Ví & Hoa hồng (Wallet)"** (`/wallet`):
      * Tab 1 (**Ví & Rút Tiền - Balance & Withdraw**):
        * Quan sát 3 thẻ số dư lớn: Số dư khả dụng, Đang chờ duyệt và Tổng đã rút kèm tỷ giá quy đổi USD/VND trực tiếp (**F146**).
        * Bấm nút *"Tạo Lệnh Rút Tiền"* $\rightarrow$ Modal mở ra $\rightarrow$ Chọn phương thức nhận tiền, nhập số tiền cần rút (kiểm soát hạn mức tối thiểu $10.00 / 250,000 VND) $\rightarrow$ Xác nhận gửi lệnh rút tiền (**F148**).
        * Bảng danh sách lệnh rút tiền: Theo dõi trạng thái lệnh (`PENDING`, `PROCESSING`, `COMPLETED`, `REJECTED`) kèm thời gian xử lý (**F148**).
      * Tab 2 (**Lịch Sử Giao Dịch - Transaction Ledger**):
        * Kiểm tra sổ cái biến động số dư theo thời gian thực (+/- tiền) với mã giao dịch, số tiền, loại giao dịch (`COMMISSION`, `WITHDRAWAL`, `TASK_REWARD`, `BONUS`) và số dư sau giao dịch (**F147**).
        * Lọc theo loại giao dịch và tìm kiếm theo mã giao dịch / mô tả (**F147**).
      * Tab 3 (**Tài Khoản Nhận Tiền - Payment Methods**):
        * Quản lý danh sách phương thức thanh toán: VietQR / Ngân hàng nội địa, Ví MoMo, PayPal Quốc tế, Crypto USDT (BEP-20 / TRC-20) (**F149**).
        * Bấm nút *"Thêm Phương Thức Mới"* $\rightarrow$ Modal thêm tài khoản nhận tiền $\rightarrow$ Lưu thông tin (**F149**).
        * Thiết lập tài khoản nhận tiền mặc định bằng nút *"Đặt mặc định"* (**F149**).
      * Tab 4 (**Nhiệm Vụ Kiếm Thưởng - Earning Tasks**):
        * Xem danh sách nhiệm vụ cộng đồng kèm điểm thưởng USD/VND và thanh phần trăm tiến độ hoàn thành (**F150**).
        * Khi nhiệm vụ đạt 100% tiến độ $\rightarrow$ Nút *"Nhận Thưởng Ngay"* kích hoạt $\rightarrow$ Bấm nhận thưởng $\rightarrow$ Số dư ví lập tức cộng tiền thưởng kèm thông báo Toast (**F150**).
      * Tab 5 (**Tiếp Thị & Chống Gian Lận - Referral & Anti-Fraud**):
        * Khung link & mã giới thiệu cá nhân: Bấm Copy Link, Copy Mã, và mở Modal xem/tải Mã QR tiếp thị độc quyền (**F151**).
        * Phễu theo dõi 4 tầng (4-Tier Funnel): Thống kê Lượt nhấp (Clicks), Lượt đăng ký (Signups), Chuyển đổi trả phí (Paid Customers), Người dùng tích cực (Active Users) kèm tỷ lệ chuyển đổi Conversion Rate (**F152**).
        * Bảng chính sách hoa hồng: Xem tỷ lệ hoa hồng phân tầng 15% - 25% theo các gói dịch vụ Basic, Pro, Enterprise (**F153**).
        * Bảng lịch sử đối soát hoa hồng: Minh bạch số tiền, người mua, gói dịch vụ và kỳ thanh toán (**F154**).
        * Trung tâm Chống Gian Lận (Anti-Fraud Center): Bấm nút *"Quét Rủi Ro Tự Động"* $\rightarrow$ Thuật toán phát hiện tự giới thiệu (Self-referral), trùng thiết bị (Same device fingerprint), bùng nổ đăng ký bất thường (Velocity spam) và phân loại cấp độ rủi ro `SAFE`, `SUSPICIOUS`, `HIGH_RISK` (**F155**).

12. **Giai đoạn 12 (Topify AI Studio M14: F156 – F162):**
    * Mở menu **"Topify AI Hub"** (`/ai`):
      * Tab 1 (**Trợ Lý AI - AI Chat Assistant**):
        * Lựa chọn Persona: Chiến lược gia Marketing, Copywriter Viral, Chuyên viên Bán hàng & CSKH, Kỹ thuật viên Tự động hóa (**F156**).
        * Quản lý phiên chat: Bấm dấu `+` tạo phiên hội thoại mới, xóa phiên bằng nút thùng rác (**F156**).
        * Bấm vào 1 trong 4 câu hỏi gợi ý nhanh (Prompt Starters) hoặc nhập câu hỏi bất kỳ $\rightarrow$ Bấm Gửi $\rightarrow$ Quan sát câu trả lời hiển thị tức thì có định dạng Markdown và tag Model sử dụng (**F156**).
        * Bấm nút "Sao chép" trên tin nhắn của AI $\rightarrow$ Kiểm tra thông báo Toast đã sao chép thành công (**F156**).
      * Tab 2 (**Sáng Tạo Nội Dung - Content Generator**):
        * Sub-tab Kịch bản Video: Nhập chủ đề, chọn Brand Voice, thời lượng (15s, 30s, 45s, 60s) $\rightarrow$ Bấm "Sinh Kịch Bản TikTok Triệu View" $\rightarrow$ Xem kịch bản phân cảnh chi tiết Hook/Body/CTA, Hashtags và Điểm Viral (**F157**).
        * Sub-tab Tiêu đề Viral: Nhập chủ đề $\rightarrow$ Bấm "Tạo 5 Tiêu Đề Viral" $\rightarrow$ Xem 5 tiêu đề theo các góc FOMO, Tò mò, Tranh cãi kèm Attention Score (**F157**).
        * Sub-tab Caption Bán Hàng: Nhập tên sản phẩm & lợi ích, chọn công thức AIDA / PAS / BAB $\rightarrow$ Sinh bài viết bán hàng hoàn chỉnh $\rightarrow$ Bấm "Mở trang Tạo bài" để chuyển thẳng sang phân hệ đăng bài (**F157**).
      * Tab 3 (**Tạo Ảnh AI - Image Studio**):
        * Nhập prompt mô tả hình ảnh $\rightarrow$ Chọn phong cách nghệ thuật (3D Render, Cyberpunk, Studio Minimal, Realistic, Anime) $\rightarrow$ Chọn tỷ lệ khung hình (1:1, 9:16, 16:9, 4:5) $\rightarrow$ Bấm "Sinh Ảnh AI" (**F158**).
        * Xem thư viện ảnh đã sinh: Bấm "Tải ảnh" để tải file ảnh về máy hoặc bấm "Sửa ảnh" để điều hướng sang Media Studio M7 (**F158**).
      * Tab 4 (**Phân Cảnh Video - Video & Storyboard**):
        * Nhập prompt mô tả video $\rightarrow$ Bấm "Sinh Storyboard Video" $\rightarrow$ Xem video preview player giả lập và bảng phân cảnh chi tiết từng cảnh (Camera movement, Visual prompt, Voiceover, BGM mood) (**F159**).
      * Tab 5 (**Lồng Tiếng AI - AI Voice TTS**):
        * Nhập văn bản kịch bản $\rightarrow$ Chọn diễn viên giọng đọc (Hoài My - Nữ Nam, Nam Minh - Nam Bắc, Thu Thảo - Nữ Trung, Jenny - Nữ Mỹ, Guy - Nam Mỹ) $\rightarrow$ Chọn ngữ điệu và kéo thanh tốc độ $\rightarrow$ Bấm "Chuyển Thành Giọng Đọc AI" (**F160**).
        * Nghe thử trực tiếp trên Audio Player hoặc bấm nút sao chép văn bản (**F160**).
      * Tab 6 (**Tái Chế & Model Routing - Repurpose & Model Routing**):
        * Khung Tái Chế: Dán bài viết dài (> 20 ký tự) $\rightarrow$ Bấm "Tái Chế Tức Thì Thành 4 Định Dạng" $\rightarrow$ Xem 2 kịch bản video ngắn TikTok, 1 Thread mạng xã hội, 1 Bản tin Email Newsletter và 3 Quotes viral (**F161**).
        * Khung Định Tuyến Model AI: Xem danh sách 5 model AI (GPT-4o Mini, GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro, DeepSeek V3) $\rightarrow$ Bấm chọn model bất kỳ để kích hoạt $\rightarrow$ Bấm "Kiểm Tra Kết Nối (Ping)" để đo độ trễ ms thời gian thực (**F162**).

13. **Giai đoạn 13 (Trung Tâm Bảo Mật & Tích Hợp M15: F163 – F170):**
    * Mở menu **"Bảo mật & Tích hợp"** (`/security`):
      * Tab 1 (**2FA & Phân Quyền RBAC - F163, F164**):
        * Bấm "Bật 2FA Ngay" $\rightarrow$ Mở modal quét mã QR + Khóa bí mật $\rightarrow$ Nhập mã 6 số (VD: `582910`) $\rightarrow$ Kích hoạt thành công 2FA TOTP kèm danh sách 8 mã khôi phục khẩn cấp (**F163**).
        * Bảng Ma Trận Phân Quyền RBAC: Xem quyền hạn 4 vai trò Owner, Admin, Editor, Viewer. Bật/tắt checkbox phân quyền theo tính năng $\rightarrow$ Quan sát thông báo cập nhật quyền hạn tức thời (**F164**).
      * Tab 2 (**Quản Lý API Keys - F165**):
        * Bấm "Tạo API Key Mới" $\rightarrow$ Nhập tên key, chọn Scope (READ_ONLY, READ_WRITE, FULL_ADMIN), nhập dải IP Whitelist $\rightarrow$ Tạo key $\rightarrow$ Modal hiển thị Full Secret Token 1 lần duy nhất $\rightarrow$ Bấm Copy (**F165**).
        * Bảng danh sách API Key: Bấm "Thu hồi" để vô hiệu hóa một key đang hoạt động (**F165**).
      * Tab 3 (**Webhooks - F166**):
        * Bấm "Thêm Webhook Endpoint" $\rightarrow$ Nhập tên, URL HTTPS và tick chọn sự kiện (`post.published`, `order.created`, ...) $\rightarrow$ Đăng ký thành công (**F166**).
        * Bấm nút "Gửi Thử Nghiệm (Test Ping)" $\rightarrow$ Nhận phản hồi HTTP 200 kèm độ trễ ms và nhật ký giao vận tự động cập nhật (**F166**).
      * Tab 4 (**Lưu Trữ Đám Mây - F167**):
        * Xem 3 nhà cung cấp: AWS S3, Cloudflare R2, Google Drive $\rightarrow$ Bấm "Kiểm Tra Kết Nối (Ping)" $\rightarrow$ Báo kết nối thành công $\rightarrow$ Bấm "Đặt làm lưu trữ mặc định" (**F167**).
      * Tab 5 (**Tích Hợp CRM & Marketing - F168**):
        * Xem 4 dịch vụ: HubSpot, Mailchimp, Zapier, Google Sheets $\rightarrow$ Bật/tắt công tắc tự động đồng bộ khách hàng (Leads) và đơn hàng (Orders) (**F168**).
      * Tab 6 (**Kiểm Toán & Phiên IP - F169, F170**):
        * Sổ kiểm toán bảo mật: Xem danh sách nhật ký Actor, Role, Hành động, IP, Địa điểm $\rightarrow$ Bấm nút "Xuất Báo Cáo CSV" tải tệp kiểm toán chuẩn ISO 27001 / SOC 2 (**F169**).
        * Phiên đăng nhập thiết bị: Xem danh sách thiết bị đang đăng nhập $\rightarrow$ Bấm "Đăng xuất thiết bị khác" (**F170**).
        * Danh sách IP tin cậy (IP Whitelisting): Nhập IP/CIDR mới + tên nhãn $\rightarrow$ Bấm "Thêm IP" $\rightarrow$ Bấm icon thùng rác để xóa IP (**F170**).

---

## [F124] - Assignee / Collaborator (Người phụ trách chính & Phối hợp)

* **Mục tiêu:** Phân định rõ trách nhiệm 1 người chủ trì (Assignee) và nhiều người phối hợp (Collaborators), đồng thời lọc việc linh hoạt theo từng thành viên.
* **Môi trường test:** Electron App (`/tasks`) & Backend API (`/api/tasks`).

### 📋 Bảng Test Cases F124

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F124-01** | Tạo task mới có 1 Assignee và 2 Collaborators | 1. Mở `/tasks` $\rightarrow$ Bấm "Tạo việc mới".<br>2. Chọn Assignee là "Nguyễn Văn A".<br>3. Tick chọn 2 người phối hợp: "Trần Thị B", "Lê Hoàng C".<br>4. Bấm "Tạo công việc". | Form tạo việc với Assignee & CollaboratorIds. | • Thẻ task xuất hiện trên cột "Cần làm".<br>• Hiển thị avatar của A và cụm 2 avatar của B, C xếp chồng.<br>• Mở chi tiết task hiển thị đầy đủ thông tin chủ trì và cộng tác viên. | [ ] |
| **TC-F124-02** | Lọc công việc theo thành viên cụ thể | 1. Tại thanh bộ lọc trên cùng, chọn "Trần Thị B". | `filterMember = 'user_2'` | • Danh sách chỉ hiển thị các task mà B là người phụ trách chính hoặc người phối hợp.<br>• Các task không liên quan đến B bị ẩn đi. | [ ] |
| **TC-F124-03** | Lọc công việc trễ hạn (Overdue) | 1. Bấm nút "Chỉ việc trễ hạn". | `onlyOverdue = true` | • Chỉ hiển thị các task có hạn chót nhỏ hơn thời gian hiện tại và chưa hoàn thành (`status != DONE`). | [ ] |

---

## [F128] - Comment / Attachment / Mention (Trao đổi, Tệp đính kèm & Nhắc tên)

* **Mục tiêu:** Cung cấp môi trường trao đổi nội bộ ngay trên từng thẻ công việc, hỗ trợ gửi tệp đính kèm và nhắc tên đồng đội bằng `@mention`.
* **Môi trường test:** Electron App (Task Detail Modal `/tasks`) & Backend API (`/api/tasks/comments`).

### 📋 Bảng Test Cases F128

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F128-01** | Gửi bình luận có gắn thẻ @mention đồng đội | 1. Nhấp vào thẻ task để mở Detail Modal.<br>2. Bấm nút tag nhanh `@A` hoặc tự gõ `@Nguyễn Văn A`.<br>3. Nhập nội dung: *"@Nguyễn Văn A kiểm tra lại kịch bản giúp em nhé"*.<br>4. Bấm "Gửi". | Comment text chứa `@Nguyễn Văn A`. | • Bình luận mới xuất hiện ngay lập tức trong luồng trao đổi.<br>• Từ khóa `@Nguyễn Văn A` được highlight nổi bật màu tím nền mờ.<br>• Số lượng comment trên thẻ task tăng lên 1. | [ ] |
| **TC-F128-02** | Gửi bình luận kèm tệp đính kèm (Attachment) | 1. Trong modal trao đổi, nhập tên tệp vào ô tệp đính kèm: *"kich_ban_final.pdf"*.<br>2. Nhập nội dung bình luận và bấm "Gửi". | Tệp đính kèm PDF / MP4. | • Bình luận hiển thị kèm link tệp có icon ghim giấy kẹp.<br>• Hiển thị tên tệp và dung lượng ước tính (ví dụ: 2.5 MB). | [ ] |

---

## [F129] - Recurring Task (Công việc lặp định kỳ tự động)

* **Mục tiêu:** Tự động tạo chu kỳ lặp lại cho các công việc mang tính định kỳ (báo cáo tuần, kiểm tra kho, sản xuất video hàng ngày).
* **Môi trường test:** Electron App (`/tasks`) & Engine (`lib/tasks/engine.ts`).

### 📋 Bảng Test Cases F129

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F129-01** | Tạo công việc có lặp lại Hàng tuần (WEEKLY) | 1. Mở modal tạo việc mới.<br>2. Tick chọn "Lặp lại công việc tự động theo chu kỳ".<br>3. Chọn tần suất "Hàng tuần (Weekly)".<br>4. Bấm "Tạo công việc". | `isRecurring = true`, `recurRule = 'WEEKLY'`. | • Thẻ công việc xuất hiện kèm huy hiệu tím `🔁 WEEKLY`. | [ ] |
| **TC-F129-02** | Hoàn thành công việc lặp và nhận thông báo gia hạn | 1. Kéo hoặc đổi trạng thái task lặp sang "Hoàn thành" (`DONE`). | `status = 'DONE'` | • Xuất hiện thông báo toast xanh: *"Công việc lặp [WEEKLY]: Đã hoàn thành và tự động gia hạn chu kỳ kế tiếp!"*. | [ ] |

---

## [F130] - Task Template (Thư viện Mẫu quy trình chuẩn hóa)

* **Mục tiêu:** Chuẩn hóa các quy trình doanh nghiệp lặp lại nhiều lần thành các mẫu có sẵn (Content, CSKH, Marketing Campaign, Onboarding).
* **Môi trường test:** Electron App (Tab Thư viện mẫu quy trình `/tasks`) & API (`/api/tasks/templates`).

### 📋 Bảng Test Cases F130

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F130-01** | Xem danh sách 4 mẫu quy trình doanh nghiệp | 1. Mở `/tasks` $\rightarrow$ Chuyển sang tab "Thư viện Mẫu quy trình". | Tab Mẫu quy trình. | • Hiển thị đủ 4 mẫu: Video Content (6 bước), CSKH (5 bước), Campaign Launch (6 bước), Onboarding (5 bước).<br>• Hiển thị số ngày dự kiến và phân vai từng bước. | [ ] |
| **TC-F130-02** | Áp dụng 1-click mẫu quy trình Sản xuất Video | 1. Bấm nút "Áp dụng quy trình (1-Click)" trên thẻ Sản xuất Video Content. | Mẫu `tpl_content_video`. | • Tự động chuyển về Tab Bảng công việc.<br>• Tự động tạo task mới kèm 6 checklist subtasks.<br>• Modal chi tiết task mở lên sẵn sàng thực hiện. | [ ] |
| **TC-F130-03** | Thanh tab giữ nguyên vị trí và kích thước khi chuyển tab | 1. Click qua lại giữa "Bảng công việc", "Thư viện Mẫu quy trình (F130)", "Năng suất & Khối lượng (F131)". | Thao tác chuyển tab liên tục. | • Vị trí và kích thước các tab giữ cố định, không bị ngắt dòng hay nhảy pixel.<br>• Nút chuyển Kanban/Danh sách nằm cố định trong thanh lọc của Bảng công việc.<br>• Con trỏ chuột giữ nguyên trên tab vừa bấm. | [ ] |

---

## [F131] - Workload & Productivity (Khối lượng việc & Năng suất)

* **Mục tiêu:** Đo lường khối lượng công việc, tỷ lệ đúng hạn, điểm năng suất của từng thành viên và tự động cảnh báo nhân sự quá tải.
* **Môi trường test:** Electron App (Tab Năng suất & Khối lượng `/tasks`) & API (`/api/tasks/productivity`).

### 📋 Bảng Test Cases F131

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F131-01** | Xem KPI tổng thể toàn đội ngũ | 1. Mở `/tasks` $\rightarrow$ Chuyển sang tab "Năng suất & Khối lượng". | Tab Năng suất. | • Hiển thị 4 thẻ KPI: Tổng khối lượng việc, Tỷ lệ đúng hạn (%), Tỷ lệ hoàn tất, Số nhân sự quá tải. | [ ] |
| **TC-F131-02** | Bảng xếp hạng và cảnh báo quá tải (Overload Alert) | 1. Quan sát bảng thành viên phía dưới.<br>2. Kiểm tra cột "Trạng thái khối lượng". | Dữ liệu active tasks của từng nhân sự. | • Nhân sự có số việc active $\ge 4$ hiển thị huy hiệu đỏ nhấp nháy: `Quá tải (Overloaded)`.<br>• Thành viên còn lại hiển thị `Bình thường` hoặc `Bận rộn` kèm thanh tiến trình đúng hạn. | [ ] |

---

## [F133] - Objective & KPI (Mục tiêu & Chỉ tiêu Chiến dịch)

* **Mục tiêu:** Thiết lập các mục tiêu kinh doanh chiến lược (Doanh thu, Leads, Nhận diện thương hiệu, Lượt tải App) và theo dõi các chỉ tiêu định lượng (KPI) có tiến độ thực tế so với mục tiêu đề ra.
* **Môi trường test:** Electron App (Trang Chiến dịch `/campaigns` - Tab Danh sách) & API Backend (`/api/campaigns`).

### 📋 Bảng Test Cases F133

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F133-01** | Tạo chiến dịch mới kèm thiết lập Mục tiêu & KPI | 1. Mở `/campaigns` $\rightarrow$ Bấm nút "Tạo Chiến dịch Mới".<br>2. Nhập tên chiến dịch, mô tả, chọn Loại mục tiêu: `REVENUE` (Tăng trưởng doanh thu).<br>3. Thêm 2 KPI: Doanh thu (Mục tiêu: 500tr VND, Đơn vị: VND) và Số đơn hàng (Mục tiêu: 1.000 đơn).<br>4. Bấm "Khởi tạo Chiến dịch". | Form modal chiến dịch. | • Chiến dịch mới được tạo thành công và xuất hiện ngay trên Grid.<br>• Thẻ chiến dịch hiển thị đúng loại mục tiêu và số lượng KPI đi kèm.<br>• API trả về mã HTTP 201 kèm payload đầy đủ. | [ ] |
| **TC-F133-02** | Xem thanh đo tiến độ hoàn thành KPI | 1. Trên thẻ chiến dịch hoặc tại Tab Tiến độ, quan sát phần "Chỉ tiêu KPIs". | Chiến dịch Mega Sale 11.11. | • Hiển thị thanh tiến trình trực quan (% Đạt được = Thực tế / Mục tiêu).<br>• Hiển thị số liệu thực tế đã đạt được so với mục tiêu (VD: 320.000.000 / 500.000.000 VND - 64%). | [ ] |

---

## [F134] - Budget (Ngân sách Kế hoạch / Thực tế & Cảnh báo Burn Rate)

* **Mục tiêu:** Phân bổ ngân sách theo 4 danh mục cốt lõi (Paid Ads, Content Production, KOL/Influencer, Vận hành/Công cụ) và tự động tính toán tốc độ tiêu hao (Burn Rate) để cảnh báo vượt ngân sách.
* **Môi trường test:** Electron App (Tab Danh sách & Tab Tiến độ `/campaigns`) & API Backend (`/api/campaigns`).

### 📋 Bảng Test Cases F134

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F134-01** | Phân bổ ngân sách theo danh mục chi phí | 1. Mở chi tiết chiến dịch hoặc kiểm tra dữ liệu phân bổ.<br>2. Kiểm tra tỷ lệ phân bổ ngân sách. | Chiến dịch BST Thu Đông 2026. | • Hiển thị đủ 4 danh mục: Paid Ads, Content/Media, KOL/KOC, Công cụ/Vận hành.<br>• Tổng ngân sách kế hoạch bằng tổng các danh mục phân bổ (120.000.000 VND). | [ ] |
| **TC-F134-02** | Cảnh báo tốc độ tiêu hao ngân sách (Burn Rate Status) | 1. Quan sát huy hiệu Burn Rate trên thẻ chiến dịch:<br>• Chiến dịch tiêu chậm hơn tiến độ thời gian.<br>• Chiến dịch tiêu nhanh vượt tỷ lệ thời gian trôi qua.<br>• Chiến dịch vượt 100% ngân sách kế hoạch. | Thuật toán `calculateBudgetBurnRate`. | • Hiển thị nhãn xanh lá: `Bình thường (NORMAL)` khi tốc độ tiêu hợp lý.<br>• Hiển thị nhãn cam/vàng: `Tăng tốc (ACCELERATED)` khi % tiền tiêu > % thời gian trôi qua + 15%.<br>• Hiển thị nhãn đỏ cảnh báo nguy cơ: `Vượt ngân sách (OVER_BUDGET)` nếu thực chi > ngân sách. | [ ] |

---

## [F135] - Channel & Content Plan (Gắn Kênh & Kế hoạch Nội dung)

* **Mục tiêu:** Lựa chọn đa kênh phân phối (TikTok, Facebook, Shopee, YouTube, Email) và xây dựng kế hoạch phân bổ nội dung theo 4 giai đoạn chiến dịch (Teaser, Launch, Mega Sale, Retargeting).
* **Môi trường test:** Electron App (Tab Danh sách & Tab Tiến độ `/campaigns`) & API Backend (`/api/campaigns`).

### 📋 Bảng Test Cases F135

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F135-01** | Chọn kênh truyền thông khi tạo chiến dịch | 1. Bấm "Tạo Chiến dịch Mới".<br>2. Nhấp chọn các kênh: TikTok, Facebook, Shopee.<br>3. Bấm tạo. | Form lựa chọn kênh. | • Các huy hiệu kênh được kích hoạt đổi màu tương ứng (TikTok, Facebook, Shopee).<br>• Dữ liệu kênh được lưu trữ mảng chuỗi `channels: ['TIKTOK', 'FACEBOOK', 'SHOPEE']`. | [ ] |
| **TC-F135-02** | Phân bổ bài viết theo giai đoạn chiến dịch (Timeline Phases) | 1. Chuyển sang Tab "Tiến độ Hợp nhất" $\rightarrow$ Chọn chiến dịch Mega Sale 11.11.<br>2. Quan sát bảng "Kế hoạch giai đoạn & Nội dung". | Mảng dữ liệu `phases`. | • Hiển thị 4 giai đoạn với ngày bắt đầu - kết thúc rõ ràng.<br>• Mỗi giai đoạn hiển thị số bài viết đã đăng / số bài theo kế hoạch (VD: Giai đoạn Teaser: 8/8 bài hoàn thành).<br>• Thanh trạng thái tiến độ trực quan hiển thị `COMPLETED`, `IN_PROGRESS`, `UPCOMING`. | [ ] |

---

## [F137] - Asset & Approval (Kho Tài nguyên Sáng tạo & Luồng Phê duyệt)

* **Mục tiêu:** Quản trị kho tài nguyên sáng tạo của chiến dịch (Banner, Video ngắn, Ấn phẩm POSM, Copywriting) và thực hiện quy trình duyệt 2 cấp kèm phản hồi ghi chú chỉnh sửa.
* **Môi trường test:** Electron App (Tab Kho Asset & Luồng Duyệt `/campaigns`) & API Backend (`/api/campaigns/assets`).

### 📋 Bảng Test Cases F137

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F137-01** | Lọc và xem danh sách Creative Assets | 1. Mở `/campaigns` $\rightarrow$ Chuyển sang tab "Kho Asset & Luồng Duyệt".<br>2. Thử lọc theo Loại: `IMAGE`, `VIDEO`, `DOCUMENT`, `COPY`.<br>3. Thử lọc theo Trạng thái duyệt: `Tất cả`, `Chờ duyệt`, `Đã duyệt`, `Từ chối`. | Bộ lọc Asset. | • Bảng hiển thị chính xác tên asset, loại định dạng, kênh đích, phiên bản (v1, v2), người tải lên và người duyệt.<br>• Lọc phản hồi tức thì với 0ms độ trễ. | [ ] |
| **TC-F137-02** | Phê duyệt 1-Click tài nguyên (Approve Asset) | 1. Tìm asset đang ở trạng thái `Chờ duyệt (PENDING_REVIEW)`.<br>2. Bấm nút "Phê duyệt" (Icon Check xanh). | Asset `ast_003`. | • Trạng thái asset chuyển ngay sang huy hiệu xanh: `Đã phê duyệt (APPROVED)`.<br>• Hiển thị thông báo Toast thành công.<br>• API cập nhật trạng thái `APPROVED` và ghi nhận reviewerId. | [ ] |
| **TC-F137-03** | Từ chối tài nguyên kèm góp ý chỉnh sửa (Reject with Note) | 1. Tìm asset đang ở trạng thái `Chờ duyệt`.<br>2. Bấm nút "Từ chối" (Icon X đỏ).<br>3. Modal góp ý mở ra $\rightarrow$ Nhập lý do: *"Màu nền chưa đồng bộ với Key Visual 2026, cần tăng độ tương phản logo"*.<br>4. Bấm "Xác nhận Từ chối". | Góp ý từ chối. | • Asset chuyển sang huy hiệu đỏ: `Từ chối (REJECTED)`.<br>• Ô ghi chú của người duyệt (Reviewer Note) hiển thị ngay nội dung vừa nhập.<br>• API lưu trữ `reviewerNote` và gửi phản hồi thành công. | [ ] |

---

## [F138] - Progress Dashboard (Tiến độ Hợp nhất 4 Trục)

* **Mục tiêu:** Bảng điều khiển tích hợp giám sát toàn diện 4 trục vận hành chiến dịch: Tiến độ Nội dung, Tiến độ Công việc (kết nối trực tiếp M9), Tiến độ Chỉ tiêu KPI và Tỷ lệ Giải ngân Ngân sách.
* **Môi trường test:** Electron App (Tab Tiến độ Hợp nhất `/campaigns`) & API Backend (`/api/campaigns/progress`).

### 📋 Bảng Test Cases F138

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F138-01** | Hiển thị 4 thẻ tiến độ đa chiều (Content, Tasks, KPIs, Budget) | 1. Mở `/campaigns` $\rightarrow$ Chuyển sang tab "Tiến độ Hợp nhất".<br>2. Chọn chiến dịch "Mega Sale 11.11". | Chiến dịch `camp_mega_1111`. | • Thẻ Content: Hiển thị 26/30 bài đăng (86.7%).<br>• Thẻ Tasks (M9): Hiển thị 14/18 công việc hoàn thành (77.8%).<br>• Thẻ KPI: Hiển thị tiến độ hoàn thành các chỉ tiêu kinh doanh (64.0%).<br>• Thẻ Ngân sách: Hiển thị giải ngân 75.000.000 / 100.000.000 VND (75.0%). | [ ] |
| **TC-F138-02** | Xem dòng thời gian thực thi (Gantt Phase Breakdown) | 1. Cuộn xuống phần "Tiến độ Giai đoạn (Timeline Breakdown)".<br>2. Quan sát các thanh tiến trình theo từng chặng. | Dữ liệu `phases`. | • Hiển thị thanh tiến trình riêng cho từng giai đoạn.<br>• Phân định rõ ràng giai đoạn đang diễn ra (In Progress) và giai đoạn sắp tới (Upcoming). | [ ] |

---

## [F139] - Campaign Report & ROI (Báo cáo Tổng kết & Hiệu quả Đầu tư)

* **Mục tiêu:** Báo cáo tài chính chuyên sâu tự động tính toán Doanh thu, Lợi nhuận ròng, Tỷ suất hoàn vốn đầu tư (ROI %), Hiệu quả doanh thu trên chi phí quảng cáo (ROAS), Chi phí trên mỗi khách hàng tiềm năng (CPL), Chi phí trên mỗi chuyển đổi (CPA), xếp hạng hiệu quả và hỗ trợ xuất báo cáo.
* **Môi trường test:** Electron App (Tab Báo cáo & ROI `/campaigns`) & API Backend (`/api/campaigns/report`).

### 📋 Bảng Test Cases F139

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F139-01** | Xem bảng chỉ số tài chính và đo lường ROI/ROAS/CPL/CPA | 1. Mở `/campaigns` $\rightarrow$ Chuyển sang tab "Báo cáo Tổng kết & ROI".<br>2. Chọn chiến dịch "Mega Sale 11.11". | Dữ liệu tài chính chiến dịch. | • Tổng thực chi: 75.000.000 VND.<br>• Doanh thu ghi nhận: 320.000.000 VND.<br>• Lợi nhuận ròng: +245.000.000 VND.<br>• ROI: +326.7% (Đầu tư 1 đồng sinh lời 3.26 đồng lãi).<br>• ROAS: 4.27x.<br>• CPL: 62.500 VND / Lead.<br>• CPA: 115.385 VND / Đơn hàng. | [ ] |
| **TC-F139-02** | Đánh giá xếp hạng chiến dịch (Performance Rating) | 1. Quan sát thẻ huy hiệu xếp hạng ở góc trên cùng của báo cáo. | Thuật toán `calculateCampaignROI`. | • Chiến dịch Mega Sale 11.11 có ROI > 200% $\rightarrow$ Xếp hạng huy hiệu xanh: `Xuất sắc (OUTSTANDING)`.<br>• Chiến dịch có ROI từ 50%-200% hiển thị `Đạt mục tiêu (ON_TARGET)`.<br>• Chiến dịch ROI < 50% hiển thị `Cần tối ưu (NEEDS_IMPROVEMENT)`. | [ ] |
| **TC-F139-03** | Xuất báo cáo tổng kết chiến dịch | 1. Bấm nút "Xuất Báo Cáo" (Icon Download). | Bấm Export. | • Thông báo tải xuống báo cáo tổng kết thành công.<br>• File báo cáo tổng hợp chi tiết tài chính, ROI, ROAS và tiến độ 4 trục sẵn sàng lưu trữ. | [ ] |

---

## [F141] - Multi-Source Trigger (Đa Nguồn Kích Hoạt Tự Động)

* **Mục tiêu:** Kích hoạt luồng kịch bản tự động từ 5 loại nguồn sự kiện: Bình luận mạng xã hội (Comment), Tin nhắn hộp thư (Message), Khách hàng mới (Lead CRM), Lịch trình thời gian định kỳ (Time Cron), và Inbound Webhook từ hệ thống bên ngoài.
* **Môi trường test:** Electron App (Trang Tự động hóa `/automation` - Tab Kịch bản Tự động) & API Backend (`/api/automations`).

### 📋 Bảng Test Cases F141

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F141-01** | Tạo kịch bản với nguồn kích hoạt Comment mạng xã hội | 1. Mở `/automation` $\rightarrow$ Bấm "Tạo Kịch Bản Mới".<br>2. Nhập tên kịch bản.<br>3. Tại mục Nguồn kích hoạt, chọn `Bình luận` (COMMENT) $\rightarrow$ Chọn kênh: Tất cả kênh (TikTok, FB, Shopee).<br>4. Lưu kịch bản. | Form tạo kịch bản. | • Kịch bản mới xuất hiện trên Grid.<br>• Huy hiệu hiển thị màu xanh dương `Comment MXH`.<br>• Dữ liệu `trigger.type = 'COMMENT'` lưu trữ thành công. | [ ] |
| **TC-F141-02** | Tạo kịch bản với nguồn kích hoạt Inbound Webhook | 1. Bấm "Tạo Kịch Bản Mới".<br>2. Chọn nguồn kích hoạt `Webhook` $\rightarrow$ Nhập nguồn `landing_page`.<br>3. Lưu kịch bản. | Trigger Webhook. | • Kịch bản lưu thành công với huy hiệu tím chàm `Inbound Webhook`.<br>• Kịch bản sẵn sàng nhận payload từ các cổng đối tác. | [ ] |
| **TC-F141-03** | Chạy thử nghiệm (Test Run) kích hoạt kịch bản | 1. Trên thẻ kịch bản bất kỳ, bấm nút "Test" (Icon Play). | Test trigger API. | • Gọi API `/api/automations/trigger-test`.<br>• Hiển thị Toast thông báo kịch bản kích hoạt thành công.<br>• Số lượt đã chạy của kịch bản tăng lên 1 và thời gian vừa chạy được cập nhật. | [ ] |

---

## [F142] - Condition Builder (Bộ Lọc Điều Kiện Thông Minh)

* **Mục tiêu:** Thiết lập các quy tắc lọc điều kiện linh hoạt trước khi kích hoạt hành động (Keyword, Tag, Source, Status, Message Contains) hỗ trợ nhiều toán tử so khớp.
* **Môi trường test:** Electron App (Modal Flow Builder `/automation`) & Thuật toán `evaluateConditions`.

### 📋 Bảng Test Cases F142

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F142-01** | Thiết lập điều kiện lọc Từ khóa (Keyword contains) | 1. Mở modal tạo/sửa kịch bản.<br>2. Tại mục Bộ điều kiện lọc, chọn trường `Từ khóa (Keyword)`, toán tử `Chứa từ (contains)`.<br>3. Nhập giá trị: `giá, bao nhiêu, ship`.<br>4. Bấm Lưu. | Điều kiện Keyword. | • Điều kiện được lưu trong mảng `conditions`.<br>• Khi khách comment chứa từ "giá" $\rightarrow$ Điều kiện khớp (`true`) $\rightarrow$ Kích hoạt hành động.<br>• Nếu comment không chứa từ khóa $\rightarrow$ Bỏ qua và ghi log `SKIPPED`. | [ ] |
| **TC-F142-02** | Thêm nhiều điều kiện kết hợp (Multi-Conditions) | 1. Bấm nút "Thêm điều kiện".<br>2. Thêm điều kiện 1: `tag` `contains` `VIP`.<br>3. Thêm điều kiện 2: `status` `equals` `NEW`.<br>4. Bấm Lưu. | 2 điều kiện kết hợp. | • Cả 2 điều kiện hiển thị rõ ràng trên thẻ kịch bản.<br>• Thuật toán kiểm tra đồng thời cả 2 điều kiện trước khi cho phép luồng chạy. | [ ] |

---

## [F143] - Cross-Module Actions (Chuỗi Hành Động Liên Phân Hệ)

* **Mục tiêu:** Tự động kích hoạt chuỗi hành động xuyên suốt các module của Topify: Gửi tin nhắn trả lời (Inbox M3), Gắn thẻ phân loại (CRM M4), Tạo Lead (CRM M4), Tạo công việc khẩn cấp (Work & Task M9), Gán người phụ trách (Staff Assignment), và Bắn thông báo In-App (Notifications).
* **Môi trường test:** Electron App (Modal Flow Builder `/automation`) & Hàm `executeActions`.

### 📋 Bảng Test Cases F143

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F143-01** | Cấu hình chuỗi hành động Message + Tag | 1. Thêm hành động 1: `+MESSAGE` $\rightarrow$ Nhập mẫu tin nhắn phản hồi.<br>2. Thêm hành động 2: `+TAG` $\rightarrow$ Nhập thẻ `Hoi_Gia_Tieng_Nang`.<br>3. Lưu kịch bản và chạy Test. | Chuỗi Message + Tag. | • Thẻ kịch bản hiển thị 2 huy hiệu hành động: `MESSAGE` và `TAG`.<br>• Log thực thi ghi nhận: `sentMessage` kèm người nhận và `appliedTag` thành công. | [ ] |
| **TC-F143-02** | Cấu hình hành động tạo Task tự động (Liên kết M9) | 1. Thêm hành động: `+TASK`.<br>2. Nhập tiêu đề task: *"Gọi điện tư vấn khách VIP trong 15 phút"*.<br>3. Chọn độ ưu tiên: `Khẩn cấp (URGENT)`.<br>4. Chạy Test kịch bản. | Hành động Task M9. | • Log thực thi ghi nhận kết quả tạo công việc mới kèm mức ưu tiên URGENT.<br>• Hệ thống Work & Task sẵn sàng tiếp nhận công việc tự động. | [ ] |

---

## [F144] - Execution Log, Retry & Idempotency (Nhật Ký Thực Thi, Thử Lại & Chống Trùng)

* **Mục tiêu:** Giám sát toàn diện lịch sử kích hoạt kịch bản, tự động phân loại kết quả (`SUCCESS`, `FAILED`, `SKIPPED`), hỗ trợ nút thử lại 1-click cho các lượt lỗi, và bảo đảm tính bất biến không trùng lặp với `idempotencyKey`.
* **Môi trường test:** Electron App (Tab Nhật ký Thực thi & Thử lại `/automation`) & API Backend (`/api/automations/logs`).

### 📋 Bảng Test Cases F144

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F144-01** | Lọc và xem danh sách nhật ký thực thi | 1. Chuyển sang Tab "Nhật Ký Thực Thi & Thử Lại".<br>2. Nhấp chọn các bộ lọc: `Tất cả`, `Thành công`, `Thất bại`, `Đã bỏ qua`. | Bộ lọc trạng thái. | • Bảng hiển thị chính xác Thời gian, Tên kịch bản, Trigger, Trạng thái (Huy hiệu màu sắc tương ứng), Idempotency Key, Thời gian xử lý ms.<br>• 4 thẻ KPI tổng kết số lượng lượt chạy đồng bộ với dữ liệu bảng. | [ ] |
| **TC-F144-02** | Thử lại lượt chạy thất bại (Retry Flow) | 1. Chọn bộ lọc `Thất bại`.<br>2. Tìm lượt chạy có trạng thái FAILED (VD: do TikTok API Rate Limit).<br>3. Bấm nút "Thử lại (1/3)". | Log ID thất bại. | • Biểu tượng xoay loading trong khi gửi yêu cầu retry.<br>• Trạng thái dòng log chuyển từ `Thất bại` sang `Thành công` (Màu xanh lá).<br>• Hiển thị Toast thông báo thử lại thành công và tăng số lần `retryCount`. | [ ] |
| **TC-F144-03** | Thanh tra chi tiết Payload (Inspect Modal) | 1. Bấm biểu tượng con mắt (Eye) trên một dòng log bất kỳ. | Nút xem chi tiết. | • Modal mở ra hiển thị 2 khối mã JSON rõ ràng:<br>  - 1. Input Trigger Payload (Dữ liệu nhận từ MXH/Webhook).<br>  - 2. Output Executed Result (Kết quả các hành động đã thực thi).<br>• Nếu là log lỗi, hiển thị khung cảnh báo màu đỏ với thông báo lỗi chi tiết. | [ ] |
| **TC-F144-04** | Kiểm tra và sao chép Idempotency Key | 1. Quan sát cột "Idempotency Key" trên bảng log.<br>2. Bấm nút Copy (Icon Copy) cạnh mã. | Bấm Copy. | • Mã có định dạng chuẩn bất biến `idemp_...`.<br>• Hiển thị thông báo Toast đã sao chép thành công và biểu tượng chuyển sang dấu Check xanh trong 2 giây. | [ ] |

---

## [F145] - Automation Templates (Thư Viện Mẫu Kịch Bản 1-Click)

* **Mục tiêu:** Cung cấp 5 mẫu quy trình tự động hóa thực chiến chuẩn doanh nghiệp cho Marketing, CSKH, CRM, Vận hành và hỗ trợ kích hoạt tức thì chỉ với 1 cú click.
* **Môi trường test:** Electron App (Modal Thư Viện Mẫu `/automation`) & API Backend (`/api/automations/templates`).

### 📋 Bảng Test Cases F145

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F145-01** | Xem thư viện 5 mẫu kịch bản chuẩn hóa | 1. Tại trang `/automation`, bấm nút "Mẫu Quy Trình (1-Click)".<br>2. Chuyển đổi giữa các danh mục tab: Marketing, CSKH, CRM, Vận hành. | Modal Thư viện mẫu. | • Hiển thị đủ 5 mẫu kịch bản thực chiến kèm mô tả chi tiết, đối tượng phù hợp và sơ đồ Nguồn $\rightarrow$ Hành động.<br>• Lọc theo danh mục mượt mà và trực quan. | [ ] |
| **TC-F145-02** | Áp dụng 1-Click mẫu kịch bản vào Workspace | 1. Chọn mẫu *"Tự động trả lời comment hỏi giá & Gắn tag Lead tiềm năng"*.<br>2. Bấm nút "Áp dụng quy trình (1-Click)". | Template ID `tpl_auto_comment_reply`. | • Modal tự động đóng lại.<br>• Hiển thị thông báo Toast thành công.<br>• Kịch bản mới xuất hiện ngay trên Tab Kịch Bản Tự Động ở trạng thái BẬT (Active) sẵn sàng vận hành. | [ ] |

---

## [F146] - Multi-Tier Balance & Auto Currency (Số Dư 3 Cấp & Quy Đổi Ngoại Tệ)

* **Mục tiêu:** Quản trị độc lập 3 loại số dư (Khả dụng - Available, Đang chờ duyệt - Pending, Tổng đã rút - Withdrawn) và tự động quy đổi ngoại tệ tức thời giữa USD và VND theo tỷ giá thị trường thời gian thực.
* **Môi trường test:** Electron App (Trang Ví & Thu Nhập `/wallet`, Tab Ví & Rút Tiền) & API Backend (`/api/wallet`).

### 📋 Bảng Test Cases F146

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F146-01** | Kiểm tra hiển thị 3 thẻ số dư trực quan | 1. Mở trang `/wallet` trên Electron Desktop App.<br>2. Quan sát 3 thẻ KPI số dư ở đầu trang. | Dữ liệu ví từ API `/api/wallet`. | • Thẻ 1 (Số dư khả dụng): Màu xanh lá, hiển thị rõ số tiền khả dụng (USD & VND).<br>• Thẻ 2 (Đang chờ duyệt): Màu vàng, hiển thị số tiền các giao dịch/lệnh rút đang xử lý.<br>• Thẻ 3 (Tổng đã rút): Màu tím, hiển thị tổng tiền đã giải ngân thành công. | [ ] |
| **TC-F146-02** | Kiểm tra cơ chế tự động quy đổi tỷ giá USD $\leftrightarrow$ VND | 1. Quan sát dòng chữ quy đổi bên dưới giá trị chính.<br>2. Kiểm tra tỷ giá áp dụng (Mặc định 1 USD = 25,400 VND). | Giá trị USD từ server. | • Số tiền VND hiển thị định dạng chuẩn phân cách hàng nghìn (VD: `$142.50` $\rightarrow$ `~3,619,500 ₫`).<br>• Hiển thị nhãn tỷ giá tham chiếu trực tiếp. | [ ] |
| **TC-F146-03** | Khả năng tự phục hồi khi Offline (Resilience Fallback) | 1. Ngắt kết nối mạng hoặc ngắt Prisma server tạm thời.<br>2. Refresh lại trang `/wallet`. | Trạng thái offline / DB unlinked. | • App tự kích hoạt kho dữ liệu In-Memory Fallback mượt mà.<br>• Không xảy ra lỗi màn hình trắng (White Screen) hay crash ứng dụng. | [ ] |

---

## [F147] - Transaction History & Ledger (Lịch Sử Giao Dịch & Sổ Cái Biến Động)

* **Mục tiêu:** Lưu vết toàn bộ biến động tài chính theo nguyên tắc sổ cái kế toán (Double-entry Ledger), minh bạch nguồn tiền (+/-), phân loại giao dịch (`COMMISSION`, `WITHDRAWAL`, `TASK_REWARD`, `BONUS`), và ghi nhận số dư sau giao dịch.
* **Môi trường test:** Electron App (Tab Lịch Sử Giao Dịch `/wallet`) & API Backend (`/api/wallet`).

### 📋 Bảng Test Cases F147

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F147-01** | Xem và phân loại sổ cái biến động số dư | 1. Chuyển sang Tab "Lịch Sử Giao Dịch".<br>2. Quan sát các dòng giao dịch. | Dữ liệu ledger. | • Dòng tiền vào (+): Màu xanh lá kèm icon `ArrowDownToLine` (VD: Hoa hồng, Thưởng nhiệm vụ).<br>• Dòng tiền ra (-): Màu đỏ kèm icon `ArrowUpRight` (VD: Rút tiền).<br>• Cột "Số dư sau GD" hiển thị chính xác lũy kế số dư ví. | [ ] |
| **TC-F147-02** | Lọc theo loại giao dịch (Transaction Type Filter) | 1. Bấm vào dropdown "Loại giao dịch".<br>2. Chọn lần lượt: `Tất cả`, `Hoa hồng giới thiệu`, `Lệnh rút tiền`, `Thưởng nhiệm vụ`. | Bộ lọc type. | • Danh sách giao dịch lọc tức thì không cần reload trang.<br>• Nếu không có giao dịch phù hợp, hiển thị giao diện trống thông báo trực quan. | [ ] |
| **TC-F147-03** | Tìm kiếm giao dịch theo từ khóa realtime | 1. Nhập mã giao dịch (VD: `TX-1049`) hoặc tên khách hàng vào ô tìm kiếm. | Từ khóa: `"TX-"`, `"Topify Pro"` | • Bảng tự động lọc các dòng giao dịch chứa từ khóa tìm kiếm. | [ ] |

---

## [F148] - Withdrawal Request & Limit Guard (Lập Lệnh Rút Tiền & Kiểm Duyệt Hạn Mức)

* **Mục tiêu:** Cho phép người dùng lập yêu cầu rút tiền về ngân hàng/ví điện tử, tự động kiểm duyệt hạn mức rút tối thiểu ($10.00 / 250,000 VND), ngăn chặn rút vượt số dư khả dụng, và theo dõi tiến độ giải ngân.
* **Môi trường test:** Electron App (Modal Rút Tiền `/wallet`) & API Backend (`POST /api/wallet`).

### 📋 Bảng Test Cases F148

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F148-01** | Mở Modal và kiểm tra hạn ngạch rút tiền | 1. Tại Tab "Ví & Rút Tiền", bấm nút "Tạo Lệnh Rút Tiền".<br>2. Quan sát modal hiển thị. | Click nút Rút tiền. | • Modal mở ra hiển thị: Số dư khả dụng hiện tại, danh sách phương thức nhận tiền đã lưu, ô nhập số tiền.<br>• Cảnh báo hạn mức tối thiểu: $10.00 USD. | [ ] |
| **TC-F148-02** | Chặn rút tiền dưới hạn mức tối thiểu | 1. Nhập số tiền rút là `$5.00`.<br>2. Bấm "Xác nhận gửi yêu cầu". | Số tiền: `$5.00` (< $10.00). | • Hệ thống hiển thị cảnh báo đỏ: *"Số tiền rút tối thiểu là $10.00"*.<br>• Không tạo lệnh rút và không trừ tiền trong ví. | [ ] |
| **TC-F148-03** | Chặn rút tiền vượt quá số dư khả dụng | 1. Nhập số tiền lớn hơn số dư khả dụng (VD: `$9999.00`).<br>2. Bấm "Xác nhận gửi yêu cầu". | Số tiền: `$9999.00`. | • Báo lỗi: *"Số dư khả dụng không đủ để thực hiện giao dịch"*.<br>• Ngăn chặn request gửi lên backend. | [ ] |
| **TC-F148-04** | Tạo lệnh rút tiền thành công (Happy Path) | 1. Chọn tài khoản VietQR đã lưu.<br>2. Nhập số tiền hợp lệ (VD: `$50.00`).<br>3. Bấm "Xác nhận gửi yêu cầu". | Số tiền: `$50.00`, Tài khoản VietQR. | • Hiển thị Toast thông báo tạo lệnh rút thành công.<br>• Số dư khả dụng giảm $50.00, số dư Đang chờ duyệt tăng tương ứng $50.00.<br>• Dòng lệnh mới xuất hiện trong Bảng "Lệnh Rút Tiền Gần Đây" với trạng thái `PENDING`. | [ ] |

---

## [F149] - Payment Methods Management (Quản Lý Tài Khoản Nhận Tiền Đa Kênh)

* **Mục tiêu:** Hỗ trợ đa dạng phương thức nhận tiền trong nước và quốc tế (VietQR, Ví MoMo, PayPal, Crypto USDT TRC-20/BEP-20), thiết lập tài khoản nhận tiền mặc định và bảo mật thông tin tài khoản.
* **Môi trường test:** Electron App (Tab Tài Khoản Nhận Tiền `/wallet`) & API Backend (`/api/wallet/payment-methods`).

### 📋 Bảng Test Cases F149

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F149-01** | Xem danh sách các phương thức thanh toán | 1. Chuyển sang Tab "Tài Khoản Nhận Tiền".<br>2. Quan sát các thẻ tài khoản. | Danh sách phương thức. | • Hiển thị đầy đủ thông tin: Logo/Icon loại kênh, Tên ngân hàng/ví, Số tài khoản, Tên chủ sở hữu, Huy hiệu "Mặc định". | [ ] |
| **TC-F149-02** | Thêm mới tài khoản VietQR / Ngân hàng nội địa | 1. Bấm nút "Thêm Phương Thức Mới".<br>2. Chọn loại: `VietQR / Ngân hàng Việt Nam`.<br>3. Nhập: Vietcombank, STK: `9876543210`, Tên: `NGUYEN VAN B`.<br>4. Bấm "Lưu phương thức". | Dữ liệu tài khoản ngân hàng. | • Thông báo toast lưu thành công.<br>• Thẻ tài khoản mới hiển thị trên danh sách và có thể dùng ngay khi rút tiền. | [ ] |
| **TC-F149-03** | Thêm mới ví PayPal và Crypto USDT | 1. Chọn loại `PayPal` $\rightarrow$ Nhập email PayPal.<br>2. Chọn loại `Crypto USDT` $\rightarrow$ Nhập địa chỉ ví USDT TRC-20/BEP-20.<br>3. Lưu phương thức. | Email PayPal / Ví Crypto. | • Hệ thống lưu trữ an toàn, hiển thị icon tương ứng của PayPal hoặc Crypto. | [ ] |
| **TC-F149-04** | Đặt phương thức làm mặc định (Set Default) | 1. Tại thẻ tài khoản chưa mặc định, bấm nút "Đặt mặc định". | Click nút Đặt mặc định. | • Thẻ tài khoản được gán huy hiệu xanh "Mặc định".<br>• Tài khoản cũ tự động bỏ cờ mặc định.<br>• Khi mở modal rút tiền, phương thức này tự động được chọn trước. | [ ] |

---

## [F150] - Earning Tasks & Direct Claim (Nhiệm Vụ Kiếm Tiền & Nhận Thưởng Trực Tiếp)

* **Mục tiêu:** Kích thích người dùng tham gia mở rộng hệ sinh thái Topify thông qua chuỗi nhiệm vụ nhận thưởng (Chia sẻ phần mềm, Review trải nghiệm, Tạo video hướng dẫn, Mời bạn bè), tích hợp thanh tiến độ và nút nhận thưởng tiền tươi vào ví ngay lập tức.
* **Môi trường test:** Electron App (Tab Nhiệm Vụ Kiếm Thưởng `/wallet`) & API Backend (`/api/wallet/tasks`).

### 📋 Bảng Test Cases F150

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F150-01** | Xem danh sách 4 nhiệm vụ kiếm tiền | 1. Chuyển sang Tab "Nhiệm Vụ Kiếm Thưởng".<br>2. Quan sát danh sách các nhiệm vụ. | Dữ liệu tasks từ API. | • Hiển thị đủ 4 nhiệm vụ: Tiêu đề, mô tả, huy hiệu danh mục (`COMMUNITY`, `REVIEW`, `CONTENT`, `REFERRAL`), phần thưởng USD & quy đổi VND, thanh phần trăm tiến độ. | [ ] |
| **TC-F150-02** | Trạng thái nhiệm vụ chưa hoàn thành (In Progress) | 1. Quan sát nhiệm vụ có tiến độ < 100% (VD: 3/5 bài viết, 60%). | Task tiến độ 60%. | • Thanh tiến độ hiển thị màu xanh lơ.<br>• Nút bấm hiển thị trạng thái xám mờ: *"Chưa đủ điều kiện"* kèm số lượng còn thiếu. | [ ] |
| **TC-F150-03** | Nhận thưởng trực tiếp vào ví (Direct Claim Reward) | 1. Tìm nhiệm vụ đã đạt 100% tiến độ (VD: Đánh giá 5 sao Topify trên Trustpilot).<br>2. Nút bấm chuyển sang màu xanh lá: *"Nhận Thưởng Ngay ($5.00)"*.<br>3. Bấm vào nút nhận thưởng. | Click "Nhận Thưởng Ngay". | • Hiệu ứng loading nhận thưởng.<br>• Toast thông báo chúc mừng: *"Bạn đã nhận thành công $5.00 vào số dư khả dụng!"*.<br>• Nút chuyển sang huy hiệu *"Đã nhận"* (Claimed).<br>• Số dư khả dụng của ví lập tức tăng thêm $5.00.<br>• Sổ cái giao dịch ghi nhận thêm 1 dòng `TASK_REWARD`. | [ ] |

---

## [F151] - Referral Link, Code & QR Generator (Link Tiếp Thị, Mã Mời & Sinh Mã QR)

* **Mục tiêu:** Cung cấp đường dẫn tiếp thị độc quyền (Unique Referral URL), mã mời cá nhân hóa cho từng Workspace, và công cụ tạo mã QR Code động tải về máy để in ấn hoặc quét nhanh trên di động.
* **Môi trường test:** Electron App (Tab Tiếp Thị & Chống Gian Lận `/wallet`) & API Backend (`/api/referral`).

### 📋 Bảng Test Cases F151

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F151-01** | Hiển thị và sao chép Link giới thiệu | 1. Chuyển sang Tab "Tiếp Thị & Chống Gian Lận".<br>2. Quan sát khung "Đường dẫn giới thiệu độc quyền".<br>3. Bấm nút "Sao chép link". | Click Sao chép link. | • Link có định dạng chuẩn: `https://topify.app/ref/<MÃ_GIỚI_THIỆU>`.<br>• Hiển thị Toast xác nhận đã sao chép và nút chuyển sang biểu tượng Check xanh. | [ ] |
| **TC-F151-02** | Tùy biến mã giới thiệu cá nhân (Custom Referral Code) | 1. Tại ô Mã mời, bấm biểu tượng chỉnh sửa (Edit).<br>2. Nhập mã mới (VD: `TOPAGENCY2026`).<br>3. Bấm "Lưu". | Mã mới: `TOPAGENCY2026`. | • Hệ thống gửi yêu cầu cập nhật lên backend.<br>• Mã mời mới được áp dụng, link giới thiệu tự động cập nhật theo mã mới. | [ ] |
| **TC-F151-03** | Mở Modal và xem Mã QR tiếp thị động | 1. Bấm nút "Mã QR" (Icon QrCode) bên cạnh khung link.<br>2. Quan sát modal QR Code mở lên. | Click nút Mã QR. | • Modal hiển thị mã QR Code chuẩn SVG/Canvas sinh tự động từ link tiếp thị.<br>• Cho phép quét thử bằng camera điện thoại mở đúng link giới thiệu.<br>• Có nút "Tải mã QR" định dạng ảnh PNG sắc nét. | [ ] |

---

## [F152] - 4-Tier Tracking Funnel (Phễu Theo Dõi Tiếp Thị 4 Tầng)

* **Mục tiêu:** Đo lường chính xác hiệu quả chiến dịch tiếp thị liên kết qua mô hình phễu 4 tầng (Lượt nhấp $\rightarrow$ Đăng ký tài khoản $\rightarrow$ Chuyển đổi gói trả phí $\rightarrow$ Người dùng hoạt động thường xuyên), tính toán tỷ lệ chuyển đổi (Conversion Rate %) theo thời gian thực.
* **Môi trường test:** Electron App (Phễu Chuyển Đổi Tab Tiếp Thị `/wallet`) & API Backend (`/api/referral`).

### 📋 Bảng Test Cases F152

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F152-01** | Kiểm tra hiển thị 4 tầng của phễu chuyển đổi | 1. Cuộn xuống phần "Phễu Chuyển Đổi Tiếp Thị (4-Tier Funnel)".<br>2. Quan sát 4 cột phân cấp của phễu. | Dữ liệu funnel từ API. | • Tầng 1: Lượt nhấp link (Clicks) - Số lượng lớn nhất.<br>• Tầng 2: Lượt đăng ký mới (Signups) kèm % chuyển đổi Clicks $\rightarrow$ Signups.<br>• Tầng 3: Khách trả phí (Paid Customers) kèm % chuyển đổi Signups $\rightarrow$ Paid.<br>• Tầng 4: Người dùng tích cực (Active Users) duy trì gia hạn. | [ ] |
| **TC-F152-02** | Xem danh sách người dùng được giới thiệu (Referred Users Table) | 1. Quan sát bảng "Danh Sách Khách Hàng Được Giới Thiệu". | Bảng danh sách người dùng. | • Hiển thị đầy đủ: Tên / Email, Ngày tham gia, Gói dịch vụ (`FREE`, `PRO`, `ENTERPRISE`), Hoa hồng tạo ra ($), Trạng thái (`ACTIVE`, `PENDING`). | [ ] |

---

## [F153] - Commission Rules & Tiering (Chính Sách Hoa Hồng Đa Tầng)

* **Mục tiêu:** Định nghĩa chính sách hoa hồng minh bạch theo các gói dịch vụ Topify (15% cho gói Basic, 20% cho gói Pro, 25% cho gói Doanh nghiệp Enterprise) kèm cơ chế hoa hồng trọn đời (Lifetime Recurring Commission) khi khách hàng gia hạn hàng tháng.
* **Môi trường test:** Electron App (Bảng Chính Sách Hoa Hồng Tab Tiếp Thị `/wallet`) & API Backend (`/api/referral/commissions`).

### 📋 Bảng Test Cases F153

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F153-01** | Xem bảng chính sách hoa hồng 3 gói | 1. Cuộn đến phần "Chính Sách Tỷ Lệ Hoa Hồng".<br>2. Kiểm tra tỷ lệ áp dụng cho từng gói. | Dữ liệu rules từ API. | • Gói Basic/Starter: 15% hoa hồng.<br>• Gói Pro Agency: 20% hoa hồng.<br>• Gói Doanh nghiệp Enterprise: 25% hoa hồng.<br>• Ghi chú rõ thời gian đối soát định kỳ: Ngày 15 hàng tháng. | [ ] |
| **TC-F153-02** | Kiểm tra nhãn Hoa hồng tái tục trọn đời | 1. Quan sát cột "Cơ chế trả thưởng" trên bảng chính sách. | Cột cơ chế trả thưởng. | • Hiển thị rõ: *"Trả thưởng định kỳ mỗi lần khách hàng gia hạn (Recurring Lifetime)"*.<br>• Khẳng định quyền lợi thu nhập thụ động bền vững cho đối tác affiliate. | [ ] |

---

## [F154] - Commission Settlement & Audit (Đối Soát Hoa Hồng & Sổ Đối Chiếu Minh Bạch)

* **Mục tiêu:** Cung cấp bảng kê chi tiết đối soát từng khoản hoa hồng phát sinh từ đơn hàng thực tế của khách hàng (Mã đơn, Doanh thu, Tỷ lệ hoa hồng, Số tiền nhận được, Trạng thái thanh toán và Kỳ đối soát).
* **Môi trường test:** Electron App (Bảng Đối Soát Hoa Hồng Tab Tiếp Thị `/wallet`) & API Backend (`/api/referral/commissions`).

### 📋 Bảng Test Cases F154

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F154-01** | Xem bảng kê đối soát hoa hồng chi tiết | 1. Quan sát phần "Lịch Sử Đối Soát Hoa Hồng". | Dữ liệu commission transactions. | • Hiển thị rõ: Mã đơn hàng (VD: `ORD-9821`), Người mua, Gói dịch vụ đã mua, Giá trị đơn hàng, % Hoa hồng, Số tiền hoa hồng thực nhận ($). | [ ] |
| **TC-F154-02** | Kiểm tra trạng thái đối soát và kỳ giải ngân | 1. Quan sát cột "Trạng thái đối soát" và "Kỳ thanh toán". | Cột trạng thái. | • Trạng thái: `APPROVED` (Đã duyệt), `SETTLED` (Đã thanh toán vào ví), `HOLDING` (Đang giữ chờ kỳ 30 ngày bảo đảm).<br>• Kỳ thanh toán: Hiển thị tháng/năm đối soát (VD: `T10/2026`). | [ ] |

---

## [F155] - Anti-Fraud Inspection (Hệ Thống Kiểm Toán & Chống Gian Lận Tự Động)

* **Mục tiêu:** Bảo vệ quỹ hoa hồng và sự công bằng của nền tảng bằng thuật toán AI quét rủi ro gian lận tự động: Phát hiện tự bấm link của chính mình (Self-referral), trùng địa chỉ IP/Fingerprint thiết bị, bùng nổ đăng ký ảo trong thời gian ngắn (Velocity burst registration), và phân loại rủi ro 3 mức (`SAFE`, `SUSPICIOUS`, `HIGH_RISK`).
* **Môi trường test:** Electron App (Trung Tâm Chống Gian Lận Tab Tiếp Thị `/wallet`) & API Backend (`/api/referral/anti-fraud`).

### 📋 Bảng Test Cases F155

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F155-01** | Xem bảng cảnh báo thanh tra gian lận | 1. Cuộn xuống phần "Trung Tâm Kiểm Toán & Chống Gian Lận".<br>2. Quan sát danh sách các cảnh báo rủi ro. | Dữ liệu fraud items từ API. | • Hiển thị đầy đủ: ID cảnh báo, Mã người dùng nghi vấn, Dấu hiệu vi phạm (Mô tả hành vi), Điểm số rủi ro (Risk Score: 0 - 100), Mức độ rủi ro (Huy hiệu màu), Hành động khuyến nghị. | [ ] |
| **TC-F155-02** | Kiểm tra phân loại 3 mức độ rủi ro | 1. Quan sát các mức độ phân loại trên bảng: `SAFE`, `SUSPICIOUS`, `HIGH_RISK`. | Huy hiệu mức độ rủi ro. | • `SAFE` (0-30 điểm): Màu xanh lá, người dùng thật bình thường.<br>• `SUSPICIOUS` (31-70 điểm): Màu vàng, cảnh báo kiểm tra bổ sung.<br>• `HIGH_RISK` (71-100 điểm): Màu đỏ, tự động đóng băng rút tiền hoa hồng liên quan. | [ ] |
| **TC-F155-03** | Chạy quét rủi ro gian lận tự động (Scan On-Demand) | 1. Bấm nút "Quét Rủi Ro Tự Động" (Icon ShieldAlert).<br>2. Quan sát hiệu ứng quét rủi ro. | Click nút Quét rủi ro. | • Biểu tượng khiên xoay tròn kích hoạt kiểm toán thuật toán.<br>• Toast thông báo hoàn thành quét: *"Hệ thống kiểm toán đã quét toàn bộ lượt giới thiệu. Điểm rủi ro tổng thể: AN TOÀN (14/100)"*.<br>• Bảng danh sách cảnh báo tự động làm mới với dữ liệu thanh tra mới nhất. | [ ] |

---

## [F156] - AI Chat Assistant (Trợ Lý AI Đa Năng & 4 Personas)

* **Mục tiêu:** Cung cấp trợ lý đàm thoại thông minh hỗ trợ vận hành chiến dịch, tư vấn chiến lược marketing, hỗ trợ copywriter và giải đáp kỹ thuật với 4 vai trò Persona chuyên biệt.
* **Môi trường test:** Electron App (Trang Topify AI Hub `/ai`, Tab Trợ Lý AI) & Backend API (`/api/ai/studio/chat`).

### 📋 Bảng Test Cases F156

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F156-01** | Chọn Persona và khởi tạo phiên hội thoại mới | 1. Mở trang `/ai` $\rightarrow$ Tab "Trợ Lý AI".<br>2. Chọn Persona: *"✍️ Copywriter Viral Triệu View"*.<br>3. Bấm nút `+` (Tạo phiên mới). | Persona `VIRAL_COPYWRITER`. | • Tạo phiên chat mới thành công.<br>• Lời chào mở đầu cá nhân hóa chuẩn vai trò Copywriter.<br>• Tên phiên tự động xuất hiện trên danh sách bên trái. | [ ] |
| **TC-F156-02** | Sử dụng câu hỏi gợi ý nhanh (Prompt Starters) | 1. Mở một phiên chat trống.<br>2. Bấm vào nút gợi ý: *"Soạn kịch bản flash sale TikTok 30s ngành thời trang"*. | Click Prompt Starter. | • Câu hỏi tự động điền vào ô chat và gửi đi.<br>• AI phản hồi kịch bản mạch lạc với bố cục rõ ràng, kèm tag Model AI sử dụng. | [ ] |
| **TC-F156-03** | Gửi tin nhắn tự do và sao chép nội dung | 1. Nhập câu hỏi: *"Làm sao để xử lý khi khách hàng chê giá đắt?"* $\rightarrow$ Bấm Gửi.<br>2. Quan sát câu trả lời $\rightarrow$ Bấm nút "Sao chép". | Prompt text. | • Trợ lý phản hồi trong < 1.5s.<br>• Nút Copy đổi sang biểu tượng Check xanh và thông báo Toast xác nhận đã sao chép. | [ ] |

---

## [F157] - AI Content Generator (Sinh Kịch Bản Video, Tiêu Đề & Caption)

* **Mục tiêu:** Tự động sinh nội dung truyền thông đa định dạng gồm kịch bản video TikTok 3 phần (Hook, Body, CTA), 5 tiêu đề viral giật tít kèm Attention Score, và bài viết bán hàng theo công thức AIDA / PAS / BAB.
* **Môi trường test:** Electron App (Tab Sáng Tạo Nội Dung `/ai`) & Backend API (`/api/ai/studio/content`).

### 📋 Bảng Test Cases F157

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F157-01** | Sinh kịch bản video ngắn TikTok chuẩn 3 phần | 1. Chọn sub-tab "Kịch Bản Video TikTok/Reels".<br>2. Nhập chủ đề: *"Kem chống nắng nâng tone kiềm dầu"*.<br>3. Chọn thời lượng: 45s $\rightarrow$ Bấm "Sinh Kịch Bản". | Chủ đề sản phẩm, 45s. | • Hiển thị kịch bản chi tiết: Hook nghịch lý 3s đầu, Body 2 đoạn, CTA 10s.<br>• Đầy đủ thông tin: Lời thoại (Voiceover), Mô tả hình ảnh (Visual), Chữ chạy trên màn hình (On-screen text) và Điểm Viral $\ge 90/100$. | [ ] |
| **TC-F157-02** | Sinh 5 tiêu đề Viral giật tít có chấm điểm Attention Score | 1. Chọn sub-tab "5 Tiêu Đề Viral Giật Tít".<br>2. Nhập: *"Phần mềm tự động hóa Topify"* $\rightarrow$ Bấm "Tạo 5 Tiêu Đề". | Chủ đề: Topify. | • Xuất hiện 5 tiêu đề theo 5 góc độ: FOMO, Tò mò, Hướng dẫn, Tranh cãi, Số liệu.<br>• Mỗi tiêu đề đều có điểm số thu hút (Attention Score: 85 - 98) và lý giải tâm lý. | [ ] |
| **TC-F157-03** | Sinh Caption bán hàng theo công thức AIDA/PAS & Mở trang đăng bài | 1. Chọn sub-tab "Caption Bán Hàng".<br>2. Nhập sản phẩm & lợi ích, chọn công thức `PAS` $\rightarrow$ Bấm Tạo.<br>3. Bấm nút "Mở trang Tạo bài". | Form PAS. | • Sinh bài viết cấu trúc Problem - Agitate - Solution sắc bén kèm hashtag.<br>• Nút "Mở trang Tạo bài" điều hướng mượt mà sang `/create`. | [ ] |

---

## [F158] - AI Image Generation (Studio Tạo Ảnh AI & Mockup)

* **Mục tiêu:** Tạo hình ảnh chất lượng cao từ văn bản (Text-to-Image) phục vụ Thumbnail video, Banner quảng cáo và Mockup sản phẩm với 5 phong cách nghệ thuật và 4 tỷ lệ khung hình chuẩn.
* **Môi trường test:** Electron App (Tab Tạo Ảnh AI `/ai`) & Backend API (`/api/ai/studio/image`).

### 📋 Bảng Test Cases F158

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F158-01** | Tạo ảnh AI với phong cách 3D Render tỷ lệ 16:9 | 1. Nhập prompt: *"Futuristic AI Marketing Dashboard with holographic neon charts"*.<br>2. Chọn Style: `3D Render`, Tỷ lệ: `16:9 YouTube`.<br>3. Bấm "Sinh Ảnh AI". | Prompt & Settings. | • Quá trình sinh ảnh hoàn tất không lỗi.<br>• Ảnh mới hiển thị đầu danh sách thư viện với độ phân giải sắc nét đúng tỷ lệ 16:9. | [ ] |
| **TC-F158-02** | Tải ảnh về máy và điều hướng sang Media Studio M7 | 1. Tại thẻ ảnh vừa sinh, bấm nút "Tải ảnh".<br>2. Bấm nút "Sửa ảnh". | Thao tác trên ảnh. | • Ảnh mở hoặc tải về máy chuẩn định dạng.<br>• Nút "Sửa ảnh" chuyển hướng người dùng sang phân hệ Media Studio (`/media/studio`) để cắt ghép & thêm sticker. | [ ] |

---

## [F159] - AI Video Generation & Storyboard (Kịch Bản Phân Cảnh Video)

* **Mục tiêu:** Chuyển hóa ý tưởng video thành bảng phân cảnh kịch bản chi tiết (Storyboard) với góc quay camera, prompt hình ảnh, voiceover và nhạc nền BGM, kèm trình phát xem trước video mẫu.
* **Môi trường test:** Electron App (Tab Phân Cảnh Video `/ai`) & Backend API (`/api/ai/studio/video`).

### 📋 Bảng Test Cases F159

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F159-01** | Tạo kịch bản phân cảnh Storyboard từ ý tưởng | 1. Nhập prompt: *"Giới thiệu tính năng tự động trả lời comment của Topify"*.<br>2. Bấm "Sinh Storyboard Video". | Prompt video. | • Bảng phân cảnh hiển thị chi tiết từ Cảnh #1 đến Cảnh #3.<br>• Đầy đủ thông số: Góc quay (Camera movement), Lời thoại (Voiceover), Visual prompt và Nhạc nền (BGM mood). | [ ] |
| **TC-F159-02** | Xem trước video mô phỏng trên Video Player | 1. Quan sát khung Preview Player bên trái.<br>2. Bấm nút Play/Pause để phát video mẫu. | Trình phát video. | • Video phát trơn tru, tỷ lệ chuẩn 9:16 dọc TikTok.<br>• Hiển thị tiêu đề, thời lượng và trạng thái render `COMPLETED`. | [ ] |

---

## [F160] - AI Voice & Audio TTS Studio (Lồng Tiếng AI Đa Ngữ Điệu)

* **Mục tiêu:** Chuyển đổi văn bản thành giọng đọc tự nhiên (Text-to-Speech) đa vùng miền (Bắc, Trung, Nam) và tiếng Anh, hỗ trợ 4 sắc thái ngữ điệu và tinh chỉnh tốc độ đọc.
* **Môi trường test:** Electron App (Tab Lồng Tiếng AI `/ai`) & Backend API (`/api/ai/studio/voice`).

### 📋 Bảng Test Cases F160

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F160-01** | Lồng tiếng AI giọng nữ miền Nam ngữ điệu hào hứng | 1. Nhập văn bản giới thiệu sản phẩm.<br>2. Chọn giọng: *"Hoài My (Nữ miền Nam)"*, Ngữ điệu: *"Hào hứng, cuốn hút"*, Tốc độ: `1.0x`.<br>3. Bấm "Chuyển Thành Giọng Đọc AI". | Text kịch bản. | • Tệp âm thanh sinh thành công và xuất hiện trong danh sách bên phải.<br>• Trình phát Audio Player cho phép phát/ngừng trực tiếp trên ứng dụng. | [ ] |
| **TC-F160-02** | Điều chỉnh tốc độ giọng đọc (Speed Slider) | 1. Kéo thanh tốc độ lên `1.2x`.<br>2. Chọn giọng *"Nam Minh (Nam miền Bắc)"* $\rightarrow$ Bấm tạo. | Tốc độ 1.2x. | • Thời lượng đọc được rút ngắn tương ứng và hiển thị số giây chính xác. | [ ] |

---

## [F161] - AI Content Repurposing Engine (Tái Chế Nội Dung Đa Kênh)

* **Mục tiêu:** Nhập 1 bài viết dài và tự động bóc tách thành gói truyền thông đa kênh gồm: 2 kịch bản video ngắn TikTok, 1 chuỗi bài viết Thread, 1 Bản tin Email Newsletter và 3 câu Quotes viral.
* **Môi trường test:** Electron App (Tab Tái Chế & Model Routing `/ai`) & Backend API (`/api/ai/studio/repurpose`).

### 📋 Bảng Test Cases F161

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F161-01** | Bóc tách bài viết dài thành 4 định dạng truyền thông | 1. Dán một bài viết dài (> 20 ký tự) vào ô văn bản.<br>2. Bấm "Tái Chế Tức Thì Thành 4 Định Dạng". | Đoạn văn bản dài. | • Hệ thống phân tích và sinh tức thời 4 khối định dạng:<br>1. Hai kịch bản video ngắn kèm Hook riêng biệt.<br>2. Chuỗi Twitter/Facebook Thread đánh số 1/3, 2/3, 3/3.<br>3. Một Email Newsletter chuẩn Marketing (Subject, Preheader, Body, CTA).<br>4. Ba câu Quotes truyền cảm hứng sâu sắc. | [ ] |
| **TC-F161-02** | Chặn nhập bài viết quá ngắn (< 20 ký tự) | 1. Nhập *"Xin chào"* $\rightarrow$ Bấm "Tái Chế Tức Thì". | Văn bản ngắn. | • Hiển thị cảnh báo Toast: *"Bài viết cần ít nhất 20 ký tự để tái chế"*.<br>• Ngăn chặn request không hợp lệ. | [ ] |

---

## [F162] - AI Model Switching & Routing Gateway (Định Tuyến & Quản Trị Mô Hình AI)

* **Mục tiêu:** Tự động định tuyến giữa các mô hình AI hàng đầu qua 9router Gateway, hỗ trợ đo lường độ trễ ms thời gian thực, quản lý credit tiêu thụ và kích hoạt cơ chế Fallback Heuristic an toàn.
* **Môi trường test:** Electron App (Tab Tái Chế & Model Routing `/ai`) & Backend API (`/api/ai/studio/models`).

### 📋 Bảng Test Cases F162

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F162-01** | Chuyển đổi linh hoạt giữa 5 mô hình AI | 1. Cuộn đến phần "AI Model Switching & 9router Gateway".<br>2. Bấm chọn thẻ model: *"Claude 3.5 Sonnet"* hoặc *"GPT-4o"*. | Model ID. | • Thẻ model được viền sáng xanh kích hoạt.<br>• Huy hiệu đổi sang *"Đang kích hoạt"*.<br>• Thanh trạng thái Gateway trên Header cập nhật tức thì model mới. | [ ] |
| **TC-F162-02** | Kiểm tra độ trễ kết nối (Ping Gateway) | 1. Bấm nút "Kiểm Tra Kết Nối (Ping)". | Click Ping. | • Hiệu ứng xoay tròn kiểm tra kết nối tới 9router Gateway.<br>• Hiển thị Toast thông báo độ trễ đo được (VD: 45ms - 150ms) và cập nhật số liệu trên thẻ. | [ ] |
| **TC-F162-03** | Cơ chế an toàn Fallback Heuristic khi không có API Key | 1. Chạy ứng dụng khi chưa cấu hình `NINE_ROUTER_API_KEY`.<br>2. Kiểm tra trạng thái hoạt động của các tính năng AI. | Môi trường offline / no key. | • Trạng thái hiển thị *"Heuristic Safe"* màu vàng.<br>• Toàn bộ 7 tính năng AI (Chat, Kịch bản, Tiêu đề, Caption, Ảnh, Video, Voice, Tái chế) vẫn hoạt động hoàn hảo, trả về kết quả mẫu chất lượng cao không bị crash. | [ ] |

---

## [F163] - Two-Factor Authentication (Xác Thực Hai Yếu Tố 2FA TOTP)

* **Mục tiêu:** Tăng cường an ninh tài khoản bằng xác thực hai yếu tố dựa trên thuật toán TOTP chuẩn tương thích với Google Authenticator, Authy, cung cấp mã QR Code động và 8 mã khôi phục khẩn cấp.
* **Môi trường test:** Electron App (Tab 2FA & RBAC `/security`) & Backend API (`/api/security/2fa`).

### 📋 Bảng Test Cases F163

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F163-01** | Bật 2FA và quét mã QR Code | 1. Bấm nút "Bật 2FA Ngay".<br>2. Xem mã QR và khóa bí mật thủ công.<br>3. Nhập mã 6 chữ số hợp lệ.<br>4. Bấm "Xác Thực & Kích Hoạt". | Mã 6 chữ số (VD: `582910`). | • 2FA chuyển sang trạng thái *"● Đang Kích Hoạt"* màu xanh.<br>• Modal đóng lại và hiển thị danh sách 8 mã khôi phục khẩn cấp (Emergency Backup Codes). | [ ] |
| **TC-F163-02** | Sao chép 8 mã khôi phục khẩn cấp | 1. Bấm nút "Copy 8 mã khôi phục". | Click Copy. | • Toàn bộ 8 mã khôi phục được sao chép vào Clipboard.<br>• Hiển thị Toast xác nhận thành công. | [ ] |
| **TC-F163-03** | Vô hiệu hóa 2FA | 1. Bấm nút "Vô hiệu hóa 2FA". | Click Disable. | • 2FA chuyển sang trạng thái *"○ Đang Tắt"*.<br>• Ghi nhận sự kiện `TWO_FACTOR_DISABLED` vào sổ kiểm toán bảo mật. | [ ] |

---

## [F164] - Role-Based Access Control (Ma Trận Phân Quyền RBAC)

* **Mục tiêu:** Kiểm soát và phân quyền chi tiết cho 4 vai trò trong doanh nghiệp (Owner, Admin, Editor, Viewer), cho phép bật/tắt quyền hạn theo từng phân hệ.
* **Môi trường test:** Electron App (Tab 2FA & RBAC `/security`) & Backend API (`/api/security/rbac`).

### 📋 Bảng Test Cases F164

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F164-01** | Xem và cập nhật quyền hạn theo vai trò | 1. Quan sát ma trận phân quyền 4 vai trò.<br>2. Tick chọn hoặc bỏ chọn một quyền hạn cho vai trò Editor (VD: *Tạo, sửa & lên lịch đăng bài*). | Checkbox toggle. | • Quyền hạn được lưu ngay vào hệ thống.<br>• Hiển thị Toast thông báo: *"Đã cập nhật quyền hạn cho vai trò EDITOR"*.<br>• Vai trò Owner luôn có dấu tích xanh cố định (Toàn quyền không thể tước). | [ ] |
| **TC-F164-02** | Kiểm soát an toàn quyền rút tiền ví | 1. Kiểm tra quyền *Lập lệnh rút tiền & quản lý tài khoản ngân hàng* (`wallet.withdraw`). | Kiểm tra quyền. | • Chỉ có Owner được cấp quyền này; các vai trò khác mặc định tắt để bảo toàn tài chính Workspace. | [ ] |

---

## [F165] - API Keys Management (Quản Lý Khóa API Cho Nhà Phát Triển)

* **Mục tiêu:** Khởi tạo, phân quyền (Scope), giới hạn dải IP Whitelist, kiểm soát Rate Limit và thu hồi khóa API dùng cho tích hợp bên thứ ba.
* **Môi trường test:** Electron App (Tab Quản Lý API Keys `/security`) & Backend API (`/api/security/api-keys`).

### 📋 Bảng Test Cases F165

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F165-01** | Tạo API Key mới kèm Scope và IP Whitelist | 1. Bấm "Tạo API Key Mới".<br>2. Nhập tên định danh, chọn Scope `READ_WRITE`, nhập IP Whitelist `14.232.208.12`.<br>3. Bấm "Tạo Key". | Tên + Scope + IP. | • API Key mới được tạo và thêm vào bảng danh sách.<br>• Banner cảnh báo màu vàng hiển thị chuỗi Token bí mật (`topify_sec_live_...`) một lần duy nhất kèm nút Copy. | [ ] |
| **TC-F165-02** | Thu hồi API Key đang hoạt động | 1. Bấm nút "Thu hồi" tại một API Key đang có trạng thái `ACTIVE`.<br>2. Xác nhận hộp thoại cảnh báo. | Click Revoke. | • Trạng thái của Key lập tức chuyển sang `REVOKED` màu đỏ.<br>• Nút thu hồi bị ẩn đi.<br>• Ghi nhận sự kiện `API_KEY_REVOKED` vào sổ kiểm toán. | [ ] |

---

## [F166] - Webhook Subscriptions (Đăng Ký & Kiểm Thử Webhooks)

* **Mục tiêu:** Cung cấp cơ chế Webhook nhận sự kiện thời gian thực khi có bài viết được đăng, đơn hàng phát sinh hoặc lead khách hàng mới, kèm chữ ký bí mật HMAC và công cụ gửi thử nghiệm Test Ping.
* **Môi trường test:** Electron App (Tab Webhooks `/security`) & Backend API (`/api/security/webhooks`).

### 📋 Bảng Test Cases F166

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F166-01** | Đăng ký Webhook Endpoint mới | 1. Bấm "Thêm Webhook Endpoint".<br>2. Nhập tên endpoint, URL HTTPS (`https://myapi.com/wh`).<br>3. Tick chọn các sự kiện quan tâm (`post.published`, `order.created`).<br>4. Bấm "Đăng Ký". | Form input hợp lệ. | • Thẻ Webhook mới xuất hiện với mã Signing Secret tự sinh (`whsec_...`).<br>• Trạng thái hiển thị `ACTIVE`. | [ ] |
| **TC-F166-02** | Gửi gói tin thử nghiệm (Test Ping) | 1. Bấm nút "Gửi Thử Nghiệm (Test Ping)" tại một Webhook.<br>2. Quan sát phản hồi mạng. | Click Test Ping. | • Hệ thống gửi mock payload `system.ping_test`.<br>• Nhận mã HTTP 200 kèm số ms đo được.<br>• Bảng "Nhật Ký Gửi Webhook Gần Nhất" bên dưới tự động thêm 1 dòng nhật ký mới. | [ ] |

---

## [F167] - Cloud Storage Integrations (Lưu Trữ Đám Mây Đa Nhà Cung Cấp)

* **Mục tiêu:** Tích hợp đa nền tảng lưu trữ đám mây (AWS S3, Cloudflare R2, Google Drive) để tự động sao lưu media và tệp xuất bản, kèm công cụ kiểm tra kết nối thời gian thực.
* **Môi trường test:** Electron App (Tab Lưu Trữ Đám Mây `/security`) & Backend API (`/api/security/integrations/storage`).

### 📋 Bảng Test Cases F167

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F167-01** | Kiểm tra kết nối dịch vụ lưu trữ (Ping) | 1. Bấm nút "Kiểm Tra Kết Nối (Ping)" tại thẻ AWS S3 hoặc Cloudflare R2. | Click Ping. | • Hiển thị Toast thông báo: *"Kiểm tra kết nối thành công: Dịch vụ lưu trữ AWS_S3 hoạt động bình thường!"*.<br>• Trạng thái hiển thị xanh `● Đã Kết Nối`. | [ ] |
| **TC-F167-02** | Chuyển đổi bộ lưu trữ đám mây mặc định | 1. Tại thẻ Cloudflare R2 (đang là phụ), bấm "Đặt làm lưu trữ mặc định". | Click Set Default. | • Huy hiệu *"Mặc định"* chuyển sang Cloudflare R2.<br>• Thẻ Cloudflare R2 được viền sáng màu xanh lục; các dịch vụ khác trở về trạng thái phụ. | [ ] |

---

## [F168] - CRM & Marketing Integrations (Tích Hợp CRM & Tự Động Hóa)

* **Mục tiêu:** Kết nối đồng bộ 2 chiều dữ liệu khách hàng (Leads) và đơn hàng (Orders) giữa Topify và các nền tảng CRM hàng đầu như HubSpot, Mailchimp, Zapier và Google Sheets.
* **Môi trường test:** Electron App (Tab Tích Hợp CRM & Marketing `/security`) & Backend API (`/api/security/integrations/crm`).

### 📋 Bảng Test Cases F168

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F168-01** | Bật/tắt tự động đồng bộ khách hàng và đơn hàng | 1. Bật công tắc "Tự động đồng bộ khách hàng (Leads)" tại thẻ HubSpot.<br>2. Bật công tắc "Tự động đồng bộ giao dịch (Orders)". | Checkbox toggles. | • Cấu hình được cập nhật tức thì qua API.<br>• Hiển thị Toast thông báo xác nhận thành công.<br>• Số lượng bản ghi đồng bộ và thời gian lần cuối được ghi nhận minh bạch. | [ ] |

---

## [F169] - Security Audit Log (Sổ Kiểm Toán Bảo Mật ISO 27001 / SOC 2)

* **Mục tiêu:** Ghi nhận toàn bộ hành vi quản trị, đăng nhập, thay đổi cấu hình, tạo key và rút tiền chuẩn ISO 27001 và SOC 2, hỗ trợ xuất báo cáo định dạng CSV.
* **Môi trường test:** Electron App (Tab Kiểm Toán & Phiên IP `/security`) & Backend API (`/api/security/audit-log`).

### 📋 Bảng Test Cases F169

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F169-01** | Xem sổ nhật ký kiểm toán bảo mật | 1. Mở phần "Sổ Kiểm Toán Bảo Mật Doanh Nghiệp".<br>2. Quan sát các cột: Người thực hiện, Hành động, Danh mục, Địa chỉ IP, Trạng thái, Thời gian. | Xem bảng. | • Hiển thị đầy đủ lịch sử với phân loại màu sắc (SUCCESS: Xanh, WARNING: Vàng, DENIED: Đỏ). | [ ] |
| **TC-F169-02** | Xuất báo cáo kiểm toán định dạng CSV | 1. Bấm nút "Xuất Báo Cáo CSV". | Click Export CSV. | • Trình duyệt/Electron tải về tệp tin `Topify_Security_Audit_Report_<timestamp>.csv`.<br>• Tệp tin chứa đầy đủ các cột dữ liệu kiểm toán chuẩn hóa. | [ ] |

---

## [F170] - IP Whitelisting & Active Session Management (Quản Lý Phiên & IP Tin Cậy)

* **Mục tiêu:** Quản trị các thiết bị đang đăng nhập vào Workspace, hỗ trợ đăng xuất từ xa từng thiết bị hoặc đăng xuất hàng loạt, đồng thời thiết lập danh sách IP tin cậy (IP Whitelisting) để ngăn chặn truy cập trái phép.
* **Môi trường test:** Electron App (Tab Kiểm Toán & Phiên IP `/security`) & Backend API (`/api/security/sessions-ip`).

### 📋 Bảng Test Cases F170

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F170-01** | Đăng xuất từ xa một thiết bị | 1. Tại danh sách "Phiên Đăng Nhập Thiết Bị", tìm một thiết bị không phải là phiên hiện tại.<br>2. Bấm nút "Đăng xuất". | Click Đăng xuất. | • Thiết bị đó biến mất khỏi danh sách.<br>• Hiển thị Toast: *"Đã đăng xuất thiết bị từ xa"*.<br>• Ghi nhận hành vi vào sổ kiểm toán. | [ ] |
| **TC-F170-02** | Đăng xuất khỏi tất cả thiết bị khác | 1. Bấm nút "Đăng xuất thiết bị khác".<br>2. Xác nhận hộp thoại cảnh báo. | Click Revoke All Others. | • Toàn bộ các phiên khác bị thu hồi, chỉ giữ lại duy nhất thiết bị đang dùng có huy hiệu *"Phiên này"*.<br>• Hiển thị Toast thông báo số lượng thiết bị đã đăng xuất. | [ ] |
| **TC-F170-03** | Thêm địa chỉ IP tin cậy (IP Whitelisting) | 1. Nhập IP `203.113.152.8` và nhãn *"Chi nhánh Cần Thơ"*.<br>2. Bấm "Thêm IP". | IP + Nhãn. | • Địa chỉ IP mới xuất hiện trong danh sách IP tin cậy.<br>• Hiển thị Toast: *"Đã thêm IP tin cậy thành công!"*. | [ ] |
| **TC-F170-04** | Xóa địa chỉ IP khỏi danh sách tin cậy | 1. Bấm icon thùng rác bên cạnh một IP tin cậy. | Click Delete IP. | • IP đó bị loại bỏ khỏi danh sách tin cậy ngay lập tức.<br>• Hiển thị Toast thông báo xác nhận. | [ ] |

---

## [F171] - Omnichannel Messaging Backend & Connectors (Hộp Thư Hợp Nhất Đa Kênh)

* **Mục tiêu:** Kết nối trực tiếp backend với các mạng xã hội (Telegram Bot, Meta Messenger/Instagram DM, Zalo OA), tự động gộp tin nhắn vào Hộp thư hợp nhất, tự sinh Lead khách hàng trên CRM và hỗ trợ nhân viên phản hồi 2 chiều tức thì.
* **Môi trường test:** Electron App (Trang Hộp thư `/inbox` & Modal Kết Nối MXH) & Backend API (`/api/webhooks/telegram`, `/api/webhooks/meta`, `/api/webhooks/zalo`, `/api/social/telegram/connect`, `/api/inbox/[id]/reply`).

### 📋 Bảng Test Cases F171

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F171-01** | Kết nối Telegram Bot 1-Click & Tự Động Kích Hoạt Webhook | 1. Mở `/inbox` $\rightarrow$ Bấm nút "Kết nối MXH" trên thanh tiêu đề.<br>2. Nhập Telegram Bot Token (VD: lấy từ @BotFather).<br>3. Bấm "Kiểm tra & Kết nối Bot". | Bot Token hợp lệ. | • Hệ thống gọi `getMe` xác thực bot username.<br>• Tự động đăng ký Webhook URL của Topify với Telegram API.<br>• Hiển thị thông báo kết nối thành công và lưu SocialAccount vào database. | [x] |
| **TC-F171-02** | Tiếp nhận tin nhắn Telegram Webhook & Tự tạo Khách hàng CRM | 1. Gửi webhook payload tin nhắn văn bản từ Telegram tới `/api/webhooks/telegram`. | Webhook payload Telegram Update. | • Tự động giải mã sender, message content và file attachment.<br>• Khởi tạo hoặc cập nhật `Conversation` với nền tảng `TELEGRAM`.<br>• Tự động tạo bản ghi `Customer` mới trong CRM với nhãn `#telegram` và nguồn `TELEGRAM`. | [x] |
| **TC-F171-03** | Xác thực Meta Webhook GET Challenge & Tiếp nhận Messenger/Instagram | 1. Meta gửi request GET xác thực tới `/api/webhooks/meta` kèm `hub.challenge`.<br>2. Meta gửi webhook POST sự kiện nhắn tin từ Fanpage hoặc Instagram. | `hub.verify_token` + Webhook POST payload. | • GET trả về `hub.challenge` với mã HTTP 200.<br>• POST kiểm tra HMAC SHA-256 signature, trích xuất tin nhắn và đưa vào Inbox với nền tảng `FACEBOOK_MESSENGER` hoặc `INSTAGRAM_DM`. | [x] |
| **TC-F171-04** | Tiếp nhận sự kiện Zalo OA Webhook | 1. Zalo gửi sự kiện `user_send_text` tới `/api/webhooks/zalo`. | Webhook payload Zalo OA. | • Chuyển đổi ID người gửi Zalo, text/ảnh sang format chuẩn `UnifiedInboundMessage`.<br>• Lưu hội thoại `ZALO_CHAT` và hiển thị trên giao diện Inbox. | [x] |
| **TC-F171-05** | Phản hồi tin nhắn 2 chiều từ Topify UI (Outbound Dispatcher) | 1. Nhân viên chọn hội thoại Telegram/Meta/Zalo tại `/inbox`.<br>2. Gõ câu trả lời và bấm "Gửi". | API POST `/api/inbox/[id]/reply`. | • Hệ thống xác định kênh đích qua `conversation.platform`.<br>• Outbound Dispatcher gửi tin qua API tương ứng (Telegram `sendMessage`, Meta Graph API `/me/messages`, Zalo `oa/message/cs`).<br>• Cập nhật tin nhắn trong cơ sở dữ liệu với `externalId` gửi đi. | [x] |
| **TC-F171-06** | Phân loại huy hiệu nền tảng trực quan trên giao diện Inbox | 1. Quan sát danh sách hội thoại tại `/inbox`. | Hội thoại từ các kênh khác nhau. | • Telegram hiển thị badge Sky kèm icon MessageCircle/Send.<br>• Messenger hiển thị badge Blue.<br>• Instagram hiển thị badge Pink/Rose.<br>• Zalo hiển thị badge Cyan. | [x] |

---

## [F022] - Đăng Ngẫu Nhiên Giờ Trong Khung (Random Time Window Publishing)

* **Mục tiêu:** Cung cấp chế độ lên lịch xuất bản ngẫu nhiên trong khoảng thời gian (Start Time - End Time) hoặc chọn theo 4 khung giờ vàng được cấu hình sẵn (Sáng, Trưa, Chiều, Tối). Khi người dùng đăng nhiều video, hệ thống tự động rải đều hoặc xáo trộn ngẫu nhiên để chống hành vi spam/bot của thuật toán mạng xã hội.
* **Môi trường test:** Electron Desktop App (`/create`) & Backend API (`POST /api/posts`).

### 📋 Bảng Test Cases F022

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F022-01** | Hiển thị 3 chế độ đăng bài và 4 khung giờ vàng preset | 1. Mở trang `/create`.<br>2. Quan sát khu vực "Thời điểm xuất bản". | Giao diện `/create`. | • Hiển thị 3 card lựa chọn: "Đăng ngay", "Lên lịch cố định" và "Đăng ngẫu nhiên trong khung".<br>• Khi chọn "Đăng ngẫu nhiên", hiển thị 4 khung giờ vàng (Sáng 08:30-11:30, Trưa 12:00-13:45, Chiều 16:00-18:00, Tối 19:30-22:30) và tuỳ chọn Tùy chỉnh. | [x] |
| **TC-F022-02** | Chọn khung giờ vàng preset và xem thời điểm dự kiến | 1. Chọn preset "Tối 19:30 - 22:30". | Preset "Tối". | • Start Time điền `19:30`, End Time điền `22:30`.<br>• Khung Xem trước hiển thị thời điểm đăng ngẫu nhiên nằm chuẩn trong khoảng 19:30 đến 22:30. | [x] |
| **TC-F022-03** | Chức năng "Random lại" xáo trộn thời điểm khác | 1. Bấm nút "🎲 Random lại". | Click event. | • Hệ thống sinh ra một mốc thời gian ngẫu nhiên khác nhưng vẫn nằm chính xác trong khoảng `[randomWindowStart, randomWindowEnd]`. | [x] |
| **TC-F022-04** | Thiết lập Start Time sau End Time (Validation) | 1. Nhập Start Time `20:00`, End Time `18:00`. | Start > End. | • Giao diện báo lỗi validation màu đỏ: "Giờ bắt đầu phải nhỏ hơn giờ kết thúc".<br>• Không thể submit form. | [x] |
| **TC-F022-05** | Lưu bài viết thành công với trạng thái SCHEDULED | 1. Chọn video hợp lệ, chọn kênh và khung giờ random.<br>2. Bấm "Lên lịch ngẫu nhiên". | Payload `publishMode: 'random_window'`. | • Backend API trả về mã 200/201 `success: true`.<br>• Bài viết được lưu với trạng thái `SCHEDULED` và trường `scheduledAt` nhận mốc thời gian ngẫu nhiên đã tính. | [x] |

---

## [F019] - Import Bài Viết Hàng Loạt Từ Google Drive / Excel

* **Mục tiêu:** Cho phép người sáng tạo và doanh nghiệp nhập hàng loạt hàng chục, hàng trăm bài viết từ file bảng tính Excel (`.xlsx`, `.xls`), file `.csv` hoặc liên kết trực tiếp Google Sheets. Giao diện cung cấp bảng xem trước tương tác (Preview Table) cho phép chỉnh sửa trực tiếp từng ô và tạo hàng loạt bài viết dạng `DRAFT` hoặc `SCHEDULED`.
* **Môi trường test:** Electron Desktop App (`/posts`, `/content-studio` Tab 4) & Backend API (`/api/content-studio/import/*`).

### 📋 Bảng Test Cases F019

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F019-01** | Mở trình Import từ Quản lý bài viết và Content Studio | 1. Tại `/posts`, bấm nút "Import từ Excel / Drive (F019)".<br>2. Tại `/content-studio`, chuyển sang tab "Import Excel / Google Drive (F019)". | Click button. | • Hiển thị Modal/Workspace Import với 2 tab: "Tải file Excel / CSV" và "Liên kết Google Sheets".<br>• Có nút "Tải file mẫu Excel" tải file `Mau_Import_Bai_Viet_Topify.xlsx`. | [x] |
| **TC-F019-02** | Upload file Excel/CSV chuẩn và xem bảng phân tích dữ liệu | 1. Kéo thả file Excel chứa danh sách bài viết vào khu vực upload.<br>2. Bấm "Phân Tích Dữ Liệu Tệp". | File Excel/CSV. | • Bảng xem trước hiển thị danh sách dòng với các cột: Hàng, Tiêu đề, Caption, Hashtags, Kênh đăng, Lịch hẹn.<br>• Huy hiệu đếm số dòng hợp lệ, cảnh báo hoặc lỗi. | [x] |
| **TC-F019-03** | Chỉnh sửa trực tiếp (Inline Edit) tại bảng Preview | 1. Nhấp đúp vào ô Tiêu đề hoặc Caption của một dòng.<br>2. Sửa nội dung câu chữ và bấm ra ngoài hoặc nhấn Enter. | Sửa nội dung ô. | • Giá trị được cập nhật trực tiếp trong bảng xem trước.<br>• Trạng thái hợp lệ của dòng được tự động tính toán lại. | [x] |
| **TC-F019-04** | Nhập bài qua liên kết Google Sheets trực tiếp | 1. Chọn tab "Liên kết Google Sheets".<br>2. Dán link Google Sheets công khai.<br>3. Bấm "Nạp Dữ Liệu Từ Google Sheets". | URL Google Sheets. | • Hệ thống tự động chuyển đổi link sang CSV export và trích xuất dữ liệu.<br>• Hiển thị toàn bộ dữ liệu lên bảng xem trước. | [x] |
| **TC-F019-05** | Lưu hàng loạt bài viết vào Database & Enqueue lịch | 1. Chọn các dòng hợp lệ cần nhập.<br>2. Bấm "Nhập & Lưu X bài viết". | Request `/api/content-studio/import/save`. | • Bài viết có ngày giờ hợp lệ được lưu trạng thái `SCHEDULED`; bài viết không có ngày được lưu `DRAFT`.<br>• Hiển thị Toast thông báo thành công và danh sách `/posts` tự động làm mới. | [x] |

---

## [F050] - So Sánh Hiệu Suất Theo Khoảng Thời Gian (Period Comparison: MoM / YoY)

* **Mục tiêu:** Cung cấp tính năng so sánh hiệu suất kỳ này với kỳ đối ứng trước đó (MoM, WoW, QoQ, YoY). Giao diện hiển thị checkbox kích hoạt tại Date Range Toolbar, biểu đồ trực quan hóa 2 đường nét liền (kỳ này) và nét đứt (kỳ trước), kèm các huy hiệu tăng trưởng tỷ lệ % (`🟩 +%` / `🟥 -%`).
* **Môi trường test:** Electron Desktop App (`/analytics`) & Backend API (`GET /api/analytics/period-comparison`).

### 📋 Bảng Test Cases F050

| ID | Tên kịch bản | Các bước thực hiện (Steps) | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-F050-01** | Hiển thị Checkbox "So sánh với kỳ trước (F050)" tại Date Toolbar | 1. Mở `/analytics`.<br>2. Quan sát thanh công cụ bộ lọc thời gian. | Giao diện `/analytics`. | • Hiển thị 4 preset khoảng thời gian: "7 ngày qua", "30 ngày qua", "Quý này (90 ngày)", "Tháng này".<br>• Hiển thị checkbox "So sánh với kỳ trước (F050)". | [x] |
| **TC-F050-02** | Kích hoạt checkbox và tự động tính toán mốc thời gian kỳ trước | 1. Tích chọn checkbox "So sánh với kỳ trước".<br>2. Đổi qua lại giữa các mốc 7 ngày, 30 ngày, Tháng này. | Toggle checkbox. | • Hiển thị Banner trạng thái đối chiếu thời gian tương đương (VD: chọn 7 ngày $\rightarrow$ Kỳ trước: 7 ngày trước đó WoW; chọn 30 ngày $\rightarrow$ Kỳ trước: 30 ngày trước đó MoM).<br>• Cho phép chuyển đổi giữa "Kỳ trước (MoM/WoW)" và "Cùng kỳ năm ngoái (YoY)". | [x] |
| **TC-F050-03** | Thẻ chỉ số KPI hiển thị huy hiệu % tăng trưởng trực quan | 1. Quan sát 4 thẻ KPI (Lượt xem, Tiếp cận, Tương tác, Leads CRM). | Chế độ so sánh đang bật. | • Mỗi thẻ hiển thị giá trị kỳ này kèm huy hiệu tăng trưởng `🟩 +%` (xanh nếu tăng) hoặc `🟥 -%` (đỏ nếu giảm).<br>• Dòng phụ chú ghi rõ số liệu kỳ đối ứng trước đó để so sánh. | [x] |
| **TC-F050-04** | Biểu đồ trực quan hóa 2 đường nét liền và nét đứt chồng lên nhau | 1. Quan sát biểu đồ xu hướng hiệu suất.<br>2. Hover chuột vào các điểm dữ liệu trên biểu đồ. | Chế độ so sánh đang bật. | • Biểu đồ hiển thị 2 đường: Đường nét liền xanh dương = Kỳ này, Đường nét đứt xám = Kỳ trước.<br>• Có các tab chuyển đổi thước đo: Lượt xem, Tiếp cận, Tương tác, Leads CRM.<br>• Tooltip khi hover hiển thị chi tiết giá trị cả 2 kỳ và % chênh lệch tương ứng. | [x] |








