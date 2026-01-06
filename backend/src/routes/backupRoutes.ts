import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
// DB path relative to this file (backend/src/routes/backupRoutes.ts)
const dbPath = path.join(__dirname, '../../prisma/dev.db');

// 디렉토리가 없으면 생성 (uploads)
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: 'uploads/' });

/**
 * DB 백업 다운로드
 */
router.get('/download', (req, res) => {
  if (!fs.existsSync(dbPath)) {
    return res.status(404).json({ error: 'DB 파일을 찾을 수 없습니다.' });
  }
  
  const date = new Date().toISOString().split('T')[0];
  const filename = `LandBriefing_Backup_${date}.db`;
  
  res.download(dbPath, filename);
});

/**
 * DB 복구 (업로드)
 */
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '업로드된 파일이 없습니다.' });
  }

  const tempPath = req.file.path;

  try {
    // 1. SQLite 헤더 검증 (처음 16바이트가 "SQLite format 3\0")
    const buffer = Buffer.alloc(16);
    const fd = fs.openSync(tempPath, 'r');
    fs.readSync(fd, buffer, 0, 16, 0);
    fs.closeSync(fd);

    const magic = buffer.toString('utf-8', 0, 15);
    if (magic !== "SQLite format 3") {
      fs.unlinkSync(tempPath);
      return res.status(400).json({ error: '유효한 SQLite 데이터베이스 파일이 아닙니다.' });
    }
    
    // 기존 DB 파일에 덮어쓰기
    fs.copyFileSync(tempPath, dbPath);
    
    // 임시 파일 삭제
    fs.unlinkSync(tempPath);
    
    res.json({ 
      success: true, 
      message: '데이터베이스가 성공적으로 복구되었습니다.' 
    });
  } catch (error) {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    console.error('DB 복구 오류:', error);
    res.status(500).json({ error: '데이터베이스 복구 중 오류가 발생했습니다.' });
  }
});

export default router;
