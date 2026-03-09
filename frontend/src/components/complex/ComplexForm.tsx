/**
 * @fileoverview 단지 추가/수정 폼 컴포넌트
 *
 * 단지명, 주소, 네이버 ID, 지하철 호선, 태그를 입력할 수 있는 폼입니다.
 * editingId 유무에 따라 "새 단지 추가" 또는 "단지 정보 수정" 모드로 전환됩니다.
 * 수정 모드에서는 삭제 버튼이 추가로 표시됩니다.
 */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SUBWAY_LINES } from "@/lib/constants";

interface ComplexFormProps {
  editingId: number | null;
  formData: {
    name: string;
    address: string;
    naverComplexId: string;
    tags: string;
    subwayLines: string[];
  };
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onDelete?: () => void;
  isSubmitting: boolean;
}

export function ComplexForm({
  editingId,
  formData,
  setFormData,
  onSubmit,
  onCancel,
  onDelete,
  isSubmitting,
}: ComplexFormProps) {
  const handleCheckboxChange = (line: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        subwayLines: [...formData.subwayLines, line],
      });
    } else {
      setFormData({
        ...formData,
        subwayLines: formData.subwayLines.filter((l) => l !== line),
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editingId ? "단지 정보 수정" : "새 단지 추가"}</CardTitle>
        <CardDescription>
          네이버 부동산에서 단지 정보를 가져올 수 있습니다
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">단지명 (필수)</label>
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
            <label className="block text-sm font-medium mb-2">주소 (선택)</label>
            <Input
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              placeholder="예: 서울시 강남구"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              네이버 단지 ID (필수)
            </label>
            <Input
              value={formData.naverComplexId}
              onChange={(e) =>
                setFormData({ ...formData, naverComplexId: e.target.value })
              }
              placeholder="예: 12345"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              네이버 부동산 URL에서 확인: https://new.land.naver.com/complexes/<strong>26325</strong>?... 의 숫자 부분
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">지하철 호선</label>
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

          <div className="flex justify-between items-center pt-2">
            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "저장 중..." : "저장"}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                취소
              </Button>
            </div>
            {editingId && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
                disabled={isSubmitting}
              >
                삭제
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
