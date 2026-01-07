/**
 * KST (Korea Standard Time, UTC+9) date utilities
 * Centralizes all date calculations to ensure consistency across the application
 */

export interface KSTDateRange {
  startTime: Date;  // KST 00:00 in UTC
  endTime: Date;    // KST 24:00 (next day 00:00) in UTC
}

/**
 * Get the current time in KST
 */
export function getKSTNow(): Date {
  const now = new Date();
  return new Date(now.getTime() + 9 * 60 * 60 * 1000);
}

/**
 * Get today's date range in KST (converted to UTC for DB queries)
 * KST 00:00 = UTC previous day 15:00
 */
export function getTodayKSTRange(): KSTDateRange {
  const kstNow = getKSTNow();
  const todayKST = new Date(
    Date.UTC(
      kstNow.getUTCFullYear(),
      kstNow.getUTCMonth(),
      kstNow.getUTCDate()
    )
  );

  const startTime = new Date(todayKST.getTime() - 9 * 60 * 60 * 1000);
  const endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000);

  return { startTime, endTime };
}

/**
 * Get yesterday's date range in KST (converted to UTC for DB queries)
 */
export function getYesterdayKSTRange(): KSTDateRange {
  const today = getTodayKSTRange();
  const startTime = new Date(today.startTime.getTime() - 24 * 60 * 60 * 1000);
  const endTime = today.startTime;

  return { startTime, endTime };
}

/**
 * Get date range for the past N days in KST
 */
export function getPastDaysKSTRange(days: number): KSTDateRange {
  const today = getTodayKSTRange();
  const startTime = new Date(today.startTime.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
  const endTime = today.endTime;

  return { startTime, endTime };
}

/**
 * Format a date to KST date string (YYYY-MM-DD)
 */
export function formatDateKST(date: Date): string {
  const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return kstDate.toISOString().split('T')[0];
}

/**
 * Get today's date string in KST (YYYY-MM-DD)
 */
export function getTodayKSTString(): string {
  return formatDateKST(new Date());
}
