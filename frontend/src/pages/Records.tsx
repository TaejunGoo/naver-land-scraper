/**
 * @fileoverview 신고가/신저가 매물 목록 페이지
 *
 * 매매 기준 최근 30일간 단지/평형대별 가격이 갱신된 매물을
 * 테이블로 표시합니다.
 *
 * URL의 type 파라미터로 신고가(high)/신저가(low)를 구분합니다:
 * - /records?type=high → 30일 대비 최고가 갱신 매물 (빨간색 테마)
 * - /records?type=low  → 30일 대비 최저가 갱신 매물 (파란색 테마)
 *
 * 데이터: GET /api/stats/records?type=high|low
 */
import { useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { statsApi } from "@/lib/api";
import { useHeaderStore } from "@/lib/store";
import type { PriceRecord } from "@/types";
import { formatPrice, formatArea } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function Records() {
  const [searchParams] = useSearchParams();
  const type = (searchParams.get("type") as "high" | "low") || "high";
  const setHeader = useHeaderStore((state) => state.setHeader);
  const resetHeader = useHeaderStore((state) => state.resetHeader);

  const { data, isLoading } = useQuery({
    queryKey: ["records", type],
    queryFn: () => statsApi.getRecords(type),
  });

  useEffect(() => {
    setHeader({
      title: type === "high" ? "신고가 매물" : "신저가 매물",
      showBackButton: true,
    });

    return () => resetHeader();
  }, [type, setHeader, resetHeader]);

  const records = (data?.data.records || []) as PriceRecord[];

  const getTradeTypeColor = (tradeType: string) => {
    switch (tradeType) {
      case "매매":
        return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700";
      case "전세":
        return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700";
      case "월세":
        return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-700";
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
        <span className="text-muted-foreground font-medium">
          데이터를 불러오는 중...
        </span>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-muted/30 rounded-lg border-2 border-dashed">
        <div
          className={`mb-4 p-4 rounded-full ${
            type === "high" ? "bg-red-100 dark:bg-red-900/30" : "bg-blue-100 dark:bg-blue-900/30"
          }`}
        >
          {type === "high" ? (
            <ArrowUpRight className="w-8 h-8 text-red-600 dark:text-red-400" />
          ) : (
            <ArrowDownRight className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          )}
        </div>
        <p className="text-muted-foreground font-medium mb-2">
          {type === "high" ? "신고가" : "신저가"} 매물이 없습니다
        </p>
        <p className="text-sm text-muted-foreground/70">
          최근 30일 대비 오늘 등록된 {type === "high" ? "신고가" : "신저가"}{" "}
          매물이 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 헤더 정보 */}
      <div
        className={`p-4 rounded-lg border ${
          type === "high"
            ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
            : "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          {type === "high" ? (
            <ArrowUpRight className="w-5 h-5 text-red-600 dark:text-red-400" />
          ) : (
            <ArrowDownRight className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          )}
          <span
            className={`font-bold ${
              type === "high" ? "text-red-700 dark:text-red-300" : "text-blue-700 dark:text-blue-300"
            }`}
          >
            총 {records.length}개의 {type === "high" ? "신고가" : "신저가"} 매물
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          매매 기준, 최근 30일간 단지별·평형대별 최{type === "high" ? "고" : "저"}
          가 대비 가격 갱신 매물
        </p>
      </div>

      {/* 테이블 */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[200px]">단지명</TableHead>
              <TableHead className="w-[90px] text-center">유형</TableHead>
              <TableHead className="w-[120px] text-right">가격</TableHead>
              <TableHead className="w-[110px] text-right">평단가</TableHead>
              <TableHead className="w-[130px] text-center">공급/전용</TableHead>
              <TableHead className="w-[70px] text-center">층</TableHead>
              <TableHead className="w-[80px] text-center">방향</TableHead>
              <TableHead className="min-w-[150px]">메모</TableHead>
              <TableHead className="w-[120px] text-right">수집일시</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow
                key={record.id}
                className={`group hover:brightness-95 transition-all ${
                  type === "high"
                    ? "bg-red-50 dark:bg-red-900/20"
                    : "bg-blue-50 dark:bg-blue-900/20"
                }`}
              >
                <TableCell className="font-medium">
                  <Link
                    to={`/complex/${record.complexId}`}
                    className="hover:underline text-primary"
                  >
                    {record.complexName}
                  </Link>
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant="outline"
                    className={`font-semibold ${getTradeTypeColor(
                      record.tradetype
                    )}`}
                  >
                    {record.tradetype}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-bold text-foreground whitespace-nowrap">
                  {formatPrice(record.price)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground text-xs whitespace-nowrap">
                  {record.pricePerPyeong.toLocaleString()}만
                </TableCell>
                <TableCell className="text-center whitespace-nowrap">
                  {formatArea(record.supplyArea, record.area)}
                </TableCell>
                <TableCell className="text-center whitespace-nowrap">
                  {record.floor}층
                </TableCell>
                <TableCell className="text-center text-muted-foreground whitespace-nowrap">
                  {record.direction || "-"}
                </TableCell>
                <TableCell className="max-w-0" title={record.memo || ""}>
                  <p className="text-xs text-muted-foreground truncate">
                    {record.memo || "-"}
                  </p>
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap italic">
                  {new Date(record.scrapedAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
