/**
 * @fileoverview 대시보드 요약 통계 카드 컴포넌트
 *
 * 대시보드와 트렌드 페이지 상단에 표시되는 4개의 요약 카드입니다:
 * 1. 전일 대비 매물 증감 (+N/-N건)
 * 2. 주간 시세 변동 (평당가 변동률 %)
 * 3. 신고가 매물 (30일 대비, 클릭 시 Records 페이지로 이동)
 * 4. 신저가 매물 (30일 대비, 클릭 시 Records 페이지로 이동)
 *
 * 데이터: GET /api/stats/trend의 summary 응답 사용
 */
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { statsApi } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

export function DashboardSummary() {
  const { data, isLoading } = useQuery({
    queryKey: ["stats", "trend"],
    queryFn: async () => {
      const response = await statsApi.getTrend();
      return response.data;
    },
  });

  if (isLoading || !data) return null;

  const { summary } = data;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 전일 대비 매물 증감 */}
      <Card className="bg-white/50 backdrop-blur-sm">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">
              전일 대비 매물 증감
            </p>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-2xl font-bold ${summary.countChange > 0 ? "text-blue-500" : summary.countChange < 0 ? "text-red-500" : "text-slate-700"}`}
              >
                {summary.countChange > 0 ? "+" : ""}
                {summary.countChange}
              </span>
              <span className="text-xs text-slate-400">건</span>
            </div>
          </div>
          <div
            className={`p-2 rounded-lg ${summary.countChange > 0 ? "bg-blue-100" : summary.countChange < 0 ? "bg-red-100" : "bg-slate-100"}`}
          >
            {summary.countChange > 0 ? (
              <ArrowUpRight className="w-5 h-5 text-blue-600" />
            ) : summary.countChange < 0 ? (
              <ArrowDownRight className="w-5 h-5 text-red-600" />
            ) : (
              <LineChart className="w-5 h-5 text-slate-500" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* 주간 시세 변동 (평균 평당가 대체) */}
      <Card className="bg-white/50 backdrop-blur-sm">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">
              주간 시세 변동
            </p>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-2xl font-bold ${summary.priceChange > 0 ? "text-red-500" : summary.priceChange < 0 ? "text-blue-500" : "text-slate-700"}`}
              >
                {summary.priceChange > 0 ? "+" : ""}
                {summary.priceChange}%
              </span>
              <span className="text-xs text-slate-400">전주 대비</span>
            </div>
          </div>
          <div className="bg-slate-100 p-2 rounded-lg">
            {summary.priceChange > 0 ? (
              <TrendingUp className="w-5 h-5 text-red-600" />
            ) : summary.priceChange < 0 ? (
              <TrendingDown className="w-5 h-5 text-blue-600" />
            ) : (
              <LineChart className="w-5 h-5 text-slate-500" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* 신고가 카드 */}
      <Link to="/records?type=high" className="block">
        <Card className="bg-white/50 backdrop-blur-sm hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">
                신고가 매물
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-red-700">
                  {summary.newHighCount || 0}
                </span>
                <span className="text-xs text-slate-400">건</span>
              </div>
            </div>
            <div className="bg-red-50 p-2 rounded-lg">
              <ArrowUpRight className="w-5 h-5 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* 신저가 카드 */}
      <Link to="/records?type=low" className="block">
        <Card className="bg-white/50 backdrop-blur-sm hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">
                신저가 매물
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-blue-700">
                  {summary.newLowCount || 0}
                </span>
                <span className="text-xs text-slate-400">건</span>
              </div>
            </div>
            <div className="bg-blue-50 p-2 rounded-lg">
              <ArrowDownRight className="w-5 h-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
