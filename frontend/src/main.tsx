/**
 * @fileoverview React 앱 최상위 초기화 모듈
 *
 * 이 파일은 애플리케이션의 시작점으로, 다음을 설정합니다:
 * 1. TanStack Query 클라이언트 (서버 상태 관리)
 *    - refetchOnWindowFocus: false (창 포커스 시 자동 재요청 비활성화)
 *    - retry: 1 (실패 시 1회만 재시도)
 * 2. React.StrictMode (개발 모드에서 잠재적 문제 감지)
 * 3. DOM 루트에 앱 마운트
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './index.css'

/**
 * TanStack Query 클라이언트 인스턴스.
 * 모든 API 요청의 캐싱, 자동 갱신, 재시도 정책을 중앙 관리합니다.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // 브라우저 탭 전환 시 자동 재요청 방지 (로컬 앱이므로)
      retry: 1,                    // API 실패 시 1회만 재시도
    },
  },
})

/** React 앱을 DOM의 #root 요소에 마운트 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)
