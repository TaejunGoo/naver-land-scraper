# LandBriefing 기술 명세서 (Technical Specification)

본 문서는 **랜드브리핑 (LandBriefing)** 프로젝트의 아키텍처, 데이터 모델 및 API 설계 사양을 정의합니다.

---

## 1. 시스템 아키텍처

랜드브리핑은 로컬 단일 사용자 환경에 최적화된 **Full-stack Desktop-like Web App**입니다.

- **Frontend**: SPA (React, Vite) 기반의 대시보드. 빌드 후 백엔드에 의해 정적 서빙됨.
- **Backend**: Node.js (Express) 서버. 스크래핑 엔진, API 서버 및 정적 파일 서버 역할 병행.
- **Database**: SQLite (파일 기반). 사용자가 직접 파일을 복사하여 이동 가능한 구조.
- **ORM**: Prisma를 통한 타입 안전한 데이터 액세스.
- **Scraper**: Puppeteer를 통한 자동화된 브라우저 제어.

---

## 2. 데이터 모델 (Schema)

### 2.1 Complex (아파트 단지)
| 필드명 | 타입 | 설명 |
| :--- | :--- | :--- |
| id | Int | 기본키 (Auto Increment) |
| name | String | 단지명 |
| address | String | 주소 |
| naverComplexId| String | 네이버 부동산 고유 ID (크롤링 키) |
| type | String? | 거래 유형 (아파트, 분양권 등) |
| units | Int? | 총 세대수 |
| buildings | Int? | 총 동수 |
| year | Int? | 준공년도 (YYYY) |
| lastScrapedAt | DateTime?| 최신 매물 수집 일시 |
| tags | String? | 지하철 호선 및 태그 (JSON) |
| customNotes | String? | 사용자 메모 |

### 2.2 Listing (매물)
| 필드명 | 타입 | 설명 |
| :--- | :--- | :--- |
| id | Int | 기본키 |
| complexId | Int | 외래키 (Complex.id) |
| tradetype | String | 매매, 전세, 월세 |
| price | Float | 가격 (단위: 만원) |
| area | Float | 전용면적 (m²) |
| supplyArea | Float | 공급면적 (m²) |
| floor | String | 층 정보 |
| direction | String? | 향 (남향, 동향 등) |
| memo | String? | 매물 설명/특이사항 |
| url | String? | 네이버 부동산 상세 링크 |
| scrapedAt | DateTime | 수집 일시 |

---

## 3. 핵심 기능 동작 원리

### 3.1 스크래핑 프로세스
1. **단지 정보 수집**: 네이버 상세 페이지의 메타데이터(세대수, 준공년도 등) 파싱.
2. **매물 수집**:
   - `Puppeteer`를 통해 해당 단지의 매물 목록 요청.
   - 봇 감지 우회를 위해 `puppeteer-extra-plugin-stealth` 및 사용자 행동 모방 적용.
   - 수집된 데이터는 기존 데이터와 중복 여부 판단 없이 히스토리성으로 전량 저장 (시계열 분석용).

### 3.2 시간대 (Timezone) 정책
- 모든 날짜 정보는 **대한민국 표준시 (KST, UTC+9)**로 처리.
- 서버에서 DB 저장 시 및 프론트엔드 노출 시 동일한 로컬 타임 유틸리티를 사용함.

---

## 4. API 명세 (Endpoint)

### 4.1 Complexes
- `GET /api/complexes`: 전체 단지 목록 및 최신 요약 정보 조회
- `POST /api/complexes`: 새 단지 등록
- `PATCH /api/complexes/:id`: 단지 정보 수정 (메모, 태그 등)
- `POST /api/complexes/:id/scrape`: 해당 단지 매물 수집 실행
- `POST /api/complexes/:id/scrape-info`: 해당 단지 메타데이터(세대수 등) 갱신

### 4.2 Listings
- `GET /api/listings/:complexId`: 특정 단지의 매물 목록 조회 (필터링/정렬 파라미터 지원)
- `DELETE /api/listings/:complexId`: 특정 단지의 모든 매물 데이터 삭제
- `POST /api/listings/batch-delete`: 선택된 매물 ID 기반 대량 삭제

### 4.3 Backups
- `GET /api/backups/download`: `dev.db` 파일 다운로드 (백업)
- `POST /api/backups/upload`: `.db` 파일 업로드 및 서버 DB 교체 (복구)

---

## 5. 빌드 및 배포 스펙
- **Integrated Port**: `5500` (환경 변수 PORT 우선)
- **Dev Ports**: Backend `5050`, Frontend `5888`
- **Output Path**: `frontend/dist` -> `backend/src/index.ts`에서 호스팅
