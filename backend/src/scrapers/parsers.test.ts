import { describe, it, expect } from 'vitest'
import { parseNaverArticle } from './parsers.js'

describe('parseNaverArticle', () => {
  it('should parse "매매" with "억" correctly', () => {
    const mockArticle = {
      tradeTypeCode: 'A1',
      dealOrWarrantPrc: '15억 5,000',
      area1: 110,
      area2: 84,
      floorInfo: '10/25',
      direction: '남향',
      articleFeatureDesc: '올수리 채광굿'
    }
    
    const result = parseNaverArticle(mockArticle)
    
    expect(result.tradetype).toBe('매매')
    expect(result.price).toBe(155000)
    expect(result.supplyArea).toBe(110)
    expect(result.area).toBe(84)
    expect(result.floor).toBe('10')
    expect(result.direction).toBe('남향')
    expect(result.memo).toBe('올수리 채광굿')
  })

  it('should parse "전세" correctly', () => {
    const mockArticle = {
      tradeTypeCode: 'B1',
      dealOrWarrantPrc: '8억',
      area1: 110,
      area2: 84,
      floorInfo: '고/25'
    }
    
    const result = parseNaverArticle(mockArticle)
    
    expect(result.tradetype).toBe('전세')
    expect(result.price).toBe(80000)
    expect(result.floor).toBe('고')
  })

  it('should parse "월세" correctly using rentPrc', () => {
    const mockArticle = {
      tradeTypeCode: 'B2',
      dealOrWarrantPrc: '1억',
      rentPrc: '350',
      area1: 110,
      area2: 84,
      floorInfo: '중/25'
    }
    
    const result = parseNaverArticle(mockArticle)
    
    expect(result.tradetype).toBe('월세')
    expect(result.price).toBe(350) // 현재 로직상 월세는 rentPrc를 price로 취급
  })

  it('should handle price without "억"', () => {
    const mockArticle = {
      tradeTypeCode: 'A1',
      dealOrWarrantPrc: '9,500',
      area1: 50,
      area2: 30
    }
    
    const result = parseNaverArticle(mockArticle)
    expect(result.price).toBe(9500)
  })
})
