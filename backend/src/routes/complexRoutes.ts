import { Router } from "express";
import ExcelJS from "exceljs";
import prisma from "../db.js";
import {
  scrapeNaverListings,
  scrapeComplexInfo,
} from "../scrapers/naverScraper.js";
import {
  getTodayKSTRange,
  getYesterdayKSTRange,
} from "../utils/index.js";
import {
  calculateListingCounts,
  calculateListingStats,
} from "../utils/index.js";

const router = Router();

// Get all complexes
router.get("/", async (req, res) => {
  try {
    const complexes = await prisma.complex.findMany({
      orderBy: { createdAt: "desc" },
    });

    // 각 단지의 최근일 매물 수 계산 (유형별)
    const complexesWithCount = await Promise.all(
      complexes.map(async (complex: any) => {
        // 해당 단지의 최근 2개 수집일 찾기
        const complexDatesResult = await prisma.$queryRaw<any[]>`
          SELECT DISTINCT date(scrapedAt / 1000, 'unixepoch', '+9 hours') as date
          FROM listings
          WHERE complexId = ${complex.id}
          ORDER BY date DESC
          LIMIT 2
        `;

        const complexLatestDate = complexDatesResult[0]?.date;
        const complexYesterdayDate = complexDatesResult[1]?.date;

        // 최근일 데이터 조회
        const todayCountsDataRaw = complexLatestDate ? await prisma.$queryRaw<any[]>`
          SELECT tradetype, COUNT(*) as _count
          FROM listings
          WHERE complexId = ${complex.id}
            AND date(scrapedAt / 1000, 'unixepoch', '+9 hours') = date(${complexLatestDate})
          GROUP BY tradetype
        ` : [];

        // 직전일 데이터 조회 (증감 계산용)
        const yesterdayCountsDataRaw = complexYesterdayDate ? await prisma.$queryRaw<any[]>`
          SELECT tradetype, COUNT(*) as _count
          FROM listings
          WHERE complexId = ${complex.id}
            AND date(scrapedAt / 1000, 'unixepoch', '+9 hours') = date(${complexYesterdayDate})
          GROUP BY tradetype
        ` : [];

        // BigInt to Number 변환
        const todayCountsData = todayCountsDataRaw.map(item => ({
          tradetype: item.tradetype,
          _count: Number(item._count)
        }));
        const yesterdayCountsData = yesterdayCountsDataRaw.map(item => ({
          tradetype: item.tradetype,
          _count: Number(item._count)
        }));

        // Calculate stats using utility
        const stats = calculateListingStats(
          todayCountsData,
          yesterdayCountsData
        );
        const counts = stats.today;
        const yesterdayCounts = stats.yesterday;
        const diff = stats.diff;

        // 데이터 수집 일수 계산 (KST 기준 중복 날짜 제외)
        const dateResult = await prisma.$queryRaw<any[]>`
          SELECT COUNT(DISTINCT date(scrapedAt / 1000, 'unixepoch', '+9 hours')) as data_count
          FROM listings
          WHERE complexId = ${complex.id}
        `;
        const dataDaysCount = dateResult[0]?.data_count ? Number(dateResult[0].data_count) : 0;

        // 신고가/신저가 개수 계산 (매매 기준, 최근 30일)
        // Use latest scraped date instead of 'now' to handle historical data
        const recordsResult = await prisma.$queryRaw<any[]>`
          WITH PastStats AS (
            SELECT
              CAST(area / 3.3058 AS INT) as pyung,
              MIN(price) as minPrice,
              MAX(price) as maxPrice
            FROM listings
            WHERE complexId = ${complex.id}
              AND tradetype = '매매'
              AND date(scrapedAt / 1000, 'unixepoch', '+9 hours') >= date((
                SELECT MAX(date(scrapedAt / 1000, 'unixepoch', '+9 hours'))
                FROM listings
                WHERE complexId = ${complex.id}
              ), '-30 days')
              AND date(scrapedAt / 1000, 'unixepoch', '+9 hours') < (
                SELECT MAX(date(scrapedAt / 1000, 'unixepoch', '+9 hours'))
                FROM listings
                WHERE complexId = ${complex.id}
              )
            GROUP BY CAST(area / 3.3058 AS INT)
          ),
          LatestListings AS (
            SELECT
              CAST(area / 3.3058 AS INT) as pyung,
              price
            FROM listings
            WHERE complexId = ${complex.id}
              AND tradetype = '매매'
              AND date(scrapedAt / 1000, 'unixepoch', '+9 hours') = (
                SELECT MAX(date(scrapedAt / 1000, 'unixepoch', '+9 hours'))
                FROM listings
                WHERE complexId = ${complex.id}
              )
          )
          SELECT
            SUM(CASE WHEN t.price < CAST(p.minPrice AS INT) THEN 1 ELSE 0 END) as lowCount,
            SUM(CASE WHEN t.price > CAST(p.maxPrice AS INT) THEN 1 ELSE 0 END) as highCount
          FROM LatestListings t
          JOIN PastStats p ON t.pyung = p.pyung
        `;

        const newLowCount = Number(recordsResult[0]?.lowCount || 0);
        const newHighCount = Number(recordsResult[0]?.highCount || 0);

        return {
          ...complex,
          todayListingCount: counts.total,
          todayListingCounts: counts,
          listingStats: { // [추가] 통계 필드
            today: counts,
            yesterday: yesterdayCounts,
            diff: diff
          },
          dataDaysCount,
          recordCounts: {
            newHighCount,
            newLowCount,
          },
        };
      })
    );

    res.json(complexesWithCount);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch complexes" });
  }
});

