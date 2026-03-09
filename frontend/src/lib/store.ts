/**
 * @fileoverview Zustand 전역 상태 관리
 *
 * 앱 전체에서 공유되는 UI 상태를 Zustand로 관리합니다.
 * React 컴포넌트 트리를 넘어선 상태 공유가 필요한 경우에 사용합니다.
 *
 * 스토어 목록:
 * - useAlertStore: 전역 확인/알림 다이얼로그 제어
 * - useHeaderStore: 공통 헤더(제목, 액션 버튼, 뒤로가기) 제어
 */
import { create } from "zustand";
import { ReactNode } from "react";

/**
 * 전역 알림 다이얼로그 상태 인터페이스.
 *
 * GlobalAlert 컴포넌트와 연동되며, 어떤 컴포넌트에서든
 * showAlert()를 호출하여 확인 다이얼로그를 표시할 수 있습니다.
 */
interface AlertState {
  /** 다이얼로그 표시 여부 */
  open: boolean;
  /** 다이얼로그 제목 */
  title: string;
  /** 다이얼로그 본문 설명 */
  description: string;
  /** "확인" 버튼 클릭 시 실행할 콜백 (선택) */
  onConfirm?: () => void;
  /** 다이얼로그를 표시하는 액션 */
  showAlert: (title: string, description: string, onConfirm?: () => void) => void;
  /** 다이얼로그를 닫는 액션 */
  closeAlert: () => void;
}

/**
 * 전역 알림 다이얼로그 스토어.
 *
 * 사용 예:
 * ```
 * const { showAlert } = useAlertStore();
 * showAlert("삭제 확인", "정말 삭제하시겠습니까?", () => deleteMutation.mutate());
 * ```
 */
export const useAlertStore = create<AlertState>((set) => ({
  open: false,
  title: "",
  description: "",
  onConfirm: undefined,
  showAlert: (title, description, onConfirm) =>
    set({ open: true, title, description, onConfirm }),
  closeAlert: () => set({ open: false }),
}));

/**
 * 공통 헤더 상태 인터페이스.
 *
 * Layout 컴포넌트의 헤더 영역을 페이지별로 다르게 구성하기 위해 사용됩니다.
 * 각 페이지 컴포넌트가 마운트 시 setHeader()로 제목/액션을 설정합니다.
 */
interface HeaderState {
  /** 헤더 제목 (문자열 또는 JSX) */
  title: string | ReactNode;
  /** 헤더 우측 액션 버튼 영역 (JSX) */
  actions?: ReactNode;
  /** 뒤로가기 버튼 표시 여부 (true이면 로고 대신 ← 표시) */
  showBackButton?: boolean;
  /** 헤더 설정 변경 액션 */
  setHeader: (config: { title: string | ReactNode; actions?: ReactNode; showBackButton?: boolean }) => void;
  /** 헤더를 기본값("랜드브리핑")으로 초기화 */
  resetHeader: () => void;
}

/**
 * 공통 헤더 스토어.
 *
 * 사용 예:
 * ```
 * const setHeader = useHeaderStore(state => state.setHeader);
 * setHeader({ title: "단지 상세", showBackButton: true, actions: <Button>수집</Button> });
 * ```
 */
export const useHeaderStore = create<HeaderState>((set) => ({
  title: "랜드브리핑",
  actions: null,
  showBackButton: false,
  setHeader: (config) => set(config),
  resetHeader: () => set({ title: "랜드브리핑", actions: null, showBackButton: false }),
}));
