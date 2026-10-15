# Thiết Kế Chi Tiết: F062 - Thanh Toán & Gia Hạn Tự Động (Cổng SePay VietQR)

* **Mã tính năng:** F062
* **Phân hệ:** M8. Workspace & Admin
* **Mức độ ưu tiên:** P1
* **Phiên bản:** V1.5
* **Ngày tạo:** 16/10/2026
* **Tác giả:** Topify Core Architect

---

## 1. Tổng Quan & Mục Tiêu Nghiệp Vụ

Hệ thống Topify cần một cổng thanh toán tự động, chính xác và liền mạch cho khách hàng tại Việt Nam thông qua **SePay (VietQR)** để:
1. **Thanh toán & Nâng cấp:** Người dùng có thể nâng cấp từ gói `FREE` lên `PRO` hoặc `ENTERPRISE`, hoặc gia hạn gói hiện tại trực tiếp trên cả **Desktop App Electron** (thông qua Modal tương tác thời gian thực) và **Trình duyệt Web** (`/thanh-toan/sepay`).
2. **Linh hoạt chu kỳ cước:** Hỗ trợ 3 chu kỳ cước:
   * **1 Tháng:** Giá niêm yết chuẩn (Pro: 499.000đ, Enterprise: 1.990.000đ).
   * **6 Tháng:** Ưu đãi giảm **10%** tổng giá trị.
   * **1 Năm (12 Tháng):** Ưu đãi giảm **20%** tổng giá trị.
3. **Cộng dồn thời hạn linh hoạt (Stacking Renewal):** Nếu gia hạn khi gói cũ vẫn còn hạn, thời hạn mới sẽ được cộng nối tiếp vào `planExpiresAt`.
4. **Nhắc hạn chủ động & ân hạn (3-Day Grace Period):**
   * Cảnh báo nhắc hạn trước **7 ngày, 3 ngày, 1 ngày**.
   * Khi hết hạn: Không khóa tài khoản ngay lập tức mà kích hoạt **3 ngày ân hạn (Grace Period)** để khách hàng có thời gian thanh toán.
   * Sau khi hết 3 ngày ân hạn mà chưa gia hạn: Tự động hạ về `FREE` và áp dụng hạn mức cơ bản.

---

## 2. Mô Hình Dữ Liệu (Data Model & Schema)

### 2.1. Cập nhật Model `Workspace` (trong `prisma/schema.prisma`)
Bổ sung các trường quản lý chu kỳ sống của thuê bao:
```prisma
model Workspace {
  id                  String             @id @default(cuid())
  name                String
  isActive            Boolean            @default(true)
  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt
  plan                SubscriptionPlan   @default(FREE)
  
  // F062: Quản lý thuê bao & hạn dùng
  planExpiresAt       DateTime?          // Ngày hết hạn gói cước
  subscriptionStatus  SubscriptionStatus @default(ACTIVE) // ACTIVE, GRACE_PERIOD, EXPIRED, TRIAL
  gracePeriodEndsAt   DateTime?          // Thời điểm kết thúc 3 ngày ân hạn
  lastRenewedAt       DateTime?          // Lần gia hạn thành công gần nhất
  autoRenewReminder   Boolean            @default(true)
  
  // Quan hệ đơn hàng & hóa đơn
  paymentOrders       PaymentOrder[]
  invoices            Invoice[]
  
  // ... các quan hệ hiện có
}

enum SubscriptionStatus {
  ACTIVE
  TRIAL
  GRACE_PERIOD
  EXPIRED
}
```

