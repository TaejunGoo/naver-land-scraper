/**
 * @fileoverview JWT 기반 인증 미들웨어
 *
 * 모든 보호된 API 라우트에 적용되어, 유효한 JWT 토큰이 있는 요청만 통과시킵니다.
 * Authorization: Bearer <token> 헤더를 검증합니다.
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/** JWT 시크릿 키 (환경변수에서 가져옴) */
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';

/**
 * JWT 인증 미들웨어.
 * - Authorization 헤더에서 Bearer 토큰 추출
 * - 토큰 유효성 검증
 * - 유효하지 않으면 401 응답 반환
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
