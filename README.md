# 랜드브리핑 (LandBriefing)

**네이버 부동산 데이터를 나만의 자산으로 관리하는 스마트 대시보드**

랜드브리핑은 네이버 부동산의 아파트 정보를 크롤링하여 시계열 데이터로 저장하고, 시세 변화를 한눈에 파악할 수 있도록 돕는 로컬 기반 데이터 관리 도구입니다.

---

## ✨ 주요 기능

- **통합 상세 정보 관리**: 관심 단지의 세대수, 준공년도, 지하철 노선, 단지 메모 등을 원클릭으로 수집 및 관리
- **시계열 시세 차트**: 수집 누적 데이터 기반 매매/전세/월세 가격 변동 추이 시각화 (Recharts)
- **데이터 백업 및 공유**: 수집된 전체 데이터를 `.db` 파일로 내보내거나 가져오기 (다른 유저와 데이터 팩 공유 가능)
- **스마트 필터링 & 정렬**: 면적별, 거래유형별, 날짜별 필터와 다양한 정렬 기능 제공
- **강력한 스크래핑**: Puppeteer Stealth 모드를 적용하여 봇 감지를 최소화한 안정적인 수집
- **원클릭 실행기**: 별도의 터미널 명령어 없이 아이콘 클릭만으로 설치부터 실행까지 자동 완료

## 🚀 시작하기 (가장 쉬운 방법)

Windows 사용자라면 복잡한 명령어 없이 바로 시작할 수 있습니다.

1. **선행 조건**: [Node.js (LTS)](https://nodejs.org/)가 설치되어 있어야 합니다.
2. **실행**: 프로젝트 루트 폴더의 `LandBriefing.bat` 파일을 더블 클릭합니다.
   - 최초 실행 시 필요한 라이브러리 설치와 데이터베이스 설정을 자동으로 진행합니다.
   - 실행 후 브라우저에서 `http://localhost:5500`이 자동으로 열립니다.
3. **팁**: `LandBriefing.bat` 파일의 바로가기를 바탕화면에 만들어 편리하게 사용하세요.

## 🛠 기술 스택

### Frontend
- **Framework**: React 18, Vite
- **UI Component**: shadcn/ui (Official), Tailwind CSS, Lucide React
- **State**: TanStack Query (v5), Zustand (Global Alert & Header)
- **Timezone**: **대한민국 표준시(KST, UTC+9)** 고정 처리

### Backend
- **Runtime**: Node.js (Express)
- **Database**: SQLite (파일 기반 무설치 DB)
- **ORM**: Prisma
- **Scraping**: Puppeteer (Headless: "new", Stealth Patch)

## 📁 프로젝트 구조

```
naver-land-scraper/
├── LandBriefing.bat       # Windows 통합 실행기
├── frontend/              # 프론트엔드 (React + Vite)
│   ├── src/components/    # 도메인별 모듈화된 컴포넌트
│   ├── src/lib/           # KST 유틸리티 및 API 정의
│   └── dist/              # 빌드된 정적 파일 (서버가 직접 서빙)
├── backend/               # 백엔드 (Express + Prisma)
│   ├── src/scrapers/      # 네이버 부동산 스크래핑 엔진
│   ├── src/routes/        # API 및 백업/복구 라우트
│   └── prisma/            # SQLite 스키마 및 DB 파일 (dev.db)
└── package.json           # 개발 및 통합 관리 설정
```

## 💾 데이터 백업 및 복구

메인 화면 하단의 **[데이터 매니지먼트]** 섹션에서 다음 작업이 가능합니다.

- **내보내기**: 지금까지 수집한 모든 단지 정보와 시세 데이터를 `.db` 파일로 저장합니다. 
- **불러오기**: 다른 컴퓨터에서 사용하던 데이터나 친구가 공유해 준 데이터를 내 앱에 즉시 반영합니다.

## ⚠️ 주의사항

- 이 도구는 **개인적인 학습 및 데이터 분석용**으로 제작되었습니다.
- 네이버 부동산 서비스에 과도한 부하를 줄 경우 사이트 이용이 제한될 수 있으므로 주의해 주세요.
- 비정상적인 대량 수집 행위는 관련 법령이나 서비스 이용약관에 저촉될 수 있습니다.

## 📝 라이선스
MIT License
