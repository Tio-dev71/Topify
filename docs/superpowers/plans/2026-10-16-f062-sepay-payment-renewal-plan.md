# F062: Thanh Toán & Gia Hạn Tự Động (SePay VietQR) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng hoàn chỉnh tính năng F062 (Thanh toán & Gia hạn qua SePay VietQR), hỗ trợ chu kỳ 1 tháng, 6 tháng (-10%), 12 tháng (-20%), tự động cộng dồn hạn dùng, cảnh báo nhắc hạn (7, 3, 1 ngày), ân hạn 3 ngày (Grace Period), tích hợp Modal VietQR tương tác realtime trên Electron Desktop App và trang thanh toán Web.

**Architecture:** Mở rộng schema Prisma (`Workspace`, `PaymentOrder`, `Invoice`), cung cấp API sinh mã VietQR và kiểm tra trạng thái (`/api/payment/sepay/*`), hoàn thiện Webhook xử lý giao dịch tiền vào SePay với tính toán cộng dồn hạn dùng an toàn (`/api/webhooks/payment`), xây dựng worker quét hết hạn (`/api/cron/subscription-check`), tích hợp `SePayPaymentModal` và `ExpirationBanner` vào `Settings.tsx` trên Electron App.

**Tech Stack:** Next.js 14 App Router, TypeScript, Prisma ORM, PostgreSQL, SePay VietQR API, React, Tailwind CSS, Lucide Icons, Sonner Toast, Electron Desktop App.

