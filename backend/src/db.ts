/**
 * @fileoverview Prisma 클라이언트 싱글턴 모듈
 *
 * Prisma 클라이언트를 애플리케이션 전체에서 단일 인스턴스로 관리합니다.
 * 개발 모드에서 Hot Reload 시 여러 Prisma 인스턴스가 생성되는 것을 방지하기 위해
 * globalThis에 캐싱하는 싱글턴 패턴을 적용합니다.
 *
 * 사용법: import prisma from './db.js' 로 가져와서 사용
 */
import { PrismaClient } from '@prisma/client'

/**
 * Prisma 클라이언트 인스턴스를 생성하는 팩토리 함수.
 * 내부적으로 SQLite 데이터베이스(dev.db)에 연결합니다.
 */
const prismaClientSingleton = () => {
  return new PrismaClient()
}

/**
 * 글로벌 타입 확장: 개발 모드에서 Prisma 인스턴스를 전역에 캐싱하기 위한 선언.
 * TypeScript가 globalThis.prismaGlobal을 인식할 수 있도록 합니다.
 */
declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

/**
 * 실제 사용되는 Prisma 클라이언트 인스턴스.
 * - 기존에 전역에 캐싱된 인스턴스가 있으면 재사용
 * - 없으면 새로 생성
 */
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

/**
 * 개발 모드에서만 생성된 인스턴스를 전역에 캐싱.
 * 프로덕션에서는 매번 새 인스턴스가 필요하므로 캐싱하지 않음.
 */
if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
