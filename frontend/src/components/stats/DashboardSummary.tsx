import { useEffect, useState } from "react";
import { statsApi } from "@/lib/api";
import { TrendData } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { 
  TrendingUp, 
  TrendingDown, 
  LineChart, 
  ArrowUpRight, 
  ArrowDownRight
} from "lucide-react";

export function DashboardSummary({ data: providedData }: { data?: TrendData | null }) {
  const [data, setData] = useState<TrendData | null>(providedData || null);
  const [loading, setLoading] = useState(!providedData);

  useEffect(() => {
    if (providedData) {
      setData(providedData);
      setLoading(false);
      return;
    }

    statsApi.getTrend()
      .then(res => setData(res.data))
      .catch(err => console.error("Trend load error", err))
      .finally(() => setLoading(false));
  }, [providedData]);

  if (loading || !data) return null;

  const { summary } = data;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* 전일 대비 매물 증감 */}
      <Card className="bg-white/50 backdrop-blur-sm">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">전일 대비 매물 증감</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${summary.countChange > 0 ? 'text-blue-500' : summary.countChange < 0 ? 'text-red-500' : 'text-slate-700'}`}>
                {summary.countChange > 0 ? '+' : ''}{summary.countChange}
              </span>
              <span className="text-xs text-slate-400">건</span>
            </div>
          </div>
          <div className={`p-2 rounded-lg ${summary.countChange > 0 ? 'bg-blue-100' : summary.countChange < 0 ? 'bg-red-100' : 'bg-slate-100'}`}>
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
            <p className="text-xs font-medium text-slate-500 mb-1">주간 시세 변동</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${summary.priceChange > 0 ? 'text-red-500' : summary.priceChange < 0 ? 'text-blue-500' : 'text-slate-700'}`}>
               {summary.priceChange > 0 ? '+' : ''}{summary.priceChange}%
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

      {/* 신고가/신저가 (시장 흐름 대체) */}
      <Card className="bg-white/50 backdrop-blur-sm">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">오늘의 가격 갱신</p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-red-50 px-2.5 py-1.5 rounded-md border border-red-100">
                <span className="text-xs text-red-600 font-medium flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" /> 신고가
                </span>
                <span className="text-lg font-bold text-red-700 leading-none">{summary.newHighCount || 0}</span>
              </div>
              <div className="flex items-center gap-2 bg-blue-50 px-2.5 py-1.5 rounded-md border border-blue-100">
                <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                  <ArrowDownRight className="w-3 h-3" /> 신저가
                </span>
                <span className="text-lg font-bold text-blue-700 leading-none">{summary.newLowCount || 0}</span>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 p-2 rounded-lg">
             <TrendingUp className="w-5 h-5 text-yellow-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
