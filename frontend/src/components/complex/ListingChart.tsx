/**
 * @fileoverview 시세 시계열 차트 컴포넌트
 *
 * 단지 상세 페이지 우측의 가격 추이 차트 영역입니다.
 * Recharts ComposedChart를 사용하여 다음을 표시합니다:
 * - 가격 밴드 (라인: 최고가/중간값/최저가, Area: 가격 범위)
 * - 매물 수 바 차트 (우측 Y축)
 *
 * 필터:
 * - 거래유형 선택 (매매/전세/월세)
 * - 조회 기간 (프리셋 + 카스텀 날짜 입력)
 * - 전용면적 선택 (배지 토글)
 */
import { useState, useMemo } from "react";
import { BarChart3, TrendingUp } from "lucide-react";
import { formatPrice, formatDateKST, getTodayKST } from "@/lib/format";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";

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
  setSelectedAreas: (areas: Set<string>) => void;
  handleAreaChange: (area: string) => void;
  areaOptions: string[];
}

export function ListingChart({
  allListings,
  selectedAreas,
  setSelectedAreas,
  handleAreaChange,
  areaOptions,
}: ListingChartProps) {
  const [chartStartDate, setChartStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return formatDateKST(d);
  });
  const [chartEndDate, setChartEndDate] = useState<string>(() => {
    return getTodayKST();
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

      const dateStr = formatDateKST(l.scrapedAt);
      if (dateStr < chartStartDate || dateStr > chartEndDate) return false;

      return true;
    });

    // 날짜별로 그룹화
    const dateMap = new Map<string, { prices: number[] }>();

    filteredListings.forEach((listing) => {
      const dateStr = formatDateKST(listing.scrapedAt);
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, { prices: [] });
      }
      const data = dateMap.get(dateStr)!;
      data.prices.push(listing.price);
    });

    // 날짜 범위 내 모든 날짜 생성 (빈 날짜도 포함)
    const result = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = formatDateKST(d);
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

  return (
    <div className="bg-card border rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
      {/* 헤더 및 필터 영역 */}
      <div className="px-6 py-5 border-b space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-500" />
              시세 트렌드 분석
            </h4>
            <p className="text-sm text-muted-foreground mt-0.5">
              {chartData.length > 0
                ? `${chartData.length}일간의 수집 데이터 통계`
                : "데이터가 충분하지 않습니다."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <ToggleGroup
              type="single"
              value={chartTradeType}
              onValueChange={(value) => value && setChartTradeType(value)}
              className="bg-muted p-1 rounded-lg h-9"
            >
              <ToggleGroupItem
                value="매매"
                className="text-xs px-3 data-[state=on]:bg-black data-[state=on]:text-white data-[state=on]:shadow-sm"
              >
                매매
              </ToggleGroupItem>
              <ToggleGroupItem
                value="전세"
                className="text-xs px-3 data-[state=on]:bg-black data-[state=on]:text-white data-[state=on]:shadow-sm"
              >
                전세
              </ToggleGroupItem>
              <ToggleGroupItem
                value="월세"
                className="text-xs px-3 data-[state=on]:bg-black data-[state=on]:text-white data-[state=on]:shadow-sm"
              >
                월세
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        <Separator />

        <div className="flex flex-wrap gap-6">
          {/* 기간 선택 */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              조회 기간
            </span>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex p-1 bg-muted rounded-lg">
                {[
                  { value: 7, label: "7일" },
                  { value: 30, label: "1개월" },
                  { value: 90, label: "3개월" },
                  { value: 180, label: "6개월" },
                ].map(({ value, label }) => (
                  <Button
                    key={value}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const end = new Date();
                      const start = new Date();
                      start.setDate(end.getDate() - value);
                      setChartEndDate(formatDateKST(end));
                      setChartStartDate(formatDateKST(start));
                    }}
                    className={`h-7 px-2.5 text-xs ${
                      chartStartDate ===
                      formatDateKST(
                        new Date(
                          new Date().setDate(new Date().getDate() - value)
                        )
                      )
                        ? "bg-background shadow-sm font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                  </Button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 px-2 py-1 border rounded-md bg-muted/30">
                <input
                  type="date"
                  value={chartStartDate}
                  onChange={(e) => setChartStartDate(e.target.value)}
                  className="bg-transparent border-none text-xs w-28 focus:ring-0"
                />
                <span className="text-muted-foreground">~</span>
                <input
                  type="date"
                  value={chartEndDate}
                  onChange={(e) => setChartEndDate(e.target.value)}
                  className="bg-transparent border-none text-xs w-28 focus:ring-0"
                />
              </div>
            </div>
          </div>

          {/* 면적 필터 (배지 형태) */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              전용면적 선택
            </span>
            <div className="flex flex-wrap gap-1.5">
              <Badge
                variant={
                  selectedAreas.size === 0 ||
                  selectedAreas.size === areaOptions.length
                    ? "secondary"
                    : "outline"
                }
                className="cursor-pointer transition-all hover:scale-105 hover:bg-muted h-[34px]"
                onClick={() => {
                  if (selectedAreas.size === areaOptions.length) {
                    setSelectedAreas(new Set());
                  } else {
                    setSelectedAreas(new Set(areaOptions));
                  }
                }}
              >
                전체
              </Badge>
              {areaOptions.map((area) => (
                <Badge
                  key={area}
                  variant={selectedAreas.has(area) ? "default" : "outline"}
                  className={`cursor-pointer transition-all hover:scale-105 ${
                    selectedAreas.has(area)
                      ? "bg-indigo-600 hover:bg-indigo-700"
                      : "hover:border-indigo-300 hover:text-indigo-600"
                  }`}
                  onClick={() => handleAreaChange(area)}
                >
                  {area}m²
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {chartData.length > 0 ? (
          <div className="space-y-6">
            <div
              className="bg-muted/30 rounded-xl p-4 border border-dashed"
              style={{ height: "400px" }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData}
                  margin={{ top: 20, right: 10, left: -10, bottom: 10 }}
                >
                  <defs>
                    <linearGradient id="colorBand" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#93c5fd" stopOpacity={0.4} />
                      <stop
                        offset="95%"
                        stopColor="#dbeafe"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e2e8f0"
                    opacity={0.5}
                  />
                  <XAxis
                    dataKey="displayDate"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    stroke="#cbd5e1"
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickFormatter={(value) => `${(value / 10000).toFixed(0)}억`}
                    stroke="#cbd5e1"
                    width={45}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    stroke="#cbd5e1"
                    width={25}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: "10px" }}
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
    </div>
  );
}
