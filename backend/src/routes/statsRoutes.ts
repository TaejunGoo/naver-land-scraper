import { Router } from "express";
import prisma from "../db.js";

const router = Router();

// Get overall trend data for the dashboard and trend page
router.get("/trend", async (req, res) => {
  try {
    const days = Number(req.query.days) || 30; // Default to 30 days
    
    // 기간별 데이터 조회 (KST 기준)
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

    // 오늘과 어제의 데이터 비교를 위한 요약 정보 (전체 시장 요약)
    // 수정: 평단가 단순 평균이 아닌, "단지별 변동률의 평균" (Weekly Trend) 및 "국평(84㎡) 평균가" 알고리즘 적용

    // 1. 단지별 변동률 (Weekly Trend: 7일 전 대비)
    // 단지별로 (오늘평단가 - 7일전평단가) / 7일전평단가 를 구한 뒤, 이를 전체 단지에 대해 평균냄.
    // 매매(tradetype = '매매') 기준.
    const weeklyTrendResult = await prisma.$queryRaw<any[]>`
      WITH TodayComplex AS (
        SELECT complexId, AVG(CAST(price AS FLOAT) / CAST(area AS FLOAT)) as avgPrice
        FROM listings
        WHERE date(scrapedAt / 1000, 'unixepoch', '+9 hours') = date('now', '+9 hours')
        AND tradetype = '매매'
        GROUP BY complexId
      ),
      LastWeekComplex AS (
        SELECT complexId, AVG(CAST(price AS FLOAT) / CAST(area AS FLOAT)) as avgPrice
        FROM listings
        WHERE date(scrapedAt / 1000, 'unixepoch', '+9 hours') = date('now', '+9 hours', '-7 days')
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

    // 2. 국평(84㎡) 평균가 (전용 84~85㎡ 사이 매물의 평균 가격)
    const standard84Result = await prisma.$queryRaw<any[]>`
      SELECT AVG(CAST(price AS FLOAT)) as avgPrice
      FROM listings
      WHERE date(scrapedAt / 1000, 'unixepoch', '+9 hours') = date('now', '+9 hours')
      AND tradetype = '매매'
      AND area >= 84 AND area < 85
    `;
    const standard84Price = Number(standard84Result[0]?.avgPrice || 0);

    // 3. 기본 통계 (총 매물 수 등) - 기존 로직 유지하되, 전체 평단가는 참고용으로 둠
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

    // 신규 매물 (어제 데이터 집합에 없고 오늘 데이터 집합에 있는 url/id)
    // SQL로 복잡하게 짜기보다는, 오늘과 어제의 매물 ID 리스트를 가져와서 JS로 계산하는 것이 빠름
    // 단, 여기서는 대시보드 성능을 위해 단순 카운트 비교로 대체하거나, 별도 쿼리로 분리
    
    // [단순화된 신규 매물 로직]
    // "어제에 비해 매물 수가 얼마나 늘었는지"를 표시 (단, 오늘 처음 수집된 단지는 제외)
    // 1. 오늘 수집된 전체 매물 중, 수집 이력이 어제 이전인 단지의 매물 수만 집계 (Today Existing Count)
    // 2. (Today Existing Count) - (Yesterday Total Count) 가 양수면 그 차이를 신규 유입으로 간주
    const todayExistingResult = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count
      FROM listings as l1
      JOIN (
          SELECT complexId 
          FROM listings 
          GROUP BY complexId 
          HAVING MIN(date(scrapedAt / 1000, 'unixepoch', '+9 hours')) < date('now', '+9 hours')
      ) as c ON l1.complexId = c.complexId
      WHERE date(l1.scrapedAt / 1000, 'unixepoch', '+9 hours') = date('now', '+9 hours')
    `;
    
    const todayExistingCount = Number(todayExistingResult[0]?.count || 0);
    
    // summary 배열의 원소들도 BigInt를 포함하고 있으므로, 사용 전 Number로 변환합니다.
    const rawYesterday = summary[1] || { totalCount: 0, avgPricePerPyeong: 0 };
    const rawToday = summary[0] || { totalCount: 0, avgPricePerPyeong: 0 };

    const yesterdayTotalCount = Number(rawYesterday.totalCount || 0);
    const todayTotalCount = Number(rawToday.totalCount || 0);
    const yesterdayAvgPrice = Number(rawYesterday.avgPricePerPyeong || 0);
    const todayAvgPrice = Number(rawToday.avgPricePerPyeong || 0);

    // 기존 priceChange 로직을 weeklyTrendRate로 대체 (혹은 별도 필드로 전달)
    // 여기서는 기존 'priceChange' 필드에 weeklyTrendRate를 담아서 보내면 프론트엔드 수정 없이 "변동률" 자리에 주간 변동률이 표시됨.
    // 하지만 "어제 대비" -> "주간 추세"로 의미가 바뀌므로 프론트엔드 라벨도 바꿔야 함.
    // 일단 API 응답에는 명시적인 필드를 추가하고, priceChange는 기존대로 두거나(어제대비), 덮어쓰거나 선택.
    // 사용자가 "판단 척도를 바꾸자"고 했으므로, DashboardSummary에서 보여주는 메인 지표를 이것으로 교체하는 것이 맞음.
    
    // 단순 증감 (오늘 - 어제)
    const countChange = todayTotalCount - yesterdayTotalCount; 
    
    // 순수 증가분 (기존 단지 기준 증가분, 음수면 0)
    const newLists = Math.max(0, todayExistingCount - yesterdayTotalCount);

    // 4. 신고가/신저가 (New Highs/Lows) - 매매 기준, 최근 30일
    // "오늘 등록된 매매 매물" 중, 같은 단지 & 같은 평형대(평 단위 반올림)에서
    // 지난 30일(오늘 제외) 동안의 최저가보다 더 싸거나(신저가), 최고가보다 더 비싼(신고가) 건수
    const recordsResult = await prisma.$queryRaw<any[]>`
      WITH PastStats AS (
        SELECT 
          complexId, 
          CAST(area / 3.3058 AS INT) as pyung,
          MIN(price) as minPrice,
          MAX(price) as maxPrice
        FROM listings
        WHERE tradetype = '매매' 
          AND date(scrapedAt / 1000, 'unixepoch', '+9 hours') >= date('now', '+9 hours', '-30 days')
          AND date(scrapedAt / 1000, 'unixepoch', '+9 hours') < date('now', '+9 hours')
        GROUP BY complexId, CAST(area / 3.3058 AS INT)
      ),
      TodayListings AS (
        SELECT 
          complexId,
          CAST(area / 3.3058 AS INT) as pyung,
          price
        FROM listings
        WHERE tradetype = '매매'
          AND date(scrapedAt / 1000, 'unixepoch', '+9 hours') = date('now', '+9 hours')
      )
      SELECT 
        SUM(CASE WHEN t.price < p.minPrice THEN 1 ELSE 0 END) as lowCount,
        SUM(CASE WHEN t.price > p.maxPrice THEN 1 ELSE 0 END) as highCount
      FROM TodayListings t
      JOIN PastStats p ON t.complexId = p.complexId AND t.pyung = p.pyung
    `;
    
    // 안전하게 Number 변환
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
        todayAvgPricePerPyeong: Math.round(todayAvgPrice), // 전체 평균도 여전히 보여줄 수 있음
        // priceChange 필드에 "주간 단지별 변동률 평균"을 할당하여 메인 지표로 사용하게 함
        priceChange: Math.round(weeklyTrendRate * 100) / 100, 
        countChange: countChange,
        newCount: newLists,
        // 추가 정보
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
        WITH PastStats AS (
          SELECT
            complexId,
            CAST(area / 3.3058 AS INT) as pyung,
            MAX(price) as comparePrice
          FROM listings
          WHERE tradetype = '매매'
            AND date(scrapedAt / 1000, 'unixepoch', '+9 hours') >= date('now', '+9 hours', '-30 days')
            AND date(scrapedAt / 1000, 'unixepoch', '+9 hours') < date('now', '+9 hours')
          GROUP BY complexId, CAST(area / 3.3058 AS INT)
        ),
        TodayListings AS (
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
          FROM listings l
          JOIN complexes c ON l.complexId = c.id
          WHERE l.tradetype = '매매'
            AND date(l.scrapedAt / 1000, 'unixepoch', '+9 hours') = date('now', '+9 hours')
        )
        SELECT t.*
        FROM TodayListings t
        JOIN PastStats p ON t.complexId = p.complexId AND t.pyung = p.pyung
        WHERE t.price > p.comparePrice
        ORDER BY t.price DESC
      `;
    } else {
      records = await prisma.$queryRaw<any[]>`
        WITH PastStats AS (
          SELECT
            complexId,
            CAST(area / 3.3058 AS INT) as pyung,
            MIN(price) as comparePrice
          FROM listings
          WHERE tradetype = '매매'
            AND date(scrapedAt / 1000, 'unixepoch', '+9 hours') >= date('now', '+9 hours', '-30 days')
            AND date(scrapedAt / 1000, 'unixepoch', '+9 hours') < date('now', '+9 hours')
          GROUP BY complexId, CAST(area / 3.3058 AS INT)
        ),
        TodayListings AS (
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
          FROM listings l
          JOIN complexes c ON l.complexId = c.id
          WHERE l.tradetype = '매매'
            AND date(l.scrapedAt / 1000, 'unixepoch', '+9 hours') = date('now', '+9 hours')
        )
        SELECT t.*
        FROM TodayListings t
        JOIN PastStats p ON t.complexId = p.complexId AND t.pyung = p.pyung
        WHERE t.price < p.comparePrice
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
