import { useState, useMemo } from "react";
import { BarChart3 } from "lucide-react";
import { formatPrice } from "@/lib/format";
import {
  ComposedChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// 커스텀 툴팁 컴포넌트
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg p-4"
      style={{ minWidth: "220px" }}
    >
      <div className="text-sm font-semibold text-slate-700 mb-3 pb-2 border-b border-slate-100">
        📅 {label}
      </div>
      <div className="space-y-2">
        {payload.map((entry: any, index: number) => {
          if (
            !entry.value ||
            entry.dataKey === "min" ||
            entry.dataKey === "max"
          )
            return null;

          let icon = "📊";
          let label = entry.name || "";

          if (entry.dataKey === "average" || label.includes("평균")) {
            icon = "💰";
            label = "평균가";
          } else if (entry.dataKey === "median" || label.includes("중간")) {
            icon = "📈";
            label = "중간가";
          } else if (
            entry.dataKey === "avgPyeong" ||
            label.includes("평단가")
          ) {
            icon = "📐";
            label = "평단가";
          } else if (label.includes("최고")) {
            icon = "🔺";
          } else if (label.includes("최저")) {
            icon = "🔻";
          } else if (entry.dataKey === "count" || label.includes("매물")) {
            icon = "📋";
          }

          return (
            <div
              key={index}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs font-medium text-slate-600">
                  {icon} {label}
                </span>
              </div>
              <span
                className="text-sm font-bold text-slate-900"
                style={{ color: entry.color }}
              >
                {entry.dataKey === "count"
                  ? `${entry.value}개`
                  : formatPrice(entry.value as number)}
              </span>
            </div>
          );
        })}
      </div>
      {payload.some((p: any) => p.dataKey === "max") &&
        payload.some((p: any) => p.dataKey === "min") && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">가격 범위</span>
              <span className="font-semibold text-slate-700">
                {formatPrice(
                  payload.find((p: any) => p.dataKey === "min")?.value as number
                )}{" "}
                ~{" "}
                {formatPrice(
                  payload.find((p: any) => p.dataKey === "max")?.value as number
                )}
              </span>
            </div>
          </div>
        )}
    </div>
  );
};

interface ListingChartProps {
  allListings: any[] | undefined;
  selectedAreas: Set<string>;
  handleAreaChange: (area: string) => void;
  areaOptions: string[];
}

