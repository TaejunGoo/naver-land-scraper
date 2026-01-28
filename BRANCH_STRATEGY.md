# 브랜치 전략

이 프로젝트는 **브랜치 분리 전략**을 사용합니다.

## 브랜치 구조

### `main` 브랜치 (프로덕션)
- **용도**: 실제 프로덕션 코드
- **특징**:
  - 백엔드 API 포함 (Express + SQLite/PostgreSQL)
  - 크롤링 기능 활성화
  - 모든 CRUD 기능 동작
  - 로컬 개발 및 실제 사용 목적

### `demo` 브랜치 (데모 배포)
- **용도**: Vercel 데모 배포 전용
- **특징**:
  - 프론트엔드만 포함
  - JSON 기반 샘플 데이터 (8개 단지, 30일 데이터)
  - 모든 수정 버튼 disabled 상태
  - 읽기 전용 포트폴리오 버전

## 브랜치 설정 방법

### 1. 현재 변경사항을 demo 브랜치로 이동

```bash
# 현재 main 브랜치라고 가정
git add .
git commit -m "Setup demo mode with sample data"

# demo 브랜치 생성 및 전환
git checkout -b demo

# GitHub에 푸시
git push -u origin demo
```

### 2. main 브랜치 원상 복구 (옵션)

만약 main 브랜치를 원래 상태로 되돌리고 싶다면:

```bash
# main 브랜치로 돌아가기
git checkout main

# 변경사항 되돌리기 (demo 브랜치 생성 전 커밋으로)
git reset --hard <이전-커밋-해시>

# 또는 특정 파일만 복원
git restore frontend/src/lib/api.ts
git restore frontend/src/components/...
```

### 3. Vercel 배포 설정

**데모 배포:**
1. Vercel에서 새 프로젝트 생성
2. **Git Branch**: `demo` 선택 ⭐
3. Root Directory: `frontend`
4. Framework: Vite
5. Deploy

**프로덕션 배포 (나중에):**
1. Vercel에서 별도 프로젝트 생성
2. **Git Branch**: `main` 선택
3. 백엔드 설정 필요 (Railway, Fly.io 등)

## 브랜치 관리

### 기능 추가 시

**main 브랜치에서 개발:**
```bash
# main에서 새 기능 개발
git checkout main
# ... 코드 수정 ...
git add .
git commit -m "Add new feature"
git push origin main
```

**demo 브랜치에 반영 (선택적):**
```bash
# demo에 merge (필요한 경우만)
git checkout demo
git merge main

# 또는 cherry-pick으로 특정 커밋만
git cherry-pick <커밋-해시>

git push origin demo
```

### 주의사항

❌ **demo → main merge 하지 말것**
- demo는 데모 전용 수정사항 포함
- JSON API, disabled 버튼 등은 main에 불필요

✅ **main → demo merge는 선택적으로**
- 새 기능이나 UI 개선사항만 선택적으로 반영
- merge 후 충돌 해결 필요할 수 있음

## 빠른 참조

```bash
# 브랜치 확인
git branch

# 브랜치 전환
git checkout main    # 프로덕션
git checkout demo    # 데모

# 브랜치 상태 확인
git log --oneline --graph --all

# 원격 브랜치 확인
git branch -r
```

## 현재 브랜치별 차이점

| 항목 | main | demo |
|------|------|------|
| 백엔드 | ✅ Express API | ❌ 없음 |
| 데이터베이스 | ✅ SQLite/PostgreSQL | ❌ JSON 파일 |
| 크롤링 | ✅ Puppeteer | ❌ 비활성화 |
| API | ✅ Axios (실제 API) | ✅ JSON 기반 Mock |
| 버튼 | ✅ 활성화 | ❌ Disabled |
| 배포 | 🔧 백엔드 필요 | ✅ Vercel만으로 가능 |

## 데모 URL

배포 후 README에 추가:
- **Demo**: https://your-project.vercel.app (demo 브랜치)
- **Docs**: GitHub main 브랜치

---

**권장 워크플로우:**
1. main에서 개발
2. demo는 그대로 유지 (스냅샷)
3. 필요시에만 demo 업데이트
