# Implementation Plan: F022 (Random Time Window), F019 (Bulk Post Import), and F050 (Analytics Period Comparison)

**Goal:** Implement and verify three features marked "Ready to Test":
1. F022: Đăng ngẫu nhiên giờ trong khung (Random Time Window) on `/create`
2. F019: Import bài viết từ Google Drive & Excel on `/content-studio` and `/posts`
3. F050: So sánh hiệu suất theo khoảng thời gian (MoM / Prior Period) on `/analytics`

**Spec:** `docs/superpowers/specs/2026-10-24-m2-f019-f022-m5-f050-features-design.md`

---

## Phase 1: Feature F022 — Đăng Ngẫu Nhiên Giờ Trong Khung (Random Time Window)

### Task 1.1: Frontend UI on `/create`
**Files:**
- Modify: `electron-app/frontend/src/pages/CreatePost.tsx`

**Steps:**
- [ ] Add `random_window` to `publishMode` state type (`'now' | 'schedule' | 'random_window'`).
- [ ] Add state variables:
  - `randomDate`: string (default today or tomorrow if after 21:00)
  - `randomStartTime`: string (default `'08:30'`)
  - `randomEndTime`: string (default `'11:30'`)
  - `selectedPreset`: string (default `'morning'`)
  - `isEvenlySpaced`: boolean (default `true`)
  - `generatedRandomTimes`: `Record<string, string>` (mapping video ID to computed scheduled time)
- [ ] Render 3rd card in "Thời điểm xuất bản":
  - Icon: `Shuffle` (Lucide)
  - Title: "Đăng ngẫu nhiên trong khung (F022)"
  - Subtitle: "Tự động chọn giờ ngẫu nhiên trong khoảng thời gian để tối ưu tương tác & chống spam"
- [ ] Render Time Window Config Box when `publishMode === 'random_window'`:
  - Date input (`randomDate`).
  - 4 Golden-Hour Presets:
    - 🌅 Sáng: `08:30 – 11:30`
    - ☀️ Trưa: `12:00 – 13:45`
    - 🌆 Chiều: `16:00 – 18:00`
    - 🌙 Tối (Hot): `19:30 – 22:30`
    - ⚙️ Tùy chỉnh (Start/End time picker)
  - Multi-video dispersion toggle (if `videos.length > 1`).
  - Live preview card showing the computed random moment (e.g. `🎲 Giờ đăng dự kiến: 20:45 (thứ Bảy, 25/10/2026)`).
  - Button "🎲 Random lại" to recalculate/shuffle instantly.
- [ ] In `handleSubmit`:
  - When `publishMode === 'random_window'`, ensure computed random ISO timestamp is assigned to each post payload and passed as `scheduledAt` with `randomWindowStart` and `randomWindowEnd`.

### Task 1.2: Backend Validation in `/api/posts`
**Files:**
- Modify: `app/api/posts/route.ts`

**Steps:**
- [ ] Accept `isRandomWindow`, `randomWindowStart`, `randomWindowEnd` in `POST /api/posts`.
- [ ] Validate that if `randomWindowStart` and `randomWindowEnd` are provided:
  - `randomWindowEnd > randomWindowStart`
  - `scheduledAt` is within the window.
- [ ] Ensure post is scheduled with status `SCHEDULED`.

### Task 1.3: Unit Test for F022
**Files:**
- Modify: `__tests__/api/posts/route.test.ts`

**Steps:**
- [ ] Add unit test verifying a post with `randomWindowStart`, `randomWindowEnd`, and `scheduledAt` within window returns HTTP 201 with status `SCHEDULED`.

---

## Phase 2: Feature F019 — Import Bài Viết từ Google Drive & Excel

### Task 2.1: Backend Import Engine & Template Generator
**Files:**
- Create: `lib/content-studio/import-engine.ts`

**Steps:**
- [ ] Define interfaces `ImportPostRawRow`, `ImportPostItem`, `ImportParseResult`.
- [ ] Implement `parseExcelOrCsvBuffer(buffer: Buffer): ImportParseResult`:
  - Read workbook with `xlsx.read`.
  - Normalize header keys (Tiếng Việt có dấu, không dấu, Tiếng Anh).
  - Validate rows: check Title presence, parse date/time format, normalize platforms.
- [ ] Implement `fetchAndParseGoogleSheet(sheetUrl: string): Promise<ImportParseResult>`:
  - Extract sheet ID from standard Google Sheets sharing URLs.
  - Fetch CSV export via `https://docs.google.com/spreadsheets/d/{id}/export?format=csv`.
  - Pass CSV buffer to `parseExcelOrCsvBuffer`.
- [ ] Implement `generateSampleExcelTemplate(): Buffer`:
  - Create a workbook with columns: `Tiêu đề`, `Nội dung (Caption)`, `Bình luận đầu (First Comment)`, `Hashtags`, `Nền tảng`, `Thời gian lên lịch`, `Media URL`.
  - Add 3 realistic sample rows and return XLSX buffer.

### Task 2.2: Backend API Endpoints
**Files:**
- Create: `app/api/content-studio/import/parse/route.ts`
- Create: `app/api/content-studio/import/save/route.ts`
- Create: `app/api/content-studio/import/template/route.ts`

**Steps:**
- [ ] `parse/route.ts`:
  - Handle multipart file upload (`.xlsx`, `.xls`, `.csv`) OR JSON `{ sheetUrl }`.
  - Call `import-engine` and return parsed rows with validation counts.
