import type { Complex, Listing, ComplexCreateInput, ComplexUpdateInput } from "../types";
import sampleData from "../data/sample-data.json";

export type { Complex, Listing, ComplexCreateInput, ComplexUpdateInput };

// Helper to simulate API delay
const delay = (ms: number = 100) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to simulate API response
const mockResponse = async <T>(data: T) => {
  await delay();
  return { data };
};

// Helper to calculate listing stats
function calculateListingStats(listings: Listing[], complexId: number) {
  const complexListings = listings.filter(l => l.complexId === complexId);

  // Get unique dates
  const dates = Array.from(new Set(complexListings.map(l =>
    new Date(l.scrapedAt).toISOString().split('T')[0]
  ))).sort().reverse();

  const latestDate = dates[0];
  const previousDate = dates[1];

  // Today's listings
  const todayListings = complexListings.filter(l =>
    new Date(l.scrapedAt).toISOString().split('T')[0] === latestDate
  );

  // Yesterday's listings
  const yesterdayListings = complexListings.filter(l =>
    new Date(l.scrapedAt).toISOString().split('T')[0] === previousDate
  );

  const todayCounts = {
    sale: todayListings.filter(l => l.tradetype === '매매').length,
    jeonse: todayListings.filter(l => l.tradetype === '전세').length,
    rent: todayListings.filter(l => l.tradetype === '월세').length,
    total: todayListings.length
  };

  const yesterdayCounts = {
    sale: yesterdayListings.filter(l => l.tradetype === '매매').length,
    jeonse: yesterdayListings.filter(l => l.tradetype === '전세').length,
    rent: yesterdayListings.filter(l => l.tradetype === '월세').length,
    total: yesterdayListings.length
  };

  return {
    today: todayCounts,
    yesterday: yesterdayCounts,
    diff: {
      sale: todayCounts.sale - yesterdayCounts.sale,
      jeonse: todayCounts.jeonse - yesterdayCounts.jeonse,
      rent: todayCounts.rent - yesterdayCounts.rent,
      total: todayCounts.total - yesterdayCounts.total
    }
  };
}

export const complexApi = {
  getAll: async () => {
    const complexes = sampleData.complexes.map((complex: any) => {
      const stats = calculateListingStats(sampleData.listings, complex.id);
      const complexListings = sampleData.listings.filter((l: any) => l.complexId === complex.id);
      const uniqueDates = new Set(complexListings.map((l: any) =>
        new Date(l.scrapedAt).toISOString().split('T')[0]
      ));

      return {
        ...complex,
        todayListingCount: stats.today.total,
        todayListingCounts: stats.today,
        listingStats: stats,
        dataDaysCount: uniqueDates.size,
        recordCounts: {
          newHighCount: 0,
          newLowCount: 0
        }
      };
    });

    return mockResponse(complexes);
  },

  getById: async (id: number) => {
    const complex = sampleData.complexes.find((c: any) => c.id === id);
    if (!complex) {
      throw new Error('Complex not found');
    }

    const stats = calculateListingStats(sampleData.listings, id);
    const complexListings = sampleData.listings.filter((l: any) => l.complexId === id);
    const uniqueDates = new Set(complexListings.map((l: any) =>
      new Date(l.scrapedAt).toISOString().split('T')[0]
    ));

    const enrichedComplex = {
      ...complex,
      todayListingCount: stats.today.total,
      todayListingCounts: stats.today,
      listingStats: stats,
      dataDaysCount: uniqueDates.size
    };

    return mockResponse(enrichedComplex);
  },

  create: async (_data: ComplexCreateInput) => {
    throw new Error('This is a demo mode. Create operation is disabled.');
  },

  update: async (_id: number, _data: ComplexUpdateInput) => {
    throw new Error('This is a demo mode. Update operation is disabled.');
  },

  delete: async (_id: number) => {
    throw new Error('This is a demo mode. Delete operation is disabled.');
  },

  scrape: async (_id: number) => {
    throw new Error('This is a demo mode. Scraping is disabled.');
  },

  scrapeInfo: async (_id: number) => {
    throw new Error('This is a demo mode. Scraping is disabled.');
  },

  scrapeAll: async () => {
    throw new Error('This is a demo mode. Scraping is disabled.');
  },

  createTestComplex: async (_days: number = 365) => {
    throw new Error('This is a demo mode. This operation is disabled.');
  },

  exportAllExcel: async () => {
    throw new Error('This is a demo mode. Excel export is disabled.');
  },

  exportByIdExcel: async (_id: number) => {
    throw new Error('This is a demo mode. Excel export is disabled.');
  },
};

