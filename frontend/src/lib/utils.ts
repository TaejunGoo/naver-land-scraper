/**
 * @fileoverview 범용 유틸리티 함수
 *
 * 여러 컴포넌트에서 공통으로 사용하는 헬퍼 함수들을 모아놓은 모듈입니다.
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind CSS 클래스 합성 유틸리티.
 *
 * clsx로 조건부 클래스를 합성한 뒤, tailwind-merge로 충돌하는 클래스를 해결합니다.
 * shadcn/ui 컴포넌트에서 기본 스타일과 사용자 커스텀 스타일을 안전하게 병합할 때 사용됩니다.
 *
 * @param inputs - 클래스명, 객체, 배열 등의 조합
 * @returns 병합된 Tailwind CSS 클래스 문자열
 *
 * @example
 * cn("p-4 bg-white", isActive && "bg-blue-500", "p-2")
 * // → "bg-blue-500 p-2" (p-4와 p-2 충돌 시 p-2가 우선)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Blob 데이터를 파일로 다운로드합니다.
 *
 * API에서 엑셀 파일(.xlsx)을 Blob으로 받은 뒤,
 * 사용자의 브라우저에서 파일 다운로드를 실행할 때 사용됩니다.
 *
 * 동작 방식:
 * 1. Blob URL 생성
 * 2. 임시 <a> 태그를 만들어 클릭 이벤트 발생
 * 3. 다운로드 후 임시 URL과 태그 정리
 *
 * @param blob - 다운로드할 Blob 데이터
 * @param filename - 저장될 파일명 (예: "전체_데이터_추출_2024-01-15.xlsx")
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
}