// Export all complexes to Excel
router.get("/export/excel", async (req, res) => {
  try {
    const complexes = await prisma.complex.findMany({
      orderBy: { createdAt: "desc" },
    });

    // KST 오늘 기준 계산 (매물 수 체크용)
    const now = new Date();
    const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const todayKST = new Date(
      Date.UTC(
        kstNow.getUTCFullYear(),
        kstNow.getUTCMonth(),
        kstNow.getUTCDate()
      )
    );
    const startTime = new Date(todayKST.getTime() - 9 * 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("전체 단지 목록");

    worksheet.columns = [
      { header: "ID", key: "id", width: 5 },
      { header: "이름", key: "name", width: 20 },
      { header: "주소", key: "address", width: 40 },
      { header: "네이버 ID", key: "naverComplexId", width: 15 },
      { header: "유형", key: "type", width: 10 },
      { header: "세대수", key: "units", width: 10 },
      { header: "동수", key: "buildings", width: 10 },
      { header: "준공연도", key: "year", width: 10 },
      { header: "오늘 매매", key: "sale", width: 10 },
      { header: "오늘 전세", key: "jeonse", width: 10 },
      { header: "오늘 월세", key: "rent", width: 10 },
      { header: "태그", key: "tags", width: 30 },
      { header: "비고", key: "customNotes", width: 30 },
    ];

    // 헤더 스타일링
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = {
      vertical: "middle",
      horizontal: "center",
    };

    for (const complex of complexes) {
      const todayCounts = await prisma.listing.groupBy({
        by: ["tradetype"],
        where: {
          complexId: complex.id,
          scrapedAt: {
            gte: startTime,
            lt: endTime,
          },
        },
        _count: true,
      });

      const counts = { sale: 0, jeonse: 0, rent: 0 };
      todayCounts.forEach((item: any) => {
        if (item.tradetype === "매매") counts.sale = item._count;
        else if (item.tradetype === "전세") counts.jeonse = item._count;
        else if (item.tradetype === "월세") counts.rent = item._count;
      });

      let tagList = "";
      try {
        if (complex.tags) {
          const parsed = JSON.parse(complex.tags);
          tagList = Array.isArray(parsed) ? parsed.join(", ") : complex.tags;
        }
      } catch (e) {
        tagList = complex.tags || "";
      }

      worksheet.addRow({
        id: complex.id,
        name: complex.name,
        address: complex.address,
        naverComplexId: complex.naverComplexId,
        type: complex.type,
        units: complex.units,
        buildings: complex.buildings,
        year: complex.year,
        sale: counts.sale,
        jeonse: counts.jeonse,
        rent: counts.rent,
        tags: tagList,
        customNotes: complex.customNotes,
      });
    }

    // 두 번째 시트: 모든 매물 통합 목록
    const listingSheet = workbook.addWorksheet("전체 매물 통합");
    const allListings = await prisma.listing.findMany({
      include: { complex: true },
      orderBy: [{ complexId: "asc" }, { scrapedAt: "desc" }],
    });

    listingSheet.columns = [
      { header: "단지명", key: "complexName", width: 20 },
      { header: "거래유형", key: "tradetype", width: 10 },
      { header: "가격(만원)", key: "price", width: 12 },
      { header: "공급면적", key: "supplyArea", width: 10 },
      { header: "전용면적", key: "area", width: 10 },
      { header: "층", key: "floor", width: 8 },
      { header: "향", key: "direction", width: 10 },
      { header: "메모", key: "memo", width: 40 },
      { header: "URL", key: "url", width: 40 },
      { header: "수집일시", key: "scrapedAt", width: 25 },
    ];

    listingSheet.getRow(1).font = { bold: true };
    listingSheet.getRow(1).alignment = { horizontal: "center" };

    allListings.forEach((listing) => {
      listingSheet.addRow({
        complexName: listing.complex.name,
        tradetype: listing.tradetype,
        price: listing.price,
        supplyArea: listing.supplyArea,
        area: listing.area,
        floor: listing.floor,
        direction: listing.direction || "",
        memo: listing.memo || "",
        url: listing.url || "",
        scrapedAt: listing.scrapedAt.toISOString(),
      });
    });

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" +
        encodeURIComponent(
          `전체_데이터_추출_${now.toISOString().split("T")[0]}.xlsx`
        )
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Export all error:", error);
    res.status(500).json({ error: "Failed to export complexes" });
  }
});

// Get complex by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const complex = await prisma.complex.findUnique({
      where: { id: Number(id) },
    });

    if (!complex) {
      return res.status(404).json({ error: "Complex not found" });
    }

    // 데이터 수집 일수 추가 (KST 기준)
    const dateResult = await prisma.$queryRaw<any[]>`
      SELECT COUNT(DISTINCT date(scrapedAt / 1000, 'unixepoch', '+9 hours')) as data_count 
      FROM listings 
      WHERE complexId = ${Number(id)}
    `;
    const dataDaysCount = dateResult[0]?.data_count ? Number(dateResult[0].data_count) : 0;

    // 해당 단지의 최근 2개 수집일 찾기 (이전 '수집일' 기준으로 증감 계산)
    const datesResult = await prisma.$queryRaw<any[]>`
      SELECT DISTINCT date(scrapedAt / 1000, 'unixepoch', '+9 hours') as date
      FROM listings
      WHERE complexId = ${Number(id)}
      ORDER BY date DESC
      LIMIT 2
    `;
    const latestDate = datesResult[0]?.date;
    const previousDate = datesResult[1]?.date;

    const todayCountsDataRaw = latestDate ? await prisma.$queryRaw<any[]>`
      SELECT tradetype, COUNT(*) as _count
      FROM listings
      WHERE complexId = ${Number(id)}
        AND date(scrapedAt / 1000, 'unixepoch', '+9 hours') = date(${latestDate})
      GROUP BY tradetype
    ` : [];

    // 이전 수집일 데이터 조회 (증감 계산용)
    const yesterdayCountsDataRaw = previousDate ? await prisma.$queryRaw<any[]>`
      SELECT tradetype, COUNT(*) as _count
      FROM listings
      WHERE complexId = ${Number(id)}
        AND date(scrapedAt / 1000, 'unixepoch', '+9 hours') = date(${previousDate})
      GROUP BY tradetype
    ` : [];

    // BigInt to Number 변환
    const todayCountsData = todayCountsDataRaw.map(item => ({
      tradetype: item.tradetype,
      _count: Number(item._count)
    }));
    const yesterdayCountsData = yesterdayCountsDataRaw.map(item => ({
      tradetype: item.tradetype,
      _count: Number(item._count)
    }));

    // Calculate stats using utility
    const listingStats = calculateListingStats(
      todayCountsData,
      yesterdayCountsData
    );

    res.json({
      ...complex,
      dataDaysCount,
      todayListingCount: listingStats.today.total,
      todayListingCounts: listingStats.today,
      listingStats,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch complex" });
  }
});

