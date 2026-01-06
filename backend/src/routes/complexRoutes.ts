import { Router } from 'express'
import prisma from '../db.js'
import { scrapeNaverListings, scrapeComplexInfo } from '../scrapers/naverScraper.js'

const router = Router()

// Get all complexes
router.get('/', async (req, res) => {
  try {
    const complexes = await prisma.complex.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    // 대한민국 표준시(KST) 기준 오늘 시작/종료 시점 계산
    const now = new Date()
    const kstNow = new Date(now.getTime() + (9 * 60 * 60 * 1000))
    const todayKST = new Date(Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate()))
    
    // DB 쿼리를 위한 UTC 시간 (KST 00:00 = UTC 전날 15:00)
    const startTime = new Date(todayKST.getTime() - (9 * 60 * 60 * 1000))
    const endTime = new Date(startTime.getTime() + (24 * 60 * 60 * 1000))
    
    // 각 단지의 오늘 매물 수 계산 (유형별)
    const complexesWithCount = await Promise.all(
      complexes.map(async (complex: any) => {
        const todayCounts = await prisma.listing.groupBy({
          by: ['tradetype'],
          where: {
            complexId: complex.id,
            scrapedAt: {
              gte: startTime,
              lt: endTime
            }
          },
          _count: true
        })

        const counts = {
          total: 0,
          sale: 0,    // 매매
          jeonse: 0,  // 전세
          rent: 0     // 월세
        }

        todayCounts.forEach((item: { tradetype: string; _count: number }) => {
          const count = item._count
          counts.total += count
          if (item.tradetype === '매매') counts.sale = count
          else if (item.tradetype === '전세') counts.jeonse = count
          else if (item.tradetype === '월세') counts.rent = count
        })

        return {
          ...complex,
          todayListingCount: counts.total,
          todayListingCounts: counts
        }
      })
    )
    
    res.json(complexesWithCount)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch complexes' })
  }
})

// Get complex by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const complex = await prisma.complex.findUnique({
      where: { id: Number(id) }
    })
    
    if (!complex) {
      return res.status(404).json({ error: 'Complex not found' })
    }
    
    res.json(complex)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch complex' })
  }
})

// Create complex
router.post('/', async (req, res) => {
  try {
    const { name, address, naverComplexId, customNotes, tags } = req.body
    
    const complex = await prisma.complex.create({
      data: {
        name,
        address,
        naverComplexId: naverComplexId || null,
        customNotes: customNotes || null,
        tags: tags ? JSON.stringify(tags) : null
      }
    })
    
    res.json(complex)
  } catch (error) {
    res.status(500).json({ error: 'Failed to create complex' })
  }
})

// Update complex
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, address, naverComplexId, customNotes, tags } = req.body
    
    const complex = await prisma.complex.update({
      where: { id: Number(id) },
      data: {
        name,
        address,
        naverComplexId: naverComplexId || null,
        customNotes: customNotes || null,
        tags: tags ? JSON.stringify(tags) : undefined
      }
    })
    
    res.json(complex)
  } catch (error) {
    res.status(500).json({ error: 'Failed to update complex' })
  }
})

// Delete complex
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    await prisma.complex.delete({
      where: { id: Number(id) }
    })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete complex' })
  }
})

// Scrape listings for complex
router.post('/:id/scrape', async (req, res) => {
  try {
    const { id } = req.params
    const complexId = Number(id)
    const complex = await prisma.complex.findUnique({
      where: { id: complexId }
    })
    
    if (!complex || !complex.naverComplexId) {
      return res.status(400).json({ error: 'Complex not found or missing Naver ID' })
    }
    
    // 대한민국 표준시(KST) 기준 오늘 시작/종료 시점 계산
    const now = new Date()
    const kstNow = new Date(now.getTime() + (9 * 60 * 60 * 1000))
    const todayKST = new Date(Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate()))
    
    const startTime = new Date(todayKST.getTime() - (9 * 60 * 60 * 1000))
    const endTime = new Date(startTime.getTime() + (24 * 60 * 60 * 1000))
    
    await prisma.listing.deleteMany({
      where: {
        complexId: complexId,
        scrapedAt: {
          gte: startTime,
          lt: endTime
        }
      }
    })
    
    console.log(`${complex.name}의 당일 데이터 삭제 완료`)
    
    const startTimeScrape = Date.now()
    const scraperResults = await scrapeNaverListings(complex.naverComplexId)
    const duration = ((Date.now() - startTimeScrape) / 1000).toFixed(1)
    const scrapeTimestamp = new Date() // 모든 매물에 동일한 수집 시각 부여
    
    // Save new listings to database using Bulk Insert (createMany)
    if (scraperResults.length > 0) {
      await prisma.listing.createMany({
        data: scraperResults.map(l => ({
          complexId: complexId,
          ...l,
          scrapedAt: scrapeTimestamp
        }))
      })
    }
    
    // Update lastScrapedAt
    await prisma.complex.update({
      where: { id: complexId },
      data: { lastScrapedAt: new Date() }
    })
    
    console.log(`${complex.name}: ${scraperResults.length}개 매물 저장 완료 (소요시간: ${duration}초)`)
    res.json({ success: true, count: scraperResults.length, total: scraperResults.length })
  } catch (error) {
    console.error('Scraping error:', error)
    res.status(500).json({ error: 'Failed to scrape listings' })
  }
})

