import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ExternalLink, RefreshCw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHeaderStore } from "@/lib/store";
import { ComplexInfo } from "@/components/complex/ComplexInfo";
import { ListingChart } from "@/components/complex/ListingChart";
import { ListingFilters } from "@/components/complex/ListingFilters";
import { ListingTable } from "@/components/complex/ListingTable";
import { useComplexDetail } from "@/hooks/useComplexDetail";

export default function ComplexDetail() {
  const { id } = useParams<{ id: string }>();
  const setHeader = useHeaderStore((state) => state.setHeader);
  const resetHeader = useHeaderStore((state) => state.resetHeader);

  const {
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
    handleScrape,
    handleScrapeInfo,
    handleSort,
    handleAreaChange,
    currentListingCounts,
  } = useComplexDetail(id);

  useEffect(() => {
    if (complex) {
      setHeader({
        title: (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 leading-tight">
              {complex.name}
            </span>
            <span className="text-xs text-slate-500 font-normal">
              {complex.address}
            </span>
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
              <Info
                className={`w-3.5 h-3.5 ${isRefreshingInfo ? "animate-spin" : ""}`}
              />
              정보 갱신
            </Button>
            <Button
              onClick={handleScrape}
              disabled={isScraping}
              size="sm"
              className="gap-1.5 h-9"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isScraping ? "animate-spin" : ""}`}
              />
              매물 갱신
            </Button>
          </div>
        ),
      });
    }

    return () => resetHeader();
  }, [
    complex,
    isScraping,
    isRefreshingInfo,
    handleScrape,
    handleScrapeInfo,
    setHeader,
    resetHeader,
  ]);

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