- [ ] `save/route.ts`:
  - Authenticate user/workspace.
  - Bulk create `Post` records with `PostPlatform` in a Prisma transaction.
  - Set status to `SCHEDULED` if scheduledAt is present and future, else `DRAFT`.
  - Return created post count and IDs.
- [ ] `template/route.ts`:
  - Return XLSX template with attachment header `Mau_Import_Bai_Viet_Topify.xlsx`.

### Task 2.3: Frontend Import Modal & Components
**Files:**
- Create: `electron-app/frontend/src/components/content-studio/ImportPostsModal.tsx`

**Steps:**
- [ ] Build multi-step / dual-tab modal:
  - Tab 1: "Tải tệp lên" (Drag & drop `.xlsx`, `.xls`, `.csv`).
  - Tab 2: "Google Sheets" (Input URL + guide on public link sharing).
  - Quick action: "Tải file mẫu Excel (.xlsx)".
- [ ] Build Data Preview Table:
  - Summary metrics: Tổng số dòng, Hợp lệ (xanh), Cảnh báo (vàng), Lỗi (đỏ).
  - Table columns: Checkbox, STT, Tiêu đề, Caption, Nền tảng, Thời gian, Trạng thái, Thao tác.
  - Support inline editing of cells and deleting unwanted rows.
- [ ] Batch actions:
  - "Lưu thành Bản thảo (Draft)"
  - "Lên lịch & Lưu bài"
  - Progress spinner and toast notifications.

### Task 2.4: Integration into ContentStudio and Posts Pages
**Files:**
- Modify: `electron-app/frontend/src/pages/ContentStudio.tsx`
- Modify: `electron-app/frontend/src/pages/Posts.tsx`

**Steps:**
- [ ] `ContentStudio.tsx`:
  - Add 4th Tab: "Import Excel / Google Drive (F019)".
  - Render full import dashboard directly in this tab.
- [ ] `Posts.tsx`:
  - Add header button "Import từ Excel / Drive (F019)" with `Upload` / `FileSpreadsheet` icon next to "Tạo bài đăng mới".
  - Open `ImportPostsModal` on click.
  - Refresh post list upon successful import.

---

## Phase 3: Feature F050 — Analytics Period Comparison (MoM / Prior Period)

### Task 3.1: Backend Analytics Comparison Engine
**Files:**
- Modify: `lib/analytics/engine.ts`
- Create: `app/api/analytics/period-comparison/route.ts`

**Steps:**
- [ ] In `lib/analytics/engine.ts`:
  - Define `PeriodComparisonResult`:
    - `currentPeriod`: `{ start, end, metrics, dailyTrajectory }`
    - `priorPeriod`: `{ start, end, metrics, dailyTrajectory }`
    - `growth`: `{ reachPct, viewsPct, engagementsPct, leadsPct, dealsPct, wonPct, roiPct }`
  - Implement calculation logic adjusting date intervals for `7d`, `30d`, `90d`, or custom ranges.
  - Calculate percentage change $\Delta\%$ safely avoiding division by zero.
- [ ] In `app/api/analytics/period-comparison/route.ts`:
  - Accept `?timeframe=7d|30d|90d` and optional `&seed=true`.
  - Return structured current vs prior comparison metrics.

### Task 3.2: Frontend UI in `Analytics.tsx`
**Files:**
- Modify: `electron-app/frontend/src/pages/Analytics.tsx`

**Steps:**
- [ ] Add state: `compareWithPrior: boolean` (default `false`), `comparisonData: PeriodComparisonResult | null`.
- [ ] Add UI Checkbox toggle in the header/date-filter bar:
  - `[x] So sánh với kỳ trước (F050)` with badge `MoM / Prior Period`.
- [ ] When enabled:
  - Fetch comparison data from `/api/analytics/period-comparison`.
  - Render colored growth pills on KPI summary cards: `🟩 +X%` or `🟥 -X%`.
  - Render dual-line comparison chart:
    - Solid line: Kỳ hiện tại (Current).
    - Dashed line: Kỳ trước (Prior).
    - Comparative tooltip showing both values side by side.

---

## Phase 4: Test Cases Matrix, Verification & Deployment

### Task 4.1: Update `TEST_CASES.md`
**Files:**
- Modify: `TEST_CASES.md`

**Steps:**
- [ ] Add `[F022]` section and test cases (TC-F022-01 to TC-F022-05).
- [ ] Add `[F019]` section and test cases (TC-F019-01 to TC-F019-05).
- [ ] Add `[F050]` section and test cases (TC-F050-01 to TC-F050-04).
- [ ] Update Roadmap summary table status to `✅ Đã sẵn sàng test` for F022, F019, F050.

### Task 4.2: Update `UPDATES.md`
**Files:**
- Modify: `UPDATES.md`

**Steps:**
- [ ] Document release notes for F022, F019, and F050 with technical details and file list.

### Task 4.3: Build & Verification
**Steps:**
- [ ] Run backend tests (`npm test`).
- [ ] Build Electron frontend (`npm run build --prefix electron-app/frontend`).
- [ ] Build Next.js application (`npm run build`).

### Task 4.4: Deploy to Production
**Steps:**
- [ ] Git commit and push to `origin/main`.
- [ ] SSH/sync to remote server (`157.66.100.35`).
- [ ] Rebuild frontend & Next.js, restart PM2 (`Topify` and `Topify-Worker`).