export const statsApi = {
  getLatestDate: async () => {
    // Get the latest scraped date from sample data
    const dates = sampleData.listings.map((l: any) =>
      new Date(l.scrapedAt).toISOString().split('T')[0]
    );
    const latestDate = dates.sort().reverse()[0];

    return mockResponse({ latestDate });
  },

  getTrend: async (days: number = 30) => {
    // Group listings by date
    const listingsByDate: Record<string, any[]> = {};

    sampleData.listings.forEach((listing: any) => {
      const date = new Date(listing.scrapedAt).toISOString().split('T')[0];
      if (!listingsByDate[date]) {
        listingsByDate[date] = [];
      }
      listingsByDate[date].push(listing);
    });

    const sortedDates = Object.keys(listingsByDate).sort();
    const recentDates = sortedDates.slice(-days);

    // Build history
    const history = recentDates.map(date => {
      const dayListings = listingsByDate[date];
      const totalCount = dayListings.length;
      const saleCount = dayListings.filter(l => l.tradetype === '매매').length;
      const jeonseCount = dayListings.filter(l => l.tradetype === '전세').length;
      const rentCount = dayListings.filter(l => l.tradetype === '월세').length;

      const avgPricePerPyeong = dayListings.length > 0
        ? Math.round(
            dayListings.reduce((sum, l) => sum + (l.price / l.area) * 3.3058, 0) /
            dayListings.length
          )
        : 0;

      return {
        date,
        totalCount,
        saleCount,
        jeonseCount,
        rentCount,
        avgPricePerPyeong
      };
    });

    // Calculate summary
    const latestDate = sortedDates[sortedDates.length - 1];
    const previousDate = sortedDates[sortedDates.length - 2];

    const todayListings = listingsByDate[latestDate] || [];
    const yesterdayListings = listingsByDate[previousDate] || [];

    const todayTotal = todayListings.length;
    const yesterdayTotal = yesterdayListings.length;

    const todayAvgPricePerPyeong = todayListings.length > 0
      ? Math.round(
          todayListings.reduce((sum, l) => sum + (l.price / l.area) * 3.3058, 0) /
          todayListings.length
        )
      : 0;

    // Calculate 84㎡ average price
    const sale84Listings = todayListings.filter(
      l => l.tradetype === '매매' && l.area >= 84 && l.area < 85
    );
    const avgPrice84 = sale84Listings.length > 0
      ? Math.round(
          sale84Listings.reduce((sum, l) => sum + l.price, 0) / sale84Listings.length
        )
      : 0;

    // Calculate weekly trend
    const weekAgoDate = sortedDates[Math.max(0, sortedDates.length - 8)];
    const weekAgoListings = listingsByDate[weekAgoDate] || [];
    const weekAgoAvg = weekAgoListings.length > 0
      ? weekAgoListings.reduce((sum, l) => sum + (l.price / l.area) * 3.3058, 0) /
        weekAgoListings.length
      : 0;

    const priceChange = weekAgoAvg > 0
      ? Math.round(((todayAvgPricePerPyeong - weekAgoAvg) / weekAgoAvg) * 10000) / 100
      : 0;

    return mockResponse({
      history,
      summary: {
        todayTotal,
        todayAvgPricePerPyeong,
        priceChange,
        countChange: todayTotal - yesterdayTotal,
        newCount: Math.max(0, todayTotal - yesterdayTotal),
        avgPrice84,
        newLowCount: 0,
        newHighCount: 0
      }
    });
  },

  getRecords: async (_type: 'high' | 'low') => {
    // Return empty array for demo mode
    return mockResponse({ records: [] });
  },
};

export const listingApi = {
  getByComplexId: async (
    complexId: number,
    params?: {
      tradetype?: string[];
      areaMin?: number;
      areaMax?: number;
      sortBy?: string;
      sortOrder?: string;
    }
  ) => {
    let listings = sampleData.listings.filter((l: any) => l.complexId === complexId);

    // Filter by trade type
    if (params?.tradetype && params.tradetype.length > 0) {
      listings = listings.filter(l => params.tradetype!.includes(l.tradetype));
    }

    // Filter by area
    if (params?.areaMin) {
      listings = listings.filter(l => l.area >= params.areaMin!);
    }
    if (params?.areaMax) {
      listings = listings.filter(l => l.area <= params.areaMax!);
    }

    // Sort listings
    const sortField = params?.sortBy || 'price';
    const sortOrder = params?.sortOrder === 'desc' ? -1 : 1;

    listings.sort((a: any, b: any) => {
      const aVal = sortField === 'floor' ? Number(a[sortField]) : a[sortField];
      const bVal = sortField === 'floor' ? Number(b[sortField]) : b[sortField];
      return aVal > bVal ? sortOrder : aVal < bVal ? -sortOrder : 0;
    });

    // Add flags (simplified for demo)
    const listingsWithFlags = listings.map(listing => ({
      ...listing,
      isNewHigh: false,
      isNewLow: false,
    }));

    return mockResponse(listingsWithFlags);
  },

  delete: async (_id: number) => {
    throw new Error('This is a demo mode. Delete operation is disabled.');
  },

  batchDelete: async (_ids: number[]) => {
    throw new Error('This is a demo mode. Delete operation is disabled.');
  },

  deleteAll: async (_complexId: number) => {
    throw new Error('This is a demo mode. Delete operation is disabled.');
  },

  generateDummy: async (_complexId: number, _days: number = 365) => {
    throw new Error('This is a demo mode. This operation is disabled.');
  },
};

export default { complexApi, statsApi, listingApi };
