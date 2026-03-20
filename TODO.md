# TODO

## 🚧 Railway 배포 현황 (2026-03-20)

| 항목 | 상태 |
|------|:---:|
| Railway 배포 (`dev` 브랜치 자동 배포) | ✅ |
| 로그인 / JWT 인증 | ✅ |
| DB Volume 영속화 (`/app/data/dev.db`) | ✅ |
| Serverless 슬립 모드 (월 ~$0.10) | ✅ |
| GitHub Actions 자동 크론 (KST 09:00) | ✅ |
| **자동 크롤링 동작** | ❌ |

---

## ❌ 자동 크롤링 미동작 원인

네이버가 Railway 클라우드 IP를 봇으로 감지해 연결을 차단합니다.

```
ERR_CONNECTION_RESET at https://new.land.naver.com/complexes/...
```

클라우드 서버(Railway, AWS, GCP 등)의 IP는 데이터센터 IP로 분류되어  
네이버의 봇 방지 정책에 의해 TCP 연결 자체가 리셋됩니다.

---

## 📋 해결 방법: 주거용 IP 프록시

### Step 1. 프록시 서비스 가입

**[webshare.io](https://webshare.io)** Residential 플랜 추천
- 월 1GB / $4 수준
- 단지 10개 일일 1회 크롤링 시 월 트래픽 ≈ 10~50MB → 충분

가입 후 `Proxy List` 탭에서 아래 형식의 주소 확인:
```
http://username:password@proxy.webshare.io:포트번호
```

### Step 2. Railway 환경변수 추가

Railway 대시보드 → 서비스 → Variables:
```
PROXY_URL=http://username:password@proxy.webshare.io:포트번호
```

### Step 3. 코드 수정

`backend/src/scrapers/naverScraper.ts`의 `LAUNCH_OPTIONS.args` 배열에 추가:

```typescript
// 프록시 설정: PROXY_URL 환경변수로 주거용 IP 프록시 적용
...(process.env.PROXY_URL ? [`--proxy-server=${process.env.PROXY_URL}`] : []),
```

> 로컬 개발 시 `PROXY_URL` 없으면 직접 연결로 정상 동작
