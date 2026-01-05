import { useMemo } from "react";
import { Button } from "@/components/ui/button";

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
  handleTradeTypeChange: (type: string) => void;
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
  handleTradeTypeChange,
  handleAreaChange,
}: ListingFiltersProps) {
  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  const getDaysRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    return { start: formatDate(start), end: formatDate(end) };
  };

  const getMonthsRange = (months: number) => {
    const end = new Date();
    const start = new Date();
    start.setMonth(end.getMonth() - months);
    return { start: formatDate(start), end: formatDate(end) };
  };

  const {
    isAllActive,
    isTodayActive,
    isWeekActive,
    isOneMonthActive,
    isThreeMonthsActive,
  } = useMemo(() => {
    const allActive = !tableStartDate && !tableEndDate;

    const today = formatDate(new Date());
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
    <div className="p-4 bg-muted rounded-lg space-y-4">
      <div className="flex flex-wrap gap-6">
        {/* 거래유형 필터 */}
        <div>
          <h4 className="text-sm font-medium mb-2">거래유형</h4>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedTradeTypes.size === 3}
                onChange={() => {
                  if (selectedTradeTypes.size === 3) {
                    setSelectedTradeTypes(new Set());
                  } else {
                    setSelectedTradeTypes(new Set(["매매", "전세", "월세"]));
                  }
                }}
                className="cursor-pointer"
              />
              <span className="text-sm font-medium">전체</span>
            </label>
            {["매매", "전세", "월세"].map((type) => (
              <label
                key={type}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedTradeTypes.has(type)}
                  onChange={() => handleTradeTypeChange(type)}
                  className="cursor-pointer"
                />
                <span className="text-sm">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 조회 기간 필터 */}
        <div>
          <h4 className="text-sm font-medium mb-2">조회 기간 (수집일 기준)</h4>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 p-1">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTableStartDate("");
                  setTableEndDate("");
                }}
                className={`h-7 px-2 text-xs font-medium ${
                  isAllActive
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : ""
                }`}
              >
                전체
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const today = formatDate(new Date());
                  setTableStartDate(today);
                  setTableEndDate(today);
                }}
                className={`h-7 px-2 text-xs font-medium ${
                  isTodayActive
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : ""
                }`}
              >
                오늘
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const range = getDaysRange(7);
                  setTableStartDate(range.start);
                  setTableEndDate(range.end);
                }}
                className={`h-7 px-2 text-xs font-medium ${
                  isWeekActive
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : ""
                }`}
              >
                1주일
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const range = getMonthsRange(1);
                  setTableStartDate(range.start);
                  setTableEndDate(range.end);
                }}
                className={`h-7 px-2 text-xs font-medium ${
                  isOneMonthActive
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : ""
                }`}
              >
                1개월
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const range = getMonthsRange(3);
                  setTableStartDate(range.start);
                  setTableEndDate(range.end);
                }}
                className={`h-7 px-2 text-xs font-medium ${
                  isThreeMonthsActive
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : ""
                }`}
              >
                3개월
              </Button>
            </div>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={tableStartDate}
                onChange={(e) => setTableStartDate(e.target.value)}
                className="text-xs border border-slate-200 rounded px-1 py-0.5 bg-transparent"
              />
              <span className="text-xs text-slate-400">~</span>
              <input
                type="date"
                value={tableEndDate}
                onChange={(e) => setTableEndDate(e.target.value)}
                className="text-xs border border-slate-200 rounded px-1 py-0.5 bg-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 면적 필터 */}
      {areaOptions.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">면적</h4>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedAreas.size === areaOptions.length}
                onChange={() => {
                  if (selectedAreas.size === areaOptions.length) {
                    setSelectedAreas(new Set());
                  } else {
                    setSelectedAreas(new Set(areaOptions));
                  }
                }}
                className="cursor-pointer"
              />
              <span className="text-sm font-medium">전체</span>
            </label>
            {areaOptions.map((area: string) => (
              <label
                key={area}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedAreas.has(area)}
                  onChange={() => handleAreaChange(area)}
                  className="cursor-pointer"
                />
                <span className="text-sm">{area}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
