# 네이버 부동산 크롤러

React, shadcn/ui, Tailwind CSS 기반 네이버 부동산 아파트 정보 크롤링 및 관리 툴

## 기능

- 관심 아파트 단지 등록 및 관리
- 네이버 부동산에서 단지 정보 크롤링
- 단지별 매물 정보 수집
- 커스텀 메모 추가 기능
- 시계열 매물 데이터 추적

## 기술 스택

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- React Router
- TanStack Query (React Query)

### Backend
- Node.js
- Express
- TypeScript
- Prisma ORM
- SQLite
- Puppeteer (웹 스크래핑)

## 설치 및 실행

### 1. 의존성 설치

```bash
# 루트 의존성 설치
npm install

# 프론트엔드 의존성 설치
cd frontend
npm install

# 백엔드 의존성 설치
cd ../backend
npm install
```

### 2. 데이터베이스 설정

```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

### 3. 개발 서버 실행

```bash
# 루트 디렉토리에서 (프론트엔드 + 백엔드 동시 실행)
npm run dev

# 또는 개별 실행
npm run dev:frontend  # 프론트엔드만 (http://localhost:3000)
npm run dev:backend   # 백엔드만 (http://localhost:5000)
```

## 프로젝트 구조

```
naver-land-scraper/
├── frontend/              # React 프론트엔드
│   ├── src/
│   │   ├── components/    # UI 컴포넌트
│   │   ├── pages/         # 페이지 컴포넌트
│   │   ├── lib/           # 유틸리티 & API
│   │   └── main.tsx       # 엔트리 포인트
│   └── package.json
├── backend/               # Express 백엔드
│   ├── src/
│   │   ├── routes/        # API 라우트
│   │   ├── services/      # 비즈니스 로직
│   │   ├── scrapers/      # 크롤링 로직
│   │   └── index.ts       # 서버 엔트리
│   ├── prisma/            # DB 스키마
│   └── package.json
└── package.json           # 루트 package.json
```

## 사용 방법

1. **단지 추가**: 메인 페이지에서 "단지 추가" 버튼을 클릭하여 새 단지 등록
2. **네이버 단지 ID 설정**: 단지 상세 페이지에서 네이버 부동산의 단지 ID 입력
3. **매물 크롤링**: "매물 크롤링" 버튼을 눌러 최신 매물 정보 수집
4. **커스텀 메모**: 각 단지에 대한 추가 정보를 메모로 저장

## 주의사항

- 네이버 부동산의 이용약관을 준수하여 사용하세요
- 과도한 크롤링은 IP 차단의 원인이 될 수 있습니다
- 개인적인 용도로만 사용을 권장합니다
