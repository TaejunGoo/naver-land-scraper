import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import statsRoutes from './statsRoutes';
import prisma from '../db';

// Mock prisma
vi.mock('../db', () => ({
  default: {
    $queryRaw: vi.fn(),
  }
}));

const app = express();
app.use(express.json());
app.use('/api/stats', statsRoutes);

describe('Stats Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /trend should return calculated trend data', async () => {
    // Mock responses in order:
    // 1. Summary query (to get latestDate)
    // 2. TrendData query (history)
    // 3. Weekly trend query
    // 4. Standard 84 price query
    // 5. Today existing count query
    // 6. Records query (new highs/lows)
    
    (prisma.$queryRaw as any)
      .mockResolvedValueOnce([
        {
          date: '2026-01-06',
          totalCount: 12n,
          avgPricePerPyeong: 3300
        },
        {
          date: '2026-01-05',
          totalCount: 10n,
          avgPricePerPyeong: 3000
        }
      ])
      .mockResolvedValueOnce([
        {
          date: '2026-01-05',
          totalCount: 10n,
          saleCount: 5n,
          jeonseCount: 3n,
          rentCount: 2n,
          avgPricePerPyeong: 3000
        },
        {
          date: '2026-01-06',
          totalCount: 12n,
          saleCount: 6n,
          jeonseCount: 4n,
          rentCount: 2n,
          avgPricePerPyeong: 3300
        }
      ])
      .mockResolvedValueOnce([{ avgChangeRate: 5.5 }])
      .mockResolvedValueOnce([{ avgPrice: 45000 }])
      .mockResolvedValueOnce([{ count: 12n }])
      .mockResolvedValueOnce([{ lowCount: 2n, highCount: 3n }]);

    const response = await request(app).get('/api/stats/trend');

    expect(response.status).toBe(200);
    expect(response.body.summary.todayTotal).toBe(12);
    expect(response.body.summary.todayAvgPricePerPyeong).toBe(3300);
    expect(response.body.summary.priceChange).toBe(5.5);
    expect(response.body.summary.countChange).toBe(2);
    expect(response.body.summary.newCount).toBe(2);
    expect(response.body.summary.avgPrice84).toBe(45000);
    expect(response.body.summary.newLowCount).toBe(2);
    expect(response.body.summary.newHighCount).toBe(3);
    expect(response.body.history).toHaveLength(2);
  });

  it('GET /trend should handle zero yesterday price avoiding NaN', async () => {
    // Mock responses: summary with only today, no yesterday
    (prisma.$queryRaw as any)
      .mockResolvedValueOnce([
        {
          date: '2026-01-06',
          totalCount: 5n,
          avgPricePerPyeong: 3000
        }
        // No yesterday data
      ])
      .mockResolvedValueOnce([
        {
          date: '2026-01-06',
          totalCount: 5n,
          saleCount: 3n,
          jeonseCount: 1n,
          rentCount: 1n,
          avgPricePerPyeong: 3000
        }
      ])
      .mockResolvedValueOnce([{ avgChangeRate: null }])
      .mockResolvedValueOnce([{ avgPrice: 40000 }])
      .mockResolvedValueOnce([{ count: 5n }])
      .mockResolvedValueOnce([{ lowCount: 0n, highCount: 0n }]);

    const response = await request(app).get('/api/stats/trend');

    expect(response.status).toBe(200);
    expect(response.body.summary.priceChange).toBe(0);
    expect(response.body.summary.todayTotal).toBe(5);
    expect(response.body.summary.countChange).toBe(5);
  });

  it('GET /trend should return 500 on database error', async () => {
    (prisma.$queryRaw as any).mockRejectedValue(new Error('DB Error'));

    const response = await request(app).get('/api/stats/trend');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Failed to fetch trend data');
  });
});
