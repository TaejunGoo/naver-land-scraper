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
