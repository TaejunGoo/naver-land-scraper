/**
 * @fileoverview 단지 카드 컴포넌트
 *
 * 대시보드의 그리드에 표시되는 개별 단지 카드입니다.
 * memo로 래핑되어 성능에 최적화되어 있습니다.
 *
 * 표시 정보:
 * - 단지명, 주소, 지하철/태그 배지
 * - 세대수, 연차 (사용승인일 기준 계산)
 * - 수집 일수, 오늘 매물 수
 * - 유형별 증감 (▲/▼ 표시)
 * - 신고가/저가 매물 수
 * - 네이버 부동산 외부 링크, 편집 버튼
 */
import { memo, useMemo, useCallback } from "react";
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

export const ComplexCard = memo(function ComplexCard({
  complex,
  onEdit,
}: ComplexCardProps) {
  // 사용승인일 기준 연차 계산 (memoized)
  const yearsSinceApproval = useMemo(() => {
    if (!complex.approvalDate) return "-";
    try {
      const approvalYear = parseInt(complex.approvalDate.split(".")[0]);
      if (!isNaN(approvalYear)) {
        const currentYear = new Date().getFullYear();
        const years = currentYear - approvalYear;
        return `${years}년차`;
      }
    } catch {
      // 파싱 실패 시 그냥 '-' 표시
    }
    return "-";
  }, [complex.approvalDate]);

  // 태그 파싱 (memoized)
  const tags = useMemo(() => {
    if (!complex.tags) return [];
    try {
      const parsed = JSON.parse(complex.tags);
      if (Array.isArray(parsed)) {
        return parsed;
      } else if (typeof parsed === "string") {
        return parsed
          .split(",")
          .map((t: string) => t.trim())
          .filter((t: string) => t);
      }
    } catch {
      // 파싱 실패 시 콤마로 분리 시도 (하위 호환성)
      if (typeof complex.tags === "string") {
        return complex.tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t);
      }
    }
    return [];
  }, [complex.tags]);

  // 편집 버튼 클릭 핸들러 (memoized)
  const handleEditClick = useCallback(() => {
    onEdit(complex);
  }, [onEdit, complex]);

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
              onClick={handleEditClick}
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
              <div className="flex flex-wrap gap-x-2 gap-y-0.5 justify-end text-[11px] text-slate-500">
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
                {complex.recordCounts && complex.recordCounts.newHighCount > 0 && (
                  <span className="flex items-center gap-0.5 text-red-600 dark:text-red-400 font-medium">
                    ▲최고 {complex.recordCounts.newHighCount}
                  </span>
                )}
                {complex.recordCounts && complex.recordCounts.newLowCount > 0 && (
                  <span className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400 font-medium">
                    ▼최저 {complex.recordCounts.newLowCount}
                  </span>
                )}
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
});
