/**
 * Random Time Window Module (F022)
 * Manages golden hour presets, expired preset detection, in-progress window handling,
 * and future-safe pseudo-random timestamp computation.
 */

export interface GoldenHourPreset {
  id: string;
  label: string;
  start: string;
  end: string;
  desc: string;
}

export const GOLDEN_HOUR_PRESETS: GoldenHourPreset[] = [
  { id: 'morning', label: '🌅 Sáng', start: '08:30', end: '11:30', desc: 'Đón tương tác đầu ngày' },
  { id: 'noon', label: '☀️ Trưa', start: '12:00', end: '13:45', desc: 'Nghỉ trưa lướt MXH' },
  { id: 'afternoon', label: '🌆 Chiều', start: '16:00', end: '18:00', desc: 'Giờ tan tầm' },
  { id: 'evening', label: '🌙 Tối (Hot)', start: '19:30', end: '22:30', desc: 'Giờ vàng triệu view' },
  { id: 'custom', label: '⚙️ Tùy Chỉnh', start: '19:30', end: '22:30', desc: 'Tự chọn giờ bắt đầu & kết thúc' },
];

/**
 * Returns local YYYY-MM-DD string for a given Date
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Normalizes various date string formats into standard YYYY-MM-DD.
 * Supports:
 * - DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY (e.g. "25/10/2026", "25-10-2026", "25.10.2026")
 * - YYYY/MM/DD, YYYY-MM-DD, YYYY.MM.DD (e.g. "2026/10/25", "2026-10-25")
 * - ISO string with T (e.g. "2026-10-25T...")
 */
export function normalizeDateStringToYMD(dateStr: string): string {
  if (!dateStr) return '';
  const clean = dateStr.trim();
  if (clean.includes('T')) {
    return clean.split('T')[0];
  }
  const dmyMatch = clean.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }
  const ymdMatch = clean.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return clean;
}

/**
 * Check if a preset is disabled (has already passed compared to current time)
 */
export function isPresetDisabled(
  preset: { id: string; start: string; end: string },
  randomDate: string,
  currentTime: Date = new Date()
): boolean {
  if (preset.id === 'custom') return false;
  if (!randomDate) return false;

  const normDate = normalizeDateStringToYMD(randomDate);
  const todayStr = getLocalDateString(currentTime);
  if (normDate < todayStr) return true; // Past date -> all presets disabled
  if (normDate > todayStr) return false; // Future date -> all presets enabled

  // normDate === todayStr: Check if preset end time has already elapsed
  const [endH, endM] = preset.end.split(':').map(Number);
  const presetEnd = new Date(
    currentTime.getFullYear(),
    currentTime.getMonth(),
    currentTime.getDate(),
    endH,
    endM,
    0,
    0
  );

  return presetEnd.getTime() <= currentTime.getTime();
}

export interface WindowStatus {
  isExpired: boolean;
  isInProgress: boolean;
  effectiveStartMs: number;
  endMs: number;
  remainingDurationMs: number;
}

/**
 * Evaluates the window status: whether it has expired, is currently in progress,
 * and what the effective start boundary should be.
 */
export function getWindowStatus(
  randomDate: string,
  startTime: string,
  endTime: string,
  currentTime: Date = new Date()
): WindowStatus {
  if (!randomDate || !startTime || !endTime) {
    return { isExpired: true, isInProgress: false, effectiveStartMs: 0, endMs: 0, remainingDurationMs: 0 };
  }

  const normDate = normalizeDateStringToYMD(randomDate);
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const [yr, mo, da] = normDate.split('-').map(Number);

  const startDate = new Date(yr, mo - 1, da, startH, startM, 0, 0);
  const endDate = new Date(yr, mo - 1, da, endH, endM, 0, 0);
  const startMs = startDate.getTime();
  const endMs = endDate.getTime();
  const nowMs = currentTime.getTime();

  if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) {
    return { isExpired: true, isInProgress: false, effectiveStartMs: 0, endMs: 0, remainingDurationMs: 0 };
  }

  const todayStr = getLocalDateString(currentTime);
  const isToday = normDate === todayStr;
  const isPastDate = normDate < todayStr;

  if (isPastDate || (isToday && endMs <= nowMs)) {
    return { isExpired: true, isInProgress: false, effectiveStartMs: startMs, endMs, remainingDurationMs: 0 };
  }

  const isInProgress = isToday && startMs <= nowMs && endMs > nowMs;
  // If window is in progress, remaining random window must start at least 1 minute in the future
  const minAllowedMs = isToday ? nowMs + 60000 : startMs;
  const effectiveStartMs = Math.max(startMs, minAllowedMs);
  const remainingDurationMs = Math.max(endMs - effectiveStartMs, 0);

  return {
    isExpired: remainingDurationMs <= 0,
    isInProgress,
    effectiveStartMs,
    endMs,
    remainingDurationMs,
  };
}

/**
 * Computes random or distributed timestamps for item IDs (videos)
 * guaranteed to be >= effectiveStartMs and strictly in the future if today.
 */
export function computeRandomWindowTimes(params: {
  randomDate: string;
  startTime: string;
  endTime: string;
  itemIds?: string[];
  isEvenlySpaced?: boolean;
  shuffleKey?: number;
  currentTime?: Date;
}): Record<string, Date> {
  const {
    randomDate,
    startTime,
    endTime,
    itemIds = ['preview_single'],
    isEvenlySpaced = true,
    shuffleKey = 0,
    currentTime = new Date(),
  } = params;

  const normDate = normalizeDateStringToYMD(randomDate);
  const status = getWindowStatus(normDate, startTime, endTime, currentTime);
  if (status.isExpired || status.remainingDurationMs <= 0) {
    return {};
  }

  const count = Math.max(itemIds.length, 1);
  const result: Record<string, Date> = {};
  const { effectiveStartMs, endMs, remainingDurationMs } = status;

  if (count === 1) {
    const id = itemIds[0] || 'preview_single';
    const pseudoRand = ((shuffleKey * 9301 + 49297) % 233280) / 233280;
    const maxOffset = Math.max(remainingDurationMs - 30000, 0);
    const offset = Math.floor(pseudoRand * maxOffset);
    result[id] = new Date(effectiveStartMs + offset);
    return result;
  }

  if (isEvenlySpaced) {
    const step = remainingDurationMs / count;
    itemIds.forEach((id, idx) => {
      const baseOffset = idx * step + step * 0.3;
      const jitter = ((shuffleKey + idx * 7) % 5 - 2) * 30000;
      const finalMs = Math.min(Math.max(effectiveStartMs + baseOffset + jitter, effectiveStartMs), endMs - 30000);
      result[id] = new Date(finalMs);
    });
  } else {
    const randomOffsets = itemIds
      .map((_, idx) => {
        const rand = (((shuffleKey + 1) * (idx + 3) * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
        const maxOffset = Math.max(remainingDurationMs - 30000, 0);
        return Math.floor(rand * maxOffset);
      })
      .sort((a, b) => a - b);

    itemIds.forEach((id, idx) => {
      result[id] = new Date(effectiveStartMs + randomOffsets[idx]);
    });
  }

  return result;
}
