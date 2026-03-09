/**
 * @fileoverview 앱 라우트 정의
 *
 * React Router를 사용하여 SPA 페이지 라우팅을 구성합니다.
 *
 * 라우트 구조:
 * - /              → ComplexList (대시보드: 단지 카드 목록 + 요약 통계)
 * - /complex/:id   → ComplexDetail (단지 상세: 정보 + 차트 + 매물 테이블)
 * - /trend         → Trend (전체 시장 추세 분석: 차트 + 테이블)
 * - /records       → Records (신고가/신저가 매물 목록)
 *
 * Layout 컴포넌트가 모든 페이지의 공통 헤더/네비게이션을 제공하고,
 * GlobalAlert가 전역 확인 다이얼로그를 표시합니다.
 */
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ComplexList from './pages/ComplexList'
import ComplexDetail from './pages/ComplexDetail'
import Trend from './pages/Trend'
import Records from './pages/Records'
import { GlobalAlert } from './components/ui/GlobalAlert'

function App() {
  return (
    <Router>
      {/* Layout: 공통 헤더(로고, 뒤로가기, 액션 버튼), 메인 콘텐츠 영역 */}
      <Layout>
        <Routes>
          {/* 대시보드: 등록된 단지 카드 그리드 + 요약 통계 + 데이터 관리 */}
          <Route path="/" element={<ComplexList />} />
          {/* 단지 상세: 단지 정보 패널 + 시세 차트 + 매물 필터/테이블 */}
          <Route path="/complex/:id" element={<ComplexDetail />} />
          {/* 추세 분석: 평단가 라인차트 + 유형별 바차트 + 일자별 테이블 */}
          <Route path="/trend" element={<Trend />} />
          {/* 신고가/저가: 30일 대비 가격 갱신 매물 목록 */}
          <Route path="/records" element={<Records />} />
        </Routes>
      </Layout>
      {/* 전역 확인/알림 다이얼로그 (Zustand useAlertStore로 제어) */}
      <GlobalAlert />
    </Router>
  )
}

export default App
