/**
 * @fileoverview 매물 통계 집계 유틸리티
 *
 * 매물(Listing) 데이터를 거래유형별(매매/전세/월세)로 집계하고,
 * 날짜 간 증감을 계산하는 함수들을 제공합니다.
 *
 * complexRoutes.ts에서 단지 카드의 매물 수/증감 표시에 사용됩니다.
 */

/**
 * 거래유형별 매물 수를 나타내는 인터페이스.
 * 단지 카드, 대시보드 등에서 매물 요약 표시에 사용됩니다.
 */
export interface ListingCounts {
  /** 전체 매물 수 (매매 + 전세 + 월세) */
  total: number;
  /** 매매 매물 수 */
  sale: number;
  /** 전세 매물 수 */
  jeonse: number;
  /** 월세 매물 수 */
  rent: number;
}

/**
 * 오늘/어제 매물 통계 + 증감을 포함하는 인터페이스.
 * 단지 카드에서 "▲2 ▼1" 같은 증감 표시에 사용됩니다.
 */
export interface ListingStats {
  /** 최근 수집일 매물 수 (유형별) */
  today: ListingCounts;
  /** 직전 수집일 매물 수 (유형별) */
  yesterday: ListingCounts;
  /** 증감 (today - yesterday) */
  diff: ListingCounts;
}

/**
 * DB 그룹 쿼리 결과를 유형별 매물 수로 집계합니다.
 *
 * @param groupedData - Prisma groupBy 결과 배열
 *                      형식: [{ tradetype: "매매", _count: 5 }, ...]
 * @returns 유형별 매물 수 (ListingCounts)
 *
 * @example
 * const counts = calculateListingCounts([
 *   { tradetype: "매매", _count: 10 },
 *   { tradetype: "전세", _count: 5 },
 * ]);
 * // → { total: 15, sale: 10, jeonse: 5, rent: 0 }
 */
export function calculateListingCounts(
  groupedData: Array<{ tradetype: string; _count: number }>
): ListingCounts {
  const counts: ListingCounts = { total: 0, sale: 0, jeonse: 0, rent: 0 };

  groupedData.forEach((item) => {
    const count = item._count;
    counts.total += count;

    switch (item.tradetype) {
      case "매매":
        counts.sale = count;
        break;
      case "전세":
        counts.jeonse = count;
        break;
      case "월세":
        counts.rent = count;
        break;
    }
  });

  return counts;
}

/**
 * 두 시점의 매물 수 차이(증감)를 계산합니다.
 *
 * @param today - 최근 수집일 매물 수
 * @param yesterday - 직전 수집일 매물 수
 * @returns 각 유형별 증감 값 (양수=증가, 음수=감소)
 */
export function calculateCountsDiff(
  today: ListingCounts,
  yesterday: ListingCounts
): ListingCounts {
  return {
    total: today.total - yesterday.total,
    sale: today.sale - yesterday.sale,
    jeonse: today.jeonse - yesterday.jeonse,
    rent: today.rent - yesterday.rent,
  };
}

/**
 * 오늘/어제 매물 데이터를 받아 전체 통계(today, yesterday, diff)를 계산합니다.
 *
 * complexRoutes.ts의 단지 목록/상세 API에서 호출되어
 * 프론트엔드에 listingStats 필드로 전달됩니다.
 *
 * @param todayData - 최근 수집일의 그룹 쿼리 결과
 * @param yesterdayData - 직전 수집일의 그룹 쿼리 결과
 * @returns 완전한 통계 객체 (ListingStats)
 */
export function calculateListingStats(
  todayData: Array<{ tradetype: string; _count: number }>,
  yesterdayData: Array<{ tradetype: string; _count: number }>
): ListingStats {
  const today = calculateListingCounts(todayData);
  const yesterday = calculateListingCounts(yesterdayData);
  const diff = calculateCountsDiff(today, yesterday);

  return { today, yesterday, diff };
}