export function ListingChart({
  allListings,
  selectedAreas,
  handleAreaChange,
  areaOptions,
}: ListingChartProps) {
  const [chartStartDate, setChartStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [chartEndDate, setChartEndDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [chartTradeType, setChartTradeType] = useState<string>("매매");

  // 날짜별 통계 계산
  const chartData = useMemo(() => {
    if (!allListings || allListings.length === 0) return [];

    const start = new Date(chartStartDate);
    const end = new Date(chartEndDate);
    end.setHours(23, 59, 59, 999);

    // 거래유형 + 면적 필터링 적용 (그래프 자체 필터)
    const filteredListings = allListings.filter((l) => {
      if (l.tradetype !== chartTradeType) return false;
      if (selectedAreas.size > 0 && !selectedAreas.has(String(l.area)))
        return false;
      return true;
    });

    // 날짜별로 그룹화
    const dateMap = new Map<string, { prices: number[] }>();

    filteredListings.forEach((listing) => {
      const date = new Date(listing.scrapedAt);
      if (date >= start && date <= end) {
        const dateStr = date.toISOString().split("T")[0];
        if (!dateMap.has(dateStr)) {
          dateMap.set(dateStr, { prices: [] });
        }
        const data = dateMap.get(dateStr)!;
        data.prices.push(listing.price);
      }
    });

    // 날짜 범위 내 모든 날짜 생성 (빈 날짜도 포함)
    const result = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      const data = dateMap.get(dateStr) || { prices: [] };
      const prices = data.prices;

      if (prices.length > 0) {
        const sortedPrices = [...prices].sort((a, b) => a - b);
        result.push({
          date: dateStr,
          displayDate: `${d.getMonth() + 1}/${d.getDate()}`,
          count: prices.length,
          min: Math.min(...prices),
          max: Math.max(...prices),
          avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
          median: sortedPrices[Math.floor(sortedPrices.length / 2)],
        });
      }
    }

    return result;
  }, [
    allListings,
    chartStartDate,
    chartEndDate,
    chartTradeType,
    selectedAreas,
  ]);

  if (!allListings || allListings.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* 헤더 */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 px-6 py-4">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h4 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              📊 날짜별 매물 통계
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              {chartData.length > 0
                ? `${chartData.length}일간의 데이터 (전체 매물 기준)`
                : "데이터를 불러오는 중..."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* 날짜 범위 선택 */}
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 p-1">
              <div className="flex items-center gap-1">
                {[
                  { value: 7, label: "7일" },
                  { value: 30, label: "30일" },
                  { value: 90, label: "90일" },
                  { value: 180, label: "6개월" },
                  { value: 365, label: "1년" },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => {
                      const end = new Date();
                      const start = new Date();
                      start.setDate(end.getDate() - value);
                      setChartEndDate(end.toISOString().split("T")[0]);
                      setChartStartDate(start.toISOString().split("T")[0]);
                    }}
                    className="px-2 py-1 text-xs font-medium rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={chartStartDate}
                  onChange={(e) => setChartStartDate(e.target.value)}
                  className="text-xs border border-slate-200 rounded px-1 py-0.5 bg-transparent"
                />
                <span className="text-xs text-slate-400">~</span>
                <input
                  type="date"
                  value={chartEndDate}
                  onChange={(e) => setChartEndDate(e.target.value)}
                  className="text-xs border border-slate-200 rounded px-1 py-0.5 bg-transparent"
                />
              </div>
            </div>

            {/* 거래유형 선택 */}
            <select
              value={chartTradeType}
              onChange={(e) => setChartTradeType(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 rounded-lg cursor-pointer hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="매매">💰 매매</option>
              <option value="전세">🏡 전세</option>
              <option value="월세">📅 월세</option>
            </select>
            {/* 면적 필터 */}
            <div className="flex gap-2 items-center bg-white dark:bg-slate-800 rounded-lg border border-slate-200 px-3 py-1.5">
              <span className="text-xs font-medium text-slate-600 whitespace-nowrap">
                면적:
              </span>
              <div className="flex gap-1 flex-wrap max-w-xs">
                {areaOptions.map((area) => (
                  <label
                    key={area}
                    className="flex items-center gap-1 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAreas.has(area)}
                      onChange={() => handleAreaChange(area)}
                      className="w-3 h-3 cursor-pointer"
                    />
                    <span className="text-xs text-slate-600">{area}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {chartData.length > 0 ? (
        <div className="p-6 space-y-6">
          {/* 그래프 */}
          <div
            className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-100"
            style={{ height: "450px" }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 10, bottom: 60 }}
              >
                <defs>
                  <linearGradient id="colorBand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#93c5fd" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#dbeafe" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e2e8f0"
                  opacity={0.5}
                />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                  stroke="#cbd5e1"
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  tickFormatter={(value) => `${(value / 10000).toFixed(0)}억`}
                  stroke="#cbd5e1"
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  stroke="#cbd5e1"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: "20px" }}
                  iconType="circle"
                />

                {/* 밴드 영역: 최고가 Area */}
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="max"
                  stroke="none"
                  fill="url(#colorBand)"
                  name="가격 밴드"
                />
                {/* 밴드 영역: 최저가 Area (위쪽을 덮어서 밴드 만들기) */}
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="min"
                  stroke="none"
                  fill="white"
                  fillOpacity={1}
                />

                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="max"
                  stroke="#ef4444"
                  name="최고가"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: "#ef4444",
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                  activeDot={{ r: 6, fill: "#ef4444" }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="median"
                  stroke="#8b5cf6"
                  name="중간값"
                  strokeWidth={2.5}
                  dot={{
                    r: 3,
                    fill: "#8b5cf6",
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                  activeDot={{ r: 6, fill: "#8b5cf6" }}
                  strokeDasharray="8 4"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="min"
                  stroke="#10b981"
                  name="최저가"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: "#10b981",
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                  activeDot={{ r: 6, fill: "#10b981" }}
                />
                <Bar
                  yAxisId="right"
                  dataKey="count"
                  fill="#fb923c"
                  name="매물 수"
                  opacity={0.5}
                  radius={[4, 4, 0, 0]}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
            <BarChart3 className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            선택한 기간에 데이터가 없습니다
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            다른 기간을 선택해보세요
          </p>
        </div>
      )}
    </div>
  );
}
