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
