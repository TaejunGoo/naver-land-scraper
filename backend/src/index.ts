/**
 * @fileoverview 서버 엔트리포인트
 *
 * Express 서버를 초기화하고 모든 라우트, 미들웨어, 정적 파일 서빙을 설정합니다.
 * 서버 시작 시 SQLite 데이터베이스를 backups/ 폴더에 자동 백업합니다.
 *
 * 주요 역할:
 * - API 라우트 등록 (/api/complexes, /api/listings, /api/backups, /api/stats)
 * - 프론트엔드 빌드 결과물(frontend/dist) 정적 서빙
 * - SPA 라우팅 폴백 (모든 GET → index.html)
 * - 서버 시작 시 자동 DB 백업 (최대 5개 보관, 오래된 파일 자동 삭제)
 */
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import complexRoutes from './routes/complexRoutes.js'
import listingRoutes from './routes/listingRoutes.js'
import backupRoutes from './routes/backupRoutes.js'
import statsRoutes from './routes/statsRoutes.js'
import fs from 'fs'

/** 환경변수 로드 (.env 파일에서 DATABASE_URL 등 설정) */
dotenv.config()

/** ESM 환경에서 __dirname 대체 변수 생성 */
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** Express 앱 인스턴스 생성 */
const app = express()

/** 서버 포트: 환경변수 PORT가 있으면 사용, 없으면 5050 (개발 모드) */
const PORT = process.env.PORT || 5050

// ─── 미들웨어 설정 ───────────────────────────────────────────────
/** CORS 허용: 프론트엔드 개발 서버(localhost:5888)에서의 API 호출 허용 */
app.use(cors())
/** JSON 요청 바디 파싱 */
app.use(express.json())

// ─── API 라우트 등록 ──────────────────────────────────────────────
/** 단지(Complex) CRUD, 매물 스크래핑, 엑셀 내보내기 등 */
app.use('/api/complexes', complexRoutes)
/** 매물(Listing) 조회, 삭제, 더미 데이터 생성 등 */
app.use('/api/listings', listingRoutes)
/** DB 백업 다운로드 및 복구 업로드 */
app.use('/api/backups', backupRoutes)
/** 시장 트렌드 통계 및 신고가/저가 조회 */
app.use('/api/stats', statsRoutes)

// ─── 헬스 체크 ────────────────────────────────────────────────────
/** 서버 정상 동작 확인 엔드포인트 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// ─── 프론트엔드 정적 파일 서빙 ────────────────────────────────────
/** 프로덕션 빌드된 React 앱(frontend/dist)을 정적 파일로 제공 */
const frontendPath = path.join(__dirname, '../../frontend/dist')
app.use(express.static(frontendPath))

/** SPA 폴백: API가 아닌 모든 GET 요청을 index.html로 리다이렉트 */
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'))
})

/**
 * 서버 시작 시 SQLite 데이터베이스를 자동 백업하는 함수.
 *
 * 동작 방식:
 * 1. dev.db 파일이 존재하면 backups/ 폴더에 타임스탬프 파일명으로 복사
 * 2. 최대 보관 개수(MAX_BACKUPS=5)를 초과하면 오래된 백업 파일부터 삭제
 *
 * 이 함수는 서버가 시작될 때마다 1회 실행되어, 데이터 손실을 방지합니다.
 */
const backupDatabase = () => {
  const dbPath = path.join(__dirname, '../prisma/dev.db');
  const backupDir = path.join(__dirname, '../backups');
  const MAX_BACKUPS = 5; // 최대 보관 개수 설정
  
  if (fs.existsSync(dbPath)) {
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }
    
    // 1. 새로운 백업 생성: ISO 형식 타임스탬프를 파일명에 포함
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupPath = path.join(backupDir, `dev_backup_${timestamp}.db`);
    fs.copyFileSync(dbPath, backupPath);
    console.log(`[Backup] Database backed up to: ${backupPath}`);

    // 2. 오래된 백업 파일 정리: 최신순 정렬 후 MAX_BACKUPS 초과분 삭제
    const files = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('dev_backup_') && file.endsWith('.db'))
      .map(file => ({
        name: file,
        path: path.join(backupDir, file),
        mtime: fs.statSync(path.join(backupDir, file)).mtime
      }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime()); // 최신순 정렬

    if (files.length > MAX_BACKUPS) {
      files.slice(MAX_BACKUPS).forEach(file => {
        fs.unlinkSync(file.path);
        console.log(`[Backup] Old backup removed: ${file.name}`);
      });
    }
  }
};

// 서버 시작 시 자동 백업 실행
backupDatabase();

/** Express 서버 시작 및 포트 리스닝 */
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
