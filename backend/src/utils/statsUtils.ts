/**
 * Statistics calculation utilities for listing data
 */

export interface ListingCounts {
  total: number;
  sale: number;
  jeonse: number;
  rent: number;
}

export interface ListingStats {
  today: ListingCounts;
  yesterday: ListingCounts;
  diff: ListingCounts;
}

/**
 * Calculate listing counts from grouped data
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
 * Calculate diff between two listing counts
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
 * Calculate full listing stats (today, yesterday, diff)
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