// Scrape complex info
router.post('/:id/scrape-info', async (req, res) => {
  try {
    const { id } = req.params
    const complexId = Number(id)
    const complex = await prisma.complex.findUnique({
      where: { id: complexId }
    })
    
    if (!complex || !complex.naverComplexId) {
      return res.status(400).json({ error: 'Complex not found or missing Naver ID' })
    }
    
    const complexInfo = await scrapeComplexInfo(complex.naverComplexId)
    
    // Update complex info
    const updated = await prisma.complex.update({
      where: { id: complexId },
      data: {
        type: complexInfo.type || null,
        units: complexInfo.units || null,
        buildings: complexInfo.buildings || null,
        year: complexInfo.year || null,
        areaOptions: complexInfo.areaOptions ? JSON.stringify(complexInfo.areaOptions) : null,
        approvalDate: complexInfo.approvalDate || null,
        infoScrapedAt: new Date()
      }
    })
    
    console.log(`${complex.name}의 단지 정보 저장 완료`)
    res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Complex info scraping error:', error)
    res.status(500).json({ error: 'Failed to scrape complex info' })
  }
})

// Scrape all complexes' listings
router.post('/scrape-all/listings', async (req, res) => {
  const globalStartTime = Date.now()
  try {
    const complexes = await prisma.complex.findMany({
      where: {
        naverComplexId: { not: null }
      }
    })

    if (complexes.length === 0) {
      return res.status(400).json({ error: 'No complexes with Naver ID found' })
    }

    const results = []
    const CONCURRENCY = 2 // 로컬 환경 부하를 고려하여 2개씩 병렬 처리
    
    for (let i = 0; i < complexes.length; i += CONCURRENCY) {
      const batch = complexes.slice(i, i + CONCURRENCY)
      console.log(`\n>>> 배치 실행 (${i + 1}~${Math.min(i + CONCURRENCY, complexes.length)} / 총 ${complexes.length}개)`)
      
      const batchPromises = batch.map(async (complex) => {
        const startTime = Date.now()
        try {
          console.log(`[시작] ${complex.name}`)
          
          // 대한민국 표준시(KST) 기준 오늘 시작/종료 시점 계산
          const now = new Date()
          const kstNow = new Date(now.getTime() + (9 * 60 * 60 * 1000))
          const todayKST = new Date(Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate()))
          
          const dbStartTime = new Date(todayKST.getTime() - (9 * 60 * 60 * 1000))
          const endTime = new Date(dbStartTime.getTime() + (24 * 60 * 60 * 1000))
          
          await prisma.listing.deleteMany({
            where: {
              complexId: complex.id,
              scrapedAt: {
                gte: dbStartTime,
                lt: endTime
              }
            }
          })

          const listings = await scrapeNaverListings(complex.naverComplexId!)
          const scrapeTimestamp = new Date()
          
          // Save new listings using Bulk Insert
          if (listings.length > 0) {
            await prisma.listing.createMany({
              data: listings.map(l => ({
                complexId: complex.id,
                ...l,
                scrapedAt: scrapeTimestamp
              }))
            })
          }
          
          // Update lastScrapedAt
          await prisma.complex.update({
            where: { id: complex.id },
            data: { lastScrapedAt: new Date() }
          })
          
          const duration = ((Date.now() - startTime) / 1000).toFixed(1)
          console.log(`[완료] ${complex.name}: ${listings.length}개 저장 (${duration}초)`)
          
          return {
            complexId: complex.id,
            complexName: complex.name,
            count: listings.length,
            total: listings.length,
            success: true,
            duration
          }
        } catch (error) {
          console.error(`[실패] ${complex.name}:`, error)
          return {
            complexId: complex.id,
            complexName: complex.name,
            count: 0,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      })
      
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
    }

    const totalDuration = ((Date.now() - globalStartTime) / 1000).toFixed(1)
    const totalCount = results.reduce((sum, r) => sum + r.count, 0)
    const successCount = results.filter(r => r.success).length
    
    console.log(`\n==========================================`)
    console.log(`전체 크롤링 완료!`)
    console.log(`- 총 단지: ${complexes.length}개 (성공: ${successCount})`)
    console.log(`- 총 매물: ${totalCount}개`)
    console.log(`- 전체 소요 시간: ${totalDuration}초`)
    console.log(`==========================================\n`)

    res.json({
      success: true,
      totalComplexes: complexes.length,
      successComplexes: successCount,
      totalListings: totalCount,
      totalDuration,
      results
    })
  } catch (error) {
    console.error('Scrape all error:', error)
    res.status(500).json({ error: 'Failed to scrape all listings' })
  }
})

// Create test complex with dummy data
router.post('/create-test-complex', async (req, res) => {
  try {
    const { days = 365 } = req.body

    // Create test complex
    const complex = await prisma.complex.create({
      data: {
        name: '테스트 아파트',
        address: '서울시 강남구 테스트동',
        naverComplexId: null,
        customNotes: '그래프 테스트용 더미 데이터 단지입니다.',
        type: '아파트',
        units: 500,
        buildings: 10,
        year: 2010,
        areaOptions: JSON.stringify(['59㎡', '84㎡', '104㎡', '114㎡', '135㎡']),
        approvalDate: '2020.01',
        infoScrapedAt: new Date()
      }
    })

    // Generate dummy listings
    const areaOptions = ['59㎡', '84㎡', '104㎡', '114㎡', '135㎡']
    const tradeTypes = ['매매', '전세', '월세']
    const listings = []
    const now = new Date()

    for (let i = 0; i < days; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      
      // 매일 5~12개의 매물 생성
      const listingsPerDay = Math.floor(Math.random() * 8) + 5
      
      for (let j = 0; j < listingsPerDay; j++) {
        const tradetype = tradeTypes[Math.floor(Math.random() * tradeTypes.length)]
        const areaStr = areaOptions[Math.floor(Math.random() * areaOptions.length)]
        const area = parseFloat(areaStr.match(/[\d.]+/)?.[0] || '84')
        
        // 매매만 생성 (현실적인 가격 범위)
        let price
        if (tradetype === '매매') {
          // 5억 ~ 15억 사이 (50000 ~ 150000)
          // 면적에 따라 기본 가격 차이
          const basePrice = 50000 + (area - 59) * 800 // 59㎡: 5억, 135㎡: 11억 정도
          // ±30% 랜덤 변동
          const variation = (Math.random() * 0.6 - 0.3)
          price = Math.floor(basePrice + basePrice * variation)
          
          // 최소 5억, 최대 15억으로 제한
          price = Math.max(50000, Math.min(150000, price))
        } else if (tradetype === '전세') {
          // 전세: 3억 ~ 10억
          const basePrice = 30000 + (area - 59) * 500
          const variation = (Math.random() * 0.6 - 0.3)
          price = Math.floor(basePrice + basePrice * variation)
          price = Math.max(30000, Math.min(100000, price))
        } else {
          // 월세: 500 ~ 3000만원
          const basePrice = 500 + (area - 59) * 20
          const variation = (Math.random() * 0.6 - 0.3)
          price = Math.floor(basePrice + basePrice * variation)
          price = Math.max(500, Math.min(3000, price))
        }
        
        // 시간에 따른 가격 트렌드 (점진적 상승)
        const trendFactor = 1 + (i / days) * 0.2 // 20% 변동
        price = Math.floor(price / trendFactor)
        
        // 랜덤한 주간 변동 추가
        const weeklyNoise = (Math.random() * 0.1 - 0.05)
        price = Math.floor(price * (1 + weeklyNoise))
        
        // Random floor (1-30)
        const floor = Math.floor(Math.random() * 30) + 1
        
        // Random direction
        const directions = ['남', '남동', '남서', '동', '서', '북', '북동', '북서']
        const direction = directions[Math.floor(Math.random() * directions.length)]
        
        listings.push({
          complexId: complex.id,
          price,
          area,
          supplyArea: Math.round(area * 1.25),
          floor,
          direction,
          tradetype,
          memo: `테스트 매물 ${areaStr} ${tradetype}`,
          url: `https://test.example.com/${complex.id}/${j}`,
          scrapedAt: date
        })
      }
    }

    // Insert all dummy listings
    await prisma.listing.createMany({
      data: listings
    })

    console.log(`Created test complex with ${listings.length} dummy listings`)
    res.json({ 
      success: true, 
      complexId: complex.id,
      count: listings.length,
      days,
      message: `테스트 단지가 생성되었습니다. ${days}일간 ${listings.length}개의 더미 데이터가 포함되어 있습니다.`
    })
  } catch (error) {
    console.error('Error creating test complex:', error)
    res.status(500).json({ error: 'Failed to create test complex' })
  }
})

export default router
