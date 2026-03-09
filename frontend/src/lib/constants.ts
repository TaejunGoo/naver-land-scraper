/**
 * @fileoverview 상수 정의
 *
 * 애플리케이션 전체에서 사용되는 상수를 정의합니다.
 * - SUBWAY_LINES: 지하철 노선 목록 (단지 추가/수정 폼의 체크박스에 사용)
 * - getTagColor: 태그명에 따른 노선 색상 배지 클래스 반환
 */

/** 서울 수도권 지하철 노선 목록 (단지 태그 입력 UI에서 체크박스로 표시) */
export const SUBWAY_LINES = [
  "1호선",
  "2호선",
  "3호선",
  "4호선",
  "5호선",
  "6호선",
  "7호선",
  "8호선",
  "9호선",
  "신분당선",
  "수인분당선",
  "경의중앙선",
  "공항철도",
  "GTX-A",
];

/**
 * 태그명에 해당하는 지하철 노선 색상의 Tailwind CSS 클래스를 반환합니다.
 * 각 색상은 서울교통공사의 공식 노선 색상 코드를 사용합니다.
 * ComplexCard 및 ComplexInfo의 태그 배지에 적용됩니다.
 *
 * @param tag - 태그 문자열 (예: "신분당선", "2호선")
 * @returns Tailwind CSS 배경색 클래스 (예: "bg-[#00A84D] hover:bg-[#00A84D]/90")
 */
export const getTagColor = (tag: string) => {
  if (tag.includes("1호선")) return "bg-[#0052A4] hover:bg-[#0052A4]/90";
  if (tag.includes("2호선")) return "bg-[#00A84D] hover:bg-[#00A84D]/90";
  if (tag.includes("3호선")) return "bg-[#EF7C1C] hover:bg-[#EF7C1C]/90";
  if (tag.includes("4호선")) return "bg-[#00A5DE] hover:bg-[#00A5DE]/90";
  if (tag.includes("5호선")) return "bg-[#996CAC] hover:bg-[#996CAC]/90";
  if (tag.includes("6호선")) return "bg-[#CD7C2F] hover:bg-[#CD7C2F]/90";
  if (tag.includes("7호선")) return "bg-[#747F00] hover:bg-[#747F00]/90";
  if (tag.includes("8호선")) return "bg-[#E6186C] hover:bg-[#E6186C]/90";
  if (tag.includes("9호선")) return "bg-[#BDB092] hover:bg-[#BDB092]/90";
  if (tag.includes("신분당")) return "bg-[#D4003B] hover:bg-[#D4003B]/90";
  if (tag.includes("수인분당")) return "bg-[#F5A200] hover:bg-[#F5A200]/90";
  if (tag.includes("경의중앙")) return "bg-[#77C4A3] hover:bg-[#77C4A3]/90";
  if (tag.includes("공항철도")) return "bg-[#0090D2] hover:bg-[#0090D2]/90";
  if (tag.includes("GTX")) return "bg-[#1E1E1E] hover:bg-[#1E1E1E]/90";
  return "bg-slate-500 hover:bg-slate-500/90";
};
