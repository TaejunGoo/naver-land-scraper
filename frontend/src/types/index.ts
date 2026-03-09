/**
 * @fileoverview 프론트엔드 타입 정의
 *
 * 프론트엔드에서 사용하는 모든 데이터 구조를 TypeScript 인터페이스로 정의합니다.
 * 백엔드 API 응답 형식과 대응되며, API 클라이언트(api.ts)에서 제네릭 타입으로 활용됩니다.
 */

/**
 * 아파트 단지 정보 (백엔드 GET /api/complexes 응답)
 *
 * DB의 Complex 모델 + 서버에서 계산된 추가 통계 필드를 포함합니다.
 */
export interface Complex {
  /** 고유 ID */
  id: number;
  /** 단지명 */
  name: string;
  /** 주소 */
  address: string;
  /** 네이버 부동산 고유 ID (크롤링 키) */
  naverComplexId: string | null;
  /** 사용자 메모 */
  customNotes: string | null;
  /** 지하철 호선/태그 (JSON 문자열) */
  tags: string | null;
  /** 유형 (아파트, 분양권 등) */
  type: string | null;
  /** 총 세대수 */
  units: number | null;
  /** 총 동수 */
  buildings: number | null;
  /** 준공년도 */
  year: number | null;
  /** 사용승인일 (예: "2020.01") */
  approvalDate: string | null;
  /** 최종 매물 수집 일시 */
  lastScrapedAt: string | null;
  /** 최종 정보 수집 일시 */
  infoScrapedAt: string | null;
  /** 레코드 생성 일시 */
  createdAt: string;
  /** 레코드 수정 일시 */
  updatedAt: string;

  // ─── 서버에서 계산되어 추가되는 필드들 ─────────────────────
  /** 최근 수집일 총 매물 수 */
  todayListingCount?: number;
  /** 최근 수집일 유형별 매물 수 */
  todayListingCounts?: {
    total: number;  // 전체
    sale: number;   // 매매
    jeonse: number; // 전세
    rent: number;   // 월세
  };
  /** 매물 통계: 최근/직전 수집일 매물 수 및 증감 */
  listingStats?: {
    today: { total: number; sale: number; jeonse: number; rent: number; };
    yesterday: { total: number; sale: number; jeonse: number; rent: number; };
    diff: { total: number; sale: number; jeonse: number; rent: number; };
  };
  /** 전체 데이터 수집 일수 */
  dataDaysCount?: number;
  /** 30일 대비 신고가/신저가 매물 수 */
  recordCounts?: {
    newHighCount: number;
    newLowCount: number;
  };
}

/**
 * 매물 정보 (백엔드 GET /api/listings/:complexId 응답)
 *
 * DB의 Listing 모델 + 신고가/저가 플래그를 포함합니다.
 */
export interface Listing {
  /** 고유 ID */
  id: number;
  /** 소속 단지 ID */
  complexId: number;
  /** 거래유형: "매매" | "전세" | "월세" */
  tradetype: string;
  /** 가격 (만원 단위) */
  price: number;
  /** 전용면적 (m²) */
  area: number;
  /** 공급면적 (m²) */
  supplyArea: number;
  /** 층 정보 */
  floor: string;
  /** 향 */
  direction: string | null;
  /** 매물 설명 */
  memo: string | null;
  /** 네이버 상세 링크 */
  url: string | null;
  /** 수집 일시 (ISO 문자열) */
  scrapedAt: string;
  /** 30일 대비 신고가 여부 (서버에서 계산) */
  isNewHigh?: boolean;
  /** 30일 대비 신저가 여부 (서버에서 계산) */
  isNewLow?: boolean;
}

/**
 * 트렌드 페이지 데이터 (백엔드 GET /api/stats/trend 응답)
 *
 * 일별 시계열 데이터(history)와 요약 통계(summary)를 포함합니다.
 */
export interface TrendData {
  /** 일별 시계열 데이터 배열 */
  history: {
    /** 날짜 (YYYY-MM-DD) */
    date: string;
    /** 전체 매물 수 */
    totalCount: number;
    /** 매매 매물 수 */
    saleCount: number;
    /** 전세 매물 수 */
    jeonseCount: number;
    /** 월세 매물 수 */
    rentCount: number;
    /** 평균 평당가 (만원, m²→평 환산 적용) */
    avgPricePerPyeong: number;
  }[];
  /** 요약 통계 */
  summary: {
    /** 최근 수집일 총 매물 수 */
    todayTotal: number;
    /** 최근 수집일 평균 평당가 (만원) */
    todayAvgPricePerPyeong: number;
    /** 7일 전 대비 가격 변동률 (%) */
    priceChange: number;
    /** 직전 수집일 대비 매물 수 증감 */
    countChange: number;
    /** 순수 신규 매물 수 (기존 단지 기준) */
    newCount: number;
    /** 국평(84㎡) 매매 평균가 (만원) */
    avgPrice84?: number;
    /** 30일 대비 신저가 매물 수 */
    newLowCount?: number;
    /** 30일 대비 신고가 매물 수 */
    newHighCount?: number;
  };
}

/**
 * 스크래핑용 매물 원시 데이터 (parsers.ts 변환 결과)
 */
export interface ListingData {
  price: number;
  area: number;
  supplyArea: number;
  floor: string;
  direction: string | null;
  tradetype: string;
  memo: string | null;
  url: string | null;
}

/**
 * 네이버 부동산 단지 메타데이터 (scrapeComplexInfo 결과)
 */
export interface ComplexInfo {
  type?: string;
  units?: number;
  buildings?: number;
  year?: number;
  areaOptions?: string[];
  approvalDate?: string;
}

/**
 * 단지 생성 요청 타입 (POST /api/complexes body)
 */
export interface ComplexCreateInput {
  name: string;
  address: string;
  naverComplexId?: string | null;
  customNotes?: string | null;
  /** 지하철 호선 + 기타 태그 배열 */
  tags?: string[];
}

/**
 * 단지 수정 요청 타입 (PUT /api/complexes/:id body)
 * 모든 필드가 선택적 (Partial)
 */
export interface ComplexUpdateInput extends Partial<ComplexCreateInput> {}

/**
 * 신고가/신저가 매물 레코드 (GET /api/stats/records 응답)
 *
 * Records 페이지의 테이블 행 데이터로 사용됩니다.
 */
export interface PriceRecord {
  /** 매물 ID */
  id: number;
  /** 단지 ID */
  complexId: number;
  /** 단지명 */
  complexName: string;
  /** 거래유형 */
  tradetype: string;
  /** 가격 (만원) */
  price: number;
  /** 전용면적 (m²) */
  area: number;
  /** 공급면적 (m²) */
  supplyArea: number | null;
  /** 층 */
  floor: string;
  /** 향 */
  direction: string | null;
  /** 매물 설명 */
  memo: string | null;
  /** 네이버 링크 */
  url: string | null;
  /** 수집 일시 */
  scrapedAt: string;
  /** 평형 (평 단위, 정수) */
  pyeong: number;
  /** 평당가 (만원) */
  pricePerPyeong: number;
}