**Spec:** [docs/superpowers/specs/2026-10-16-f062-sepay-payment-renewal-design.md](file:///Users/tiodev/Desktop/Topify.nosync/docs/superpowers/specs/2026-10-16-f062-sepay-payment-renewal-design.md)

## Global Constraints
- Cổng thanh toán: Sử dụng SePay VietQR (`https://qr.sepay.vn/img?...`).
- Chu kỳ cước: 1 Tháng (0%), 6 Tháng (-10%), 12 Tháng (-20%).
- Cơ chế gia hạn: Cộng dồn thời hạn vào `planExpiresAt` nếu gia hạn sớm.
- Quy định hết hạn: Nhắc hạn trước 7, 3, 1 ngày; ân hạn 3 ngày (Grace Period) trước khi tự động hạ về `FREE`.
- Trải nghiệm đa nền tảng: Hỗ trợ Modal trực tiếp trên Electron và mở liên kết ngoài trên trình duyệt Web.

---

### Task 1: Mở Rộng Schema Prisma & Cập Nhật Prisma Client

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `lib/payment/types.ts`

**Interfaces:**
- Produces: `PaymentOrder`, `Invoice`, `SubscriptionStatus`, `PaymentStatus`, `InvoiceStatus` trong Prisma Client.
- Type definitions: `PaymentOrderDto`, `SubscriptionStatusResult`.

- [ ] **Step 1: Cập nhật `prisma/schema.prisma`**
Thêm enum `SubscriptionStatus`, enum `PaymentStatus`, enum `InvoiceStatus`, thêm các trường cho `Workspace`, và tạo model `PaymentOrder`, `Invoice`:
```prisma
enum SubscriptionStatus {
  ACTIVE
  TRIAL
  GRACE_PERIOD
  EXPIRED
}

enum PaymentStatus {
  PENDING
  COMPLETED
  EXPIRED
  CANCELLED
}

enum InvoiceStatus {
  PAID
  PENDING
  FAILED
}

model PaymentOrder {
  id                 String           @id @default(cuid())
  code               String           @unique
  workspaceId        String
  userId             String
  plan               SubscriptionPlan
  durationMonths     Int
  originalAmount     Float
  discountPercent    Int              @default(0)
  amount             Float
  status             PaymentStatus    @default(PENDING)
  sepayTransactionId String?
  gateway            String           @default("SEPAY")
  bankId             String?
  accountNumber      String?
  paidAt             DateTime?
  expiresAt          DateTime
  createdAt          DateTime         @default(now())
  updatedAt          DateTime         @updatedAt

  workspace          Workspace        @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user               User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  invoice            Invoice?

  @@index([code])
  @@index([workspaceId])
  @@index([status])
}

model Invoice {
  id             String        @id @default(cuid())
  invoiceNumber  String        @unique
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
```

- [ ] **Step 2: Chạy `npx prisma generate`**
Run: `npx prisma generate`
Expected: `✔ Generated Prisma Client`

- [ ] **Step 3: Tạo file `lib/payment/types.ts`**
Định nghĩa các interface chuẩn hóa dữ liệu thanh toán, chiết khấu và trạng thái cước.

- [ ] **Step 4: Commit**
```bash
git add prisma/schema.prisma lib/payment/types.ts
git commit -m "feat(payment): add PaymentOrder, Invoice models and subscription fields to schema"
```

---

### Task 2: Xây Dựng SePay Core Helper & API Tạo Đơn Hàng (`/api/payment/sepay/create-order`)

**Files:**
- Create: `lib/payment/sepay.ts`
- Create: `app/api/payment/sepay/create-order/route.ts`

**Interfaces:**
- Produces: `createPaymentOrder({ workspaceId, userId, plan, durationMonths })`
- API: `POST /api/payment/sepay/create-order`

- [ ] **Step 1: Viết helper tính toán giá & sinh URL VietQR trong `lib/payment/sepay.ts`**
```typescript
import { PLAN_LIMITS } from '@/lib/workspace/quota';

export function calculatePlanPricing(plan: 'PRO' | 'ENTERPRISE', durationMonths: number) {
  const baseMonthlyPrice = PLAN_LIMITS[plan]?.monthlyPrice || 499000;
  let discountPercent = 0;
  if (durationMonths === 6) discountPercent = 10;
  if (durationMonths >= 12) discountPercent = 20;

  const originalAmount = baseMonthlyPrice * durationMonths;
  const amount = Math.round(originalAmount * (1 - discountPercent / 100));

  return { baseMonthlyPrice, durationMonths, discountPercent, originalAmount, amount };
}

export function generateVietQrUrl(params: { bankId: string; accountNo: string; amount: number; description: string }) {
  const { bankId, accountNo, amount, description } = params;
  return `https://qr.sepay.vn/img?bank=${encodeURIComponent(bankId)}&acc=${encodeURIComponent(accountNo)}&amount=${amount}&des=${encodeURIComponent(description)}`;
}
```

- [ ] **Step 2: Tạo route handler `app/api/payment/sepay/create-order/route.ts`**
Tạo mã duy nhất dạng `TPF` + 5 chữ số ngẫu nhiên, lưu `PaymentOrder` vào database với hạn 15 phút, trả về payload VietQR đầy đủ.

- [ ] **Step 3: Kiểm thử gọi API tạo đơn hàng**
Run: Gọi cURL thử nghiệm POST `/api/payment/sepay/create-order`
Expected: Status 200, trả về `{ success: true, order: { code: 'TPF...', amount: ..., qrUrl: '...' } }`.

- [ ] **Step 4: Commit**
```bash
git add lib/payment/sepay.ts app/api/payment/sepay/create-order/route.ts
git commit -m "feat(payment): implement SePay order creation and VietQR generation API"
```

---

### Task 3: Nâng Cấp Webhook SePay & Logic Cộng Dồn Hạn Dùng (`/api/webhooks/payment`)

**Files:**
- Modify: `app/api/webhooks/payment/route.ts`

**Interfaces:**
- Consumes: SePay Webhook JSON payload (`content`, `transferAmount`, `referenceCode`, `transferType`).
- Produces: Cập nhật `PaymentOrder` status = `COMPLETED`, cộng dồn `Workspace.planExpiresAt`, tạo hóa đơn `Invoice`.

- [ ] **Step 1: Viết hàm trích xuất mã và xử lý giao dịch trong transaction**
Trích xuất `code` bằng regex `/TPF\d{4,8}/i`. Tìm đơn hàng `PaymentOrder` có trạng thái `PENDING`. Kiểm tra số tiền chuyển.

- [ ] **Step 2: Logic cộng dồn thời hạn chuẩn xác (Stacking Expiry Date)**
```typescript
const now = new Date();
const currentExpiresAt = workspace.planExpiresAt ? new Date(workspace.planExpiresAt) : null;
const baseDate = currentExpiresAt && currentExpiresAt > now ? currentExpiresAt : now;
const newExpiresAt = new Date(baseDate.getTime() + order.durationMonths * 30 * 24 * 3600 * 1000);
```

- [ ] **Step 3: Thực hiện `prisma.$transaction`**
Cập nhật `PaymentOrder` -> `COMPLETED`, cập nhật `Workspace` (plan, planExpiresAt, subscriptionStatus = 'ACTIVE', gracePeriodEndsAt = null), tạo `Invoice`.

- [ ] **Step 4: Kiểm thử kịch bản webhook với payload SePay mẫu**
Kiểm tra test đơn hàng chuyển trạng thái thành công và gia hạn đúng số ngày.

- [ ] **Step 5: Commit**
```bash
git add app/api/webhooks/payment/route.ts
git commit -m "feat(payment): harden SePay webhook with renewal stacking and invoice generation"
```

---

### Task 4: API Polling Đơn Hàng & Kiểm Tra Trạng Thái Thuê Bao

**Files:**
- Create: `app/api/payment/sepay/check-status/route.ts`
- Create: `app/api/workspace/subscription-status/route.ts`

**Interfaces:**
- `GET /api/payment/sepay/check-status?code=...` -> `{ status: 'COMPLETED' | 'PENDING', plan, expiresAt }`
- `GET /api/workspace/subscription-status` -> `{ plan, expiresAt, daysRemaining, status, alertLevel }`

- [ ] **Step 1: Tạo route `app/api/payment/sepay/check-status/route.ts`**
Truy vấn `PaymentOrder` theo mã `code` và trả về trạng thái đơn hàng.

- [ ] **Step 2: Tạo route `app/api/workspace/subscription-status/route.ts`**
Tính số ngày còn lại:
```typescript
const now = new Date();
const expiresAt = workspace.planExpiresAt ? new Date(workspace.planExpiresAt) : null;
const daysRemaining = expiresAt ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 3600 * 24)) : 0;
let alertLevel: 'NONE' | 'WARNING' | 'URGENT' | 'GRACE' = 'NONE';
if (workspace.subscriptionStatus === 'GRACE_PERIOD') alertLevel = 'GRACE';
else if (daysRemaining <= 1) alertLevel = 'URGENT';
else if (daysRemaining <= 7) alertLevel = 'WARNING';
```

- [ ] **Step 3: Commit**
```bash
git add app/api/payment/sepay/check-status/route.ts app/api/workspace/subscription-status/route.ts
git commit -m "feat(payment): add status polling and subscription status endpoints"
```

---

### Task 5: Cronjob Quét Hết Hạn & Quản Lý 3 Ngày Ân Hạn (Grace Period)

**Files:**
- Create: `lib/workspace/subscription-cron.ts`
- Create: `app/api/cron/subscription-check/route.ts`

**Interfaces:**
- Produces: Quét định kỳ toàn bộ Workspace, chuyển sang `GRACE_PERIOD` khi hết hạn, hạ về `FREE` khi hết 3 ngày ân hạn.

- [ ] **Step 1: Viết logic quét và xử lý ân hạn trong `lib/workspace/subscription-cron.ts`**
```typescript
export async function processExpiringSubscriptions() {
  const now = new Date();
  // 1. Chuyển sang GRACE_PERIOD nếu đã hết hạn nhưng chưa được ân hạn
  // 2. Hạ về FREE nếu đã quá hạn ân hạn gracePeriodEndsAt
}
```

- [ ] **Step 2: Tạo API endpoint `/api/cron/subscription-check`**
Nhận request bảo vệ bởi `CRON_SECRET` hoặc token nội bộ để kích hoạt kiểm tra.

- [ ] **Step 3: Commit**
```bash
git add lib/workspace/subscription-cron.ts app/api/cron/subscription-check/route.ts
git commit -m "feat(payment): add subscription expiration scanner and grace period handler"
```

---

### Task 6: Xây Dựng Modal VietQR SePay Trên Electron Desktop App (`SePayPaymentModal.tsx`)

**Files:**
- Create: `electron-app/frontend/src/components/payment/SePayPaymentModal.tsx`

**Interfaces:**
- Props: `isOpen: boolean`, `onClose: () => void`, `initialPlan?: 'PRO' | 'ENTERPRISE'`, `onSuccess: () => void`.

- [ ] **Step 1: Xây dựng UI chọn chu kỳ 1 tháng, 6 tháng (-10%), 12 tháng (-20%)**
Tabs chọn chu kỳ kèm huy hiệu giảm giá nổi bật, hiển thị giá gốc và tổng tiền thanh toán sau chiết khấu.

- [ ] **Step 2: Gọi API `/api/payment/sepay/create-order` và hiển thị mã VietQR động**
Hiển thị ảnh QR SePay, thông tin STK, Ngân hàng, Chủ tài khoản, Số tiền, và Nội dung chuyển khoản in đậm kèm nút copy.

- [ ] **Step 3: Polling tự động kiểm tra trạng thái thanh toán**
Dùng `setInterval` 2.5s gọi `/api/payment/sepay/check-status?code=...`. Khi nhận `COMPLETED`, dừng polling, phát hiệu ứng chúc mừng và hiển thị ngày hết hạn mới.

- [ ] **Step 4: Thêm nút "Mở trên trình duyệt web"**
Mở URL `/thanh-toan/sepay?plan=...&amount=...&code=...` trên trình duyệt ngoài qua Electron Shell hoặc `window.open`.

- [ ] **Step 5: Commit**
```bash
git add electron-app/frontend/src/components/payment/SePayPaymentModal.tsx
git commit -m "feat(electron): add interactive SePay VietQR payment modal with live polling"
```

---

### Task 7: Tích Hợp Expiration Banner & Nút Gia Hạn Vào Trang Settings

**Files:**
- Create: `electron-app/frontend/src/components/subscription/ExpirationBanner.tsx`
- Modify: `electron-app/frontend/src/pages/Settings.tsx`
- Modify: `app/api/workspace/billing/route.ts`

**Interfaces:**
- Hiển thị ngày hết hạn cước và trạng thái thuê bao trên Tab Quota & Tab Billing.
- Bấm nút "Gia hạn gói cước" hoặc "Nâng cấp gói" sẽ mở `SePayPaymentModal`.
- Tab 3 (Billing History) tải danh sách hóa đơn `Invoice` thực tế từ DB.

- [ ] **Step 1: Tạo component `ExpirationBanner.tsx`**
Hiển thị banner màu vàng (Warning khi còn $\le 7$ ngày), màu cam (Urgent khi còn $\le 1$ ngày), màu đỏ (Grace Period khi đang trong 3 ngày ân hạn).

- [ ] **Step 2: Tích hợp Banner và Modal vào `Settings.tsx`**
Cập nhật Tab 2 (Quota) hiển thị ngày hết hạn cước `planExpiresAt`, nút "Gia hạn gói cước", và tích hợp mở `SePayPaymentModal`.

- [ ] **Step 3: Cập nhật Tab 3 (Billing) kết nối dữ liệu Invoice từ Database**
Cập nhật `/api/workspace/billing/route.ts` để đọc hóa đơn từ bảng `Invoice` và trả về đúng cho bảng lịch sử.

- [ ] **Step 4: Kiểm thử giao diện và build Frontend**
Run: `npm --prefix electron-app/frontend run build`
Expected: Build thành công 0 lỗi.

- [ ] **Step 5: Commit**
```bash
git add electron-app/frontend/src/components/subscription/ExpirationBanner.tsx electron-app/frontend/src/pages/Settings.tsx app/api/workspace/billing/route.ts
git commit -m "feat(settings): integrate expiration banner and SePay payment modal into settings"
```

---

### Task 8: Đồng Bộ Hóa Trang Thanh Toán Web (`/thanh-toan/sepay/page.tsx`)

**Files:**
- Modify: `app/thanh-toan/sepay/page.tsx`

**Interfaces:**
- Web page kết nối trực tiếp với backend `/api/payment/sepay/create-order` và `/api/payment/sepay/check-status`.

- [ ] **Step 1: Cập nhật trang web `/thanh-toan/sepay/page.tsx`**
Sử dụng chung API tạo đơn hàng và polling tự động xác nhận chuyển khoản.

- [ ] **Step 2: Kiểm thử trên trình duyệt**
Truy cập `http://localhost:3000/thanh-toan/sepay?plan=PRO` xác nhận QR code và thông tin hiển thị chính xác.