### 2.2. Model `PaymentOrder` (Đơn hàng thanh toán SePay)
```prisma
model PaymentOrder {
  id                 String           @id @default(cuid())
  code               String           @unique // Mã chuyển khoản duy nhất (vd: TPF89214)
  workspaceId        String
  userId             String
  plan               SubscriptionPlan // PRO | ENTERPRISE
  durationMonths     Int              // 1 | 6 | 12
  originalAmount     Float            // Giá gốc
  discountPercent    Int              @default(0) // 0 | 10 | 20
  amount             Float            // Số tiền thực thu (VND)
  status             PaymentStatus    @default(PENDING) // PENDING | COMPLETED | EXPIRED | CANCELLED
  sepayTransactionId String?          // Mã tham chiếu từ SePay (referenceCode)
  gateway            String           @default("SEPAY")
  bankId             String?          // MB, VCB,...
  accountNumber      String?
  paidAt             DateTime?
  expiresAt          DateTime         // Hết hạn mã QR (mặc định 15 phút)
  createdAt          DateTime         @default(now())
  updatedAt          DateTime         @updatedAt

  workspace          Workspace        @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user               User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  invoice            Invoice?

  @@index([code])
  @@index([workspaceId])
  @@index([status])
}

enum PaymentStatus {
  PENDING
  COMPLETED
  EXPIRED
  CANCELLED
}
```

### 2.3. Model `Invoice` (Hóa đơn lưu vết lịch sử cước F120)
```prisma
model Invoice {
  id             String        @id @default(cuid())
  invoiceNumber  String        @unique // INV-2026-XXXX
  workspaceId    String
  orderId        String?       @unique
  planName       String
  amount         Float
  periodStart    DateTime
  periodEnd      DateTime
  paymentMethod  String        @default("SePay / VietQR")
  status         InvoiceStatus @default(PAID)
  paidAt         DateTime      @default(now())
  createdAt      DateTime      @default(now())

  workspace      Workspace     @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  order          PaymentOrder? @relation(fields: [orderId], references: [id])

  @@index([workspaceId])
}

enum InvoiceStatus {
  PAID
  PENDING
  FAILED
}
```

---

## 3. Kiến Trúc API Backend

### 3.1. `POST /api/payment/sepay/create-order`
* **Mục đích:** Tạo đơn hàng thanh toán mới, sinh mã chuyển khoản duy nhất `TPF<random>` và trả về dữ liệu tạo mã VietQR.
* **Payload Request:**
  ```json
  {
    "workspaceId": "ws_123",
    "plan": "PRO",
    "durationMonths": 6
  }
  ```
* **Logic xử lý:**
  1. Kiểm tra giá gói cước (`PLAN_LIMITS[plan].monthlyPrice`).
  2. Tính tổng tiền:
     * 1 tháng: Giá gốc (giảm 0%).
     * 6 tháng: Giá gốc $\times 6 \times 0.9$ (giảm 10%).
     * 12 tháng: Giá gốc $\times 12 \times 0.8$ (giảm 20%).
  3. Tạo mã thanh toán duy nhất `code`: Tiền tố `TPF` + 5 chữ số ngẫu nhiên (hoặc timestamp) đảm bảo chưa từng tồn tại trong bảng `PaymentOrder`.
  4. Tạo bản ghi `PaymentOrder` với `expiresAt = now + 15 phút`.
  5. Sinh URL VietQR SePay:
     `https://qr.sepay.vn/img?bank=${BANK_ID}&acc=${BANK_ACC}&amount=${amount}&des=${code}`
* **Response:**
  ```json
  {
    "success": true,
    "order": {
      "id": "ord_xyz",
      "code": "TPF58291",
      "plan": "PRO",
      "durationMonths": 6,
      "amount": 2694600,
      "discountPercent": 10,
      "qrUrl": "https://qr.sepay.vn/img?bank=MB&acc=0123456789&amount=2694600&des=TPF58291",
      "bankId": "MB",
      "accountNo": "0123456789",
      "accountName": "NGUYEN VAN A",
      "expiresAt": "2026-10-16T01:30:00Z"
    }
  }
  ```

