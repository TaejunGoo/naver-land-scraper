# Vercel 배포 가이드 - 프론트엔드 전용 (Static Site)

이 가이드는 프론트엔드만 Vercel에 정적 사이트로 배포하는 방법을 설명합니다.

## ✨ 데모 버전 특징

- **샘플 데이터**: 8개 아파트 단지, 30일간 약 2,747개의 매물 데이터 포함
- **읽기 전용**: 크롤링/추가/수정/삭제 버튼들이 disabled 상태로 표시됨
- **UI 완전 보존**: 모든 버튼과 기능이 보이지만 비활성화됨
- **빠른 로딩**: 백엔드 API 없이 모든 데이터가 JSON 파일로 프론트엔드에 포함
- **무료 배포**: Vercel 무료 티어로 충분

## 📁 프로젝트 구조 변경사항

### 데이터 파일
- `frontend/src/data/sample-data.json` - 샘플 아파트 및 매물 데이터 (약 900KB)

### API 레이어 수정
- `frontend/src/lib/api.ts` - JSON 데이터 기반 API로 변경
- 실제 HTTP 요청 대신 로컬 JSON 파일 사용
- 수정 기능들은 에러 메시지 반환

### UI 변경사항
- 크롤링/수정/삭제 버튼들을 **disabled 상태**로 변경 (보이지만 클릭 불가)
- 모든 버튼에 "데모 모드에서는 사용할 수 없습니다" 툴팁 추가
- 버튼 아이콘에 opacity 효과 적용
- 데이터 관리 섹션의 버튼들도 disabled 처리

## 🚀 Vercel 배포 방법

### 방법 1: Vercel Dashboard (추천)

1. **GitHub 저장소에 푸시**
   ```bash
   git add .
   git commit -m "Setup for static deployment"
   git push
   ```

2. **Vercel Dashboard에서 프로젝트 Import**
   - https://vercel.com/new 접속
   - GitHub 저장소 선택

3. **프로젝트 설정**

   **Framework Preset**: `Vite`

   **Root Directory**: `frontend` ⭐ 중요!

   **Build Command**:
   ```bash
   npm run build
   ```

   **Output Directory**:
   ```
   dist
   ```

   **Install Command**:
   ```bash
   npm install
   ```

4. **Deploy 버튼 클릭**

### 방법 2: Vercel CLI

```bash
# Vercel CLI 설치 (글로벌)
npm install -g vercel

# 로그인
vercel login

# frontend 디렉토리로 이동
cd frontend

# 배포
vercel

# 프로덕션 배포
vercel --prod
```

## 📝 배포 후 확인사항

1. **홈페이지**: `https://your-domain.vercel.app/`
   - 8개 단지 표시
   - 대시보드 통계 표시

2. **단지 상세**: 각 단지 클릭 시
   - 매물 리스트 표시
   - 차트 및 통계 동작
   - 크롤링/수정 버튼들이 disabled 상태로 표시
   - 버튼에 마우스 올리면 "데모 모드에서는 사용할 수 없습니다" 툴팁 표시

3. **추세 분석**: `/trend` 페이지
   - 30일간 추세 그래프
   - 통계 요약

## 🛠️ 로컬 테스트

배포 전에 로컬에서 빌드를 테스트하세요:

```bash
# frontend 디렉토리에서
cd frontend

# 빌드
npm run build

# 빌드된 파일 미리보기
npm run preview
```

브라우저에서 `http://localhost:4173` 접속하여 확인

## ⚙️ Vercel 프로젝트 설정 요약

만약 Vercel Dashboard에서 설정을 변경해야 한다면:

**Settings > General**
- Build & Development Settings
  - Framework Preset: `Vite`
  - Root Directory: `frontend`
  - Build Command: `npm run build`
  - Output Directory: `dist`

**Settings > Environment Variables**
- 필요 없음 (환경 변수 사용하지 않음)

## 📦 빌드 결과물

빌드 후 생성되는 파일들:

```
frontend/dist/
├── index.html          # 메인 HTML
├── assets/
│   ├── index-xxx.js    # 번들된 JavaScript (약 1.3MB)
│   └── index-xxx.css   # 스타일 (약 47KB)
└── vite.svg            # 파비콘
```

**참고**: JSON 데이터(900KB)가 JavaScript 번들에 포함되어 있습니다.

## 🔧 트러블슈팅

### 빌드 실패
- Node.js 버전 확인: v18 이상 권장
- `frontend` 디렉토리가 Root Directory로 설정되어 있는지 확인

### 데이터가 표시되지 않음
- 브라우저 개발자 도구 Console 확인
- `sample-data.json` 파일이 빌드에 포함되었는지 확인

### 404 에러
- Vercel의 SPA 라우팅이 자동으로 처리됨
- React Router 설정이 올바른지 확인

## 🎨 커스터마이징

### 샘플 데이터 변경
`frontend/src/data/sample-data.json` 파일을 직접 편집하거나, 루트의 `scripts/generateSampleData.ts`를 수정한 후 재생성:

```bash
# 루트 디렉토리에서
npx tsx scripts/generateSampleData.ts
```

### 단지/매물 개수 변경
`scripts/generateSampleData.ts` 파일 수정:
- `complexes` 배열: 단지 추가/제거
- `days` 변수: 수집 기간 변경

## 🔄 프로덕션 모드로 전환

실제 크롤링 기능을 사용하려면 백엔드가 필요합니다:

1. **별도의 백엔드 배포** (Railway, Fly.io, AWS 등)
2. **데이터베이스 설정** (PostgreSQL, MySQL 등)
3. **프론트엔드에서 API URL 변경**
4. **원본 API 코드 복원**

자세한 내용은 `README.md`와 `SPEC.md`를 참고하세요.

## 📌 주의사항

- 이 배포는 **데모/포트폴리오 용도**입니다
- 실제 데이터 수집이나 수정은 불가능합니다
- 모든 데이터는 정적 JSON 파일입니다
- 버튼들이 보이지만 disabled 상태로 클릭이 불가능합니다
- 버튼 클릭 시 "데모 모드에서는 사용할 수 없습니다" 메시지가 표시될 수 있습니다

## 🆘 문제 해결

문제가 발생하면:
1. Vercel 배포 로그 확인
2. GitHub Actions/Workflows 확인 (있는 경우)
3. 로컬 빌드가 성공하는지 확인
4. Vercel 공식 문서 참고: https://vercel.com/docs

---

**성공적인 배포 완료!** 🎉

배포 URL을 포트폴리오나 README에 추가하세요.
