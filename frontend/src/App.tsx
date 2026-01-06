import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ComplexList from './pages/ComplexList'
import { GlobalAlert } from './components/ui/GlobalAlert'
import ComplexDetail from './pages/ComplexDetail'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<ComplexList />} />
          <Route path="/complex/:id" element={<ComplexDetail />} />
        </Routes>
      </Layout>
      <GlobalAlert />
    </Router>
  )
}

export default App
