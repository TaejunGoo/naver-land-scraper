import { Button } from "@/components/ui/button";
import { Beaker, RefreshCw, Plus, ArrowUpDown } from "lucide-react";
import { Complex } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ComplexListHeaderProps {
  onAddClick: () => void;
  onScrapeAllClick: () => void;
  onCreateTestClick: () => void;
  isScrapingAll: boolean;
  isCreatingTest: boolean;
  hasComplexes: boolean;
  sortBy: string;
  setSortBy: (val: string) => void;
  sortOrder: string;
  setSortOrder: (val: string) => void;
}

export function ComplexListHeader({
  onAddClick,
  onScrapeAllClick,
  onCreateTestClick,
  isScrapingAll,
  isCreatingTest,
  hasComplexes,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
}: ComplexListHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold">관심 아파트 단지</h1>
        <div className="flex gap-2">
          <Button
            onClick={onCreateTestClick}
            disabled={isCreatingTest}
            variant="outline"
          >
            <Beaker
              className={`w-4 h-4 mr-2 ${isCreatingTest ? "animate-spin" : ""}`}
            />
            {isCreatingTest ? "생성 중..." : "테스트 단지 생성"}
          </Button>
          <Button
            onClick={onScrapeAllClick}
            disabled={isScrapingAll || !hasComplexes}
            variant="default"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isScrapingAll ? "animate-spin" : ""}`}
            />
            {isScrapingAll ? "크롤링 중..." : "전체 매물 크롤링"}
          </Button>
          <Button onClick={onAddClick}>
            <Plus className="w-4 h-4 mr-2" />
            단지 추가
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
        <span className="text-xs font-medium text-slate-500 ml-2">
          정렬 기준:
        </span>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[130px] h-8 text-xs bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">단지명</SelectItem>
            <SelectItem value="units">세대수</SelectItem>
            <SelectItem value="approvalDate">연차</SelectItem>
            <SelectItem value="todayListingCount">매물수</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs gap-1"
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
        >
          <ArrowUpDown className="w-3 h-3" />
          {sortOrder === "asc" ? "오름차순" : "내림차순"}
        </Button>
      </div>
    </div>
  );
}
