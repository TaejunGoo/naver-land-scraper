/**
 * @fileoverview API 클라이언트 모듈
 *
 * Axios 인스턴스를 생성하고, 백엔드 API 호출 함수들을 모아놓은 모듈입니다.
 * 프론트엔드 전체에서 이 모듈을 통해 API를 호출하며,
 * TanStack Query의 queryFn/mutationFn에서 사용됩니다.
 *
 * API 그룹:
 * - complexApi: 단지 CRUD, 스크래핑, 엑셀 내보내기
 * - listingApi: 매물 조회, 삭제, 더미 데이터 생성
 * - statsApi: 트렌드 통계, 신고가/저가 조회
 */
import axios from "axios";
import type { Complex, Listing, ComplexCreateInput, ComplexUpdateInput } from "../types";

/**
 * Axios 인스턴스 생성.
 * baseURL "/api"는 개발 모드에서 Vite 프록시(→ localhost:5050)를 통해,
 * 프로덕션에서는 동일 서버의 /api 경로로 요청됩니다.
 */
const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

/** 타입 재내보내기 (다른 모듈에서 api.ts를 통해 타입도 함께 가져갈 수 있도록) */
export type { Complex, Listing, ComplexCreateInput, ComplexUpdateInput };

/**
 * 단지(Complex) 관련 API 함수 모음
 */
export const complexApi = {
  /** 전체 단지 목록 조회 (매물 수, 증감, 신고가/저가 포함) */
  getAll: () => api.get<Complex[]>("/complexes"),
  /** 특정 단지 상세 조회 */
  getById: (id: number) => api.get<Complex>(`/complexes/${id}`),
  /** 새 단지 등록 */
  create: (data: ComplexCreateInput) => api.post<Complex>("/complexes", data),
  /** 단지 정보 수정 */
  update: (id: number, data: ComplexUpdateInput) =>
    api.put<Complex>(`/complexes/${id}`, data),
  /** 단지 삭제 (관련 매물도 함께 삭제됨) */
  delete: (id: number) => api.delete(`/complexes/${id}`),
  /** 특정 단지 매물 스크래핑 실행 */
  scrape: (id: number) => api.post(`/complexes/${id}/scrape`),
  /** 특정 단지 메타데이터(세대수 등) 스크래핑 */
  scrapeInfo: (id: number) => api.post(`/complexes/${id}/scrape-info`),
  /** 전체 단지 일괄 매물 스크래핑 */
  scrapeAll: () => api.post("/complexes/scrape-all/listings"),
  /** 테스트용 더미 단지 생성 */
  createTestComplex: (days: number = 365) =>
    api.post("/complexes/create-test-complex", { days }),
  /** 전체 단지 + 매물 엑셀 다운로드 */
  exportAllExcel: () =>
    api.get("/complexes/export/excel", { responseType: "blob" }),
  /** 특정 단지 매물 엑셀 다운로드 */
  exportByIdExcel: (id: number) =>
    api.get(`/complexes/${id}/export/excel`, { responseType: "blob" }),
};

/**
 * 통계(Stats) 관련 API 함수 모음
 */
export const statsApi = {
  /** 전체 시장 트렌드 조회 (일별 매물 수, 평당가, 요약) */
  getTrend: (days: number = 30) => api.get(`/stats/trend?days=${days}`),
  /** 신고가/신저가 매물 상세 목록 조회 */
  getRecords: (type: 'high' | 'low') => api.get(`/stats/records?type=${type}`),
};

/**
 * 매물(Listing) 관련 API 함수 모음
 */
export const listingApi = {
  /**
   * 특정 단지의 매물 목록 조회 (필터/정렬 지원)
   * @param complexId - 조회할 단지 ID
   * @param params - 쿼리 파라미터 (거래유형, 면적 범위, 정렬)
   */
  getByComplexId: (
    complexId: number,
    params?: {
      tradetype?: string[];   // 거래유형 필터 (예: ["매매", "전세"])
      areaMin?: number;       // 최소 면적 (m²)
      areaMax?: number;       // 최대 면적 (m²)
      sortBy?: string;        // 정렬 기준
      sortOrder?: string;     // 정렬 방향
    }
  ) => {
    const queryParams = new URLSearchParams();
    if (params?.tradetype && params.tradetype.length > 0) {
      queryParams.append("tradetype", params.tradetype.join(","));
    }
    if (params?.areaMin) queryParams.append("areaMin", String(params.areaMin));
    if (params?.areaMax) queryParams.append("areaMax", String(params.areaMax));
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder);

    const query = queryParams.toString();
    const url = query
      ? `/listings/${complexId}?${query}`
      : `/listings/${complexId}`;
    return api.get<Listing[]>(url);
  },
  /** 단건 매물 삭제 */
  delete: (id: number) => api.delete(`/listings/${id}`),
  /** 복수 매물 일괄 삭제 */
  batchDelete: (ids: number[]) => api.post("/listings/batch-delete", { ids }),
  /** 특정 단지의 전체 매물 삭제 */
  deleteAll: (complexId: number) =>
    api.delete(`/listings/complex/${complexId}/all`),
  /** 테스트용 더미 매물 생성 */
  generateDummy: (complexId: number, days: number = 365) =>
    api.post(`/listings/complex/${complexId}/generate-dummy`, { days }),
};

export default api;
