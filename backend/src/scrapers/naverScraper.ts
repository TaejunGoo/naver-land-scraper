/**
 * @fileoverview 네이버 부동산 크롤링 엔진
 *
 * Puppeteer를 사용하여 네이버 부동산(new.land.naver.com)에서
 * 아파트 단지 정보와 매물 목록을 자동으로 수집하는 스크래퍼입니다.
 *
 * 주요 특징:
 * - Headless 브라우저를 사용한 네이버 부동산 페이지 접근
 * - 봇 감지 우회 패치 (navigator.webdriver 숨김, 플러그인 위장 등)
 * - 네이버 내부 API 응답을 가로채는 방식으로 데이터 수집 (DOM 파싱 X)
 * - 자동 재시도 로직 (최대 3회, 지수 백오프)
 * - 스크롤 기반 동적 데이터 로딩 감지
 */
import puppeteer, { Browser } from "puppeteer";
import { ListingData, ComplexInfo } from "../types/index.js";
import { parseNaverArticle } from "./parsers.js";

/**
 * 지정된 시간(ms) 동안 실행을 일시 중지하는 유틸리티 함수.
 * 사람의 행동을 모방하기 위한 대기 시간으로 사용됩니다.
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Puppeteer 브라우저 공통 실행 옵션.
 *
 * - headless: "new" → 최신 Chromium Headless 모드 사용
 * - no-sandbox: Docker 등 제한된 환경에서도 실행 가능하도록 설정
 * - disable-blink-features: 자동화 감지 CSS 속성 비활성화
 * - ignoreDefaultArgs: --enable-automation 플래그 제거 (감지 우회)
 */
const LAUNCH_OPTIONS = {
  headless: "new" as const,
  // Docker 환경의 시스템 Chromium 사용 (CHROME_PATH가 설정된 경우)
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-blink-features=AutomationControlled",
    "--window-size=1920,1080",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--no-first-run",
    "--no-zygote",
    "--single-process",
  ],
  ignoreDefaultArgs: ["--enable-automation"],
};

/**
 * 봇 감지 우회를 위한 페이지 초기 설정 함수.
 *
 * 네이버 부동산은 봇 접근을 차단하기 위해 다양한 감지 기법을 사용합니다.
 * 이 함수는 다음 항목들을 설정하여 일반 사용자처럼 보이도록 합니다:
 *
 * 1. navigator.webdriver = false로 설정 (Selenium/Puppeteer 감지 우회)
 * 2. Chrome 런타임 객체 위장
 * 3. 플러그인/언어 정보를 한국어 브라우저처럼 설정
 * 4. esbuild 헬퍼 함수 주입 (tsx 실행 시 발생하는 오류 방지)
 * 5. 뷰포트를 1920x1080 FHD로 설정
 * 6. User-Agent를 최신 Chrome으로 위장
 * 7. Accept-Language 헤더를 한국어로 설정
 */
async function setupPage(page: any) {
  // 봇 감지 우회 스크립트 + esbuild 헬퍼 주입
  await page.evaluateOnNewDocument(`
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    window.chrome = { runtime: {} };
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    Object.defineProperty(navigator, 'languages', { get: () => ['ko-KR', 'ko', 'en-US', 'en'] });
    
    // esbuild injected helpers (tsx 실행 환경에서 필요한 전역 함수 정의)
    window.__name = (fn) => fn;
    window.__export = (target, all) => {
      for (var name in all)
        Object.defineProperty(target, name, { get: all[name], enumerable: true });
    };
    window.__toCommonJS = (mod) => mod;
    var __name = (fn) => fn;
    var __export = (target, all) => {
      for (var name in all)
        Object.defineProperty(target, name, { get: all[name], enumerable: true });
    };
    var __toCommonJS = (mod) => mod;
  `);

  // 브라우저 뷰포트 설정 (실제 모니터 크기와 유사하게)
  await page.setViewport({ width: 1920, height: 1080 });

  // User-Agent를 최신 Windows Chrome으로 설정
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
  );

  // HTTP 헤더를 한국어 환경으로 설정
  await page.setExtraHTTPHeaders({
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  });
}

