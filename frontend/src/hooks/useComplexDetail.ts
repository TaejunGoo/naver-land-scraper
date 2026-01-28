import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { complexApi, listingApi, type Listing } from "@/lib/api";
import { formatDateKST, getTodayKST } from "@/lib/format";
import { useAlertStore } from "@/lib/store";
// Demo mode: downloadBlob not used
// import { downloadBlob } from "@/lib/utils";

export function useComplexDetail(id: string | undefined) {
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();

  // 상태 관리
  const [sortBy, setSortBy] = useState<string>("scrapedAt");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [selectedTradeTypes, setSelectedTradeTypes] = useState<Set<string>>(
    new Set(["매매"])
  );
  const [tableStartDate, setTableStartDate] = useState<string>(() =>
    getTodayKST()
  );
  const [tableEndDate, setTableEndDate] = useState<string>(() => getTodayKST());
  const [selectedAreas, setSelectedAreas] = useState<Set<string>>(new Set());
  const [isScraping, setIsScraping] = useState(false);
  const [isRefreshingInfo, setIsRefreshingInfo] = useState(false);

  // 단지 정보 조회
  const { data: complex, isLoading: complexLoading } = useQuery({
    queryKey: ["complex", id],
    queryFn: () => complexApi.getById(Number(id)).then((res) => res.data),
    enabled: !!id,
  });

  // 전체 매물 조회
  const { data: allListings } = useQuery<Listing[]>({
    queryKey: ["listings", id, "all"],
    queryFn: () =>
      listingApi.getByComplexId(Number(id)).then((res) => res.data),
    enabled: !!id,
  });

  // Demo mode: Scraping disabled
  const scrapeMutation = useMutation({
    mutationFn: () => complexApi.scrape(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complex", id] });
      queryClient.invalidateQueries({ queryKey: ["listings", id] });
      setIsScraping(false);
      showAlert("매물 갱신", "데모 모드에서는 사용할 수 없습니다.");
    },
    onError: (err: any) => {
      setIsScraping(false);
      showAlert(
        "매물 갱신 실패",
        err.message || "오류가 발생했습니다."
      );
    },
  });

  // 정보 갱신 실행
  // Demo mode: Info scraping disabled
  const scrapeInfoMutation = useMutation({
    mutationFn: () => complexApi.scrapeInfo(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complex", id] });
      setIsRefreshingInfo(false);
      showAlert("정보 갱신", "데모 모드에서는 사용할 수 없습니다.");
    },
    onError: (err: any) => {
      setIsRefreshingInfo(false);
      showAlert(
        "정보 갱신 실패",
        err.message || "오류가 발생했습니다."
      );
    },
  });

  // Demo mode: Excel export disabled
  const exportMutation = useMutation({
    mutationFn: () => complexApi.exportByIdExcel(Number(id)),
    onSuccess: () => {
      showAlert("엑셀 내보내기", "데모 모드에서는 사용할 수 없습니다.");
    },
    onError: () => {
      showAlert("오류", "데모 모드에서는 사용할 수 없습니다.");
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

  const handleExportExcel = useCallback(() => {
    exportMutation.mutate();
  }, [exportMutation]);

  const areaOptions = useMemo(() => {
    if (!allListings) return [];
    const areas = new Set(allListings.map((l) => String(l.area)));
    return Array.from(areas).sort((a, b) => parseFloat(a) - parseFloat(b));
  }, [allListings]);

  useEffect(() => {
    if (areaOptions.length > 0 && selectedAreas.size === 0) {
      setSelectedAreas(new Set(areaOptions));
    }
  }, [areaOptions, selectedAreas.size]);

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
          if (
            selectedTradeTypes.size > 0 &&
            !selectedTradeTypes.has(l.tradetype)
          )
            return false;
          const dateStr = formatDateKST(new Date(l.scrapedAt));
          if (tableStartDate && dateStr < tableStartDate) return false;
          if (tableEndDate && dateStr > tableEndDate) return false;
          if (selectedAreas.size > 0 && !selectedAreas.has(String(l.area)))
            return false;
          return true;
        })
        .sort((a, b) => {
          const aVal = a[sortBy as keyof Listing];
          const bVal = b[sortBy as keyof Listing];
          if (sortBy === "pricePerPyeong") {
            const getPrice = (i: any) =>
              !i.supplyArea || i.tradetype !== "매매"
                ? 0
                : i.price / (i.supplyArea / 3.3058);
            return sortOrder === "asc"
              ? getPrice(a) - getPrice(b)
              : getPrice(b) - getPrice(a);
          }
          if (typeof aVal === "string" && typeof bVal === "string") {
            return sortOrder === "asc"
              ? aVal.localeCompare(bVal)
              : bVal.localeCompare(aVal);
          }
          return sortOrder === "asc"
            ? (aVal as any) - (bVal as any)
            : (bVal as any) - (aVal as any);
        });
    },
    enabled: !!id,
  });

  const currentListingCounts = useMemo(() => {
    if (!allListings || allListings.length === 0) return null;
    const maxDateStr = formatDateKST(
      Math.max(...allListings.map((l) => new Date(l.scrapedAt).getTime()))
    );
    const latest = allListings.filter(
      (l) => formatDateKST(l.scrapedAt) === maxDateStr
    );
    return {
      total: latest.length,
      sale: latest.filter((l) => l.tradetype === "매매").length,
      jeonse: latest.filter((l) => l.tradetype === "전세").length,
      rent: latest.filter((l) => l.tradetype === "월세").length,
    };
  }, [allListings]);

  const handleSort = (field: string) => {
    if (sortBy === field) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const handleAreaChange = (area: string) => {
    const next = new Set(selectedAreas);
    if (next.has(area)) next.delete(area);
    else next.add(area);
    setSelectedAreas(next);
  };

  return {
    complex,
    complexLoading,
    listings,
    listingsLoading,
    allListings,
    areaOptions,
    selectedTradeTypes,
    setSelectedTradeTypes,
    tableStartDate,
    setTableStartDate,
    tableEndDate,
    setTableEndDate,
    selectedAreas,
    setSelectedAreas,
    isScraping,
    isRefreshingInfo,
    isExporting: exportMutation.isPending,
    sortBy,
    sortOrder,
    handleScrape,
    handleScrapeInfo,
    handleExportExcel,
    handleSort,
    handleAreaChange,
    currentListingCounts,
  };
}
