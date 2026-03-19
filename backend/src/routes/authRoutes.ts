/**
 * @fileoverview 인증(Auth) API 라우트
 *
 * 로그인 및 토큰 검증 엔드포인트를 제공합니다.
 * 환경변수의 ADMIN_USERNAME / ADMIN_PASSWORD와 대조하여 JWT를 발급합니다.
 *
 * - POST /login   ID/PW 확인 후 JWT 발급
 * - GET  /verify   토큰 유효성 확인
 */
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { timingSafeEqual } from 'crypto';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

/**
 * POST /login - 로그인
 *
 * body: { username, password }
 * 환경변수에 설정된 관리자 계정과 일치하면 JWT 토큰을 반환합니다.
 * 토큰 유효기간: 7일
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // timing-safe 비교: 길이가 다른 경우에도 동일한 시간을 소비하도록 패딩
  try {
    const usernameMatch = timingSafeEqual(
      Buffer.from(username ?? ''),
      Buffer.from(ADMIN_USERNAME)
    );
    const passwordMatch = timingSafeEqual(
      Buffer.from(password ?? ''),
      Buffer.from(ADMIN_PASSWORD)
    );

    if (!usernameMatch || !passwordMatch) {
      return res.status(401).json({ error: '아이디 또는 비밀번호가 일치하지 않습니다.' });
    }
  } catch {
    // Buffer 길이 불일치 시 timingSafeEqual이 throw — 실패로 처리
    return res.status(401).json({ error: '아이디 또는 비밀번호가 일치하지 않습니다.' });
  }

  const token = jwt.sign(
    { username, role: 'admin' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token, username });
});

/**
 * GET /verify - 토큰 유효성 확인
 *
 * Authorization: Bearer <token> 헤더 필요.
 * 유효한 토큰이면 { valid: true }를 반환합니다.
 */
router.get('/verify', (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ valid: false });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ valid: false });
  }
});

export default router;
