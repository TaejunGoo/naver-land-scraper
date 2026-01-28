import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const complexes = [
  {
    id: 1,
    name: "래미안 강남힐즈",
    address: "서울특별시 강남구 도곡동 467-9",
    naverComplexId: "1234",
    customNotes: "역세권 프리미엄 단지",
    createdAt: "2025-12-29T00:00:00.000Z",
    updatedAt: "2026-01-28T00:00:00.000Z",
    lastScrapedAt: "2026-01-28T00:00:00.000Z",
    approvalDate: "2018.03",
    areaOptions: "84, 114, 134",
    buildings: 15,
    infoScrapedAt: "2026-01-28T00:00:00.000Z",
    type: "아파트",
    units: 1247,
    year: 2018,
    tags: "역세권,학군,대단지",
    areas: [84.95, 114.88, 134.92],
    basePrice: 170000
  },
  {
    id: 2,
    name: "아크로리버파크",
    address: "서울특별시 서초구 잠원동 40-1",
    naverComplexId: "5678",
    customNotes: "한강뷰 프리미엄",
    createdAt: "2025-12-29T00:00:00.000Z",
    updatedAt: "2026-01-28T00:00:00.000Z",
    lastScrapedAt: "2026-01-28T00:00:00.000Z",
    approvalDate: "2020.08",
    areaOptions: "84, 109, 134, 165",
    buildings: 8,
    infoScrapedAt: "2026-01-28T00:00:00.000Z",
    type: "아파트",
    units: 556,
    year: 2020,
    tags: "한강뷰,신축,브랜드",
    areas: [84.92, 109.85, 134.56, 165.32],
    basePrice: 240000
  },
  {
    id: 3,
    name: "힐스테이트 목동",
    address: "서울특별시 양천구 목동 906",
    naverComplexId: "9012",
    customNotes: "목동 학군지",
    createdAt: "2025-12-29T00:00:00.000Z",
    updatedAt: "2026-01-28T00:00:00.000Z",
    lastScrapedAt: "2026-01-27T00:00:00.000Z",
    approvalDate: "2019.05",
    areaOptions: "59, 84, 114",
    buildings: 12,
    infoScrapedAt: "2026-01-27T00:00:00.000Z",
    type: "아파트",
    units: 982,
    year: 2019,
    tags: "학군,대단지,편의시설",
    areas: [59.94, 84.98, 114.72],
    basePrice: 130000
  },
  {
    id: 4,
    name: "자이 여의도",
    address: "서울특별시 영등포구 여의도동 23-3",
    naverComplexId: "3456",
    customNotes: "업무지구 인접",
    createdAt: "2025-12-29T00:00:00.000Z",
    updatedAt: "2026-01-28T00:00:00.000Z",
    lastScrapedAt: "2026-01-28T00:00:00.000Z",
    approvalDate: "2021.11",
    areaOptions: "84, 109",
    buildings: 6,
    infoScrapedAt: "2026-01-28T00:00:00.000Z",
    type: "아파트",
    units: 428,
    year: 2021,
    tags: "신축,업무지구,교통",
    areas: [84.87, 109.92],
    basePrice: 215000
  },
  {
    id: 5,
    name: "푸르지오 월드마크",
    address: "서울특별시 송파구 가락동 79-3",
    naverComplexId: "7890",
    customNotes: "복합개발지구",
    createdAt: "2025-12-29T00:00:00.000Z",
    updatedAt: "2026-01-28T00:00:00.000Z",
    lastScrapedAt: "2026-01-27T00:00:00.000Z",
    approvalDate: "2017.09",
    areaOptions: "59, 74, 84, 114",
    buildings: 20,
    infoScrapedAt: "2026-01-27T00:00:00.000Z",
    type: "아파트",
    units: 1856,
    year: 2017,
    tags: "대단지,쇼핑몰,교통",
    areas: [59.87, 74.62, 84.91, 114.85],
    basePrice: 118000
  },
  {
    id: 6,
    name: "롯데캐슬 골드파크",
    address: "서울특별시 마포구 상암동 1654",
    naverComplexId: "2468",
    customNotes: "DMC 핵심입지",
    createdAt: "2025-12-29T00:00:00.000Z",
    updatedAt: "2026-01-28T00:00:00.000Z",
    lastScrapedAt: "2026-01-28T00:00:00.000Z",
    approvalDate: "2019.12",
    areaOptions: "84, 99, 114",
    buildings: 10,
    infoScrapedAt: "2026-01-28T00:00:00.000Z",
    type: "아파트",
    units: 724,
    year: 2019,
    tags: "신도시,교통,편의시설",
    areas: [84.76, 99.45, 114.23],
    basePrice: 152000
  },
  {
    id: 7,
    name: "e편한세상 청라호수공원",
    address: "인천광역시 서구 청라동 118",
    naverComplexId: "1357",
    customNotes: "호수공원 조망",
    createdAt: "2025-12-29T00:00:00.000Z",
    updatedAt: "2026-01-28T00:00:00.000Z",
    lastScrapedAt: "2026-01-28T00:00:00.000Z",
    approvalDate: "2020.03",
    areaOptions: "74, 84, 99, 114, 135",
    buildings: 25,
    infoScrapedAt: "2026-01-28T00:00:00.000Z",
    type: "아파트",
    units: 2145,
    year: 2020,
    tags: "대단지,호수뷰,신축",
    areas: [74.83, 84.92, 99.67, 114.56, 135.42],
    basePrice: 95000
  },
  {
    id: 8,
    name: "헬리오시티",
    address: "서울특별시 송파구 거여동 20",
    naverComplexId: "9753",
    customNotes: "초대형 단지",
    createdAt: "2025-12-29T00:00:00.000Z",
    updatedAt: "2026-01-28T00:00:00.000Z",
    lastScrapedAt: "2026-01-28T00:00:00.000Z",
    approvalDate: "2016.05",
    areaOptions: "59, 74, 84, 99, 114, 135",
    buildings: 35,
    infoScrapedAt: "2026-01-28T00:00:00.000Z",
    type: "아파트",
    units: 3556,
    year: 2016,
    tags: "초대형단지,복합,교통",
    areas: [59.92, 74.78, 84.87, 99.54, 114.67, 135.89],
    basePrice: 108000
  }
];

