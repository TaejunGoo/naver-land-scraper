import { Router } from 'express'
import prisma from '../db.js'

const router = Router()

// Get listings by complex ID with filtering and sorting
router.get('/:complexId', async (req, res) => {
  try {
    const { complexId } = req.params
    const {
      tradetype,
      areaMin,
      areaMax,
      sortBy = 'price',
      sortOrder = 'asc'
    } = req.query

    // Build where clause
    const whereClause: any = {
      complexId: Number(complexId)
    }

    // Filter by trade type
    if (tradetype && tradetype !== 'ALL' && tradetype !== '') {
      // tradetype이 쉼표로 구분된 여러 값일 수 있음
      const types = (tradetype as string).split(',').map(t => t.trim())
      if (types.length > 1) {
        whereClause.tradetype = { in: types }
      } else {
        whereClause.tradetype = types[0]
      }
    }

    // Filter by area
    if (areaMin || areaMax) {
      whereClause.area = {}
      if (areaMin) {
        whereClause.area.gte = Number(areaMin)
      }
      if (areaMax) {
        whereClause.area.lte = Number(areaMax)
      }
    }

    // Build order by clause
    const orderByClause: any = {}
    const validSortFields = ['price', 'area', 'floor', 'scrapedAt']
    const sortField = validSortFields.includes(sortBy as string) ? sortBy : 'price'
    const order = sortOrder === 'desc' ? 'desc' : 'asc'
    orderByClause[sortField as string] = order

    const listings = await prisma.listing.findMany({
      where: whereClause,
      orderBy: orderByClause
    })

    // Get new high/low record IDs for this complex
    // Use the latest scraped date instead of 'today' to handle historical data
    const recordIdsResult = await prisma.$queryRaw<any[]>`
      WITH PastStats AS (
        SELECT
          CAST(area / 3.3058 AS INT) as pyung,
          MIN(price) as minPrice,
          MAX(price) as maxPrice
        FROM listings
        WHERE complexId = ${Number(complexId)}
          AND tradetype = '매매'
          AND date(scrapedAt / 1000, 'unixepoch', '+9 hours') >= date((
            SELECT MAX(date(scrapedAt / 1000, 'unixepoch', '+9 hours'))
            FROM listings
            WHERE complexId = ${Number(complexId)}
          ), '-30 days')
          AND date(scrapedAt / 1000, 'unixepoch', '+9 hours') < (
            SELECT MAX(date(scrapedAt / 1000, 'unixepoch', '+9 hours'))
            FROM listings
            WHERE complexId = ${Number(complexId)}
          )
        GROUP BY CAST(area / 3.3058 AS INT)
      ),
      LatestListings AS (
        SELECT
          l.id,
          CAST(l.area / 3.3058 AS INT) as pyung,
          l.price
        FROM listings l
        WHERE l.complexId = ${Number(complexId)}
          AND l.tradetype = '매매'
          AND date(l.scrapedAt / 1000, 'unixepoch', '+9 hours') = (
            SELECT MAX(date(scrapedAt / 1000, 'unixepoch', '+9 hours'))
            FROM listings
            WHERE complexId = ${Number(complexId)}
          )
      )
      SELECT
        t.id,
        t.pyung,
        t.price,
        p.minPrice,
        p.maxPrice,
        CASE WHEN t.price < CAST(p.minPrice AS INT) THEN 1 ELSE 0 END as isLow,
        CASE WHEN t.price > CAST(p.maxPrice AS INT) THEN 1 ELSE 0 END as isHigh
      FROM LatestListings t
      LEFT JOIN PastStats p ON t.pyung = p.pyung
    `;

    // Create Sets for quick lookup
    const newHighIds = new Set<number>();
    const newLowIds = new Set<number>();

    recordIdsResult.forEach(record => {
      const id = Number(record.id);
      // Only count if there's valid past data to compare against
      if (record.minPrice !== null && record.maxPrice !== null) {
        // Convert BigInt to Number for comparison
        if (Number(record.isHigh) === 1) {
          newHighIds.add(id);
        }
        if (Number(record.isLow) === 1) {
          newLowIds.add(id);
        }
      }
    });

    // Add flags to listings
    const listingsWithFlags = listings.map(listing => ({
      ...listing,
      isNewHigh: newHighIds.has(listing.id),
      isNewLow: newLowIds.has(listing.id),
    }));

    res.json(listingsWithFlags)
  } catch (error) {
    console.error('Error fetching listings:', error)
    res.status(500).json({ error: 'Failed to fetch listings' })
  }
})

