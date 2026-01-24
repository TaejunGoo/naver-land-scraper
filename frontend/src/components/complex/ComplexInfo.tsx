import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Edit,
  Info,
  Building,
  FileText,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { complexApi, type Complex, type ComplexUpdateInput } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useAlertStore } from "@/lib/store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SUBWAY_LINES, getTagColor } from "@/lib/constants";
import { formatDateKST } from "@/lib/format";

interface ComplexInfoProps {
  complex: Complex;
  currentListingCounts: {
    total: number;
    sale: number;
    jeonse: number;
    rent: number;
  } | null;
}

export function ComplexInfo({
  complex,
  currentListingCounts,
}: ComplexInfoProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { showAlert } = useAlertStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Complex>>({});
  const [subwayLines, setSubwayLines] = useState<string[]>([]);
  const [otherTags, setOtherTags] = useState("");

  useEffect(() => {
    if (isEditing && complex) {
      setFormData(complex);
      let tags: string[] = [];
      try {
        if (complex.tags) {
          tags = JSON.parse(complex.tags);
        }
      } catch (e) {
        if (complex.tags) {
          tags = complex.tags
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t);
        }
      }

      const lines = tags.filter((tag) =>
        SUBWAY_LINES.some((line) => tag.includes(line)),
      );
      const others = tags.filter(
        (tag) => !SUBWAY_LINES.some((line) => tag.includes(line)),
      );

      setSubwayLines(lines);
      setOtherTags(others.join(", "));
    }
  }, [isEditing, complex]);

  const updateMutation = useMutation({
    mutationFn: (data: ComplexUpdateInput) =>
      complexApi.update(complex.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["complex", String(complex.id)],
      });
      setIsEditing(false);
      showAlert("수정 완료", "단지 정보가 수정되었습니다.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => complexApi.delete(complex.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complexes"] });
      showAlert("삭제 완료", "단지가 성공적으로 삭제되었습니다.");
      navigate("/");
    },
    onError: () => {
      showAlert("삭제 실패", "단지를 삭제하는 중 오류가 발생했습니다.");
    },
  });

  const handleDelete = () => {
    showAlert(
      "단지 삭제",
      `'${complex.name}' 단지를 삭제하시겠습니까? 관련 매물 데이터도 모두 삭제됩니다.`,
      () => deleteMutation.mutate(),
    );
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();

    const otherTagsList = otherTags
      ? otherTags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t)
      : [];
    const allTags = Array.from(new Set([...subwayLines, ...otherTagsList]));

    updateMutation.mutate({
      name: formData.name,
      address: formData.address,
      naverComplexId: formData.naverComplexId,
      customNotes: formData.customNotes,
      tags: allTags,
    });
  };

  const handleCheckboxChange = (line: string, checked: boolean) => {
    if (checked) {
      setSubwayLines((prev) => [...prev, line]);
    } else {
      setSubwayLines((prev) => prev.filter((l) => l !== line));
    }
  };

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl">{complex.name}</CardTitle>
              <CardDescription>{complex.address}</CardDescription>
              {!isEditing && complex.tags && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {(() => {
                    let tags: string[] = [];
                    try {
                      tags = JSON.parse(complex.tags);
                    } catch (e) {
                      tags = complex.tags
                        .split(",")
                        .map((t) => t.trim())
                        .filter((t) => t);
                    }
                    return tags.map((tag, index) => (
                      <Badge
                        key={index}
                        className={`${getTagColor(
                          tag,
                        )} text-white border-0 text-[10px] px-1.5 py-0`}
                      >
                        {tag}
                      </Badge>
                    ));
                  })()}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {isEditing && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  삭제
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit className="w-4 h-4 mr-2" />
                {isEditing ? "취소" : "수정"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">단지명</label>
                <Input
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">주소</label>
                <Input
                  value={formData.address || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  네이버 단지 ID
                </label>
                <Input
                  value={formData.naverComplexId || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, naverComplexId: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  지하철 호선
                </label>
                <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-3 gap-2 p-3 border rounded-md bg-slate-50">
                  {SUBWAY_LINES.map((line) => (
                    <label
                      key={line}
                      className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-slate-100 p-1 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={subwayLines.includes(line)}
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
                  value={otherTags}
                  onChange={(e) => setOtherTags(e.target.value)}
                  placeholder="예: 초품아, 숲세권"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  커스텀 메모
                </label>
                <Textarea
                  value={formData.customNotes || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, customNotes: e.target.value })
                  }
                  placeholder="단지에 대한 추가 정보를 입력하세요"
                  rows={4}
                />
              </div>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "저장 중..." : "저장"}
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              {/* 매물 현황 요약 */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-center relative group">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                    총 매물
                  </div>
                  <div className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center justify-center gap-1">
                    {currentListingCounts?.total || 0}
                    {complex.listingStats?.diff?.total ? (
                      <span
                        className={`text-xs ${complex.listingStats.diff.total > 0 ? "text-red-500" : "text-blue-500"}`}
                      >
                        {complex.listingStats.diff.total > 0 ? "▲" : "▼"}
                        {Math.abs(complex.listingStats.diff.total)}
                      </span>
                    ) : null}
                  </div>
                  {complex.listingStats?.diff?.total !== undefined &&
                    complex.listingStats.diff.total !== 0 && (
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        전일 대비
                      </div>
                    )}
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-900/30 text-center relative group">
                  <div className="text-xs text-red-600 dark:text-red-400 mb-1">
                    매매
                  </div>
                  <div className="text-xl font-bold text-red-700 dark:text-red-400 flex items-center justify-center gap-1">
                    {currentListingCounts?.sale || 0}
                    {complex.listingStats?.diff?.sale ? (
                      <span
                        className={`text-xs ${complex.listingStats.diff.sale > 0 ? "text-red-600" : "text-blue-600"}`}
                      >
                        {complex.listingStats.diff.sale > 0 ? "▲" : "▼"}
                        {Math.abs(complex.listingStats.diff.sale)}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30 text-center relative group">
                  <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                    전세
                  </div>
                  <div className="text-xl font-bold text-blue-700 dark:text-blue-400 flex items-center justify-center gap-1">
                    {currentListingCounts?.jeonse || 0}
                    {complex.listingStats?.diff?.jeonse ? (
                      <span
                        className={`text-xs ${complex.listingStats.diff.jeonse > 0 ? "text-red-500" : "text-blue-500"}`}
                      >
                        {complex.listingStats.diff.jeonse > 0 ? "▲" : "▼"}
                        {Math.abs(complex.listingStats.diff.jeonse)}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-xl border border-green-100 dark:border-green-900/30 text-center relative group">
                  <div className="text-xs text-green-600 dark:text-green-400 mb-1">
                    월세
                  </div>
                  <div className="text-xl font-bold text-green-700 dark:text-green-400 flex items-center justify-center gap-1">
                    {currentListingCounts?.rent || 0}
                    {complex.listingStats?.diff?.rent ? (
                      <span
                        className={`text-xs ${complex.listingStats.diff.rent > 0 ? "text-red-500" : "text-blue-500"}`}
                      >
                        {complex.listingStats.diff.rent > 0 ? "▲" : "▼"}
                        {Math.abs(complex.listingStats.diff.rent)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* 주요 단지 정보 */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                  <Building className="w-4 h-4 text-slate-500" /> 단지 상세
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      세대수
                    </span>
                    <p className="font-medium text-slate-900 dark:text-slate-200">
                      {complex.units
                        ? `${complex.units.toLocaleString()}`
                        : "-"}
                      <span className="text-xs">세대</span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      동수
                    </span>
                    <p className="font-medium text-slate-900 dark:text-slate-200">
                      {complex.buildings ? `${complex.buildings}개동` : "-"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      준공년도
                    </span>
                    <p className="font-medium text-slate-900 dark:text-slate-200">
                      {complex.approvalDate ? (
                        <span>
                          {complex.approvalDate.substring(0, 4)}년
                          <span className="block text-xs text-slate-500">
                            (
                            {new Date().getFullYear() -
                              parseInt(complex.approvalDate.substring(0, 4)) +
                              1}
                            년차)
                          </span>
                        </span>
                      ) : complex.year ? (
                        `${complex.year}년`
                      ) : (
                        "-"
                      )}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      단지유형
                    </span>
                    <p className="font-medium text-slate-900 dark:text-slate-200">
                      {complex.type || "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* 추가 정보 */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4 text-slate-500" /> 추가 정보
                </h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">
                      사용승인일
                    </span>
                    <span className="font-medium">
                      {complex.approvalDate || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">
                      네이버 ID
                    </span>
                    <span className="font-mono bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600 text-[11px] text-slate-600 dark:text-slate-300">
                      {complex.naverComplexId || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">
                      정보갱신일
                    </span>
                    <span className="font-medium">
                      {complex.infoScrapedAt
                        ? formatDateKST(new Date(complex.infoScrapedAt))
                        : ""}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">
                      네이버 부동산
                    </span>
                    {complex.naverComplexId ? (
                      <a
                        href={`https://new.land.naver.com/complexes/${complex.naverComplexId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 text-[11px] font-medium"
                      >
                        링크 이동 <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 커스텀 메모 */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" /> 단지 메모
                </h3>
                <div className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-xl p-4 min-h-[120px]">
                  {complex.customNotes ? (
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {complex.customNotes}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-400 italic">
                      등록된 메모가 없습니다. [수정] 버튼을 눌러 메모를 입력해
                      보세요.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
