import puppeteer from 'puppeteer'
import axios from 'axios'

interface ListingData {
  price: number
  area: number
  supplyArea: number
  floor: number
  direction: string | null
  tradetype: string
  memo: string | null
  url: string | null
}

interface ComplexInfo {
  type?: string
  units?: number
  buildings?: number
  year?: number
  areaOptions?: string[]
  approvalDate?: string
}

/**
 * 네이버 부동산에서 단지 정보를 크롤링합니다.
 * @param naverComplexId - 네이버 부동산 단지 ID
 * @returns 단지 정보
 */
export async function scrapeComplexInfo(naverComplexId: string): Promise<ComplexInfo> {
  let browser
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--window-size=1920,1080',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
      ignoreDefaultArgs: ['--enable-automation']
    })
    
    const page = await browser.newPage()
    
    await page.evaluateOnNewDocument(() => {
      (navigator as any).webdriver = false
      ;(window as any).chrome = {
        runtime: {}
      }
      const originalQuery = (window.navigator as any).permissions.query
      ;(window.navigator as any).permissions.query = (parameters: any) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: (Notification as any).permission } as PermissionStatus) :
          originalQuery(parameters)
      )
    })
    
    await page.setViewport({ width: 1920, height: 1080 })
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    )
    
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
    })
    
    const url = `https://new.land.naver.com/complexes/${naverComplexId}`
    
    console.log(`단지 정보 크롤링: ${url}`)
    
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 60000 
    })
    
    await page.waitForTimeout(3000)
    
    // 단지 정보 추출
    const complexInfo = await page.evaluate(() => {
      const info: ComplexInfo = {}
      
      // 유형 추출
      const typeEl = Array.from(document.querySelectorAll('.complex_feature dt')).find(el => el.textContent?.includes('유형'))
      if (typeEl?.nextElementSibling) {
        info.type = typeEl.nextElementSibling.textContent?.trim()
      }
      
      // 세대수 추출
      const unitsEl = Array.from(document.querySelectorAll('.complex_feature dt')).find(el => el.textContent?.includes('세대수'))
      if (unitsEl?.nextElementSibling) {
        const unitsText = unitsEl.nextElementSibling.textContent?.trim() || ''
        const match = unitsText.match(/(\d+)/)
        if (match) info.units = parseInt(match[1])
      }
      
      // 동수 추출
      const buildingsEl = Array.from(document.querySelectorAll('.complex_feature dt')).find(el => el.textContent?.includes('동수'))
      if (buildingsEl?.nextElementSibling) {
        const buildingsText = buildingsEl.nextElementSibling.textContent?.trim() || ''
        const match = buildingsText.match(/(\d+)/)
        if (match) info.buildings = parseInt(match[1])
      }
      
      // 연차 추출 (준공연도)
      const yearEl = Array.from(document.querySelectorAll('.complex_feature dt')).find(el => el.textContent?.includes('준공연도'))
      if (yearEl?.nextElementSibling) {
        const yearText = yearEl.nextElementSibling.textContent?.trim() || ''
        const match = yearText.match(/(\d{4})/)
        if (match) info.year = parseInt(match[1])
      }
      
      // 사용승인일 추출
      const approvalEl = Array.from(document.querySelectorAll('.complex_feature dt')).find(el => el.textContent?.includes('사용승인일'))
      if (approvalEl?.nextElementSibling) {
        info.approvalDate = approvalEl.nextElementSibling.textContent?.trim()
      }
      
      // 면적 옵션 추출 (필터에서)
      const areaOptions: Set<string> = new Set()
      const areaLabels = document.querySelectorAll('label[for^="housesize"]')
      areaLabels.forEach(label => {
        const text = label.textContent?.trim()
        if (text && text !== '전체') {
          areaOptions.add(text)
        }
      })
      
      if (areaOptions.size > 0) {
        info.areaOptions = Array.from(areaOptions)
      }
      
      return info
    })
    
    console.log('단지 정보 추출 완료:', complexInfo)
    
    return complexInfo
    
  } catch (error) {
    console.error('단지 정보 크롤링 오류:', error)
    throw new Error('단지 정보 크롤링 실패')
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}


