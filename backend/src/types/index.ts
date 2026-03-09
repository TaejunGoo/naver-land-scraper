/**
 * @fileoverview 백엔드 타입 정의
 *
 * 프로젝트 전체에서 사용되는 데이터 구조를 TypeScript 인터페이스로 정의합니다.
 * Prisma 스키마와 대응되는 타입 + 스크래핑 전용 타입을 포함합니다.
 */

/**
 * 아파트 단지 정보 인터페이스 (DB Complex 모델 대응)
 */
export interface Complex {
  /** 고유 ID (자동 증가 PK) */
  id: number;
  /** 단지명 (예: "래미안강남") */
  name: string;
  /** 주소 (예: "서울시 강남구 개포동") */
  address: string;
  /** 네이버 부동산 고유 ID — 크롤링 시 URL의 키로 사용 */
  naverComplexId: string | null;
  /** 사용자가 자유롭게 입력하는 메모 */
  customNotes: string | null;
  /** 지하철 호선 및 기타 태그 (JSON 문자열) */
  tags: string | null;
  /** 아파트 유형 (아파트, 분양권 등) */
  type: string | null;
  /** 총 세대수 */
  units: number | null;
  /** 총 동수 */
  buildings: number | null;
  /** 준공년도 (YYYY) */
  year: number | null;
  /** 사용승인일 (예: "2020.01") */
  approvalDate: string | null;
  /** 최종 매물 수집 일시 */
  lastScrapedAt: string | null;
  /** 최종 단지 정보 수집 일시 */
  infoScrapedAt: string | null;
  /** 레코드 생성 일시 */
  createdAt: string;
  /** 레코드 수정 일시 */
  updatedAt: string;
}

/**
 * 매물 정보 인터페이스 (DB Listing 모델 대응)
 */
export interface Listing {
  /** 고유 ID (자동 증가 PK) */
  id: number;
  /** 소속 단지 ID (Complex.id 외래키) */
  complexId: number;
  /** 거래유형: "매매" | "전세" | "월세" */
  tradetype: string;
  /** 가격 (만원 단위, 월세의 경우 월세 금액) */
  price: number;
  /** 전용면적 (m²) */
  area: number;
  /** 공급면적 (m²) */
  supplyArea: number;
  /** 층 정보 (예: "15", "고" 등) */
  floor: string;
  /** 향 (예: "남향", "동향") */
  direction: string | null;
  /** 매물 설명/특이사항 */
  memo: string | null;
  /** 네이버 부동산 매물 상세 링크 */
  url: string | null;
  /** 수집 일시 (ISO 문자열) */
  scrapedAt: string;
}

/**
 * 스크래핑으로 수집된 매물 원시 데이터 (DB 저장용)
 *
 * Listing과 유사하지만 id, complexId, scrapedAt이 없는 "수집 시점"의 데이터입니다.
 * parsers.ts의 parseNaverArticle() 함수가 이 형식으로 변환합니다.
 */
export interface ListingData {
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
  /** 거래유형: "매매" | "전세" | "월세" */
  tradetype: string;
  /** 매물 설명 */
  memo: string | null;
  /** 매물 URL */
  url: string | null;
}

/**
 * 네이버 부동산에서 스크래핑한 단지 메타데이터
 *
 * scrapeComplexInfo() 함수가 이 형식으로 데이터를 반환합니다.
 * Complex 모델의 일부 필드를 업데이트하는 데 사용됩니다.
 */
export interface ComplexInfo {
  /** 아파트 유형 */
  type?: string;
  /** 총 세대수 */
  units?: number;
  /** 총 동수 */
  buildings?: number;
  /** 준공년도 */
  year?: number;
  /** 면적 옵션 리스트 (예: ["59㎡", "84㎡", "104㎡"]) */
  areaOptions?: string[];
  /** 사용승인일 */
  approvalDate?: string;
}
