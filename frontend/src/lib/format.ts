/**
 * @fileoverview 데이터 포맷팅 유틸리티
 *
 * 가격, 면적, 날짜 등의 데이터를 사용자에게 보여줄 형식으로 변환합니다.
 * 프론트엔드 전체에서 사용되는 공통 포맷터 함수 모음입니다.
 */

/**
 * 가격(만원 단위)을 "X억 X,XXX만원" 형식으로 포맷팅합니다.
 *
 * @param priceInManwon - 만원 단위의 숫자 가격
 * @returns 포맷팅된 가격 문자열
 *
 * @example
 * formatPrice(105000) → "10억 5,000만원"
 * formatPrice(50000)  → "5억"
 * formatPrice(3000)   → "3,000만원"
 */
export function formatPrice(priceInManwon: number): string {
  const billion = Math.floor(priceInManwon / 10000)    // 억 단위
  const remainder = priceInManwon % 10000               // 나머지 만원 단위
  
  if (billion > 0 && remainder > 0) {
    return `${billion}억 ${remainder.toLocaleString()}만원`
  } else if (billion > 0) {
    return `${billion}억`
  } else {
    return `${remainder.toLocaleString()}만원`
  }
}

/**
 * 제곱미터(m²)를 평(坪)으로 변환합니다.
 *
 * 1평 = 3.3058 m² (법정 환산 기준)
 * 소수점 첫째 자리까지 반올림합니다.
 *
 * @param sqm - 제곱미터 값
 * @returns 평 단위 값 (소수점 1자리)
 *
 * @example
 * sqmToPyeong(84) → 25.4
 */
export function sqmToPyeong(sqm: number): number {
  return Math.round(sqm / 3.3058 * 10) / 10
}

/**
 * 면적 정보를 "공급면적/전용면적㎡ (평/평)" 형식으로 포맷팅합니다.
 *
 * @param supplyArea - 공급면적(계약면적, m²), null이면 전용면적만 표시
 * @param exclusiveArea - 전용면적 (m²)
 * @returns 포맷팅된 면적 문자열
 *
 * @example
 * formatArea(114.67, 84.95) → "114.67/84.95㎡ (34.7평/25.7평)"
 * formatArea(null, 84.95)   → "84.95㎡ (25.7평)"
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
 * Date 객체 또는 날짜 문자열을 KST(UTC+9) 기준 "YYYY-MM-DD" 문자열로 변환합니다.
 *
 * 서버에서 받은 UTC 기반 scrapedAt 값을 한국 시간 기준 날짜로 변환할 때 사용합니다.
 * 프론트엔드에서의 날짜 필터링, 그룹핑 등에 필수적인 함수입니다.
 *
 * @param date - 변환할 날짜 (Date 객체, ISO 문자열, 또는 타임스탬프)
 * @returns KST 기준 "YYYY-MM-DD" 문자열, 유효하지 않으면 빈 문자열
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
 * 현재 시간의 KST 기준 "YYYY-MM-DD" 문자열을 반환합니다.
 * 매물 필터의 기본 날짜 값으로 사용됩니다.
 */
export function getTodayKST(): string {
  return formatDateKST(new Date());
}
