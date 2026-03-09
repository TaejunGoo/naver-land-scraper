/**
 * @fileoverview KST (한국 표준시, UTC+9) 날짜 유틸리티
 *
 * 이 애플리케이션은 모든 날짜를 KST 기준으로 처리합니다.
 * SQLite는 타임존을 지원하지 않으므로, 서버 코드에서
 * UTC ↔ KST 변환을 수동으로 처리합니다.
 *
 * 주요 함수:
 * - getTodayKSTRange(): 오늘(KST) 00:00~23:59의 UTC 범위
 * - getYesterdayKSTRange(): 어제(KST) 00:00~23:59의 UTC 범위
 * - formatDateKST(): 날짜를 KST 기준 YYYY-MM-DD로 변환
 */

/**
 * KST 기준 날짜 범위를 나타내는 인터페이스.
 * startTime ~ endTime 사이가 KST 기준 하루(24시간)입니다.
 */
export interface KSTDateRange {
  startTime: Date;  // KST 00:00에 해당하는 UTC 시각 (전일 15:00 UTC)
  endTime: Date;    // KST 24:00에 해당하는 UTC 시각 (당일 15:00 UTC)
}

/**
 * 현재 시각을 KST로 변환하여 반환합니다.
 *
 * 주의: 반환된 Date 객체의 "UTC 시간"이 실제 KST 시간을 나타냅니다.
 * 예: KST 2024-01-15 14:00 → UTC 필드에 14:00으로 저장됨
 */
export function getKSTNow(): Date {
  const now = new Date();
  return new Date(now.getTime() + 9 * 60 * 60 * 1000);
}

/**
 * 오늘(KST 기준)의 시작~끝 시각을 UTC Date로 반환합니다.
 *
 * 예: KST 2024-01-15일 경우
 * - startTime: 2024-01-14T15:00:00Z (KST 00:00)
 * - endTime:   2024-01-15T15:00:00Z (KST 24:00)
 *
 * DB 쿼리 시 scrapedAt >= startTime AND scrapedAt < endTime 으로 사용합니다.
 */
export function getTodayKSTRange(): KSTDateRange {
  const kstNow = getKSTNow();
  // KST 기준 "오늘 00:00"을 UTC Date로 구성
  const todayKST = new Date(
    Date.UTC(
      kstNow.getUTCFullYear(),
      kstNow.getUTCMonth(),
      kstNow.getUTCDate()
    )
  );

  // KST 00:00을 UTC로 변환 (-9시간)
  const startTime = new Date(todayKST.getTime() - 9 * 60 * 60 * 1000);
  // KST 24:00 = 다음날 KST 00:00 = startTime + 24시간
  const endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000);

  return { startTime, endTime };
}

/**
 * 어제(KST 기준)의 시작~끝 시각을 UTC Date로 반환합니다.
 * 오늘(KST) 범위에서 24시간을 빼서 계산합니다.
 */
export function getYesterdayKSTRange(): KSTDateRange {
  const today = getTodayKSTRange();
  const startTime = new Date(today.startTime.getTime() - 24 * 60 * 60 * 1000);
  const endTime = today.startTime; // 어제의 끝 = 오늘의 시작

  return { startTime, endTime };
}

/**
 * 과거 N일간의 KST 날짜 범위를 UTC Date로 반환합니다.
 *
 * @param days - 과거 일수 (1이면 오늘만, 7이면 최근 7일)
 */
export function getPastDaysKSTRange(days: number): KSTDateRange {
  const today = getTodayKSTRange();
  const startTime = new Date(today.startTime.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
  const endTime = today.endTime;

  return { startTime, endTime };
}

/**
 * Date 객체를 KST 기준 "YYYY-MM-DD" 문자열로 변환합니다.
 *
 * @param date - 변환할 Date 객체 (UTC 기준)
 * @returns KST 기준 날짜 문자열 (예: "2024-01-15")
 */
export function formatDateKST(date: Date): string {
  const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return kstDate.toISOString().split('T')[0];
}

/**
 * 현재 시각의 KST 기준 날짜 문자열을 반환합니다.
 * @returns "YYYY-MM-DD" 형식 (예: "2024-01-15")
 */
export function getTodayKSTString(): string {
  return formatDateKST(new Date());
}
