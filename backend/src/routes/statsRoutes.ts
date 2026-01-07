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
    const summary = await prisma.$queryRaw<any[]>`
      WITH DailyStats AS (
        SELECT 
          date(scrapedAt / 1000, 'unixepoch', '+9 hours') as date,
          COUNT(*) as totalCount,
          AVG(price / area) * 3.305785 as avgPricePerPyeong,
          -- 해당 날짜에 처음 등장한 매물 수 카운트 (1일차 매물 제외)
          (
            SELECT COUNT(*) 
            FROM listings l2
            WHERE date(l2.scrapedAt / 1000, 'unixepoch', '+9 hours') = date(listings.scrapedAt / 1000, 'unixepoch', '+9 hours')
            AND l2.scrapedAt = (
               SELECT MIN(l3.scrapedAt) FROM listings l3 WHERE l3.id = l2.id
            )
            -- 단, 해당 단지의 데이터 수집 이력이 최소 2일 이상이어야 함 (첫 수집일 제외 로직 필요)
            -- 여기서는 단순화하여 '오늘 등록된 신규 매물'로 간주하되, 
            -- 실제 서비스에서는 '어제 없었는데 오늘 생긴' 로직이 더 정확함.
            -- 현재 구조상 '생성일(createdAt)' 개념이 없으므로 scrapedAt으로 추정.
          ) as newCount
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

    // 변동률 및 증감 계산 (이제 모든 변수가 Number 타입이므로 안전하게 계산됩니다)
    const priceChange = yesterdayAvgPrice > 0 
      ? ((todayAvgPrice - yesterdayAvgPrice) / yesterdayAvgPrice) * 100 
      : 0;
    
    // 단순 증감 (오늘 - 어제)
    const countChange = todayTotalCount - yesterdayTotalCount; 
    
    // 순수 증가분 (기존 단지 기준 증가분, 음수면 0)
    const newLists = Math.max(0, todayExistingCount - yesterdayTotalCount);

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
        priceChange: Math.round(priceChange * 100) / 100,
        countChange: countChange,
        newCount: newLists
      }
    });
  } catch (error) {
    console.error("Stats Trend error:", error);
    res.status(500).json({ error: "Failed to fetch trend data" });
  }
});

export default router;
