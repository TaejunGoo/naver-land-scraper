import { Database, Download, Upload, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAlertStore } from "@/lib/store";

export function DataManagementSection() {
  const { showAlert } = useAlertStore();

  // Demo mode: Functions disabled
  const handleDownloadBackup = () => {
    showAlert("데이터 내보내기", "데모 모드에서는 사용할 수 없습니다.");
  };

  const handleUploadRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = "";
    showAlert("데이터 불러오기", "데모 모드에서는 사용할 수 없습니다.");
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
                  disabled
                  className="w-full mt-2 bg-white"
                  title="데모 모드에서는 사용할 수 없습니다"
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
                    disabled
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("db-upload")?.click()}
                    disabled
                    className="w-full bg-white"
                    title="데모 모드에서는 사용할 수 없습니다"
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
