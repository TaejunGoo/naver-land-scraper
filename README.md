# 네이버 부동산 크롤러

React, Official shadcn/ui, Tailwind CSS 기반 네이버 부동산 아파트 정보 크롤링 및 시계열 관리 도구

## 주요 기능

- **단지 관리**: 관심 아파트 단지 등록 및 관리 (등록 시 단지 상세정보 자동 수집)
- **정보 크롤링**: 네이버 부동산 기반 단지 상세정보(세대수, 준공년도 등) 및 실시간 매물 데이터 수집
- **데이터 시각화**: 수집된 매물 데이터를 바탕으로 기간별 가격 추이 차트 제공 (Recharts)
- **스마트 필터링**: 거래유형(매매/전세/월세), 전용면적, 수집 기간별 매물 필터링
- **정렬 기능**: 단지 목록 다중 정렬 (이름순, 세대수순, 연차순, 오늘 매물수순)
- **전역 알림 시스템**: Zustand 기반의 통일된 Alert/Confirm UI (shadcn/ui Alert-Dialog)
- **현지화 로직**: 모든 날짜와 시간 처리를 **대한민국 표준시(KST, UTC+9)** 기준으로 통일

## 기술 스택

### Frontend
- **Framework**: React 18, Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS, shadcn/ui (Official)
- **State Management**: TanStack Query (v5), Zustand
- **Visualization**: Recharts
- **Routing**: React Router DOM

### Backend
- **Runtime**: Node.js (Express)
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: SQLite
- **Scraping**: Puppeteer, Axios

## 설치 및 실행

### 1. 프로젝트 초기화 (한 번에 설치 및 DB 설정)

루트 디렉토리에서 아래 명령어를 실행하면 프론트엔드/백엔드 의존성 설치와 데이터베이스 마이그레이션을 한 번에 마칠 수 있습니다.

```bash
npm run init
```

### 2. 수동 설치 (단계별 실행 시)

```bash
# 전체 의존성 설치 (Root, Frontend, Backend)
npm install
cd frontend && npm install
cd ../backend && npm install

# 데이터베이스 설정
cd ../backend
npx prisma migrate dev --name init
npx prisma generate
```

### 3. 개발 서버 실행

```bash
# 루트 디렉토리에서 (Concurrently를 이용한 동시 실행)
npm run dev
```

## 프로젝트 구조

```
naver-land-scraper/
├── frontend/              # 프론트엔드 (React)
│   ├── src/
│   │   ├── components/
│   │   │   ├── complex/   # 단지/매물 관련 도메인 컴포넌트
│   │   │   └── ui/        # shadcn/ui 공통 컴포넌트
│   │   ├── lib/           # KST 유틸리티, API 정의, Zustand 스토어
│   │   └── pages/         # 리스트 및 상세 페이지
├── backend/               # 백엔드 (Express)
│   ├── src/
│   │   ├── routes/        # 단지 및 매물 API 라우트
│   │   ├── scrapers/      # Puppeteer 기반 네이버 부동산 스크래퍼
│   │   └── db.ts          # Prisma Client 설정
│   └── prisma/            # SQLite 스키마 및 마이그레이션 파일
└── package.json           # 루트 설정 (Scripts: dev, build 등)
```

## 사용 방법

1. **단지 추가**: 메인 상단의 "단지 추가" 버튼으로 네이버 부동산 단지 ID(예: 12345)를 포함하여 등록합니다.
2. **자동 수집**: 단지 등록 시 기본 상세 정보(연차, 세대수 등)가 자동으로 수집됩니다.
3. **매물 수집**: 상세 페이지에서 "매물 수집" 버튼을 누르면 해당 시점의 모든 매물을 가져와 DB에 기록합니다.
4. **추이 분석**: 여러 번 수집이 반복되면 차트 영역에서 가격 흐름을 한눈에 확인할 수 있습니다.
5. **정렬 및 필터**: 상단 정렬 메뉴와 필터 도구를 사용하여 수천 개의 매물 중 원하는 데이터만 빠르게 골라냅니다.

## 주의사항

- 이 도구는 개인적인 학습 및 데이터 분석용으로 제작되었습니다.
- 네이버 부동산 서비스에 부하를 줄 수 있는 과도한 크롤링(매초 반복 등)은 삼가해 주세요.
- 자동화된 스크래핑 행위는 사이트 이용약관에 위배될 수 있으므로 주의가 필요합니다.
