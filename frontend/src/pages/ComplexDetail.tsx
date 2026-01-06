import { useState, useMemo, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, RefreshCw, Info } from "lucide-react";
import { complexApi, listingApi, type Listing } from "@/lib/api";
import { formatDateKST, getTodayKST } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { useAlertStore, useHeaderStore } from "@/lib/store";
import { ComplexInfo } from "@/components/complex/ComplexInfo";
import { ListingChart } from "@/components/complex/ListingChart";
import { ListingFilters } from "@/components/complex/ListingFilters";
import { ListingTable } from "@/components/complex/ListingTable";

export default function ComplexDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const setHeader = useHeaderStore((state) => state.setHeader);
  const resetHeader = useHeaderStore((state) => state.resetHeader);

  // 상태 관리
  const [sortBy, setSortBy] = useState<string>("scrapedAt");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [selectedTradeTypes, setSelectedTradeTypes] = useState<Set<string>>(
    new Set(["매매"])
  );
  const [tableStartDate, setTableStartDate] = useState<string>(() => {
    return getTodayKST();
  });
  const [tableEndDate, setTableEndDate] = useState<string>(() => {
    return getTodayKST();
  });
  const [selectedAreas, setSelectedAreas] = useState<Set<string>>(new Set());
  const [isScraping, setIsScraping] = useState(false);
  const [isRefreshingInfo, setIsRefreshingInfo] = useState(false);
  const { showAlert } = useAlertStore();

  // 단지 정보 조회
  const { data: complex, isLoading: complexLoading } = useQuery({
    queryKey: ["complex", id],
    queryFn: () => complexApi.getById(Number(id)).then((res) => res.data),
    enabled: !!id,
  });

  // 전체 매물 조회 (차트 및 면적 옵션용)
  const { data: allListings } = useQuery<Listing[]>({
    queryKey: ["listings", id, "all"],
    queryFn: () =>
      listingApi.getByComplexId(Number(id)).then((res) => res.data),
    enabled: !!id,
  });

  // 매물 수집 실행
  const scrapeMutation = useMutation({
    mutationFn: () => complexApi.scrape(Number(id)),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["complex", id] });
      queryClient.invalidateQueries({ queryKey: ["listings", id] });
      setIsScraping(false);
      showAlert("매물 갱신 완료", `${res.data.count}개의 매물을 업데이트했습니다.`);
    },
    onError: (err: any) => {
      setIsScraping(false);
      showAlert(
        "급매물 갱신 실패",
        err.response?.data?.message || "오류가 발생했습니다."
      );
    },
  });

  // 단지 상세 정보 수집 실행
  const scrapeInfoMutation = useMutation({
    mutationFn: () => complexApi.scrapeInfo(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complex", id] });
      setIsRefreshingInfo(false);
      showAlert("정보 갱신 완료", "단지 상세 정보를 업데이트했습니다.");
    },
    onError: (err: any) => {
      setIsRefreshingInfo(false);
      showAlert(
        "정보 갱신 실패",
        err.response?.data?.message || "오류가 발생했습니다."
      );
    },
  });

  const handleScrape = useCallback(() => {
    if (isScraping) return;
    setIsScraping(true);
    scrapeMutation.mutate();
  }, [isScraping, scrapeMutation]);

  const handleScrapeInfo = useCallback(() => {
    if (isRefreshingInfo) return;
    setIsRefreshingInfo(true);
    scrapeInfoMutation.mutate();
  }, [isRefreshingInfo, scrapeInfoMutation]);

  useEffect(() => {
    if (complex) {
      setHeader({
        title: (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 leading-tight">{complex.name}</span>
            <span className="text-xs text-slate-500 font-normal">{complex.address}</span>
          </div>
        ),
        showBackButton: true,
        actions: (
          <div className="flex items-center gap-2">
            <Link
              to={`https://new.land.naver.com/complexes/${complex.naverComplexId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex"
            >
              <Button variant="outline" size="sm" className="gap-1.5 h-9">
                <ExternalLink className="w-3.5 h-3.5" />
                네이버 부동산
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={handleScrapeInfo}
              disabled={isRefreshingInfo}
              size="sm"
              className="gap-1.5 h-9"
            >
              <Info className={`w-3.5 h-3.5 ${isRefreshingInfo ? "animate-spin" : ""}`} />
              정보 갱신
            </Button>
            <Button
              onClick={handleScrape}
              disabled={isScraping}
              size="sm"
              className="gap-1.5 h-9"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScraping ? "animate-spin" : ""}`} />
              매물 갱신
            </Button>
          </div>
        )
      });
    }

    return () => resetHeader();
  }, [complex, isScraping, isRefreshingInfo, handleScrape, handleScrapeInfo]);

  // 면적 옵션 추출
  const areaOptions = useMemo(() => {
    if (!allListings) return [];
    const areas = new Set(allListings.map((l) => String(l.area)));
    return Array.from(areas).sort((a, b) => parseFloat(a) - parseFloat(b));
  }, [allListings]);

  // 최초 로드 시 모든 평형을 기본 선택
  useEffect(() => {
    if (areaOptions.length > 0 && selectedAreas.size === 0) {
      setSelectedAreas(new Set(areaOptions));
    }
  }, [areaOptions, selectedAreas.size, setSelectedAreas]);

  // 필터링된 매물 조회 (테이블용)
  const { data: listings, isLoading: listingsLoading } = useQuery<Listing[]>({
    queryKey: [
      "listings",
      id,
      sortBy,
      sortOrder,
      Array.from(selectedTradeTypes),
      tableStartDate,
      tableEndDate,
      Array.from(selectedAreas),
    ],
    queryFn: async () => {
      const response = await listingApi.getByComplexId(Number(id));
      const data = response.data;

      return data
        .filter((l) => {
          // 거래유형 필터
          if (
            selectedTradeTypes.size > 0 &&
            !selectedTradeTypes.has(l.tradetype)
          )
            return false;

          // 날짜 필터
          const date = new Date(l.scrapedAt);
          const dateStr = formatDateKST(date);

          if (tableStartDate && dateStr < tableStartDate) return false;
          if (tableEndDate && dateStr > tableEndDate) return false;

          // 면적 필터
          if (selectedAreas.size > 0 && !selectedAreas.has(String(l.area)))
            return false;

          return true;
        })
        .sort((a, b) => {
          const aVal = a[sortBy as keyof typeof a];
          const bVal = b[sortBy as keyof typeof b];

          if (sortBy === "pricePerPyeong") {
            // 평단가 계산 후 정렬
            const getPyeongPrice = (item: any) => {
              if (!item.supplyArea || item.tradetype !== "매매") return 0;
              return item.price / (item.supplyArea / 3.3058);
            };
            const aPrice = getPyeongPrice(a);
            const bPrice = getPyeongPrice(b);
            return sortOrder === "asc" ? aPrice - bPrice : bPrice - aPrice;
          }

          if (typeof aVal === "string" && typeof bVal === "string") {
            return sortOrder === "asc"
              ? aVal.localeCompare(bVal)
              : bVal.localeCompare(aVal);
          }
          // @ts-ignore
          return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
        });
    },
    enabled: !!id,
  });

  // 현재 매물 현황 계산 (최신 날짜 기준)
  const currentListingCounts = useMemo(() => {
    if (!allListings || allListings.length === 0) return null;

    // 전체 데이터에서 가장 최신 날짜 찾기
    const timestamps = allListings.map((l) => new Date(l.scrapedAt).getTime());
    const maxTimestamp = Math.max(...timestamps);
    const maxDateStr = formatDateKST(maxTimestamp);
    // 최신 날짜의 데이터만 필터링
    const latestListings = allListings.filter((l) => {
      const dateStr = formatDateKST(l.scrapedAt);
      return dateStr === maxDateStr;
    });
    return {
      total: latestListings.length,
      sale: latestListings.filter((l) => l.tradetype === "매매").length,
      jeonse: latestListings.filter((l) => l.tradetype === "전세").length,
      rent: latestListings.filter((l) => l.tradetype === "월세").length,
    };
  }, [allListings]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const handleAreaChange = (area: string) => {
    const newAreas = new Set(selectedAreas);
    if (newAreas.has(area)) {
      newAreas.delete(area);
    } else {
      newAreas.add(area);
    }
    setSelectedAreas(newAreas);
  };

  if (complexLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!complex) return <div>단지를 찾을 수 없습니다.</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-5 xl:col-span-4 h-full">
          <ComplexInfo
            complex={complex}
            currentListingCounts={currentListingCounts}
          />
        </div>
        <div className="lg:col-span-7 xl:col-span-8 h-full">
          {/* 차트 */}
          <ListingChart
            allListings={allListings}
            selectedAreas={selectedAreas}
            setSelectedAreas={setSelectedAreas}
            handleAreaChange={handleAreaChange}
            areaOptions={areaOptions}
          />
        </div>
      </div>

      {/* 매물 목록 섹션 */}
      <div className="space-y-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">매물 목록</h3>
          <span className="text-sm text-slate-500">
            총 {listings?.length || 0}개
          </span>
        </div>

        {/* 필터 */}
        <ListingFilters
          selectedTradeTypes={selectedTradeTypes}
          setSelectedTradeTypes={setSelectedTradeTypes}
          tableStartDate={tableStartDate}
          setTableStartDate={setTableStartDate}
          tableEndDate={tableEndDate}
          setTableEndDate={setTableEndDate}
          selectedAreas={selectedAreas}
          setSelectedAreas={setSelectedAreas}
          areaOptions={areaOptions}
          handleAreaChange={handleAreaChange}
        />

        {/* 테이블 */}
        <ListingTable
          listings={listings}
          listingsLoading={listingsLoading}
          handleSort={handleSort}
          complexId={id!}
        />
      </div>
    </div>
  );
}
