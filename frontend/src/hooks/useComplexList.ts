import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// Demo mode: navigate not used
// import { useNavigate } from "react-router-dom";
import { complexApi, type Complex, type ComplexCreateInput } from "@/lib/api";
import { useAlertStore, useHeaderStore } from "@/lib/store";
// Demo mode: downloadBlob not used
// import { downloadBlob } from "@/lib/utils";
import { SUBWAY_LINES } from "@/lib/constants";

export interface ComplexFormData {
  name: string;
  address: string;
  naverComplexId: string;
  tags: string;
  subwayLines: string[];
}

const initialFormData: ComplexFormData = {
  name: "",
  address: "",
  naverComplexId: "",
  tags: "",
  subwayLines: [],
};

export function useComplexList() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ComplexFormData>(initialFormData);
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<string>("asc");

  const { showAlert } = useAlertStore();
  const queryClient = useQueryClient();
  // Demo mode: navigate not used
  // const navigate = useNavigate();
  const setHeader = useHeaderStore((state) => state.setHeader);
  const resetHeader = useHeaderStore((state) => state.resetHeader);

  // Set header on mount
  useEffect(() => {
    setHeader({
      title: "대시보드",
      actions: null,
      showBackButton: false,
    });
    return () => resetHeader();
  }, [setHeader, resetHeader]);

  // Fetch complexes
  const { data: complexes, isLoading } = useQuery({
    queryKey: ["complexes"],
    queryFn: async () => {
      const response = await complexApi.getAll();
      return response.data;
    },
  });

  // Sort complexes
  const sortedComplexes = useMemo(() => {
    if (!complexes) return [];

    return [...complexes].sort((a, b) => {
      const aVal = a[sortBy as keyof typeof a];
      const bVal = b[sortBy as keyof typeof b];

      if (sortBy === "approvalDate") {
        if (!aVal) return 1;
        if (!bVal) return -1;
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortOrder === "asc"
        ? ((aVal as number) || 0) - ((bVal as number) || 0)
        : ((bVal as number) || 0) - ((aVal as number) || 0);
    });
  }, [complexes, sortBy, sortOrder]);

  // Reset form
  const resetForm = useCallback(() => {
    setShowForm(false);
    setEditingId(null);
    setFormData(initialFormData);
  }, []);

  // Demo mode: Create disabled
  const createMutation = useMutation({
    mutationFn: (data: ComplexCreateInput) => complexApi.create(data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["complexes"] });
      setShowForm(false);
      resetForm();
      showAlert("등록", "데모 모드에서는 사용할 수 없습니다.");
    },
    onError: (err: any) => {
      showAlert("등록 실패", err.message || "오류가 발생했습니다.");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ComplexCreateInput }) =>
      complexApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complexes"] });
      resetForm();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => complexApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complexes"] });
      resetForm();
      showAlert("삭제 완료", "단지가 성공적으로 삭제되었습니다.");
    },
    onError: () => {
      showAlert("삭제 실패", "단지를 삭제하는 중 오류가 발생했습니다.");
    },
  });

  // Demo mode: Scrape all disabled
  const scrapeAllMutation = useMutation({
    mutationFn: () => complexApi.scrapeAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complexes"] });
      queryClient.invalidateQueries({ queryKey: ["stats", "trend"] });
      showAlert("전체 수집", "데모 모드에서는 사용할 수 없습니다.");
    },
    onError: () => {
      showAlert("수집 실패", "전체 데이터 수집에 실패했습니다.");
    },
  });

  // Demo mode: Create test complex disabled
  const createTestComplexMutation = useMutation({
    mutationFn: (days: number) => complexApi.createTestComplex(days),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complexes"] });
      showAlert("테스트 단지 생성", "데모 모드에서는 사용할 수 없습니다.");
    },
    onError: () => {
      showAlert("생성 실패", "테스트 단지 생성에 실패했습니다.");
    },
  });

  // Demo mode: Export Excel disabled
  const exportExcelMutation = useMutation({
    mutationFn: () => complexApi.exportAllExcel(),
    onSuccess: () => {
      showAlert("엑셀 내보내기", "데모 모드에서는 사용할 수 없습니다.");
    },
    onError: () => {
      showAlert("오류", "데모 모드에서는 사용할 수 없습니다.");
    },
  });

  // Handle delete complex
  const handleDeleteComplex = useCallback(
    (complex: Complex) => {
      showAlert(
        "단지 삭제",
        `'${complex.name}' 단지를 삭제하시겠습니까? 관련 매물 데이터도 모두 삭제됩니다.`,
        () => deleteMutation.mutate(complex.id)
      );
    },
    [showAlert, deleteMutation]
  );

  // Handle edit
  const handleEdit = useCallback((complex: Complex) => {
    let tags: string[] = [];
    try {
      if (complex.tags) {
        const parsed = JSON.parse(complex.tags);
        if (Array.isArray(parsed)) {
          tags = parsed;
        } else if (typeof parsed === "string") {
          tags = parsed.split(",").map((t) => t.trim()).filter((t) => t);
        }
      }
    } catch {
      if (complex.tags) {
        tags = complex.tags.split(",").map((t) => t.trim()).filter((t) => t);
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
      subwayLines,
    });
    setEditingId(complex.id);
    setShowForm(true);
  }, []);

  // Handle submit
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const otherTags = formData.tags
        ? formData.tags.split(",").map((t) => t.trim()).filter((t) => t)
        : [];
      const allTags = Array.from(new Set([...formData.subwayLines, ...otherTags]));

      const submitData: ComplexCreateInput = {
        name: formData.name,
        address: formData.address,
        naverComplexId: formData.naverComplexId || null,
        tags: allTags,
      };

      if (editingId) {
        updateMutation.mutate({ id: editingId, data: submitData });
      } else {
        createMutation.mutate(submitData);
      }
    },
    [formData, editingId, updateMutation, createMutation]
  );

  // Handle create test click
  const handleCreateTestClick = useCallback(() => {
    showAlert(
      "테스트 단지 생성",
      "7일간의 더미 데이터가 포함된 테스트 단지를 생성하시겠습니까?",
      () => createTestComplexMutation.mutate(7)
    );
  }, [showAlert, createTestComplexMutation]);

  return {
    // State
    showForm,
    setShowForm,
    editingId,
    formData,
    setFormData,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,

    // Data
    complexes,
    sortedComplexes,
    isLoading,

    // Actions
    resetForm,
    handleEdit,
    handleSubmit,
    handleDeleteComplex,
    handleCreateTestClick,

    // Mutations
    scrapeAllMutation,
    exportExcelMutation,
    createMutation,
    updateMutation,
    createTestComplexMutation,
  };
}
