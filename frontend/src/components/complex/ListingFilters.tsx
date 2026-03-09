/**
 * @fileoverview 매물 필터 UI 컴포넌트
 *
 * 단지 상세 페이지의 매물 목록 상단 필터 영역입니다.
 * 세 가지 필터를 제공합니다:
 * - 조회 기간: 프리셋 버튼(오늘/1주일/1개월/3개월) + 카스텀 날짜
 * - 거래 유형: 매매/전세/월세 토글
 * - 전용면적: m²별 선택 버튼
 */
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";
import { formatDateKST, getTodayKST } from "@/lib/format";

interface ListingFiltersProps {
  selectedTradeTypes: Set<string>;
  setSelectedTradeTypes: (types: Set<string>) => void;
  tableStartDate: string;
  setTableStartDate: (date: string) => void;
  tableEndDate: string;
  setTableEndDate: (date: string) => void;
  selectedAreas: Set<string>;
  setSelectedAreas: (areas: Set<string>) => void;
  areaOptions: string[];
  handleAreaChange: (area: string) => void;
}

export function ListingFilters({
  selectedTradeTypes,
  setSelectedTradeTypes,
  tableStartDate,
  setTableStartDate,
  tableEndDate,
  setTableEndDate,
  selectedAreas,
  setSelectedAreas,
  areaOptions,
  handleAreaChange,
}: ListingFiltersProps) {
  const getDaysRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    return { start: formatDateKST(start), end: formatDateKST(end) };
  };

  const getMonthsRange = (months: number) => {
    const end = new Date();
    const start = new Date();
    start.setMonth(end.getMonth() - months);
    return { start: formatDateKST(start), end: formatDateKST(end) };
  };

  const {
    isAllActive,
    isTodayActive,
    isWeekActive,
    isOneMonthActive,
    isThreeMonthsActive,
  } = useMemo(() => {
    const allActive = !tableStartDate && !tableEndDate;

    const today = getTodayKST();
    const todayActive = tableStartDate === today && tableEndDate === today;

    const weekRange = getDaysRange(7);
    const weekActive =
      tableStartDate === weekRange.start && tableEndDate === weekRange.end;

    const oneMonthRange = getMonthsRange(1);
    const oneMonthActive =
      tableStartDate === oneMonthRange.start &&
      tableEndDate === oneMonthRange.end;

    const threeMonthsRange = getMonthsRange(3);
    const threeMonthsActive =
      tableStartDate === threeMonthsRange.start &&
      tableEndDate === threeMonthsRange.end;

    return {
      isAllActive: allActive,
      isTodayActive: todayActive,
      isWeekActive: weekActive,
      isOneMonthActive: oneMonthActive,
      isThreeMonthsActive: threeMonthsActive,
    };
  }, [tableStartDate, tableEndDate]);

  return (
    <div className="p-5 bg-card border rounded-xl shadow-sm space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 조회 기간 필터 */}
        <div className="space-y-4">
          <Label className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            📅 조회 기간 <span className="text-xs font-normal opacity-70">(수집일 기준)</span>
          </Label>
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted/50 rounded-lg w-fit">
            <Button
              variant={isAllActive ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setTableStartDate("");
                setTableEndDate("");
              }}
              className="h-8 px-3 text-xs"
            >
              전체
            </Button>
            <Button
              variant={isTodayActive ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                const today = getTodayKST();
                setTableStartDate(today);
                setTableEndDate(today);
              }}
              className="h-8 px-3 text-xs"
            >
              오늘
            </Button>
            <Button
              variant={isWeekActive ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                const range = getDaysRange(7);
                setTableStartDate(range.start);
                setTableEndDate(range.end);
              }}
              className="h-8 px-3 text-xs"
            >
              1주일
            </Button>
            <Button
              variant={isOneMonthActive ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                const range = getMonthsRange(1);
                setTableStartDate(range.start);
                setTableEndDate(range.end);
              }}
              className="h-8 px-3 text-xs"
            >
              1개월
            </Button>
            <Button
              variant={isThreeMonthsActive ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                const range = getMonthsRange(3);
                setTableStartDate(range.start);
                setTableEndDate(range.end);
              }}
              className="h-8 px-3 text-xs"
            >
              3개월
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={tableStartDate}
              onChange={(e) => setTableStartDate(e.target.value)}
              className="flex h-9 w-full sm:w-40 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <span className="text-muted-foreground">~</span>
            <input
              type="date"
              value={tableEndDate}
              onChange={(e) => setTableEndDate(e.target.value)}
              className="flex h-9 w-full sm:w-40 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </div>

        {/* 거래 유형 필터 */}
        <div className="space-y-4">
          <Label className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            🤝 거래 유형
          </Label>
          <div className="pt-2">
            <ToggleGroup 
              type="multiple" 
              variant="outline" 
              className="justify-start gap-2"
              value={Array.from(selectedTradeTypes)}
              onValueChange={(values) => {
                setSelectedTradeTypes(new Set(values));
              }}
            >
              <ToggleGroupItem value="매매" className="px-4 py-2 text-xs data-[state=on]:bg-blue-600 data-[state=on]:text-white">매매</ToggleGroupItem>
              <ToggleGroupItem value="전세" className="px-4 py-2 text-xs data-[state=on]:bg-emerald-600 data-[state=on]:text-white">전세</ToggleGroupItem>
              <ToggleGroupItem value="월세" className="px-4 py-2 text-xs data-[state=on]:bg-amber-600 data-[state=on]:text-white">월세</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </div>

      <Separator />

      {/* 면적 필터 */}
      <div className="space-y-4">
        <Label className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          📏 전용면적 선택 (m²)
        </Label>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            variant={selectedAreas.size === 0 ? "secondary" : "outline"}
            size="sm"
            onClick={() => setSelectedAreas(new Set())}
            className="h-8 px-4 text-xs rounded-full"
          >
            전체
          </Button>
          {areaOptions.map((area) => (
            <Button
              key={area}
              variant={selectedAreas.has(area) ? "default" : "outline"}
              size="sm"
              onClick={() => handleAreaChange(area)}
              className={`h-8 px-4 text-xs rounded-full ${
                selectedAreas.has(area) ? "bg-indigo-600 hover:bg-indigo-700" : ""
              }`}
            >
              {area}m²
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

