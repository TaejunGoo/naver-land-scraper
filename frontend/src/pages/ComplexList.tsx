/**
 * @fileoverview 대시보드 (단지 목록) 페이지
 *
 * 앱의 메인 화면으로, 등록된 단지들을 카드 그리드로 표시합니다.
 *
 * 페이지 구성:
 * - DashboardSummary: 요약 통계 (총 매물/평당가/신고가·저가)
 * - ComplexListHeader: 상단 버튼 바 (단지 추가/전체 수집/엑셀/정렬)
 * - ComplexForm: 단지 추가/수정 폼 (조건부 표시)
 * - ComplexCard 그리드: 단지 정보 카드 (세대수/연차/매물수/증감)
 * - DataManagementSection: DB 백업/복구 UI
 *
 * 비즈니스 로직은 useComplexList 훅에 완전히 분리되어 있습니다.
 */
import { useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ComplexListHeader } from "@/components/complex/ComplexListHeader";
import { ComplexForm } from "@/components/complex/ComplexForm";
import { ComplexCard } from "@/components/complex/ComplexCard";
import { DashboardSummary } from "@/components/stats/DashboardSummary";
import { DataManagementSection } from "@/components/complex/DataManagementSection";
import { useComplexList } from "@/hooks/useComplexList";

export default function ComplexList() {
  const {
    showForm,
    setShowForm,
    editingId,
    formData,
    setFormData,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    complexes,
    sortedComplexes,
    isLoading,
    resetForm,
    handleEdit,
    handleSubmit,
    handleDeleteComplex,
    handleCreateTestClick,
    scrapeAllMutation,
    exportExcelMutation,
    createMutation,
    updateMutation,
    createTestComplexMutation,
  } = useComplexList();

  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showForm && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [showForm, editingId]);

  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className="space-y-6">
      <DashboardSummary />

      <ComplexListHeader
        onAddClick={() => {
          resetForm();
          setShowForm(!showForm);
        }}
        onScrapeAllClick={() => scrapeAllMutation.mutate()}
        onExportExcelClick={() => exportExcelMutation.mutate()}
        onCreateTestClick={handleCreateTestClick}
        isScrapingAll={scrapeAllMutation.isPending}
        isCreatingTest={createTestComplexMutation.isPending}
        hasComplexes={!!complexes && complexes.length > 0}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
      />

      {showForm && (
        <div ref={formRef} className="scroll-mt-20">
          <ComplexForm
            editingId={editingId}
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            onCancel={resetForm}
            onDelete={
              editingId
                ? () => handleDeleteComplex(complexes?.find((c) => c.id === editingId)!)
                : undefined
            }
            isSubmitting={createMutation.isPending || updateMutation.isPending}
          />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sortedComplexes?.map((complex) => (
          <ComplexCard key={complex.id} complex={complex} onEdit={handleEdit} />
        ))}
      </div>

      {sortedComplexes?.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            등록된 단지가 없습니다. 단지를 추가해보세요!
          </CardContent>
        </Card>
      )}

      <DataManagementSection />
    </div>
  );
}
