import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAlertStore } from "@/lib/store";

export function GlobalAlert() {
  const { open, title, description, onConfirm, closeAlert } = useAlertStore();

  return (
    <AlertDialog open={open} onOpenChange={(val) => !val && closeAlert()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {onConfirm && (
            <AlertDialogCancel onClick={closeAlert}>취소</AlertDialogCancel>
          )}
          <AlertDialogAction
            onClick={() => {
              if (onConfirm) onConfirm();
              closeAlert();
            }}
          >
            확인
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
