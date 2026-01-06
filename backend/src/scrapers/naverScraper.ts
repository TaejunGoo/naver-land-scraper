import puppeteer, { Browser } from 'puppeteer'
import { ListingData, ComplexInfo } from '../types/index.js'

/**
 * 지연 함수 (ms 단위)
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Puppeteer 브라우저 공통 설정
 */
const LAUNCH_OPTIONS = {
  headless: "new" as const,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-blink-features=AutomationControlled',
    '--window-size=1920,1080',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--no-first-run',
    '--no-zygote'
  ],
  ignoreDefaultArgs: ['--enable-automation']
}

/**
 * 봇 감지 우회를 위한 페이지 초기화
 */
async function setupPage(page: any) {
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    (window as any).chrome = { runtime: {} };
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    Object.defineProperty(navigator, 'languages', { get: () => ['ko-KR', 'ko', 'en-US', 'en'] });
  })

  await page.setViewport({ width: 1920, height: 1080 })
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
  )

  await page.setExtraHTTPHeaders({
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
  })
}

/**
 * 재시도 로직을 포함한 래퍼 함수
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let lastError: any
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      console.warn(`[Retry ${i + 1}/${retries}] 오류 발생: ${error instanceof Error ? error.message : error}`)
      if (i < retries - 1) await delay(2000 * (i + 1))
    }
  }
  throw lastError
}

/**
 * 네이버 부동산에서 단지 정보를 크롤링합니다.
 */
export async function scrapeComplexInfo(naverComplexId: string): Promise<ComplexInfo> {
  return withRetry(async () => {
    let browser: Browser | undefined
    try {
      browser = await puppeteer.launch(LAUNCH_OPTIONS)
      const page = await browser.newPage()
      await setupPage(page)
      
      const url = `https://new.land.naver.com/complexes/${naverComplexId}`
      console.log(`단지 정보 수집 시작: ${url}`)
      
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })
      await delay(2000)
      
      const complexInfo = await page.evaluate(() => {
        const info: ComplexInfo = {}
        const featureContainer = document.querySelector('.complex_feature')
        if (!featureContainer) return info

        const getVal = (label: string) => {
          const dt = Array.from(featureContainer.querySelectorAll('dt')).find(el => el.textContent?.includes(label))
          return dt?.nextElementSibling?.textContent?.trim() || ''
        }
        
        info.type = getVal('유형')
        
        const unitsText = getVal('세대수')
        const unitsMatch = unitsText.match(/(\d+)/)
        if (unitsMatch) info.units = parseInt(unitsMatch[1])
        
        const buildingsText = getVal('동수')
        const buildingsMatch = buildingsText.match(/(\d+)/)
        if (buildingsMatch) info.buildings = parseInt(buildingsMatch[1])
        
        const yearText = getVal('준공연도') || getVal('사용승인일')
        const yearMatch = yearText.match(/(\d{4})/)
        if (yearMatch) info.year = parseInt(yearMatch[1])
        
        info.approvalDate = getVal('사용승인일')
        
        const areaOptionsSet = new Set<string>()
        document.querySelectorAll('label[for^="housesize"]').forEach(label => {
          const text = label.textContent?.trim()
          if (text && text !== '전체') areaOptionsSet.add(text)
        })
        if (areaOptionsSet.size > 0) info.areaOptions = Array.from(areaOptionsSet)
        
        return info
      })
      
      return complexInfo
    } finally {
      if (browser) await browser.close()
    }
  })
}

/**
 * 네이버 부동산에서 매물 목록을 크롤링합니다.
 */
