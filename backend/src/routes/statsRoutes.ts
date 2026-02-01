import { Router } from "express";
import prisma from "../db.js";

const router = Router();

// Get overall trend data for the dashboard and trend page
router.get("/trend", async (req, res) => {
  try {
    const days = Number(req.query.days) || 30; // Default to 30 days
    
    // 1. 먼저 최근 수집일(latestDate)을 확인하기 위해 Summary 쿼리를 가장 먼저 실행합니다.
    const summary = await prisma.$queryRaw<any[]>`
      WITH DailyStats AS (
        SELECT 
          date(scrapedAt / 1000, 'unixepoch', '+9 hours') as date,
          COUNT(*) as totalCount,
          AVG(price / area) * 3.305785 as avgPricePerPyeong
        FROM listings
        GROUP BY date
      )
      SELECT * FROM DailyStats ORDER BY date DESC LIMIT 2
    `;

    // 데이터가 없는 경우 빈 값 반환
    if (!summary || summary.length === 0) {
      return res.json({
        history: [],
        summary: {
          todayTotal: 0,
          todayAvgPricePerPyeong: 0,
          priceChange: 0,
          countChange: 0,
          newCount: 0,
          avgPrice84: 0,
          newLowCount: 0,
          newHighCount: 0
        }
      });
    }

    // 가장 최근 수집된 날짜
    const latestDate = summary[0].date;

    // 2. 기간별 데이터 조회 (KST 기준)
    const trendData = await prisma.$queryRaw<any[]>`
      SELECT 
        date(scrapedAt / 1000, 'unixepoch', '+9 hours') as date,
        COUNT(*) as totalCount,
        SUM(CASE WHEN tradetype = '매매' THEN 1 ELSE 0 END) as saleCount,
        SUM(CASE WHEN tradetype = '전세' THEN 1 ELSE 0 END) as jeonseCount,
        SUM(CASE WHEN tradetype = '월세' THEN 1 ELSE 0 END) as rentCount,
        AVG(price / area) * 3.305785 as avgPricePerPyeong
      FROM listings
      GROUP BY date
      ORDER BY date ASC
      LIMIT ${days}
    `;

    // 3. 단지별 변동률 (Weekly Trend: 7일 전 대비) - latestDate 기준
    const weeklyTrendResult = await prisma.$queryRaw<any[]>`
      WITH TodayComplex AS (
        SELECT complexId, AVG(CAST(price AS FLOAT) / CAST(area AS FLOAT)) as avgPrice
        FROM listings
        WHERE date(scrapedAt / 1000, 'unixepoch', '+9 hours') = date(${latestDate})
        AND tradetype = '매매'
        GROUP BY complexId
      ),
      LastWeekComplex AS (
        SELECT complexId, AVG(CAST(price AS FLOAT) / CAST(area AS FLOAT)) as avgPrice
        FROM listings
        WHERE date(scrapedAt / 1000, 'unixepoch', '+9 hours') = date(${latestDate}, '-7 days')
        AND tradetype = '매매'
        GROUP BY complexId
      )
      SELECT AVG((t.avgPrice - w.avgPrice) / w.avgPrice) * 100 as avgChangeRate
      FROM TodayComplex t
      JOIN LastWeekComplex w ON t.complexId = w.complexId
    `;
    
    const weeklyTrendRate = weeklyTrendResult[0]?.avgChangeRate !== null 
      ? Number(weeklyTrendResult[0].avgChangeRate) 
      : 0;

    // 4. 국평(84㎡) 평균가 - latestDate 기준
    const standard84Result = await prisma.$queryRaw<any[]>`
      SELECT AVG(CAST(price AS FLOAT)) as avgPrice
      FROM listings
      WHERE date(scrapedAt / 1000, 'unixepoch', '+9 hours') = date(${latestDate})
      AND tradetype = '매매'
      AND area >= 84 AND area < 85
    `;
    const standard84Price = Number(standard84Result[0]?.avgPrice || 0);

    // 5. 신규 매물 (어제/직전 수집일에 비해 매물 수가 얼마나 늘었는지)
    // latestDate 기준
    const todayExistingResult = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count
      FROM listings as l1
      JOIN (
          SELECT complexId 
          FROM listings 
          GROUP BY complexId 
          HAVING MIN(date(scrapedAt / 1000, 'unixepoch', '+9 hours')) < date(${latestDate})
      ) as c ON l1.complexId = c.complexId
      WHERE date(l1.scrapedAt / 1000, 'unixepoch', '+9 hours') = date(${latestDate})
    `;
    
    const todayExistingCount = Number(todayExistingResult[0]?.count || 0);
    
    // summary 데이터 (이미 위에서 가져옴)
    const rawYesterday = summary[1] || { totalCount: 0, avgPricePerPyeong: 0 };
    const rawToday = summary[0]; // 반드시 존재함 (length check 통과)

    const yesterdayTotalCount = Number(rawYesterday.totalCount || 0);
    const todayTotalCount = Number(rawToday.totalCount || 0);
    const yesterdayAvgPrice = Number(rawYesterday.avgPricePerPyeong || 0);
    const todayAvgPrice = Number(rawToday.avgPricePerPyeong || 0);

    // 단순 증감 (오늘 - 어제)
    const countChange = todayTotalCount - yesterdayTotalCount; 
    
    // 순수 증가분 (기존 단지 기준 증가분, 음수면 0)
    const newLists = Math.max(0, todayExistingCount - yesterdayTotalCount);

    // 6. 신고가/신저가 (New Highs/Lows) - latestDate 기준
    const recordsResult = await prisma.$queryRaw<any[]>`
      WITH LatestDate AS (
        SELECT MAX(date(scrapedAt / 1000, 'unixepoch', '+9 hours')) as latestDate
        FROM listings
      ),
      PastStats AS (
        SELECT
          complexId,
          CAST(area / 3.3058 AS INT) as pyung,
          MIN(price) as minPrice,
          MAX(price) as maxPrice
        FROM listings, LatestDate
        WHERE tradetype = '매매'
          AND date(scrapedAt / 1000, 'unixepoch', '+9 hours') >= date(LatestDate.latestDate, '-30 days')
          AND date(scrapedAt / 1000, 'unixepoch', '+9 hours') < LatestDate.latestDate
        GROUP BY complexId, CAST(area / 3.3058 AS INT)
      ),
      LatestListings AS (
        SELECT
          complexId,
          CAST(area / 3.3058 AS INT) as pyung,
          price
        FROM listings, LatestDate
        WHERE tradetype = '매매'
          AND date(scrapedAt / 1000, 'unixepoch', '+9 hours') = LatestDate.latestDate
      )
      SELECT
        SUM(CASE WHEN t.price < CAST(p.minPrice AS INT) THEN 1 ELSE 0 END) as lowCount,
        SUM(CASE WHEN t.price > CAST(p.maxPrice AS INT) THEN 1 ELSE 0 END) as highCount
      FROM LatestListings t
      JOIN PastStats p ON t.complexId = p.complexId AND t.pyung = p.pyung
    `;
    
    const newLowCount = Number(recordsResult[0]?.lowCount || 0);
    const newHighCount = Number(recordsResult[0]?.highCount || 0);

    res.json({
      history: trendData.map(d => ({
        ...d,
        totalCount: Number(d.totalCount),
        saleCount: Number(d.saleCount),
        jeonseCount: Number(d.jeonseCount),
        rentCount: Number(d.rentCount),
        avgPricePerPyeong: Math.round(Number(d.avgPricePerPyeong))
      })),
      summary: {
        todayTotal: todayTotalCount,
        todayAvgPricePerPyeong: Math.round(todayAvgPrice),
        priceChange: Math.round(weeklyTrendRate * 100) / 100, 
        countChange: countChange,
        newCount: newLists,
        avgPrice84: Math.round(standard84Price),
        newLowCount,
        newHighCount
      }
    });
  } catch (error) {
    console.error("Stats Trend error:", error);
    res.status(500).json({ error: "Failed to fetch trend data" });
  }
});

// Get the latest scraped date in the database
router.get("/latest-date", async (req, res) => {
  try {
    const result = await prisma.$queryRaw<any[]>`
      SELECT MAX(date(scrapedAt / 1000, 'unixepoch', '+9 hours')) as latestDate
      FROM listings
    `;

    const latestDate = result[0]?.latestDate;

    if (!latestDate) {
      return res.status(404).json({ error: "No data found" });
    }

    res.json({ latestDate });
  } catch (error) {
    console.error("Latest date fetch error:", error);
    res.status(500).json({ error: "Failed to fetch latest date" });
  }
});

// Get new high/low price records (individual listings)
router.get("/records", async (req, res) => {
  try {
    const { type } = req.query;

    if (!type || (type !== 'high' && type !== 'low')) {
      return res.status(400).json({ error: "Invalid type parameter. Must be 'high' or 'low'." });
    }

    const isHigh = type === 'high';

    // Query to get individual listings that are new highs or lows
    // Split into two separate queries to avoid Prisma template literal issues
    let records;

    if (isHigh) {
      records = await prisma.$queryRaw<any[]>`
        WITH LatestDate AS (
          SELECT MAX(date(scrapedAt / 1000, 'unixepoch', '+9 hours')) as latestDate
          FROM listings
        ),
        PastStats AS (
          SELECT
            complexId,
            CAST(area / 3.3058 AS INT) as pyung,
            MAX(price) as comparePrice
          FROM listings, LatestDate
          WHERE tradetype = '매매'
            AND date(scrapedAt / 1000, 'unixepoch', '+9 hours') >= date(LatestDate.latestDate, '-30 days')
            AND date(scrapedAt / 1000, 'unixepoch', '+9 hours') < LatestDate.latestDate
          GROUP BY complexId, CAST(area / 3.3058 AS INT)
        ),
        LatestListings AS (
          SELECT
            l.id,
            l.complexId,
            c.name as complexName,
            l.tradetype,
            l.price,
            l.area,
            l.supplyArea,
            l.floor,
            l.direction,
            l.memo,
            l.url,
            l.scrapedAt,
            CAST(l.area / 3.3058 AS INT) as pyung,
            CAST(l.price / (l.area / 3.3058) AS INT) as pricePerPyeong
          FROM listings l, LatestDate
          JOIN complexes c ON l.complexId = c.id
          WHERE l.tradetype = '매매'
            AND date(l.scrapedAt / 1000, 'unixepoch', '+9 hours') = LatestDate.latestDate
        )
        SELECT t.*
        FROM LatestListings t
        JOIN PastStats p ON t.complexId = p.complexId AND t.pyung = p.pyung
        WHERE t.price > CAST(p.comparePrice AS INT)
        ORDER BY t.price DESC
      `;
    } else {
      records = await prisma.$queryRaw<any[]>`
        WITH LatestDate AS (
          SELECT MAX(date(scrapedAt / 1000, 'unixepoch', '+9 hours')) as latestDate
          FROM listings
        ),
        PastStats AS (
          SELECT
            complexId,
            CAST(area / 3.3058 AS INT) as pyung,
            MIN(price) as comparePrice
          FROM listings, LatestDate
          WHERE tradetype = '매매'
            AND date(scrapedAt / 1000, 'unixepoch', '+9 hours') >= date(LatestDate.latestDate, '-30 days')
            AND date(scrapedAt / 1000, 'unixepoch', '+9 hours') < LatestDate.latestDate
          GROUP BY complexId, CAST(area / 3.3058 AS INT)
        ),
        LatestListings AS (
          SELECT
            l.id,
            l.complexId,
            c.name as complexName,
            l.tradetype,
            l.price,
            l.area,
            l.supplyArea,
            l.floor,
            l.direction,
            l.memo,
            l.url,
            l.scrapedAt,
            CAST(l.area / 3.3058 AS INT) as pyung,
            CAST(l.price / (l.area / 3.3058) AS INT) as pricePerPyeong
          FROM listings l, LatestDate
          JOIN complexes c ON l.complexId = c.id
          WHERE l.tradetype = '매매'
            AND date(l.scrapedAt / 1000, 'unixepoch', '+9 hours') = LatestDate.latestDate
        )
        SELECT t.*
        FROM LatestListings t
        JOIN PastStats p ON t.complexId = p.complexId AND t.pyung = p.pyung
        WHERE t.price < CAST(p.comparePrice AS INT)
        ORDER BY t.price ASC
      `;
    }

    // Convert BigInt to Number for JSON serialization
    const formattedRecords = records.map(r => ({
      id: Number(r.id),
      complexId: Number(r.complexId),
      complexName: r.complexName,
      tradetype: r.tradetype,
      price: Number(r.price),
      area: Number(r.area),
      supplyArea: r.supplyArea ? Number(r.supplyArea) : null,
      floor: r.floor,
      direction: r.direction,
      memo: r.memo,
      url: r.url,
      scrapedAt: r.scrapedAt,
      pyeong: Number(r.pyung),
      pricePerPyeong: Number(r.pricePerPyeong),
    }));

    res.json({ records: formattedRecords });
  } catch (error) {
    console.error("Records fetch error:", error);
    res.status(500).json({ error: "Failed to fetch price records" });
  }
});

export default router;