export async function scrapeNaverListings(naverComplexId: string): Promise<ListingData[]> {
  let browser
  
  try {
    console.log(`Puppeteer를 통한 매물 크롤링 시작: 단지 ID ${naverComplexId}`)
    
    browser = await puppeteer.launch({
      headless: false,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--window-size=1920,1080',
        '--disable-dev-shm-usage'
      ],
      ignoreDefaultArgs: ['--enable-automation']
    })
    
    const page = await browser.newPage()
    
    await page.evaluateOnNewDocument(() => {
      (navigator as any).webdriver = false
      ;(window as any).chrome = { runtime: {} }
    })
    
    await page.setViewport({ width: 1920, height: 1080 })
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    )
    
    const allListings: ListingData[] = []
    
    // API 응답 가로채기
    page.on('response', async (response) => {
      const url = response.url()
      
      // 매물 API 응답만 처리
      if (url.includes(`/api/articles/complex/${naverComplexId}`) && url.includes('type=list')) {
        try {
          const data = await response.json()
          
          if (data.articleList && Array.isArray(data.articleList)) {
            console.log(`API 응답: ${data.articleList.length}개 매물 발견`)
            
            for (const article of data.articleList) {
              try {
                // 거래 유형 변환
                let tradetype = '매매'
                if (article.tradeTypeCode === 'B1') tradetype = '전세'
                else if (article.tradeTypeCode === 'B2') tradetype = '월세'
                else if (article.tradeTypeCode === 'A1') tradetype = '매매'
                
                // 가격 파싱 개선
                let price = 0
                const priceText = article.dealOrWarrantPrc || ''
                
                // "8억 1,000" 또는 "8억" 또는 "1,000" 형태
                if (priceText.includes('억')) {
                  const parts = priceText.split('억')
                  const billionPart = parts[0].trim()
                  const manPart = parts[1]?.trim() || ''
                  
                  // 억 단위
                  if (billionPart) {
                    price = parseInt(billionPart.replace(/,/g, '')) * 10000
                  }
                  
                  // 만원 단위
                  if (manPart) {
                    price += parseInt(manPart.replace(/,/g, ''))
                  }
                } else {
                  // 만원 단위만 있는 경우
                  price = parseInt(priceText.replace(/,/g, ''))
                }
                
                // 월세의 경우 rentPrc 사용
                if (tradetype === '월세' && article.rentPrc) {
                  price = parseInt(article.rentPrc.replace(/,/g, ''))
                }
                
                const area = article.area2 || 0
                const supplyArea = article.area1 || 0
                
                // 층 정보
                let floor = 0
                const floorInfo = article.floorInfo || ''
                const floorMatch = floorInfo.match(/^(\d+)\//)
                if (floorMatch) {
                  floor = parseInt(floorMatch[1])
                } else if (floorInfo.includes('중')) {
                  floor = 6
                } else if (floorInfo.includes('고')) {
                  floor = 10
                } else if (floorInfo.includes('저')) {
                  floor = 3
                }
                
                const direction = article.direction || null
                
                // 메모 (articleFeatureDesc)
                const memo = article.articleFeatureDesc || null
                
                // 매물 링크
                const articleUrl = null
                
                if (price > 0 && area > 0) {
                  allListings.push({
                    price,
                    area,
                    supplyArea,
                    floor,
                    direction,
                    tradetype,
                    memo,
                    url: articleUrl
                  })
                }
              } catch (error) {
                console.error('매물 파싱 오류:', error)
              }
            }
          }
        } catch (error) {
          // JSON 파싱 실패는 무시
        }
      }
    })
    
    const url = `https://new.land.naver.com/complexes/${naverComplexId}`
    console.log(`페이지 로딩: ${url}`)
    
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 60000 
    })
    
    // 초기 로딩 대기
    await page.waitForTimeout(3000)
    
    // 초기 수집된 데이터 클리어 (동일매물 묶기 전 데이터)
    allListings.length = 0
    
    // '동일매물 묶기' 버튼 클릭
    try {
      console.log('동일매물 묶기 버튼 찾는 중...')
      const groupButton = await page.$('#address_group2')
      if (groupButton) {
        const isChecked = await page.evaluate(() => {
          const checkbox = document.querySelector('#address_group2') as HTMLInputElement
          return checkbox?.checked || false
        })
        
        if (!isChecked) {
          console.log('동일매물 묶기 버튼 클릭')
          await groupButton.click()
          // 버튼 클릭 후 API 재호출 대기
          await page.waitForTimeout(4000)
        } else {
          console.log('동일매물 묶기가 이미 활성화되어 있습니다.')
          await page.waitForTimeout(2000)
        }
      } else {
        console.log('동일매물 묶기 버튼을 찾을 수 없습니다.')
      }
    } catch (error) {
      console.log('동일매물 묶기 버튼 클릭 실패:', error)
    }
    
    // 스크롤하여 더 많은 데이터 로드
    console.log('스크롤하여 추가 매물 로드 중...')
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => {
        const listContainer = document.querySelector('.item_list--article')
        if (listContainer) {
          listContainer.scrollTop = listContainer.scrollHeight
        }
      })
      await page.waitForTimeout(1000)
    }
    
    // 최종 대기
    await page.waitForTimeout(2000)
    
    console.log(`총 ${allListings.length}개의 매물을 찾았습니다.`)
    
    if (allListings.length > 0) {
      console.log('첫 번째 매물 샘플:', allListings[0])
    }
    
    return allListings
    
  } catch (error) {
    console.error('크롤링 오류:', error)
    throw new Error('크롤링 실패')
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}
