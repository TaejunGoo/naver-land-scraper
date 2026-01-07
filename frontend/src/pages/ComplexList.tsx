import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { complexApi, type Complex } from "@/lib/api";
import { useAlertStore, useHeaderStore } from "@/lib/store";
import { downloadBlob } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { SUBWAY_LINES } from "@/lib/constants";
import { ComplexListHeader } from "@/components/complex/ComplexListHeader";
import { ComplexForm } from "@/components/complex/ComplexForm";
import { ComplexCard } from "@/components/complex/ComplexCard";
import { DashboardSummary } from "@/components/stats/DashboardSummary";
import { Database, Download, Upload, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ComplexList() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    naverComplexId: "",
    tags: "",
    subwayLines: [] as string[],
  });
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<string>("asc");
  const { showAlert } = useAlertStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const setHeader = useHeaderStore((state) => state.setHeader);
  const resetHeader = useHeaderStore((state) => state.resetHeader);

  useEffect(() => {
    setHeader({
      title: "대시보드",
      actions: null,
      showBackButton: false,
    });
    return () => resetHeader();
  }, [setHeader, resetHeader]);

  const { data: complexes, isLoading } = useQuery({
    queryKey: ["complexes"],
    queryFn: async () => {
      const response = await complexApi.getAll();
      return response.data;
    },
  });

  const sortedComplexes = useMemo(() => {
    if (!complexes) return [];

    return [...complexes].sort((a, b) => {
      let aVal: any = a[sortBy as keyof typeof a];
      let bVal: any = b[sortBy as keyof typeof b];

      if (sortBy === "approvalDate") {
        if (!aVal) return 1;
        if (!bVal) return -1;
      }

      if (typeof aVal === "string") {
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortOrder === "asc"
        ? (aVal || 0) - (bVal || 0)
        : (bVal || 0) - (aVal || 0);
    });
  }, [complexes, sortBy, sortOrder]);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: "",
      address: "",
      naverComplexId: "",
      tags: "",
      subwayLines: [],
    });
  };

  const createMutation = useMutation({
    mutationFn: (data: Partial<Complex>) => complexApi.create(data),
    onSuccess: async (response: any) => {
      const newComplex = response.data;

      // 1. 단지 리스트 새로고침
      queryClient.invalidateQueries({ queryKey: ["complexes"] });

      // 2. 폼 초기화 및 닫기
      setShowForm(false);
      resetForm();

      // 3. 네이버 ID가 있는 경우 즉시 정보 수집 API 호출 (프론트에서 수동 요청)
      if (newComplex.naverComplexId) {
        try {
          // 별도의 로딩 표시 없이 백그라운드에서 바로 실행
          await complexApi.scrapeInfo(newComplex.id);
          // 정보 수집 후 다시 한번 리스트 새로고침
          queryClient.invalidateQueries({ queryKey: ["complexes"] });
          showAlert(
            "등록 및 수집 완료",
            "단지 정보를 성공적으로 수집했습니다."
          );
        } catch (e) {
          showAlert(
            "등록 성공",
            "단지는 등록되었으나 정보 수집에 실패했습니다."
          );
        }
      } else {
        showAlert("등록 완료", "새 단지가 등록되었습니다.");
      }
    },
    onError: () => {
      showAlert("등록 실패", "단지를 저장하는 중 오류가 발생했습니다.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Complex> }) =>
      complexApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complexes"] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => complexApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complexes"] });
      showAlert("삭제 완료", "단지가 성공적으로 삭제되었습니다.");
    },
    onError: () => {
      showAlert("삭제 실패", "단지를 삭제하는 중 오류가 발생했습니다.");
    },
  });

  const handleDeleteComplex = (complex: Complex) => {
    showAlert(
      "단지 삭제",
      `'${complex.name}' 단지를 삭제하시겠습니까? 관련 매물 데이터도 모두 삭제됩니다.`,
      () => deleteMutation.mutate(complex.id)
    );
  };

  const scrapeAllMutation = useMutation({
    mutationFn: () => complexApi.scrapeAll(),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["complexes"] });
      const data = response.data;
      showAlert(
        "수집 완료",
        `전체 데이터 수집이 완료되었습니다!\n${data.successComplexes}/${data.totalComplexes}개 단지, 총 ${data.totalListings}개 매물 수집`
      );
    },
    onError: () => {
      showAlert("수집 실패", "전체 데이터 수집에 실패했습니다.");
    },
  });

  const createTestComplexMutation = useMutation({
    mutationFn: (days: number) => complexApi.createTestComplex(days),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["complexes"] });
      const data = response.data;
      showAlert(
        "테스트 단지 생성",
        `테스트 단지 생성 완료! ${data.count}개의 더미 데이터가 포함되어 있습니다.`
      );
      // Navigate to the test complex detail page
      setTimeout(() => {
        if (data.complexId) {
          navigate(`/complex/${data.complexId}`);
        }
      }, 1000);
    },
    onError: () => {
      showAlert("생성 실패", "테스트 단지 생성에 실패했습니다.");
    },
  });
  const exportExcelMutation = useMutation({
    mutationFn: () => complexApi.exportAllExcel(),
    onSuccess: (response: any) => {
      const filename = `전체_데이터_추출_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      downloadBlob(response.data, filename);
    },
    onError: () => {
      showAlert("오류", "엑셀 파일을 생성하는 중 문제가 발생했습니다.");
    },
  });
  const handleEdit = (complex: Complex) => {
    let tags: string[] = [];
    try {
      if (complex.tags) {
        const parsed = JSON.parse(complex.tags);
        if (Array.isArray(parsed)) {
          tags = parsed;
        } else if (typeof parsed === "string") {
          tags = parsed
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t);
        }
      }
    } catch (e) {
      if (complex.tags) {
        tags = complex.tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t);
      }
    }

    const subwayLines = tags.filter((tag) =>
      SUBWAY_LINES.some((line) => tag.includes(line))
    );
    const otherTags = tags.filter(
      (tag) => !SUBWAY_LINES.some((line) => tag.includes(line))
    );

    setFormData({
      name: complex.name,
      address: complex.address,
      naverComplexId: complex.naverComplexId || "",
      tags: otherTags.join(", "),
      subwayLines: subwayLines,
    });
    setEditingId(complex.id);
    setShowForm(true);
  };

  const handleDownloadBackup = () => {
    window.location.assign("/api/backups/download");
  };

  const handleUploadRestore = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    showAlert(
      "데이터 복구 확인",
      `'${file.name}' 파일로 데이터를 복구하시겠습니까? 현재 저장된 모든 단지 정보와 시세 데이터가 해당 파일의 내용으로 완전히 교체됩니다.`,
      async () => {
        const formData = new FormData();
        formData.append("file", file);

        try {
          const response = await fetch("/api/backups/upload", {
            method: "POST",
            body: formData,
          });

          if (response.ok) {
            showAlert(
              "복구 성공",
              "데이터가 성공적으로 복구되었습니다. 최신 정보를 불러오기 위해 페이지를 새로고침합니다.",
              () => {
                window.location.reload();
              }
            );
          } else {
            throw new Error("업로드 실패");
          }
        } catch (error) {
          showAlert("오류 발생", "데이터를 복구하는 중 문제가 발생했습니다.");
        }
      }
    );

    e.target.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const otherTags = formData.tags
      ? formData.tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t)
      : [];
    const allTags = Array.from(
      new Set([...formData.subwayLines, ...otherTags])
    );

    const submitData = {
      ...formData,
      tags: allTags,
    };

    if (editingId) {
      // @ts-ignore
      updateMutation.mutate({ id: editingId, data: submitData });
    } else {
      // @ts-ignore
      createMutation.mutate(submitData);
    }
  };

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
        onCreateTestClick={() => {
          if (
            confirm(
              "7일간의 더미 데이터가 포함된 테스트 단지를 생성하시겠습니까?"
            )
          ) {
            createTestComplexMutation.mutate(7);
          }
        }}
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
              ? () =>
                  handleDeleteComplex(
                    complexes?.find((c) => c.id === editingId)!
                  )
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

      {/* 데이터 관리 섹션 */}
      <div className="mt-16 pt-10 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <Database className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">데이터 관리</h2>
            <p className="text-sm text-muted-foreground">
              내 데이터를 다른 곳에 저장하거나, 공유받은 데이터를 불러옵니다.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-slate-50/50 border-dashed border-2">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="bg-white p-3 rounded-full shadow-sm">
                  <Download className="w-6 h-6 text-blue-500" />
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="font-semibold">데이터 내보내기</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    현재까지 수집된 모든 아파트 단지 정보와 매물 시세를 하나의
                    .db 파일로 내려받습니다.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadBackup}
                    className="w-full mt-2 bg-white"
                  >
                    파일로 저장하기
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-50/50 border-dashed border-2">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="bg-white p-3 rounded-full shadow-sm">
                  <Upload className="w-6 h-6 text-green-500" />
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="font-semibold">데이터 불러오기</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    공유받은 .db 파일을 업로드하여 데이터를 복구합니다.{" "}
                    <span className="text-red-500 font-medium">
                      현재 데이터는 삭제되므로 유의하세요.
                    </span>
                  </p>
                  <div className="relative mt-2">
                    <input
                      type="file"
                      id="db-upload"
                      className="hidden"
                      accept=".db"
                      onChange={handleUploadRestore}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        document.getElementById("db-upload")?.click()
                      }
                      className="w-full bg-white"
                    >
                      파일 선택 및 복구
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 flex items-center gap-2 text-[11px] text-amber-600 bg-amber-50 p-2 rounded-md border border-amber-100">
          <AlertCircle className="w-3 h-3" />
          데이터를 불러온 후에는 기존 시황 정보가 모두 덮어써집니다. 중요한
          데이터는 미리 내보내기를 통해 보관하세요.
        </div>
      </div>
    </div>
  );
}