const tradeTypes = ['매매', '전세', '월세'];
const directions = ['남', '남동', '남서', '동', '서', '북', '북동', '북서'];

function generateListings() {
  const listings = [];
  let listingId = 1;
  const now = new Date('2026-01-28T00:00:00.000Z');

  // Generate data for 30 days
  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const scrapedDate = new Date(now);
    scrapedDate.setDate(scrapedDate.getDate() - dayOffset);

    for (const complex of complexes) {
      // Each complex gets 8-15 listings per day
      const listingsPerDay = Math.floor(Math.random() * 8) + 8;

      for (let i = 0; i < listingsPerDay; i++) {
        const tradetype = tradeTypes[Math.floor(Math.random() * tradeTypes.length)];
        const area = complex.areas[Math.floor(Math.random() * complex.areas.length)];
        const supplyArea = Math.round(area * 1.35 * 100) / 100;

        // Calculate price based on tradetype and area
        let price;
        const areaFactor = area / 84.0; // Relative to standard 84㎡

        if (tradetype === '매매') {
          // Base price adjusted by area
          const adjustedBase = complex.basePrice * areaFactor;
          // Add random variation ±15%
          const variation = (Math.random() * 0.3 - 0.15);
          // Add time-based trend (slight upward trend over 30 days)
          const trendFactor = 1 - (dayOffset / 30) * 0.05;
          price = Math.round(adjustedBase * (1 + variation) * trendFactor);
        } else if (tradetype === '전세') {
          // Jeonse typically 60-70% of sale price
          const adjustedBase = complex.basePrice * areaFactor * 0.65;
          const variation = (Math.random() * 0.2 - 0.1);
          const trendFactor = 1 - (dayOffset / 30) * 0.03;
          price = Math.round(adjustedBase * (1 + variation) * trendFactor);
        } else {
          // Monthly rent (월세보증금)
          const adjustedBase = complex.basePrice * areaFactor * 0.15;
          const variation = (Math.random() * 0.3 - 0.15);
          price = Math.round(adjustedBase * (1 + variation) / 10) * 10;
        }

        const floor = Math.floor(Math.random() * 30) + 1;
        const direction = directions[Math.floor(Math.random() * directions.length)];

        const memos = [
          '급매',
          '깨끗한 집',
          '즉시입주 가능',
          '리모델링 완료',
          '풀옵션',
          '전망 좋음',
          '주차 2대',
          '넓은 발코니',
          '남향 베란다',
          '학교 인접'
        ];
        const memo = Math.random() > 0.3 ? memos[Math.floor(Math.random() * memos.length)] : null;

        listings.push({
          id: listingId++,
          complexId: complex.id,
          price,
          area,
          supplyArea,
          floor: String(floor),
          direction,
          tradetype,
          memo,
          url: `https://land.naver.com/article/complex/${complex.naverComplexId}/${listingId}`,
          scrapedAt: scrapedDate.toISOString()
        });
      }
    }
  }

  return listings;
}

function main() {
  console.log('Generating sample data...');

  const listings = generateListings();

  const data = {
    exportedAt: new Date().toISOString(),
    complexes: complexes.map(c => {
      const { areas, basePrice, ...complexData } = c;
      return complexData;
    }),
    listings
  };

  const outputPath = path.join(__dirname, '../frontend/src/data/sample-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

  console.log(`✅ Generated ${listings.length} listings for ${complexes.length} complexes over 30 days`);
  console.log(`📁 Saved to: ${outputPath}`);
  console.log(`📊 File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
}

main();