// Delete single listing
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    await prisma.listing.delete({
      where: { id: Number(id) }
    })
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting listing:', error)
    res.status(500).json({ error: 'Failed to delete listing' })
  }
})

// Delete multiple listings
router.post('/batch-delete', async (req, res) => {
  try {
    const { ids } = req.body

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Invalid ids array' })
    }

    const result = await prisma.listing.deleteMany({
      where: {
        id: {
          in: ids.map(Number)
        }
      }
    })

    res.json({ success: true, deletedCount: result.count })
  } catch (error) {
    console.error('Error deleting listings:', error)
    res.status(500).json({ error: 'Failed to delete listings' })
  }
})

// Delete all listings for a complex
router.delete('/complex/:complexId/all', async (req, res) => {
  try {
    const { complexId } = req.params

    const result = await prisma.listing.deleteMany({
      where: {
        complexId: Number(complexId)
      }
    })

    res.json({ success: true, deletedCount: result.count })
  } catch (error) {
    console.error('Error deleting all listings:', error)
    res.status(500).json({ error: 'Failed to delete all listings' })
  }
})

// Generate dummy data for testing
router.post('/complex/:complexId/generate-dummy', async (req, res) => {
  try {
    const { complexId } = req.params
    const { days = 365 } = req.body

    const complex = await prisma.complex.findUnique({
      where: { id: Number(complexId) }
    })

    if (!complex) {
      return res.status(404).json({ error: 'Complex not found' })
    }

    // Parse area options
    const areaOptions = complex.areaOptions ? JSON.parse(complex.areaOptions) : ['84㎡', '104㎡', '114㎡']
    const tradeTypes = ['매매', '전세', '월세']
    
    const listings = []
    const now = new Date()

    // Generate data for past X days
    for (let i = 0; i < days; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      
      // Random number of listings per day (1-5)
      const listingsPerDay = Math.floor(Math.random() * 5) + 1
      
      for (let j = 0; j < listingsPerDay; j++) {
        const tradetype = tradeTypes[Math.floor(Math.random() * tradeTypes.length)]
        const areaStr = areaOptions[Math.floor(Math.random() * areaOptions.length)]
        const area = parseFloat(areaStr.match(/[\d.]+/)?.[0] || '84')
        
        // Generate realistic prices based on tradetype
        let price
        if (tradetype === '매매') {
          // 5억 ~ 15억
          price = Math.floor(Math.random() * 100000 + 50000) * 100
        } else if (tradetype === '전세') {
          // 3억 ~ 8억
          price = Math.floor(Math.random() * 50000 + 30000) * 100
        } else {
          // 월세 1000 ~ 5000
          price = Math.floor(Math.random() * 40) + 10
        }
        
        // Add some price variation over time (trend)
        const trendFactor = 1 + (i / days) * 0.1 // 10% decrease over time
        price = Math.floor(price / trendFactor)
        
        // Random floor (1-30)
        const floor = Math.floor(Math.random() * 30) + 1
        
        // Random direction
        const directions = ['남', '남동', '남서', '동', '서', '북', '북동', '북서']
        const direction = directions[Math.floor(Math.random() * directions.length)]
        
        listings.push({
          complexId: Number(complexId),
          price,
          area,
          supplyArea: area * 1.2,
          floor: String(floor),
          direction,
          tradetype,
          memo: `테스트 매물 ${j + 1}`,
          url: `https://land.naver.com/article/test${Date.now()}${j}`,
          scrapedAt: date
        })
      }
    }

    // Insert all dummy listings
    await prisma.listing.createMany({
      data: listings
    })

    console.log(`Generated ${listings.length} dummy listings for ${complex.name}`)
    res.json({ 
      success: true, 
      count: listings.length,
      days,
      message: `${days}일간 ${listings.length}개의 더미 데이터가 생성되었습니다.`
    })
  } catch (error) {
    console.error('Error generating dummy data:', error)
    res.status(500).json({ error: 'Failed to generate dummy data' })
  }
})

export default router
