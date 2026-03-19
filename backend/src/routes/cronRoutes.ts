/**
 * @fileoverview 크론(Cron) API 라우트
 *
 * Railway Cron Job이 호출하는 자동 크롤링 엔드포인트입니다.
 * CRON_SECRET 환경변수로 보호되어 외부 접근을 차단합니다.
 *
 * - POST /scrape-all  등록된 모든 단지의 매물을 순차 크롤링
 */
import { Router } from 'express';
import prisma from '../db.js';
import { scrapeNaverListings } from '../scrapers/naverScraper.js';
import { getTodayKSTRange } from '../utils/index.js';

const router = Router();

const CRON_SECRET = process.env.CRON_SECRET || '';

/**
 * POST /scrape-all - 전체 단지 자동 크롤링
 *
 * Railway Cron Job이 매일 호출합니다.
 * x-cron-secret 헤더로 인증하며, 모든 단지를 1개씩 순차 처리합니다.
 * (서버 리소스 제한을 고려하여 병렬 처리하지 않음)
 */
router.post('/scrape-all', async (req, res) => {
  // Cron secret verification
  const secret = req.headers['x-cron-secret'];
  if (CRON_SECRET && secret !== CRON_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const globalStartTime = Date.now();

  try {
    const complexes = await prisma.complex.findMany({
      where: {
        naverComplexId: { not: null },
      },
    });

    if (complexes.length === 0) {
      return res.json({ message: 'No complexes to scrape', results: [] });
    }

    console.log(`[Cron] Starting auto-scrape for ${complexes.length} complexes...`);

    const results = [];

    // Sequential processing to avoid overloading server resources
    for (const complex of complexes) {
      const scrapeStart = Date.now();
      try {
        console.log(`[Cron] Scraping: ${complex.name}`);

        // Delete today's existing data (overwrite mode)
        const { startTime, endTime } = getTodayKSTRange();
        await prisma.listing.deleteMany({
          where: {
            complexId: complex.id,
            scrapedAt: {
              gte: startTime,
              lt: endTime,
            },
          },
        });

        const listings = await scrapeNaverListings(complex.naverComplexId!);
        const scrapeTimestamp = new Date();

        if (listings.length > 0) {
          await prisma.listing.createMany({
            data: listings.map((l) => ({
              complexId: complex.id,
              ...l,
              scrapedAt: scrapeTimestamp,
            })),
          });
        }

        await prisma.complex.update({
          where: { id: complex.id },
          data: { lastScrapedAt: new Date() },
        });

        const duration = ((Date.now() - scrapeStart) / 1000).toFixed(1);
        console.log(`[Cron] Done: ${complex.name} — ${listings.length} listings (${duration}s)`);

        results.push({
          complexId: complex.id,
          complexName: complex.name,
          count: listings.length,
          duration: `${duration}s`,
          success: true,
        });
      } catch (error) {
        const duration = ((Date.now() - scrapeStart) / 1000).toFixed(1);
        console.error(`[Cron] Failed: ${complex.name}`, error);

        results.push({
          complexId: complex.id,
          complexName: complex.name,
          count: 0,
          duration: `${duration}s`,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      // Delay between complexes to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    const totalDuration = ((Date.now() - globalStartTime) / 1000).toFixed(1);
    const successCount = results.filter((r) => r.success).length;
    const totalListings = results.reduce((sum, r) => sum + r.count, 0);

    console.log(
      `[Cron] Completed: ${successCount}/${complexes.length} complexes, ${totalListings} total listings (${totalDuration}s)`
    );

    res.json({
      message: 'Auto-scrape completed',
      totalComplexes: complexes.length,
      successCount,
      totalListings,
      totalDuration: `${totalDuration}s`,
      results,
    });
  } catch (error) {
    console.error('[Cron] Fatal error:', error);
    res.status(500).json({ error: 'Auto-scrape failed' });
  }
});

export default router;
