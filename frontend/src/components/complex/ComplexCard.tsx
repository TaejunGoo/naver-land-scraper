import { Link } from "react-router-dom";
import { ExternalLink, Pencil } from "lucide-react";
import { Complex } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTagColor } from "@/lib/constants";

interface ComplexCardProps {
  complex: Complex;
  onEdit: (complex: Complex) => void;
}

export function ComplexCard({
  complex,
  onEdit,
}: ComplexCardProps) {
  // 사용승인일 기준 연차 계산
  let yearsSinceApproval = "-";
  if (complex.approvalDate) {
    try {
      const approvalYear = parseInt(complex.approvalDate.split(".")[0]);
      if (!isNaN(approvalYear)) {
        const currentYear = new Date().getFullYear();
        const years = currentYear - approvalYear;
        yearsSinceApproval = `${years}년차`;
      }
    } catch (e) {
      // 파싱 실패 시 그냥 '-' 표시
    }
  }

  // 태그 파싱 (배열/문자열 모두 안전하게 처리)
  let tags: string[] = [];
  try {
    if (complex.tags) {
      const parsed = JSON.parse(complex.tags);
      if (Array.isArray(parsed)) {
        tags = parsed;
      } else if (typeof parsed === "string") {
        tags = parsed
          .split(",")
          .map((t: string) => t.trim())
          .filter((t: string) => t);
      }
    }
  } catch (e) {
    // 파싱 실패 시 콤마로 분리 시도 (하위 호환성)
    if (complex.tags && typeof complex.tags === "string") {
      tags = complex.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t);
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="space-y-0 pb-2">
        <CardTitle className="flex items-start justify-between gap-2">
          <span className="flex-1 text-2xl">{complex.name}</span>
          <div className="flex flex-shrink-0">
            {complex.naverComplexId && (
              <a
                href={`https://new.land.naver.com/complexes/${complex.naverComplexId}`}
                target="_blank"
                rel="noopener noreferrer"
                title="네이버 부동산 이동"
              >
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </a>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(complex)}
              className="h-6 w-6"
              title="단지 정보 수정"
            >
              <Pencil className="w-4 h-4" />
            </Button>
          </div>
        </CardTitle>
        <CardDescription className="text-xs mt-0">{complex.address}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 ">
            {tags.map((tag, index) => (
              <Badge
                key={index}
                className={`${getTagColor(
                  tag
                )} text-white border-0 px-1.5`}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
          {/* 단지 상세정보 */}
          <div className="grid grid-cols-2 gap-2 py-2 border-y border-slate-100 text-xs">
            <div className="flex flex-col">
              <span className="text-muted-foreground">🏢 세대수</span>
              <span className="font-semibold text-sm">
                {complex.units || "-"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground">📅 연차</span>
              <span className="font-semibold text-sm">
                {yearsSinceApproval}
              </span>
            </div>
          </div>
          <div className="py-2 text-xs">
            <div className="flex justify-between items-center mb-1">
              <span className="text-muted-foreground">📅 수집 일수</span>
              <span className="font-bold text-sm text-emerald-600">
                {complex.dataDaysCount || 0}일차
              </span>
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-muted-foreground">📊 오늘 매물</span>
              <span className="font-bold text-sm text-blue-600">
                {complex.todayListingCount || 0}개
              </span>
            </div>
            {complex.todayListingCounts && (
              <div className="flex gap-2 justify-end text-[11px] text-slate-500">
                <span className="flex items-center gap-0.5 text-red-500">
                  매매 {complex.todayListingCounts.sale}
                  {complex.listingStats?.diff?.sale ? (
                   <span className="text-[9px] opacity-80">{complex.listingStats.diff.sale > 0 ? "▲" : "▼"}{Math.abs(complex.listingStats.diff.sale)}</span>
                  ) : null}
                </span>
                <span className="flex items-center gap-0.5 text-blue-500">
                  전세 {complex.todayListingCounts.jeonse}
                  {complex.listingStats?.diff?.jeonse ? (
                   <span className="text-[9px] opacity-80">{complex.listingStats.diff.jeonse > 0 ? "▲" : "▼"}{Math.abs(complex.listingStats.diff.jeonse)}</span>
                  ) : null}
                </span>
                <span className="flex items-center gap-0.5 text-green-500">
                  월세 {complex.todayListingCounts.rent}
                  {complex.listingStats?.diff?.rent ? (
                   <span className="text-[9px] opacity-80">{complex.listingStats.diff.rent > 0 ? "▲" : "▼"}{Math.abs(complex.listingStats.diff.rent)}</span>
                  ) : null}
                </span>
              </div>
            )}
          </div>

          <Link to={`/complex/${complex.id}`}>
            <Button variant="outline" className="w-full">
              자세히 보기
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
