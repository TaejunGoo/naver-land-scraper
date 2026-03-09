/**
 * @fileoverview 네이버 부동산 API 응답 파서
 *
 * 네이버 부동산의 내부 API 응답(article 객체)을 애플리케이션의
 * ListingData 형식으로 변환합니다.
 *
 * 주요 파싱 로직:
 * - 거래유형 코드 → 한글 변환 (A1→매매, B1→전세, B2→월세)
 * - "X억 Y,YYY" 형식 가격 → 만원 단위 숫자 변환
 * - 층 정보 "15/20" → "15" 추출
 */
import { ListingData } from '../types/index.js'

/**
 * 네이버 부동산 API 응답의 개별 article 객체를 ListingData로 변환합니다.
 *
 * @param article - 네이버 API 응답의 articleList 내 개별 항목
 *                  주요 속성: tradeTypeCode, dealOrWarrantPrc, rentPrc,
 *                  floorInfo, area1(공급면적), area2(전용면적),
 *                  direction, articleFeatureDesc
 * @returns 표준화된 매물 데이터 (ListingData)
 *
 * @example
 * // 네이버 API 원본: { tradeTypeCode: "A1", dealOrWarrantPrc: "10억 5,000", ... }
 * // 변환 결과: { tradetype: "매매", price: 105000, ... }
 */
export function parseNaverArticle(article: any): ListingData {
  // ─── 1단계: 거래유형 변환 ────────────────────────────────────
  // 네이버 API의 거래유형 코드를 한글로 매핑
  // A1 = 매매 (기본값), B1 = 전세, B2 = 월세
  let tradetype = '매매'
  if (article.tradeTypeCode === 'B1') tradetype = '전세'
  else if (article.tradeTypeCode === 'B2') tradetype = '월세'

  // ─── 2단계: 가격 파싱 ────────────────────────────────────────
  // 네이버 가격 형식: "10억 5,000" → 105000 (만원 단위)
  // "억" 단위가 있으면 분리하여 계산, 없으면 직접 숫자 파싱
  let price = 0
  const priceText = article.dealOrWarrantPrc || ''
  if (priceText.includes('억')) {
    const parts = priceText.split('억')
    price = parseInt(parts[0].replace(/,/g, '')) * 10000  // 억 → 만원(×10000)
    if (parts[1]) {
      price += parseInt(parts[1].replace(/,/g, '')) || 0  // 나머지 만원 부분
    }
  } else {
    price = parseInt(priceText.replace(/,/g, '')) || 0
  }

  // 월세인 경우: 보증금(dealOrWarrantPrc) 대신 월세(rentPrc)를 가격으로 사용
  // 이를 통해 월세 매물의 가격 비교가 의미 있도록 처리
  if (tradetype === '월세' && article.rentPrc) {
    price = parseInt(article.rentPrc.replace(/,/g, '')) || 0
  }

  // ─── 3단계: 층 정보 파싱 ─────────────────────────────────────
  // 네이버 형식: "15/20" (해당층/총층) → "15"만 추출
  // "고/20" 같은 비숫자 표현도 처리
  const floorInfo = article.floorInfo || ''
  const floorMatch = floorInfo.match(/^(\d+)\//)
  
  let floor = '?'
  if (floorMatch) {
    floor = floorMatch[1]           // "15/20" → "15"
  } else if (floorInfo.includes('/')) {
    floor = floorInfo.split('/')[0] // "고/20" → "고"
  } else if (floorInfo) {
    floor = floorInfo               // 슬래시 없으면 전체 사용
  }

  // ─── 4단계: 표준 형식으로 반환 ──────────────────────────────
  return {
    price,
    area: article.area2 || 0,              // 전용면적 (m²)
    supplyArea: article.area1 || 0,        // 공급면적 (m²)
    floor,
    direction: article.direction || null,   // 향 (남향, 동향 등)
    tradetype,
    memo: article.articleFeatureDesc || null, // 매물 특징 설명
    url: null                               // 네이버 URL (현재 미수집)
  }
}
