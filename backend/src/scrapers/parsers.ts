import { ListingData } from '../types/index.js'

/**
 * 네이버 부동산 API 응답 객체를 ListingData 형식으로 변환합니다.
 */
export function parseNaverArticle(article: any): ListingData {
  let tradetype = '매매'
  if (article.tradeTypeCode === 'B1') tradetype = '전세'
  else if (article.tradeTypeCode === 'B2') tradetype = '월세'

  let price = 0
  const priceText = article.dealOrWarrantPrc || ''
  if (priceText.includes('억')) {
    const parts = priceText.split('억')
    price = parseInt(parts[0].replace(/,/g, '')) * 10000
    if (parts[1]) {
      price += parseInt(parts[1].replace(/,/g, '')) || 0
    }
  } else {
    price = parseInt(priceText.replace(/,/g, '')) || 0
  }

  // 월세인 경우 보증금이 아닌 월세를 가격으로 측정하려면 별도 로직이 필요할 수 있으나,
  // 현재 로직은 article.rentPrc가 있으면 이를 price로 덮어씌움 (기존 로직 유지)
  if (tradetype === '월세' && article.rentPrc) {
    price = parseInt(article.rentPrc.replace(/,/g, '')) || 0
  }

  const floorInfo = article.floorInfo || ''
  const floorMatch = floorInfo.match(/^(\d+)\//)
  
  let floor = '?'
  if (floorMatch) {
    floor = floorMatch[1] // "15/20" -> "15"
  } else if (floorInfo.includes('/')) {
    floor = floorInfo.split('/')[0] // "고/20" -> "고"
  } else if (floorInfo) {
    floor = floorInfo
  }

  return {
    price,
    area: article.area2 || 0,
    supplyArea: article.area1 || 0,
    floor,
    direction: article.direction || null,
    tradetype,
    memo: article.articleFeatureDesc || null,
    url: null
  }
}
