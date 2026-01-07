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