### 3.2. `POST /api/webhooks/payment` (SePay Webhook Receiver)
* **Mục đích:** Nhận dữ liệu bắn từ cổng SePay khi có biến động số dư chuyển khoản vào tài khoản ngân hàng.
* **Bảo mật:** Kiểm tra SePay Webhook Token trong Header `Authorization: Apikey <SEPAY_WEBHOOK_API_KEY>` (nếu được cấu hình trong `.env`).
* **Logic xử lý:**
  1. Lọc chỉ nhận giao dịch `transferType === 'in'`.
  2. Trích xuất mã giao dịch từ nội dung chuyển khoản `content` bằng Regex: `/(TPF\d{4,8})/i`.
  3. Tìm `PaymentOrder` khớp với `code` ở trạng thái `PENDING`.
  4. Kiểm tra số tiền chuyển `transferAmount >= order.amount`.
  5. Mở `prisma.$transaction`:
     * Đánh dấu `PaymentOrder` thành `COMPLETED`, lưu `sepayTransactionId = referenceCode`, `paidAt = now`.
     * Tính toán thời hạn gói mới:
       * Lấy ngày hiện tại `now` và `workspace.planExpiresAt`.
       * Nếu `workspace.planExpiresAt && workspace.planExpiresAt > now`: ngày bắt đầu mới là `workspace.planExpiresAt` (gia hạn nối tiếp).
       * Ngược lại: ngày bắt đầu mới là `now`.
       * Ngày kết thúc mới: `startDate + order.durationMonths * 30 ngày`.
     * Cập nhật `Workspace`:
       * `plan = order.plan`
       * `planExpiresAt = newExpiresAt`
       * `subscriptionStatus = 'ACTIVE'`
       * `gracePeriodEndsAt = null`
       * `lastRenewedAt = now`
     * Tạo hóa đơn `Invoice`:
       * `invoiceNumber = INV-YYYY-<random>`
       * `amount = order.amount`
       * `periodStart = startDate`
       * `periodEnd = newExpiresAt`
       * `status = 'PAID'`
* **Response:** `{ "success": true, "message": "Gia hạn thành công" }`.

### 3.3. `GET /api/payment/sepay/check-status?code=...`
* **Mục đích:** Endpoint cho Desktop App và Web client gọi định kỳ (polling 2-3s) để biết đơn hàng đã được kích hoạt thành công chưa.
* **Response:**
  ```json
  {
    "success": true,
    "status": "COMPLETED", // hoặc "PENDING", "EXPIRED"
    "plan": "PRO",
    "expiresAt": "2027-04-16T00:00:00Z"
  }
  ```

### 3.4. `GET /api/workspace/subscription-status`
* **Mục đích:** Cung cấp thông tin tình trạng gói dịch vụ phục vụ hiển thị Banner nhắc hạn và kiểm soát quota:
  * `currentPlan`: "FREE" | "PRO" | "ENTERPRISE"
  * `expiresAt`: Ngày hết hạn
  * `daysRemaining`: Số ngày còn lại (dương: còn hạn; âm: quá hạn)
  * `status`: "ACTIVE" | "EXPIRING_SOON" | "GRACE_PERIOD" | "EXPIRED"
  * `graceDaysRemaining`: Số ngày ân hạn còn lại (nếu đang trong Grace Period)
  * `alertLevel`: "NONE" | "WARNING" (còn $\le 7$ ngày) | "URGENT" (còn $\le 1$ ngày) | "GRACE" (ân hạn)

### 3.5. `POST /api/cron/subscription-check`
* **Mục đích:** Tác vụ nền quét toàn bộ Workspace hàng ngày:
  1. Nếu `plan != 'FREE'` và `planExpiresAt < now`:
     * Nếu chưa có `gracePeriodEndsAt`: Đặt `gracePeriodEndsAt = now + 3 ngày`, cập nhật `subscriptionStatus = 'GRACE_PERIOD'`.
     * Nếu đã có `gracePeriodEndsAt` và `now > gracePeriodEndsAt`: Hạ cấp `plan = 'FREE'`, cập nhật `subscriptionStatus = 'EXPIRED'`, ghi log AuditLog.