/**
 * 재시도 로직을 포함한 래퍼 함수 (Generic).
 *
 * 네트워크 오류, 타임아웃 등이 발생할 수 있으므로
 * 최대 retries회까지 자동 재시도합니다.
 * 재시도 간격은 지수 백오프: 2초 → 4초 → 6초
 *
 * @param fn - 실행할 비동기 함수
 * @param retries - 최대 재시도 횟수 (기본 3회)
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.warn(
        `[Retry ${i + 1}/${retries}] 오류 발생: ${
          error instanceof Error ? error.message : error
        }`
      );
      // 재시도 전 지수 백오프 대기 (마지막 시도가 아닌 경우에만)
      if (i < retries - 1) await delay(2000 * (i + 1));
    }
  }
  throw lastError;
}

/**
 * 네이버 부동산에서 아파트 단지의 메타데이터를 크롤링합니다.
 *
 * 수집하는 정보:
 * - 유형 (아파트, 분양권 등)
 * - 세대수, 동수
 * - 준공연도, 사용승인일
 * - 면적 옵션 (59㎡, 84㎡ 등)
 *
 * 동작 방식:
 * 1. Puppeteer로 네이버 단지 상세 페이지 접속
 * 2. DOM에서 .complex_feature 영역의 dt/dd 요소 파싱
 * 3. 정규식으로 숫자/날짜 데이터 추출
 *
 * @param naverComplexId - 네이버 부동산 단지 고유 ID
 * @returns 수집된 단지 메타데이터 (ComplexInfo)
 */
export async function scrapeComplexInfo(
  naverComplexId: string
): Promise<ComplexInfo> {
  return withRetry(async () => {
    let browser: Browser | undefined;
    try {
      browser = await puppeteer.launch(LAUNCH_OPTIONS);
      const page = await browser.newPage();
      await setupPage(page);

      const url = `https://new.land.naver.com/complexes/${naverComplexId}`;
      console.log(`단지 정보 수집 시작: ${url}`);

      // 페이지 로드 (네트워크 요청이 모두 완료될 때까지 대기)
      await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
      // 렌더링 완료 대기 (동적 콘텐츠 로딩)
      await delay(2000);

      // 브라우저 컨텍스트 안에서 DOM 파싱 실행
      const complexInfo = await page.evaluate(() => {
        // esbuild helpers: tsx 실행 시 필요한 전역 함수 (page 컨텍스트)
        const __name = (fn: any) => fn;

        const info: ComplexInfo = {};

        // 단지 상세정보 컨테이너에서 데이터 추출
        const featureContainer = document.querySelector(".complex_feature");
        if (!featureContainer) return info;

        /**
         * dt/dd 구조에서 특정 라벨의 값을 가져오는 헬퍼 함수.
         * 예: <dt>세대수</dt><dd>500세대</dd> → getVal("세대수") = "500세대"
         */
        const getVal = (label: string) => {
          const dt = Array.from(featureContainer.querySelectorAll("dt")).find(
            (el) => el.textContent?.includes(label)
          );
          return dt?.nextElementSibling?.textContent?.trim() || "";
        };

        // 유형 추출 (아파트, 분양권 등)
        info.type = getVal("유형");

        // 세대수 추출: "500세대" → 500
        const unitsText = getVal("세대수");
        const unitsMatch = unitsText.match(/(\d+)/);
        if (unitsMatch) info.units = parseInt(unitsMatch[1]);

        // 동수 추출: "10동" → 10
        const buildingsText = getVal("동수");
        const buildingsMatch = buildingsText.match(/(\d+)/);
        if (buildingsMatch) info.buildings = parseInt(buildingsMatch[1]);

        // 준공년도 추출: "2020.01" → 2020
        const yearText = getVal("준공연도") || getVal("사용승인일");
        const yearMatch = yearText.match(/(\d{4})/);
        if (yearMatch) info.year = parseInt(yearMatch[1]);

        // 사용승인일 그대로 저장 (예: "2020.01")
        info.approvalDate = getVal("사용승인일");

        // 면적 옵션 추출: 평형 선택 체크박스에서 수집
        const areaOptionsSet = new Set<string>();
        document
          .querySelectorAll('label[for^="housesize"]')
          .forEach((label) => {
            const text = label.textContent?.trim();
            if (text && text !== "전체") areaOptionsSet.add(text);
          });
        if (areaOptionsSet.size > 0)
          info.areaOptions = Array.from(areaOptionsSet);

        return info;
      });

      return complexInfo;
    } finally {
      // 브라우저 리소스 정리 (에러 발생 여부와 무관하게 항상 실행)
      if (browser) await browser.close();
    }
  });
}

/**
 * 네이버 부동산에서 특정 단지의 전체 매물 목록을 크롤링합니다.
 *
 * 핵심 동작 원리:
 * 네이버 부동산은 매물 목록을 내부 REST API로 로딩합니다.
 * 이 함수는 페이지에 접속한 뒤, 브라우저의 네트워크 응답을 가로채서
 * API 응답(articleList)을 직접 파싱하는 방식으로 데이터를 수집합니다.
 * → DOM을 파싱하는 것보다 정확하고, 데이터 구조 변경에 강합니다.
 *
 * 수집 흐름:
 * 1. Puppeteer로 단지 페이지 접속
 * 2. 불필요한 리소스(이미지/폰트/미디어) 차단 (속도 최적화)
 * 3. response 이벤트 리스너로 API 응답 가로채기
 * 4. "동일매물 묶기" 체크박스 활성화 (중복 제거)
 * 5. 스크롤 다운으로 나머지 매물 동적 로딩
 * 6. 로딩이 완료되면 (2회 연속 개수 변동 없음) 종료
 *
 * @param naverComplexId - 네이버 부동산 단지 고유 ID
 * @returns 수집된 매물 데이터 배열 (ListingData[])
 */
