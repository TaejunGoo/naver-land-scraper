import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Trash2,
  ExternalLink,
  RefreshCw,
  Beaker,
  Pencil,
} from "lucide-react";
import { complexApi, type Complex } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const SUBWAY_LINES = [
  "1호선",
  "2호선",
  "3호선",
  "4호선",
  "5호선",
  "6호선",
  "7호선",
  "8호선",
  "9호선",
  "신분당선",
  "수인분당선",
  "경의중앙선",
  "공항철도",
  "GTX-A",
];

const getTagColor = (tag: string) => {
  if (tag.includes("1호선")) return "bg-[#0052A4] hover:bg-[#0052A4]/90";
  if (tag.includes("2호선")) return "bg-[#00A84D] hover:bg-[#00A84D]/90";
  if (tag.includes("3호선")) return "bg-[#EF7C1C] hover:bg-[#EF7C1C]/90";
  if (tag.includes("4호선")) return "bg-[#00A5DE] hover:bg-[#00A5DE]/90";
  if (tag.includes("5호선")) return "bg-[#996CAC] hover:bg-[#996CAC]/90";
  if (tag.includes("6호선")) return "bg-[#CD7C2F] hover:bg-[#CD7C2F]/90";
  if (tag.includes("7호선")) return "bg-[#747F00] hover:bg-[#747F00]/90";
  if (tag.includes("8호선")) return "bg-[#E6186C] hover:bg-[#E6186C]/90";
  if (tag.includes("9호선")) return "bg-[#BDB092] hover:bg-[#BDB092]/90";
  if (tag.includes("신분당")) return "bg-[#D4003B] hover:bg-[#D4003B]/90";
  if (tag.includes("수인분당")) return "bg-[#F5A200] hover:bg-[#F5A200]/90";
  if (tag.includes("경의중앙")) return "bg-[#77C4A3] hover:bg-[#77C4A3]/90";
  if (tag.includes("공항철도")) return "bg-[#0090D2] hover:bg-[#0090D2]/90";
  if (tag.includes("GTX")) return "bg-[#1E1E1E] hover:bg-[#1E1E1E]/90";
  return "bg-slate-500 hover:bg-slate-500/90";
};

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
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: complexes, isLoading } = useQuery({
    queryKey: ["complexes"],
    queryFn: async () => {
      const response = await complexApi.getAll();
      return response.data;
    },
  });

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complexes"] });
      resetForm();
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
    },
  });

  const scrapeAllMutation = useMutation({
    mutationFn: () => complexApi.scrapeAll(),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["complexes"] });
      const data = response.data;
      setToast({
        message: `전체 크롤링 완료! ${data.successComplexes}/${data.totalComplexes}개 단지, 총 ${data.totalListings}개 매물 수집`,
        type: "success",
      });
      setTimeout(() => setToast(null), 5000);
    },
    onError: () => {
      setToast({
        message: "전체 크롤링에 실패했습니다.",
        type: "error",
      });
      setTimeout(() => setToast(null), 5000);
    },
  });

  const createTestComplexMutation = useMutation({
    mutationFn: (days: number) => complexApi.createTestComplex(days),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["complexes"] });
      const data = response.data;
      setToast({
        message: `테스트 단지 생성 완료! ${data.count}개의 더미 데이터가 포함되어 있습니다.`,
        type: "success",
      });
      setTimeout(() => setToast(null), 4000);
      // Navigate to the test complex detail page
      setTimeout(() => {
        if (data.complexId) {
          navigate(`/complex/${data.complexId}`);
        }
      }, 1000);
    },
    onError: () => {
      setToast({
        message: "테스트 단지 생성에 실패했습니다.",
        type: "error",
      });
      setTimeout(() => setToast(null), 5000);
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
      // JSON 파싱 실패 시 콤마로 분리 시도 (하위 호환성)
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

  const handleCheckboxChange = (line: string, checked: boolean) => {
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        subwayLines: [...prev.subwayLines, line],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        subwayLines: prev.subwayLines.filter((l) => l !== line),
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const otherTags = formData.tags
      ? formData.tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t)
      : [];
    // 중복 제거를 위해 Set 사용
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
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
            toast.type === "success" ? "bg-green-500" : "bg-red-500"
          } text-white animate-in fade-in slide-in-from-top-2`}
        >
          {toast.message}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">관심 아파트 단지</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              if (
                confirm(
                  "365일간의 더미 데이터가 포함된 테스트 단지를 생성하시겠습니까?"
                )
              ) {
                createTestComplexMutation.mutate(365);
              }
            }}
            disabled={createTestComplexMutation.isPending}
            variant="outline"
          >
            <Beaker
              className={`w-4 h-4 mr-2 ${
                createTestComplexMutation.isPending ? "animate-spin" : ""
              }`}
            />
            {createTestComplexMutation.isPending
              ? "생성 중..."
              : "테스트 단지 생성"}
          </Button>
          <Button
            onClick={() => scrapeAllMutation.mutate()}
            disabled={
              scrapeAllMutation.isPending ||
              !complexes ||
              complexes.length === 0
            }
            variant="default"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${
                scrapeAllMutation.isPending ? "animate-spin" : ""
              }`}
            />
            {scrapeAllMutation.isPending ? "크롤링 중..." : "전체 매물 크롤링"}
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            단지 추가
          </Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingId ? "단지 정보 수정" : "새 단지 추가"}
            </CardTitle>
            <CardDescription>
              네이버 부동산에서 단지 정보를 가져올 수 있습니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">단지명</label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="예: 래미안강남"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">주소</label>
                <Input
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="예: 서울시 강남구"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  네이버 단지 ID (선택)
                </label>
                <Input
                  value={formData.naverComplexId}
                  onChange={(e) =>
                    setFormData({ ...formData, naverComplexId: e.target.value })
                  }
                  placeholder="예: 12345"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  지하철 호선
                </label>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2 p-3 border rounded-md bg-slate-50">
                  {SUBWAY_LINES.map((line) => (
                    <label
                      key={line}
                      className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-slate-100 p-1 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={formData.subwayLines.includes(line)}
                        onChange={(e) =>
                          handleCheckboxChange(line, e.target.checked)
                        }
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span>{line}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  기타 태그 (쉼표로 구분)
                </label>
                <Input
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  placeholder="예: 초품아, 숲세권"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "저장 중..."
                    : "저장"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  취소
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {complexes?.map((complex) => {
          // 사용승인일 기준 연차 계산
          let yearsSinceApproval = "-";
          if (complex.approvalDate) {
            try {
              const approvalYear = parseInt(complex.approvalDate.split(".")[0]);
              if (!isNaN(approvalYear)) {
                const currentYear = new Date().getFullYear();
                const years = currentYear - approvalYear;
                yearsSinceApproval = `${years}년차`;
              }
            } catch (e) {
              // 파싱 실패 시 그냥 '-' 표시
            }
          }

          // 태그 파싱 (배열/문자열 모두 안전하게 처리)
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
            // 파싱 실패 시 콤마로 분리 시도 (하위 호환성)
            if (complex.tags) {
              tags = complex.tags
                .split(",")
                .map((t) => t.trim())
                .filter((t) => t);
            }
          }

          return (
            <Card
              key={complex.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <CardTitle className="flex items-start justify-between gap-2">
                  <span className="flex-1">{complex.name}</span>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(complex)}
                      className="h-8 w-8"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(complex.id)}
                      disabled={deleteMutation.isPending}
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription className="text-xs">
                  {complex.address}
                </CardDescription>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tags.map((tag, index) => (
                      <Badge
                        key={index}
                        className={`${getTagColor(
                          tag
                        )} text-white border-0 text-[10px] px-1.5 py-0`}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* 단지 상세정보 */}
                  <div className="grid grid-cols-2 gap-2 py-2 border-y border-slate-100 text-xs">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">🏢 세대수</span>
                      <span className="font-semibold text-sm">
                        {complex.units || "-"}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">📅 연차</span>
                      <span className="font-semibold text-sm">
                        {yearsSinceApproval}
                      </span>
                    </div>
                  </div>
                  <div className="py-2 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-muted-foreground">
                        📊 현재 매물
                      </span>
                      <span className="font-bold text-sm text-blue-600">
                        {complex.todayListingCount || 0}개
                      </span>
                    </div>
                    {complex.todayListingCounts && (
                      <div className="flex gap-2 justify-end text-[11px] text-slate-500">
                        <span className="text-red-500">
                          매매 {complex.todayListingCounts.sale}
                        </span>
                        <span className="text-blue-500">
                          전세 {complex.todayListingCounts.jeonse}
                        </span>
                        <span className="text-green-500">
                          월세 {complex.todayListingCounts.rent}
                        </span>
                      </div>
                    )}
                  </div>

                  <Link to={`/complex/${complex.id}`}>
                    <Button variant="outline" className="w-full">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      상세보기
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {complexes?.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            등록된 단지가 없습니다. 단지를 추가해보세요!
          </CardContent>
        </Card>
      )}
    </div>
  );
}