---

## 4. Thiết Kế Giao Diện Người Dùng (UI/UX)

### 4.1. Expiration Reminder Banners (Thanh thông báo nhắc hạn)
* **Vị trí:** Hiển thị nổi bật ở đầu trang `Settings.tsx` (Tab Quota & Billing) và thanh cảnh báo toàn ứng dụng nếu còn $\le 3$ ngày hoặc đang ân hạn.
* **Các cấp độ cảnh báo:**
  1. **Còn 4 - 7 ngày (Warning):**
     * Nền vàng hổ phách nhạt (`bg-amber-50 border-amber-200 text-amber-900`).
     * Icon: `Clock`.
     * Nội dung: *"Gói Pro của bạn còn **5 ngày** nữa sẽ hết hạn (đến ngày 21/10/2026). Gia hạn ngay để duy trì hạn mức và kênh kết nối!"*
     * Nút bấm: `[ Gia hạn ngay ]` (Mở modal SePay).
  2. **Còn $\le 1$ ngày (Urgent):**
     * Nền cam đỏ (`bg-orange-50 border-orange-200 text-orange-900`).
     * Nội dung: *"Gói Pro sắp hết hạn vào hôm nay! Vui lòng gia hạn ngay để không bị gián đoạn hoạt động đăng bài."*
  3. **Đang trong 3 ngày ân hạn (Grace Period):**
     * Nền đỏ cảnh báo (`bg-red-50 border-red-200 text-red-900`).
     * Icon: `AlertTriangle`.
     * Nội dung: *"⚠️ Gói cước đã hết hạn! Bạn đang trong **3 ngày ân hạn** (còn lại 2 ngày). Sau thời gian này hệ thống sẽ tự động hạ về gói Free."*
     * Nút bấm: `[ Thanh toán gia hạn khẩn cấp ]`.

### 4.2. Modal Thanh Toán VietQR SePay (`SePayPaymentModal.tsx`)
Modal được thiết kế tinh tế theo phong cách Apple / Modern Fintech:
1. **Bước chọn gói & chu kỳ:**
   * Chọn gói: Pro (499k/tháng) hoặc Enterprise (1.990k/tháng).
   * Tabs chu kỳ:
     * **1 Tháng** (Chuẩn)
     * **6 Tháng** (Tiết kiệm 10% - Gắn nhãn badge xanh lá)
     * **1 Năm** (Tiết kiệm 20% - Gắn nhãn badge cam rực rỡ "Khuyên dùng")
   * Hiển thị bảng tính giá rõ ràng: Giá gốc $\rightarrow$ Tiết kiệm $\rightarrow$ **Tổng thanh toán**.
2. **Khung quét mã QR SePay thời gian thực:**
   * Khung viền QR bo tròn sắc nét, căn giữa với icon VietQR chính thức.
   * Thông tin chuyển khoản chi tiết kèm nút Copy 1-chạm:
     * **Ngân hàng:** `MB Bank (Ngân hàng Quân Đội)`
     * **Số tài khoản:** `0123456789`
     * **Chủ tài khoản:** `NGUYEN VAN A`
     * **Số tiền:** `2.694.600 đ`
     * **Nội dung:** `TPF58291` (Bôi đậm màu hổ phách, chữ to rõ ràng)
   * Thanh trạng thái động: Vòng xoay Pulse nhịp nhàng: *"Đang lắng nghe chuyển khoản từ SePay... (tự động nhận diện)"*.
   * Nút phụ: `[ Mở trang web thanh toán ngoài ]` (hỗ trợ đầy đủ theo yêu cầu của user).
3. **Màn hình thành công (Success Screen):**
   * Hiệu ứng pháo hoa / check xanh tròn rực rỡ.
   * Thông báo: *"Chúc mừng! Giao dịch của bạn đã được xác nhận thành công."*
   * Hiển thị thời hạn mới đến ngày `dd/mm/yyyy`.
   * Tự động cập nhật lại toàn bộ hạn mức và tắt modal sau 3 giây hoặc khi bấm "Hoàn tất".