export async function scrapeNaverListings(
  naverComplexId: string
): Promise<ListingData[]> {
  return withRetry(async () => {
    let browser: Browser | undefined;
    try {
      browser = await puppeteer.launch(LAUNCH_OPTIONS);
      const page = await browser.newPage();
      await setupPage(page);

      // ─── 리소스 차단 설정 ─────────────────────────────────────
      // 이미지, 폰트, 미디어 파일을 차단하여 로딩 속도 향상
      await page.setRequestInterception(true);
      page.on("request", (req) => {
        if (["image", "font", "media"].includes(req.resourceType())) {
          req.abort();
        } else {
          req.continue();
        }
      });

      /** 수집된 매물 데이터를 누적하는 배열 */
      const allListings: ListingData[] = [];

      // ─── API 응답 가로채기 (핵심 수집 로직) ─────────────────────
      // 네이버 부동산은 매물 목록을 /api/articles/complex/{id}?type=list
      // 엔드포인트로 요청합니다. 이 응답을 실시간으로 감지하여 데이터 수집.
      page.on("response", async (response) => {
        const url = response.url();
        if (
          url.includes(`/api/articles/complex/${naverComplexId}`) &&
          url.includes("type=list")
        ) {
          try {
            const text = await response.text();
            const data = JSON.parse(text);
            if (data.articleList && Array.isArray(data.articleList)) {
              console.log(
                `[Scraper] API 응답 수집: ${data.articleList.length}개 항목`
              );
              for (const article of data.articleList) {
                try {
                  // 개별 매물 데이터를 표준 형식으로 변환
                  const listing = parseNaverArticle(article);
                  allListings.push(listing);
                } catch (e) {
                  /* 개별 매물 파싱 실패는 무시하고 계속 진행 */
                }
              }
            }
          } catch (e) {
            /* JSON이 아닌 응답이나 기타 오류 무시 */
          }
        }
      });

      // ─── 페이지 접속 ─────────────────────────────────────────
      const url = `https://new.land.naver.com/complexes/${naverComplexId}`;
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
      await delay(2000);

      // ─── "동일매물 묶기" 체크박스 활성화 ───────────────────────
      // 여러 부동산에서 동일 매물을 중복 게시하는 경우가 많아,
      // 네이버의 "동일매물 묶기" 기능을 활성화하여 중복 데이터를 제거합니다.
      try {
        const groupBtn = await page.$("#address_group2");
        if (groupBtn) {
          const isChecked = await page.$eval("#address_group2", (el: any) => {
            const __name = (fn: any) => fn;
            return el.checked;
          });
          if (!isChecked) {
            console.log(`[Scraper] 동일매물 묶기 활성화 중...`);
            // 클릭 전 이전 데이터를 비워서 새로 로딩된 데이터만 수집
            allListings.length = 0;
            await groupBtn.click();
            await delay(2000);
          }
        }
      } catch (e) {
        /* 체크박스가 없는 경우 무시 */
      }

      // ─── 스크롤 다운으로 모든 매물 로딩 ─────────────────────────
      // 네이버 부동산은 스크롤 시 추가 매물을 동적으로 로딩합니다.
      // 최대 15번 스크롤하며, 2회 연속 개수 변동이 없으면 완료로 판단합니다.
      console.log(`[Scraper] 데이터 로드를 위해 스크롤 다운 시작...`);
      let lastCount = 0;    // 이전 스크롤의 매물 수
      let stableCount = 0;  // 연속으로 변동 없는 횟수

      for (let i = 0; i < 15; i++) {
        // 매물 목록 컨테이너를 맨 아래로 스크롤
        await page.evaluate(() => {
          const __name = (fn: any) => fn;
          const container = document.querySelector(".item_list--article");
          if (container) container.scrollTop = container.scrollHeight;
        });
        await delay(800);

        const currentCount = allListings.length;
        if (currentCount > 0 && currentCount === lastCount) {
          stableCount++;
          if (stableCount >= 2) break; // 2회 연속 변화 없으면 로딩 완료
        } else {
          stableCount = 0;
        }
        lastCount = currentCount;
      }

      await delay(500);
      console.log(`[Scraper] 수집 완료: 총 ${allListings.length}개 매물`);

      // 수집된 원시 데이터 그대로 반환 (정렬/가공은 호출자에서 처리)
      return allListings;
    } finally {
      // 브라우저 리소스 정리
      if (browser) await browser.close().catch(() => {});
    }
  });
}