export async function scrapeNaverListings(naverComplexId: string): Promise<ListingData[]> {
  return withRetry(async () => {
    let browser: Browser | undefined
    try {
      browser = await puppeteer.launch(LAUNCH_OPTIONS)
      const page = await browser.newPage()
      await setupPage(page)
      
      // 리소스 차단
      await page.setRequestInterception(true)
      page.on('request', (req) => {
        if (['image', 'font', 'media'].includes(req.resourceType())) {
          req.abort()
        } else {
          req.continue()
        }
      })

      const allListings: ListingData[] = []
      
      // API 응답 가로채기
      page.on('response', async (response) => {
        const url = response.url()
        if (url.includes(`/api/articles/complex/${naverComplexId}`) && url.includes('type=list')) {
          try {
            const text = await response.text()
            const data = JSON.parse(text)
            if (data.articleList && Array.isArray(data.articleList)) {
              console.log(`[Scraper] API 응답 수집: ${data.articleList.length}개 항목`)
              for (const article of data.articleList) {
                try {
                  let tradetype = '매매'
                  if (article.tradeTypeCode === 'B1') tradetype = '전세'
                  else if (article.tradeTypeCode === 'B2') tradetype = '월세'
                  
                  let price = 0
                  const priceText = article.dealOrWarrantPrc || ''
                  if (priceText.includes('억')) {
                    const parts = priceText.split('억')
                    price = parseInt(parts[0].replace(/,/g, '')) * 10000
                    if (parts[1]) price += parseInt(parts[1].replace(/,/g, '')) || 0
                  } else {
                    price = parseInt(priceText.replace(/,/g, '')) || 0
                  }
                  
                  if (tradetype === '월세' && article.rentPrc) {
                    price = parseInt(article.rentPrc.replace(/,/g, '')) || 0
                  }
                  
                  const floorInfo = article.floorInfo || ''
                  const floorMatch = floorInfo.match(/^(\d+)\//)
                  let floor = floorMatch ? parseInt(floorMatch[1]) : (floorInfo.includes('고') ? 15 : floorInfo.includes('중') ? 8 : 3)

                  allListings.push({
                    price,
                    area: article.area2 || 0,
                    supplyArea: article.area1 || 0,
                    floor,
                    direction: article.direction || null,
                    tradetype,
                    memo: article.articleFeatureDesc || null,
                    url: null
                  })
                } catch (e) { /* ignore single item parse error */ }
              }
            }
          } catch (e) { /* ignore non-json or error */ }
        }
      })

      const url = `https://new.land.naver.com/complexes/${naverComplexId}`
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
      await delay(2000)

      // 동일매물 묶기 활성화 (데이터 중복 제거를 위해 네이버 기능 활용)
      try {
        const groupBtn = await page.$('#address_group2')
        if (groupBtn) {
          const isChecked = await page.$eval('#address_group2', (el: any) => el.checked)
          if (!isChecked) {
            console.log(`[Scraper] 동일매물 묶기 활성화 중...`)
            allListings.length = 0 // 클릭 전에 미리 비워서 새로 고침된 데이터만 받도록 함
            await groupBtn.click()
            await delay(2000)
          }
        }
      } catch (e) { /* ignore button error */ }

      // 스크롤하여 모든 매물 로드 (동적 감지)
      console.log(`[Scraper] 데이터 로드를 위해 스크롤 다운 시작...`)
      let lastCount = 0
      let stableCount = 0

      for (let i = 0; i < 15; i++) {
        await page.evaluate(() => {
          const container = document.querySelector('.item_list--article')
          if (container) container.scrollTop = container.scrollHeight
        })
        await delay(800)

        const currentCount = allListings.length
        if (currentCount > 0 && currentCount === lastCount) {
          stableCount++
          if (stableCount >= 2) break // 2회 연속 변화 없으면 완료로 간주
        } else {
          stableCount = 0
        }
        lastCount = currentCount
      }
      
      await delay(500)
      console.log(`[Scraper] 수집 완료: 총 ${allListings.length}개 매물`)
      
      // 가격 순 정렬 등은 DB 저장 시가 아닌 수집된 raw 데이터 반환
      return allListings
    } finally {
      if (browser) await browser.close().catch(() => {})
    }
  })
}