// Export specific complex listings to Excel
router.get("/:id/export/excel", async (req, res) => {
  try {
    const { id } = req.params;
    const complexId = Number(id);

    const complex = await prisma.complex.findUnique({
      where: { id: complexId },
    });

    if (!complex) {
      return res.status(404).json({ error: "Complex not found" });
    }

    const listings = await prisma.listing.findMany({
      where: { complexId },
      orderBy: { scrapedAt: "desc" },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(
      complex.name.substring(0, 31) || "매물목록"
    );

    // 단지 기본 정보 요약 (맨 위에 몇 줄 추가)
    worksheet.addRow([`단지명: ${complex.name}`]);
    worksheet.addRow([`주소: ${complex.address}`]);
    worksheet.addRow([`네이버 ID: ${complex.naverComplexId || "-"}`]);
    worksheet.addRow([]); // 빈 줄

    // 매물 목록 헤더
    const headerRow = worksheet.addRow([
      "거래유형",
      "가격(만원)",
      "공급면적",
      "전용면적",
      "층",
      "향",
      "메모",
      "URL",
      "수집일시",
    ]);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: "center" };

    // 데이터 추가
    listings.forEach((listing) => {
      worksheet.addRow([
        listing.tradetype,
        listing.price,
        listing.supplyArea,
        listing.area,
        listing.floor,
        listing.direction || "",
        listing.memo || "",
        listing.url || "",
        listing.scrapedAt.toISOString(),
      ]);
    });

    // 열 너비 설정
    worksheet.columns.forEach((column, i) => {
      if (i === 6 || i === 7) column.width = 40; // 메모, URL
      else if (i === 8) column.width = 25; // 수집일시
      else column.width = 12;
    });

    const filename = `${complex.name}_매물목록_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + encodeURIComponent(filename)
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Export complex error:", error);
    res.status(500).json({ error: "Failed to export listing data" });
  }
});

// Create complex
router.post("/", async (req, res) => {
  try {
    const { name, address, naverComplexId, customNotes, tags } = req.body;

    const complex = await prisma.complex.create({
      data: {
        name,
        address,
        naverComplexId: naverComplexId || null,
        customNotes: customNotes || null,
        tags: tags ? JSON.stringify(tags) : null,
      },
    });

    res.json(complex);
  } catch (error) {
    res.status(500).json({ error: "Failed to create complex" });
  }
});

// Update complex
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, naverComplexId, customNotes, tags } = req.body;

    const complex = await prisma.complex.update({
      where: { id: Number(id) },
      data: {
        name,
        address,
        naverComplexId: naverComplexId || null,
        customNotes: customNotes || null,
        tags: tags ? JSON.stringify(tags) : undefined,
      },
    });

    res.json(complex);
  } catch (error) {
    res.status(500).json({ error: "Failed to update complex" });
  }
});

// Delete complex
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.complex.delete({
      where: { id: Number(id) },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete complex" });
  }
});

// Scrape listings for complex
router.post("/:id/scrape", async (req, res) => {
  try {
    const { id } = req.params;
    const complexId = Number(id);
    const complex = await prisma.complex.findUnique({
      where: { id: complexId },
    });

    if (!complex || !complex.naverComplexId) {
      return res
        .status(400)
        .json({ error: "Complex not found or missing Naver ID" });
    }

    // Get KST date range using utility
    const { startTime, endTime } = getTodayKSTRange();

    await prisma.listing.deleteMany({
      where: {
        complexId: complexId,
        scrapedAt: {
          gte: startTime,
          lt: endTime,
        },
      },
    });

    console.log(`${complex.name}의 당일 데이터 삭제 완료`);

    const startTimeScrape = Date.now();
    const scraperResults = await scrapeNaverListings(complex.naverComplexId);
    const duration = ((Date.now() - startTimeScrape) / 1000).toFixed(1);
    const scrapeTimestamp = new Date(); // 모든 매물에 동일한 수집 시각 부여

    // Save new listings to database using Bulk Insert (createMany)
    if (scraperResults.length > 0) {
      await prisma.listing.createMany({
        data: scraperResults.map((l) => ({
          complexId: complexId,
          ...l,
          scrapedAt: scrapeTimestamp,
        })),
      });
    }

    // Update lastScrapedAt
    await prisma.complex.update({
      where: { id: complexId },
      data: { lastScrapedAt: new Date() },
    });

    console.log(
      `${complex.name}: ${scraperResults.length}개 매물 저장 완료 (소요시간: ${duration}초)`
    );
    res.json({
      success: true,
      count: scraperResults.length,
      total: scraperResults.length,
    });
  } catch (error) {
    console.error("Scraping error:", error);
    res.status(500).json({ error: "Failed to scrape listings" });
  }
});

// Scrape complex info
router.post("/:id/scrape-info", async (req, res) => {
  try {
    const { id } = req.params;
    const complexId = Number(id);
    const complex = await prisma.complex.findUnique({
      where: { id: complexId },
    });

    if (!complex || !complex.naverComplexId) {
      return res
        .status(400)
        .json({ error: "Complex not found or missing Naver ID" });
    }

    const complexInfo = await scrapeComplexInfo(complex.naverComplexId);

    // Update complex info
    const updated = await prisma.complex.update({
      where: { id: complexId },
      data: {
        type: complexInfo.type || null,
        units: complexInfo.units || null,
        buildings: complexInfo.buildings || null,
        year: complexInfo.year || null,
        areaOptions: complexInfo.areaOptions
          ? JSON.stringify(complexInfo.areaOptions)
          : null,
        approvalDate: complexInfo.approvalDate || null,
        infoScrapedAt: new Date(),
      },
    });

    console.log(`${complex.name}의 단지 정보 저장 완료`);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Complex info scraping error:", error);
    res.status(500).json({ error: "Failed to scrape complex info" });
  }
});

// Scrape all complexes' listings
router.post("/scrape-all/listings", async (req, res) => {
  const globalStartTime = Date.now();
  try {
    const complexes = await prisma.complex.findMany({
      where: {
        naverComplexId: { not: null },
      },
    });

    if (complexes.length === 0) {
      return res
        .status(400)
        .json({ error: "No complexes with Naver ID found" });
    }

    const results = [];
    const CONCURRENCY = 2; // 로컬 환경 부하를 고려하여 2개씩 병렬 처리

    for (let i = 0; i < complexes.length; i += CONCURRENCY) {
      const batch = complexes.slice(i, i + CONCURRENCY);
      console.log(
        `\n>>> 배치 실행 (${i + 1}~${Math.min(
          i + CONCURRENCY,
          complexes.length
        )} / 총 ${complexes.length}개)`
      );

      const batchPromises = batch.map(async (complex) => {
        const scrapeStart = Date.now();
        try {
          console.log(`[시작] ${complex.name}`);

          // Get KST date range using utility
          const { startTime: dbStartTime, endTime } = getTodayKSTRange();

          await prisma.listing.deleteMany({
            where: {
              complexId: complex.id,
              scrapedAt: {
                gte: dbStartTime,
                lt: endTime,
              },
            },
          });

          const listings = await scrapeNaverListings(complex.naverComplexId!);
          const scrapeTimestamp = new Date();

          // Save new listings using Bulk Insert
          if (listings.length > 0) {
            await prisma.listing.createMany({
              data: listings.map((l) => ({
                complexId: complex.id,
                ...l,
                scrapedAt: scrapeTimestamp,
              })),
            });
          }

          // Update lastScrapedAt
          await prisma.complex.update({
            where: { id: complex.id },
            data: { lastScrapedAt: new Date() },
          });

          const duration = ((Date.now() - scrapeStart) / 1000).toFixed(1);
          console.log(
            `[완료] ${complex.name}: ${listings.length}개 저장 (${duration}초)`
          );

          return {
            complexId: complex.id,
            complexName: complex.name,
            count: listings.length,
            total: listings.length,
            success: true,
            duration,
          };
        } catch (error) {
          console.error(`[실패] ${complex.name}:`, error);
          return {
            complexId: complex.id,
            complexName: complex.name,
            count: 0,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    const totalDuration = ((Date.now() - globalStartTime) / 1000).toFixed(1);
    const totalCount = results.reduce((sum, r) => sum + r.count, 0);
    const successCount = results.filter((r) => r.success).length;

    console.log(`\n==========================================`);
    console.log(`전체 크롤링 완료!`);
    console.log(`- 총 단지: ${complexes.length}개 (성공: ${successCount})`);
    console.log(`- 총 매물: ${totalCount}개`);
    console.log(`- 전체 소요 시간: ${totalDuration}초`);
    console.log(`==========================================\n`);

    res.json({
      success: true,
      totalComplexes: complexes.length,
      successComplexes: successCount,
      totalListings: totalCount,
      totalDuration,
      results,
    });
  } catch (error) {
    console.error("Scrape all error:", error);
    res.status(500).json({ error: "Failed to scrape all listings" });
  }
});

// Create test complex with dummy data
router.post("/create-test-complex", async (req, res) => {
  try {
    const { days = 365 } = req.body;

    // Create test complex
    const complex = await prisma.complex.create({
      data: {
        name: "테스트 아파트",
        address: "서울시 강남구 테스트동",
        naverComplexId: null,
        customNotes: "그래프 테스트용 더미 데이터 단지입니다.",
        type: "아파트",
        units: 500,
        buildings: 10,
        year: 2010,
        areaOptions: JSON.stringify([
          "59㎡",
          "84㎡",
          "104㎡",
          "114㎡",
          "135㎡",
        ]),
        approvalDate: "2020.01",
        infoScrapedAt: new Date(),
      },
    });

    // Generate dummy listings
    const areaOptions = ["59㎡", "84㎡", "104㎡", "114㎡", "135㎡"];
    const tradeTypes = ["매매", "전세", "월세"];
    const listings = [];
    const now = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      // 매일 5~12개의 매물 생성
      const listingsPerDay = Math.floor(Math.random() * 8) + 5;

      for (let j = 0; j < listingsPerDay; j++) {
        const tradetype =
          tradeTypes[Math.floor(Math.random() * tradeTypes.length)];
        const areaStr =
          areaOptions[Math.floor(Math.random() * areaOptions.length)];
        const area = parseFloat(areaStr.match(/[\d.]+/)?.[0] || "84");

        // 매매만 생성 (현실적인 가격 범위)
        let price;
        if (tradetype === "매매") {
          // 5억 ~ 15억 사이 (50000 ~ 150000)
          // 면적에 따라 기본 가격 차이
          const basePrice = 50000 + (area - 59) * 800; // 59㎡: 5억, 135㎡: 11억 정도
          // ±30% 랜덤 변동
          const variation = Math.random() * 0.6 - 0.3;
          price = Math.floor(basePrice + basePrice * variation);

          // 최소 5억, 최대 15억으로 제한
          price = Math.max(50000, Math.min(150000, price));
        } else if (tradetype === "전세") {
          // 전세: 3억 ~ 10억
          const basePrice = 30000 + (area - 59) * 500;
          const variation = Math.random() * 0.6 - 0.3;
          price = Math.floor(basePrice + basePrice * variation);
          price = Math.max(30000, Math.min(100000, price));
        } else {
          // 월세: 500 ~ 3000만원
          const basePrice = 500 + (area - 59) * 20;
          const variation = Math.random() * 0.6 - 0.3;
          price = Math.floor(basePrice + basePrice * variation);
          price = Math.max(500, Math.min(3000, price));
        }

        // 시간에 따른 가격 트렌드 (점진적 상승)
        const trendFactor = 1 + (i / days) * 0.2; // 20% 변동
        price = Math.floor(price / trendFactor);

        // 랜덤한 주간 변동 추가
        const weeklyNoise = Math.random() * 0.1 - 0.05;
        price = Math.floor(price * (1 + weeklyNoise));

        // Random floor (1-30)
        const floor = Math.floor(Math.random() * 30) + 1;

        // Random direction
        const directions = [
          "남",
          "남동",
          "남서",
          "동",
          "서",
          "북",
          "북동",
          "북서",
        ];
        const direction =
          directions[Math.floor(Math.random() * directions.length)];

        listings.push({
          complexId: complex.id,
          price,
          area,
          supplyArea: Math.round(area * 1.25),
          floor: String(floor),
          direction,
          tradetype,
          memo: `테스트 매물 ${areaStr} ${tradetype}`,
          url: `https://test.example.com/${complex.id}/${j}`,
          scrapedAt: date,
        });
      }
    }

    // Insert all dummy listings
    await prisma.listing.createMany({
      data: listings,
    });

    console.log(`Created test complex with ${listings.length} dummy listings`);
    res.json({
      success: true,
      complexId: complex.id,
      count: listings.length,
      days,
      message: `테스트 단지가 생성되었습니다. ${days}일간 ${listings.length}개의 더미 데이터가 포함되어 있습니다.`,
    });
  } catch (error) {
    console.error("Error creating test complex:", error);
    res.status(500).json({ error: "Failed to create test complex" });
  }
});

export default router;
