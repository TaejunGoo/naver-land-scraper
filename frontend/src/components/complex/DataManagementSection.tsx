/**
 * @fileoverview 데이터 관리 (백업/복구) UI 섹션
 *
 * 대시보드 하단에 표시되는 DB 백업/복구 영역입니다.
 * - 내보내기: .db 파일 다운로드 (/api/backups/download)
 * - 불러오기: .db 파일 업로드 (/api/backups/upload)
 *   복구 전 확인 대화상자를 표시하여 사고 방지
 */
import { Database, Download, Upload, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAlertStore } from "@/lib/store";

export function DataManagementSection() {
  const { showAlert } = useAlertStore();

  const handleDownloadBackup = () => {
    window.location.assign("/api/backups/download");
  };

  const handleUploadRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        } catch {
          showAlert("오류 발생", "데이터를 복구하는 중 문제가 발생했습니다.");
        }
      }
    );

    e.target.value = "";
  };

  return (
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
                    onClick={() => document.getElementById("db-upload")?.click()}
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
  );
}
