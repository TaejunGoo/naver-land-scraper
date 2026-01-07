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

      {/* 평균 평당가 */}
      <Card className="bg-white/50 backdrop-blur-sm">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">평균 평당가</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{summary.todayAvgPricePerPyeong.toLocaleString()}</span>
              <span className="text-xs text-slate-400">만원</span>
              {summary.priceChange !== 0 && (
                <span className={`text-[10px] flex items-center font-bold ${summary.priceChange > 0 ? 'text-red-500' : 'text-blue-500'}`}>
                  {summary.priceChange > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(summary.priceChange)}%
                </span>
              )}
            </div>
          </div>
          <div className="bg-blue-50 p-2 rounded-lg">
            <LineChart className="w-5 h-5 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      {/* 시장 분위기 (간단히) */}
      <Card className="bg-white/50 backdrop-blur-sm">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">시장 흐름</p>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">
                {summary.priceChange > 0.5 ? "상승세" : summary.priceChange < -0.5 ? "하락세" : "보합세"}
              </span>
              {summary.priceChange > 0.5 ? (
                <TrendingUp className="w-5 h-5 text-red-500" />
              ) : summary.priceChange < -0.5 ? (
                <TrendingDown className="w-5 h-5 text-blue-500" />
              ) : null}
            </div>
          </div>
          <div className={`p-2 rounded-lg ${summary.priceChange > 0.5 ? 'bg-red-50' : 'bg-slate-100'}`}>
             <TrendingUp className={`w-5 h-5 ${summary.priceChange > 0.5 ? 'text-red-600' : 'text-slate-400'}`} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
