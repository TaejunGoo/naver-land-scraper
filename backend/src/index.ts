import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import complexRoutes from './routes/complexRoutes.js'
import listingRoutes from './routes/listingRoutes.js'
import backupRoutes from './routes/backupRoutes.js'
import fs from 'fs'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5050

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/complexes', complexRoutes)
app.use('/api/listings', listingRoutes)
app.use('/api/backups', backupRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Static files (Frontend)
const frontendPath = path.join(__dirname, '../../frontend/dist')
app.use(express.static(frontendPath))

// SPA support: fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'))
})

const backupDatabase = () => {
  const dbPath = path.join(__dirname, '../prisma/dev.db');
  const backupDir = path.join(__dirname, '../backups');
  const MAX_BACKUPS = 5; // 최대 보관 개수 설정
  
  if (fs.existsSync(dbPath)) {
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }
    
    // 1. 새로운 백업 생성
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupPath = path.join(backupDir, `dev_backup_${timestamp}.db`);
    fs.copyFileSync(dbPath, backupPath);
    console.log(`[Backup] Database backed up to: ${backupPath}`);

    // 2. 오래된 백업 파일 정리 (용량 관리)
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

// ⭐ 아래 라인을 추가하여 서버 시작 시 백업 함수를 실행합니다!
backupDatabase();

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
