import sampleData from '../data/sample-data.json';

// Demo mode: Calculate the latest scraped date from sample data
const getLatestDateFromSampleData = (): string => {
  const dates = sampleData.listings.map((l: any) =>
    new Date(l.scrapedAt).toISOString().split('T')[0]
  );
  return dates.sort().reverse()[0] || formatDateKST(new Date());
};

// Cache the latest date for demo mode
const DEMO_REFERENCE_DATE = getLatestDateFromSampleData();

/**
 * 가격을 "X억 X,XXX만원" 형식으로 포맷팅
 * @param priceInManwon - 만원 단위 가격
 */
export function formatPrice(priceInManwon: number): string {
  const billion = Math.floor(priceInManwon / 10000)
  const remainder = priceInManwon % 10000
  
  if (billion > 0 && remainder > 0) {
    return `${billion}억 ${remainder.toLocaleString()}만원`
  } else if (billion > 0) {
    return `${billion}억`
  } else {
    return `${remainder.toLocaleString()}만원`
  }
}

/**
 * 제곱미터를 평으로 변환
 * @param sqm - 제곱미터
 */
export function sqmToPyeong(sqm: number): number {
  return Math.round(sqm / 3.3058 * 10) / 10
}

/**
 * 면적을 "계약면적/전용면적㎡ (평/평)" 형식으로 포맷팅
 * @param supplyArea - 계약면적(공급면적)
 * @param exclusiveArea - 전용면적
 */
export function formatArea(supplyArea: number | null, exclusiveArea: number): string {
  if (supplyArea && supplyArea > 0) {
    const supplyPyeong = sqmToPyeong(supplyArea)
    const exclusivePyeong = sqmToPyeong(exclusiveArea)
    return `${supplyArea}/${exclusiveArea}㎡ (${supplyPyeong}평/${exclusivePyeong}평)`
  } else {
    const pyeong = sqmToPyeong(exclusiveArea)
    return `${exclusiveArea}㎡ (${pyeong}평)`
  }
}

/**
 * Date 객체나 날짜 문자열을 KST(UTC+9) 기준 "YYYY-MM-DD" 문자열로 변환
 */
export function formatDateKST(date: Date | string | number): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  // UTC 시간에 9시간(KST 오프셋)을 더한 시각을 생성
  const kstTime = d.getTime() + (9 * 60 * 60 * 1000);
  const kstDate = new Date(kstTime);
  
  // ISO 문자열에서 날짜 부분(YYYY-MM-DD)만 추출
  // 주의: toISOString()은 항상 UTC 기준이므로, 위에서 9시간을 더한 시점이
  // KST의 '현재 날짜'가 됩니다.
  return kstDate.toISOString().split('T')[0];
}

/**
 * Demo mode: 샘플 데이터의 가장 최근 날짜를 KST 기준 "YYYY-MM-DD" 문자열로 반환
 * (실제 "오늘"이 아니라 샘플 데이터 기준 최신 날짜)
 */
export function getTodayKST(): string {
  return DEMO_REFERENCE_DATE;
}
