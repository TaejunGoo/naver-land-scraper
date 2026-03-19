/**
 * @fileoverview 데이터베이스 백업/복구 API 라우트
 *
 * SQLite 데이터베이스 파일(dev.db)의 다운로드 및 업로드를 처리합니다.
 *
 * - GET /download: DB 파일을 .db 파일로 다운로드 (백업)
 * - POST /upload: .db 파일을 업로드하여 기존 DB 교체 (복구)
 *   - 업로드 시 SQLite 헤더("SQLite format 3") 검증을 수행하여
 *     잘못된 파일이 DB를 덮어쓰는 것을 방지합니다.
 */
import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
// DB path: Railway 환경에서는 Volume 마운트 경로, 로컬에서는 기존 경로 사용
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../prisma/dev.db');

// 디렉토리가 없으면 생성 (uploads)
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: 'uploads/' });

/**
 * GET /download - 현재 DB 파일을 다운로드 (백업)
 *
 * SQLite DB 파일을 그대로 다운로드합니다.
 * 파일명: LandBriefing_Backup_YYYY-MM-DD.db
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
 * POST /upload - DB 파일을 업로드하여 복구
 *
 * 동작 흐름:
 * 1. multer로 파일을 임시 저장
 * 2. 파일의 처음 16바이트를 읽어 SQLite 매직 넘버("SQLite format 3\0") 검증
 * 3. 검증 통과 시 기존 dev.db에 덮어쓰기
 * 4. 임시 파일 삭제
 *
 * 유효하지 않은 파일이면 400 오류를 반환하고 임시 파일을 삭제합니다.
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