- [ ] **Step 3: Commit**
```bash
git add app/thanh-toan/sepay/page.tsx
git commit -m "feat(web): sync web checkout page with SePay order creation and status polling"
```

---

### Task 9: Kiểm Thử Toàn Diện & Cập Nhật `TEST_CASES.md`

**Files:**
- Modify: `TEST_CASES.md`
- Create: `tests/f062-sepay-payment.test.ts` (hoặc scratch test script)

**Interfaces:**
- Ghi nhận đầy đủ 8 kịch bản kiểm thử: TC-F062-01 đến TC-F062-08 trong phân hệ M8. Workspace & Admin.

- [ ] **Step 1: Thêm phần mục [F062] vào `TEST_CASES.md`**
Bổ sung bảng test cases TC-F062-01 đến TC-F062-08 chi tiết các bước, dữ liệu đầu vào và kết quả kỳ vọng.

- [ ] **Step 2: Viết script mô phỏng toàn bộ luồng thanh toán SePay**
Tạo đơn hàng $\rightarrow$ Giả lập SePay webhook bắn tiền vào $\rightarrow$ Kiểm tra ngày hết hạn cộng dồn $\rightarrow$ Kiểm tra trạng thái hóa đơn.

- [ ] **Step 3: Chạy script kiểm thử và xác nhận PASS toàn bộ**
Expected: 8/8 test cases PASS.

- [ ] **Step 4: Commit**
```bash
git add TEST_CASES.md tests/f062-sepay-payment.test.ts
git commit -m "test(f062): document test cases and verify complete SePay payment and renewal flow"
```
