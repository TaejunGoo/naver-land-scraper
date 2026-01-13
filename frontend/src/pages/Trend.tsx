import { useEffect, useState } from "react";
import { statsApi } from "@/lib/api";
import { TrendData } from "@/types";
import { useHeaderStore } from "@/lib/store";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardSummary } from "@/components/stats/DashboardSummary";

export default function Trend() {
  const [data, setData] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const setHeader = useHeaderStore((state) => state.setHeader);
  const resetHeader = useHeaderStore((state) => state.resetHeader);

  useEffect(() => {
    setHeader({
      title: "전체 추세 분석",
      showBackButton: true,
    });
    
    setLoading(true);
    statsApi.getTrend(days)
      .then(res => setData(res.data))
      .catch(err => console.error("Trend load error", err))
      .finally(() => setLoading(false));

    return () => resetHeader();
  }, [setHeader, resetHeader, days]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">시장 동향 ({days}일)</h2>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                days === d 
                  ? "bg-white text-slate-900 shadow-sm" 
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {d}일
            </button>
          ))}
        </div>
      </div>

      {loading ? (
         <div className="p-8 text-center">데이터를 불러오는 중...</div>
      ) : !data || data.history.length === 0 ? (
        <div className="p-12 text-center bg-slate-50 rounded-xl border border-dashed">
          <p className="text-slate-500">추세를 분석하기 위한 데이터가 충분하지 않습니다.</p>
          <p className="text-sm text-slate-400 mt-2">매일 매물 수집을 진행하면 여기에 그래프가 표시됩니다.</p>
        </div>
      ) : (
        <>
          {/* 요약 대시보드 */}
          <DashboardSummary />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 평단가 추이 차트 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">평균 평당가 추이</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.history}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11 }}
                    tickFormatter={(val) => val.split('-').slice(1).join('/')}
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }}
                    domain={['auto', 'auto']}
                    tickFormatter={(val) => `${val.toLocaleString()}만`}
                  />
                  <Tooltip 
                    formatter={(value: any) => [`${value.toLocaleString()} 만원`, '평균가']}
                    labelStyle={{ fontSize: 12 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="avgPricePerPyeong" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 매물 수량 추이 차트 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">유형별 매물 수량 추이</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.history}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11 }}
                    tickFormatter={(val) => val.split('-').slice(1).join('/')}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip labelStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="saleCount" name="매매" stackId="a" fill="#ef4444" />
                  <Bar dataKey="jeonseCount" name="전세" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="rentCount" name="월세" stackId="a" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 데이터 테이블 상세 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">일자별 데이터 요약</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="p-3 font-medium">날짜</th>
                  <th className="p-3 font-medium text-right">평균 평당가</th>
                  <th className="p-3 font-medium text-right text-red-600">매매</th>
                  <th className="p-3 font-medium text-right text-blue-600">전세</th>
                  <th className="p-3 font-medium text-right text-green-600">월세</th>
                  <th className="p-3 font-medium text-right font-bold">합계</th>
                </tr>
              </thead>
              <tbody>
                {data.history.map((row) => (
                  <tr key={row.date} className="border-b hover:bg-slate-50 transition-colors">
                    <td className="p-3">{row.date}</td>
                    <td className="p-3 text-right">{row.avgPricePerPyeong.toLocaleString()}만원</td>
                    <td className="p-3 text-right">{row.saleCount}개</td>
                    <td className="p-3 text-right">{row.jeonseCount}개</td>
                    <td className="p-3 text-right">{row.rentCount}개</td>
                    <td className="p-3 text-right font-bold">{row.totalCount}개</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
        </>
      )}
    </div>
  );
}
