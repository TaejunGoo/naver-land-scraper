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
    // Mock responses for the two queries in trend route
    // First query: trendData (history)
    // Second query: summary (today/yesterday)
    (prisma.$queryRaw as any)
      .mockResolvedValueOnce([
        {
          date: '2026-01-05',
          totalCount: 10,
          saleCount: 5,
          jeonseCount: 3,
          rentCount: 2,
          avgPricePerPyeong: 3000
        },
        {
          date: '2026-01-06',
          totalCount: 12,
          saleCount: 6,
          jeonseCount: 4,
          rentCount: 2,
          avgPricePerPyeong: 3300
        }
      ])
      .mockResolvedValueOnce([
        {
          date: '2026-01-06',
          totalCount: 12,
          avgPricePerPyeong: 3300
        },
        {
          date: '2026-01-05',
          totalCount: 10,
          avgPricePerPyeong: 3000
        }
      ]);

    const response = await request(app).get('/api/stats/trend');

    expect(response.status).toBe(200);
    expect(response.body.summary.todayTotal).toBe(12);
    expect(response.body.summary.priceChange).toBe(10); // (3300-3000)/3000 * 100
    expect(response.body.history).toHaveLength(2);
    expect(response.body.history[1].avgPricePerPyeong).toBe(3300);
  });

  it('GET /trend should handle zero yesterday price avoiding NaN', async () => {
    (prisma.$queryRaw as any)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          date: '2026-01-06',
          totalCount: 5,
          avgPricePerPyeong: 3000
        }
        // No yesterday data
      ]);

    const response = await request(app).get('/api/stats/trend');

    expect(response.status).toBe(200);
    expect(response.body.summary.priceChange).toBe(0);
    expect(response.body.summary.todayTotal).toBe(5);
  });

  it('GET /trend should return 500 on database error', async () => {
    (prisma.$queryRaw as any).mockRejectedValue(new Error('DB Error'));

    const response = await request(app).get('/api/stats/trend');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Failed to fetch trend data');
  });
});
