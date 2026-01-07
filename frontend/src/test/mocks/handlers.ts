import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/stats/trend', () => {
    return HttpResponse.json({
      history: [
        {
          date: '2026-01-05',
          totalCount: 100,
          saleCount: 50,
          jeonseCount: 30,
          rentCount: 20,
          avgPricePerPyeong: 3000,
        },
        {
          date: '2026-01-06',
          totalCount: 110,
          saleCount: 55,
          jeonseCount: 35,
          rentCount: 20,
          avgPricePerPyeong: 3100,
        },
        {
          date: '2026-01-07',
          totalCount: 105,
          saleCount: 52,
          jeonseCount: 33,
          rentCount: 20,
          avgPricePerPyeong: 3050,
        },
      ],
      summary: {
        todayTotal: 105,
        todayAvgPricePerPyeong: 3050,
        priceChange: -1.61, // (3050-3100)/3100 * 100
        countChange: -5,
        newListingCount: 12, // New field
      },
    });
  }),
];