---

## 5. An Toàn & Xử Lý Trường Hợp Biên (Edge Cases)

| Kịch bản lỗi | Cách hệ thống xử lý |
| :--- | :--- |
| **Khách hàng chuyển thiếu tiền** | Webhook ghi log `PARTIAL_AMOUNT`, không kích hoạt gói, gửi thông báo in-app nhắc nộp phần chênh lệch hoặc liên hệ hỗ trợ. |
| **Khách hàng ghi sai nội dung chuyển khoản** | Tiền đã vào tài khoản SePay nhưng không khớp mã `TPF...`. Webhook lưu vào bảng `UnmatchedTransaction`. Cung cấp nút đối soát thủ công trong Admin hoặc hỗ trợ nhập mã tham chiếu SePay để đối chiếu. |
| **SePay bắn webhook trùng lặp (Duplicate Webhook)** | Kiểm tra trạng thái đơn hàng. Nếu `PaymentOrder.status === 'COMPLETED'` thì bỏ qua giao dịch để tránh cộng dồn ngày lặp lại (Idempotency). |
| **Mã QR hết hạn sau 15 phút** | Client hiển thị thông báo mã QR đã hết hạn, cung cấp nút "Tạo mã QR mới" để tránh việc chuyển tiền vào mã đơn đã hủy. |
| **Mất kết nối mạng khi đang quét QR** | Ngay cả khi client tắt app, khi SePay gửi webhook đến server thì backend vẫn tự động cập nhật Database thành công. Lần tiếp theo người dùng mở app thì gói cước đã sẵn sàng. |

---

## 6. Kịch Bản Kiểm Thử (Test Plan TC-F062)

* **TC-F062-01: Tạo đơn hàng SePay chu kỳ 1 tháng, 6 tháng, 1 năm**
  * Kỳ vọng: Tính đúng chiết khấu 0%, 10%, 20%; mã `TPF...` sinh ngẫu nhiên không trùng lặp; URL QR hiển thị chuẩn.
* **TC-F062-02: Thanh toán thành công qua Webhook SePay (Happy Path)**
  * Kỳ vọng: Webhook nhận payload hợp lệ, trạng thái đơn thành `COMPLETED`, `planExpiresAt` được cộng 30/180/360 ngày, tạo hóa đơn trong `Invoice`.
* **TC-F062-03: Gia hạn cộng dồn khi gói cũ vẫn còn hạn**
  * Kỳ vọng: Ngày hết hạn mới = ngày hết hạn cũ + số ngày của chu kỳ mới (không bị mất ngày cũ).
* **TC-F062-04: Polling trạng thái realtime trên Electron Modal**
  * Kỳ vọng: Modal tự động chuyển sang giao diện thành công ngay khi SePay webhook xác nhận mà không cần F5.
* **TC-F062-05: Cảnh báo nhắc hạn (7 ngày, 3 ngày, 1 ngày)**
  * Kỳ vọng: Banner cảnh báo xuất hiện đúng màu sắc và số ngày đếm ngược trên Settings.
* **TC-F062-06: Kích hoạt 3 ngày ân hạn (Grace Period)**
  * Kỳ vọng: Khi quá hạn `planExpiresAt`, Workspace chuyển sang `GRACE_PERIOD`, hiển thị cảnh báo đỏ và cho phép dùng thêm 3 ngày.
* **TC-F062-07: Tự động hạ về FREE sau khi hết ân hạn**
  * Kỳ vọng: Cronjob hạ `plan = FREE`, khóa các tính năng vượt hạn mức và ghi log.
* **TC-F062-08: Nút mở thanh toán trên trình duyệt web**
  * Kỳ vọng: Bấm nút mở tab trình duyệt ngoài dẫn tới `/thanh-toan/sepay?plan=...&amount=...&code=...` hoạt động đồng bộ.
