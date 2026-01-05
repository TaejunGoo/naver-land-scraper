import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, RefreshCw, Edit, Info, BarChart3, Building, FileText, ExternalLink } from 'lucide-react'
import { complexApi, listingApi, type Complex } from '@/lib/api'
import { formatPrice, formatArea } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  ComposedChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

const SUBWAY_LINES = [
  '1호선', '2호선', '3호선', '4호선', '5호선', '6호선', '7호선', '8호선', '9호선',
  '신분당선', '수인분당선', '경의중앙선', '공항철도', 'GTX-A'
]

const getTagColor = (tag: string) => {
  if (tag.includes('1호선')) return 'bg-[#0052A4] hover:bg-[#0052A4]/90'
  if (tag.includes('2호선')) return 'bg-[#00A84D] hover:bg-[#00A84D]/90'
  if (tag.includes('3호선')) return 'bg-[#EF7C1C] hover:bg-[#EF7C1C]/90'
  if (tag.includes('4호선')) return 'bg-[#00A5DE] hover:bg-[#00A5DE]/90'
  if (tag.includes('5호선')) return 'bg-[#996CAC] hover:bg-[#996CAC]/90'
  if (tag.includes('6호선')) return 'bg-[#CD7C2F] hover:bg-[#CD7C2F]/90'
  if (tag.includes('7호선')) return 'bg-[#747F00] hover:bg-[#747F00]/90'
  if (tag.includes('8호선')) return 'bg-[#E6186C] hover:bg-[#E6186C]/90'
  if (tag.includes('9호선')) return 'bg-[#BDB092] hover:bg-[#BDB092]/90'
  if (tag.includes('신분당')) return 'bg-[#D4003B] hover:bg-[#D4003B]/90'
  if (tag.includes('수인분당')) return 'bg-[#F5A200] hover:bg-[#F5A200]/90'
  if (tag.includes('경의중앙')) return 'bg-[#77C4A3] hover:bg-[#77C4A3]/90'
  if (tag.includes('공항철도')) return 'bg-[#0090D2] hover:bg-[#0090D2]/90'
  if (tag.includes('GTX')) return 'bg-[#1E1E1E] hover:bg-[#1E1E1E]/90'
  return 'bg-slate-500 hover:bg-slate-500/90'
}

// 커스텀 툴팁 컴포넌트
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg p-4" style={{ minWidth: '220px' }}>
      <div className="text-sm font-semibold text-slate-700 mb-3 pb-2 border-b border-slate-100">
        📅 {label}
      </div>
      <div className="space-y-2">
        {payload.map((entry: any, index: number) => {
          if (!entry.value || entry.dataKey === 'min' || entry.dataKey === 'max') return null
          
          let icon = '📊'
          let label = entry.name || ''
          
          if (entry.dataKey === 'average' || label.includes('평균')) {
            icon = '💰'
            label = '평균가'
          } else if (entry.dataKey === 'median' || label.includes('중간')) {
            icon = '📈'
            label = '중간가'
          } else if (label.includes('최고')) {
            icon = '🔺'
          } else if (label.includes('최저')) {
            icon = '🔻'
          } else if (entry.dataKey === 'count' || label.includes('매물')) {
            icon = '📋'
          }
          
          return (
            <div key={index} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs font-medium text-slate-600">{icon} {label}</span>
              </div>
              <span className="text-sm font-bold text-slate-900" style={{ color: entry.color }}>
                {entry.dataKey === 'count' ? `${entry.value}개` : formatPrice(entry.value as number)}
              </span>
            </div>
          )
        })}
      </div>
      {payload.some((p: any) => p.dataKey === 'max') && payload.some((p: any) => p.dataKey === 'min') && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">가격 범위</span>
            <span className="font-semibold text-slate-700">
              {formatPrice(payload.find((p: any) => p.dataKey === 'min')?.value as number)} ~ {formatPrice(payload.find((p: any) => p.dataKey === 'max')?.value as number)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ComplexDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<Complex>>({})
  const [subwayLines, setSubwayLines] = useState<string[]>([])
  const [otherTags, setOtherTags] = useState('')

  // 필터링/소팅 상태
  const [selectedTradeTypes, setSelectedTradeTypes] = useState<Set<string>>(new Set(['매매']))
  const [selectedAreas, setSelectedAreas] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState('scrapedAt')
  const [sortOrder, setSortOrder] = useState('desc')

  // 체크박스 선택 상태
  const [selectedListings, setSelectedListings] = useState<Set<number>>(new Set())

  // 토스트 메시지 상태
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // 스크롤 위치 저장용
  const scrollPositionRef = useRef<number>(0)

  // 그래프 설정 상태
  const [chartDays, setChartDays] = useState(30) // 7, 30, 90, 180, 365
  const [chartTradeType, setChartTradeType] = useState<string>('매매') // specific tradetype

  // 레이지 로딩 상태
  const [displayCount, setDisplayCount] = useState(50) // 처음에 50개만 표시
  const [showAll, setShowAll] = useState(false) // 전체 보기 여부

  const { data: complex, isLoading: complexLoading } = useQuery({
    queryKey: ['complex', id],
    queryFn: async () => {
      const response = await complexApi.getById(Number(id))
      setFormData(response.data)
      return response.data
    },
    enabled: !!id,
  })

  // 태그 초기화
  useEffect(() => {
    if (isEditing && complex) {
      let tags: string[] = []
      try {
        if (complex.tags) {
          tags = JSON.parse(complex.tags)
        }
      } catch (e) {
        if (complex.tags) {
          tags = complex.tags.split(',').map(t => t.trim()).filter(t => t)
        }
      }
      
      const lines = tags.filter(tag => SUBWAY_LINES.some(line => tag.includes(line)))
      const others = tags.filter(tag => !SUBWAY_LINES.some(line => tag.includes(line)))
      
      setSubwayLines(lines)
      setOtherTags(others.join(', '))
    }
  }, [isEditing, complex])

  // areaOptions 파싱
  const areaOptions = complex?.areaOptions
    ? JSON.parse(complex.areaOptions)
    : []

  // areaOptions가 로드되면 모두 선택
  useEffect(() => {
    if (areaOptions.length > 0 && selectedAreas.size === 0) {
      setSelectedAreas(new Set(areaOptions))
    }
  }, [areaOptions.length])

  const { data: listings, isLoading: listingsLoading } = useQuery({
    queryKey: ['listings', id, Array.from(selectedTradeTypes), Array.from(selectedAreas), sortBy, sortOrder],
    queryFn: async () => {
      // 1. 서버에서 데이터 가져오기 (거래유형, 정렬만 적용)
      const response = await listingApi.getByComplexId(Number(id), {
        tradetype: Array.from(selectedTradeTypes),
        sortBy,
        sortOrder
      })
      
      const fetchedListings = response.data

      // 2. 면적 필터링 (클라이언트 사이드)
      // 전체 선택되었거나 선택된게 없으면 필터링 건너뜀
      if (selectedAreas.size === 0 || selectedAreas.size === areaOptions.length) {
        return fetchedListings
      }

      // 선택된 면적 옵션에서 숫자 추출 (공급면적 기준)
      const targetAreas = Array.from(selectedAreas).map(option => {
        const match = option.match(/([\d.]+)/)
        return match ? parseFloat(match[1]) : null
      }).filter((n): n is number => n !== null)

      if (targetAreas.length === 0) return fetchedListings

      // 매물의 공급면적(supplyArea)과 비교
      // 오차 범위 ±2 (네이버 단지 정보의 면적과 실제 매물 면적의 차이 고려)
      const TOLERANCE = 2.0

      return fetchedListings.filter(listing => {
        // 공급면적이 있으면 사용, 없으면 전용면적 사용 (fallback)
        const listingArea = listing.supplyArea && listing.supplyArea > 0 
          ? listing.supplyArea 
          : listing.area

        return targetAreas.some(target => Math.abs(listingArea - target) <= TOLERANCE)
      })
    },
    enabled: !!id,
  })

  // 그래프용 전체 데이터 (필터 무시)
  const { data: allListings } = useQuery({
    queryKey: ['allListings', id],
    queryFn: async () => {
      const response = await listingApi.getByComplexId(Number(id), {})
      return response.data
    },
    enabled: !!id,
  })

  // 데이터 로딩 완료 후 스크롤 위치 복원
  useEffect(() => {
    if (!listingsLoading && scrollPositionRef.current > 0) {
      window.scrollTo(0, scrollPositionRef.current)
    }
  }, [listingsLoading])

  // 현재 매물 카운트 계산
  const currentListingCounts = useMemo(() => {
    if (!allListings) return null
    
    const counts = {
      total: allListings.length,
      sale: 0,
      jeonse: 0,
      rent: 0
    }
    
    allListings.forEach(listing => {
      if (listing.tradetype === '매매') counts.sale++
      else if (listing.tradetype === '전세') counts.jeonse++
      else if (listing.tradetype === '월세') counts.rent++
    })
    
    return counts
  }, [allListings])

  // 날짜별 통계 계산 (그래프용 - 필터 무시, 전체 데이터 사용)
  const chartData = useMemo(() => {
    if (!allListings || allListings.length === 0) return []

    const now = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - chartDays)

    // 거래유형 필터링 적용 (그래프 자체 필터)
    const filteredListings = allListings.filter(l => l.tradetype === chartTradeType)

    // 날짜별로 그룹화
    const dateMap = new Map<string, number[]>()
    
    filteredListings.forEach(listing => {
      const date = new Date(listing.scrapedAt)
      if (date >= startDate && date <= now) {
        const dateStr = date.toISOString().split('T')[0]
        if (!dateMap.has(dateStr)) {
          dateMap.set(dateStr, [])
        }
        dateMap.get(dateStr)!.push(listing.price)
      }
    })

    // 날짜 범위 내 모든 날짜 생성 (빈 날짜도 포함)
    const result = []
    for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      const prices = dateMap.get(dateStr) || []
      
      if (prices.length > 0) {
        const sortedPrices = [...prices].sort((a, b) => a - b)
        result.push({
          date: dateStr,
          displayDate: `${d.getMonth() + 1}/${d.getDate()}`,
          count: prices.length,
          min: Math.min(...prices),
          max: Math.max(...prices),
          avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
          median: sortedPrices[Math.floor(sortedPrices.length / 2)]
        })
      }
    }

    return result
  }, [allListings, chartDays, chartTradeType])

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Complex>) => complexApi.update(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complex', id] })
      setIsEditing(false)
      setToast({ message: '단지 정보가 수정되었습니다.', type: 'success' })
      setTimeout(() => setToast(null), 3000)
    },
  })

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    
    const otherTagsList = otherTags ? otherTags.split(',').map(t => t.trim()).filter(t => t) : []
    const allTags = Array.from(new Set([...subwayLines, ...otherTagsList]))
    
    // @ts-ignore
    updateMutation.mutate({
      ...formData,
      tags: allTags
    })
  }

  const handleCheckboxChange = (line: string, checked: boolean) => {
    if (checked) {
      setSubwayLines(prev => [...prev, line])
    } else {
      setSubwayLines(prev => prev.filter(l => l !== line))
    }
  }

  const handleSelectListing = (id: number) => {
    const newSelected = new Set(selectedListings)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedListings(newSelected)
  }

  const handleSelectAll = () => {
    if (listings && listings.length > 0) {
      if (selectedListings.size === listings.length) {
        setSelectedListings(new Set())
      } else {
        setSelectedListings(new Set(listings.map(l => l.id)))
      }
    }
  }

  const handleTradeTypeChange = (type: string) => {
    const newSelected = new Set(selectedTradeTypes)
    if (newSelected.has(type)) {
      newSelected.delete(type)
    } else {
      newSelected.add(type)
    }
    setSelectedTradeTypes(newSelected)
    // 필터 변경 시 레이지 로딩 초기화
    setDisplayCount(50)
    setShowAll(false)
  }

  const handleAreaChange = (area: string) => {
    const newSelected = new Set(selectedAreas)
    if (newSelected.has(area)) {
      newSelected.delete(area)
    } else {
      newSelected.add(area)
    }
    setSelectedAreas(newSelected)
    // 필터 변경 시 레이지 로딩 초기화
    setDisplayCount(50)
    setShowAll(false)
  }

  const handleSort = (field: string) => {
    scrollPositionRef.current = window.scrollY
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
    // 정렬 변경 시 레이지 로딩 초기화
    setDisplayCount(50)
    setShowAll(false)
  }

  const scrapeMutation = useMutation({
    mutationFn: () => complexApi.scrape(Number(id)),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['listings', id] })
      const count = response?.data?.count || 0
      setToast({
        message: `매물 크롤링 성공! ${count}개의 매물을 수집했습니다.`,
        type: 'success'
      })
      setTimeout(() => setToast(null), 3000)
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || error?.message || '크롤링 실패'
      setToast({
        message: `매물 크롤링 실패: ${errorMessage}`,
        type: 'error'
      })
      setTimeout(() => setToast(null), 3000)
    },
  })

  const scrapeInfoMutation = useMutation({
    mutationFn: () => complexApi.scrapeInfo(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complex', id] })
      setToast({
        message: '단지 정보 수집 성공!',
        type: 'success'
      })
      setTimeout(() => setToast(null), 3000)
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || error?.message || '수집 실패'
      setToast({
        message: `단지 정보 수집 실패: ${errorMessage}`,
        type: 'error'
      })
      setTimeout(() => setToast(null), 3000)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (listingId: number) => listingApi.delete(listingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings', id] })
      setSelectedListings(new Set())
    },
  })

  const batchDeleteMutation = useMutation({
    mutationFn: (ids: number[]) => listingApi.batchDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings', id] })
      setSelectedListings(new Set())
    },
  })

  const deleteAllMutation = useMutation({
    mutationFn: () => listingApi.deleteAll(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings', id] })
      setSelectedListings(new Set())
    },
  })

  if (complexLoading) {
    return <div>로딩 중...</div>
  }

  if (!complex) {
    return <div>단지를 찾을 수 없습니다.</div>
  }

  return (
    <div className="space-y-6">
      {/* 토스트 메시지 */}
      {toast && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white animate-in fade-in slide-in-from-top-2 z-50 ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-bold">{complex.name}</h1>
      </div>

      {/* 단지 정보 카드 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>단지 정보</CardTitle>
              <CardDescription>{complex.address}</CardDescription>
              {!isEditing && complex.tags && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {(() => {
                    let tags: string[] = []
                    try {
                      tags = JSON.parse(complex.tags)
                    } catch (e) {
                      tags = complex.tags.split(',').map(t => t.trim()).filter(t => t)
                    }
                    return tags.map((tag, index) => (
                      <Badge key={index} className={`${getTagColor(tag)} text-white border-0 text-[10px] px-1.5 py-0`}>
                        {tag}
                      </Badge>
                    ))
                  })()}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => scrapeInfoMutation.mutate()}
                disabled={scrapeInfoMutation.isPending || !complex.naverComplexId}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${scrapeInfoMutation.isPending ? 'animate-spin' : ''}`} />
                {scrapeInfoMutation.isPending ? '정보 수집 중...' : '단지 정보 수집'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit className="w-4 h-4 mr-2" />
                {isEditing ? '취소' : '수정'}
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
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">주소</label>
                <Input
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">네이버 단지 ID</label>
                <Input
                  value={formData.naverComplexId || ''}
                  onChange={(e) => setFormData({ ...formData, naverComplexId: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">지하철 호선</label>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2 p-3 border rounded-md bg-slate-50">
                  {SUBWAY_LINES.map(line => (
                    <label key={line} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-slate-100 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={subwayLines.includes(line)}
                        onChange={(e) => handleCheckboxChange(line, e.target.checked)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span>{line}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">기타 태그 (쉼표로 구분)</label>
                <Input
                  value={otherTags}
                  onChange={(e) => setOtherTags(e.target.value)}
                  placeholder="예: 초품아, 숲세권"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">커스텀 메모</label>
                <Textarea
                  value={formData.customNotes || ''}
                  onChange={(e) => setFormData({ ...formData, customNotes: e.target.value })}
                  placeholder="단지에 대한 추가 정보를 입력하세요"
                  rows={4}
                />
              </div>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? '저장 중...' : '저장'}
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              {/* 매물 현황 요약 */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">총 매물</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{currentListingCounts?.total || 0}</div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-900/30 text-center">
                  <div className="text-xs text-red-600 dark:text-red-400 mb-1">매매</div>
                  <div className="text-xl font-bold text-red-700 dark:text-red-400">{currentListingCounts?.sale || 0}</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30 text-center">
                  <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">전세</div>
                  <div className="text-xl font-bold text-blue-700 dark:text-blue-400">{currentListingCounts?.jeonse || 0}</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-xl border border-green-100 dark:border-green-900/30 text-center">
                  <div className="text-xs text-green-600 dark:text-green-400 mb-1">월세</div>
                  <div className="text-xl font-bold text-green-700 dark:text-green-400">{currentListingCounts?.rent || 0}</div>
                </div>
              </div>

              {/* 주요 단지 정보 */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                  <Building className="w-4 h-4 text-slate-500" /> 단지 상세
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400">세대수</span>
                    <p className="font-medium text-slate-900 dark:text-slate-200">
                      {complex.units ? `${complex.units.toLocaleString()}세대` : '-'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400">동수</span>
                    <p className="font-medium text-slate-900 dark:text-slate-200">
                      {complex.buildings ? `${complex.buildings}개동` : '-'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400">준공년도</span>
                    <p className="font-medium text-slate-900 dark:text-slate-200">
                      {complex.approvalDate ? (
                        <span>
                          {complex.approvalDate.substring(0, 4)}년 
                          <span className="text-xs text-slate-500 ml-1">
                            ({new Date().getFullYear() - parseInt(complex.approvalDate.substring(0, 4)) + 1}년차)
                          </span>
                        </span>
                      ) : complex.year ? `${complex.year}년` : '-'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400">단지유형</span>
                    <p className="font-medium text-slate-900 dark:text-slate-200">
                      {complex.type || '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 추가 정보 및 메모 */}
              <div className="grid md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Info className="w-4 h-4 text-slate-500" /> 추가 정보
                  </h3>
                  <div className="space-y-3 text-sm border-t border-slate-100 dark:border-slate-700 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400">사용승인일</span>
                      <span className="font-medium">{complex.approvalDate || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400">네이버 ID</span>
                      <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs text-slate-600 dark:text-slate-300">
                        {complex.naverComplexId || '미설정'}
                      </span>
                    </div>
                    {complex.naverComplexId && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400">네이버 부동산</span>
                        <a 
                          href={`https://new.land.naver.com/complexes/${complex.naverComplexId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1 text-xs"
                        >
                          바로가기 <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400">정보 업데이트</span>
                      <span className="text-xs text-slate-400">
                        {complex.infoScrapedAt ? new Date(complex.infoScrapedAt).toLocaleDateString() : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-500" /> 메모
                  </h3>
                  <div className="bg-yellow-50/50 dark:bg-yellow-900/10 rounded-xl p-4 text-sm text-slate-700 dark:text-slate-300 min-h-[100px] border border-yellow-100 dark:border-yellow-900/20">
                    {complex.customNotes ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{complex.customNotes}</p>
                    ) : (
                      <p className="text-slate-400 italic">등록된 메모가 없습니다.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 단지 상세 정보 섹션 (기존 코드 제거됨) */}
        </CardContent>
      </Card>

      {/* 매물 정보 카드 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center gap-4">
            <div>
              <CardTitle>매물 정보</CardTitle>
              {complex.lastScrapedAt && (
                <CardDescription>
                  마지막 업데이트: {new Date(complex.lastScrapedAt).toLocaleString()}
                </CardDescription>
              )}
              {!complex.naverComplexId && (
                <CardDescription className="text-destructive">
                  네이버 단지 ID를 설정하면 매물을 크롤링할 수 있습니다.
                </CardDescription>
              )}
            </div>
            <Button
              onClick={() => scrapeMutation.mutate()}
              disabled={scrapeMutation.isPending || !complex.naverComplexId}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${scrapeMutation.isPending ? 'animate-spin' : ''}`} />
              {scrapeMutation.isPending ? '크롤링 중...' : '매물 크롤링'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 날짜별 통계 그래프 */}
          {allListings && allListings.length > 0 && (
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* 헤더 */}
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 px-6 py-4">
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      📊 날짜별 매물 통계
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {chartData.length > 0 ? `${chartData.length}일간의 데이터 (전체 매물 기준)` : '데이터를 불러오는 중...'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* 날짜 범위 선택 */}
                    <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 px-1 py-1">
                      {[
                        { value: 7, label: '7일' },
                        { value: 30, label: '30일' },
                        { value: 90, label: '90일' },
                        { value: 180, label: '180일' },
                        { value: 365, label: '1년' }
                      ].map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => setChartDays(value)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                            chartDays === value
                              ? 'bg-blue-500 text-white shadow-sm'
                              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* 거래유형 선택 */}
                    <select 
                      value={chartTradeType} 
                      onChange={(e) => setChartTradeType(e.target.value)}
                      className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 rounded-lg cursor-pointer hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="매매">💰 매매</option>
                      <option value="전세">🏡 전세</option>
                      <option value="월세">📅 월세</option>
                    </select>
                    {/* 면적 필터 */}
                    <div className="flex gap-2 items-center bg-white dark:bg-slate-800 rounded-lg border border-slate-200 px-3 py-1.5">
                      <span className="text-xs font-medium text-slate-600 whitespace-nowrap">면적:</span>
                      <div className="flex gap-1 flex-wrap max-w-xs">
                        {areaOptions.map((area) => (
                          <label key={area} className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedAreas.has(area)}
                              onChange={() => handleAreaChange(area)}
                              className="w-3 h-3 cursor-pointer"
                            />
                            <span className="text-xs text-slate-600">{area}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {chartData.length > 0 ? (
                <div className="p-6 space-y-6">
                  {/* 그래프 */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-100" style={{ height: '450px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart 
                        data={chartData}
                        margin={{ top: 10, right: 30, left: 10, bottom: 60 }}
                      >
                        <defs>
                          <linearGradient id="colorBand" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#93c5fd" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#dbeafe" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                        <XAxis 
                          dataKey="displayDate" 
                          tick={{ fontSize: 12, fill: '#64748b' }}
                          angle={-45}
                          textAnchor="end"
                          height={70}
                          stroke="#cbd5e1"
                        />
                        <YAxis 
                          yAxisId="left"
                          tick={{ fontSize: 12, fill: '#64748b' }}
                          tickFormatter={(value) => `${(value / 10000).toFixed(0)}억`}
                          stroke="#cbd5e1"
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          tick={{ fontSize: 12, fill: '#64748b' }}
                          tickFormatter={(value) => `${Math.round(value)}개`}
                          stroke="#cbd5e1"
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                          wrapperStyle={{ paddingTop: '20px' }}
                          iconType="circle"
                        />
                        
                        {/* 밴드 영역: 최고가 Area */}
                        <Area 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="max" 
                          stroke="none"
                          fill="url(#colorBand)"
                          name="가격 밴드"
                        />
                        {/* 밴드 영역: 최저가 Area (위쪽을 덮어서 밴드 만들기) */}
                        <Area 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="min" 
                          stroke="none"
                          fill="white"
                          fillOpacity={1}
                        />
                        
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="max" 
                          stroke="#ef4444" 
                          name="최고가" 
                          strokeWidth={3}
                          dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 6, fill: '#ef4444' }}
                        />
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="median" 
                          stroke="#8b5cf6" 
                          name="중간값" 
                          strokeWidth={2.5}
                          dot={{ r: 3, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 6, fill: '#8b5cf6' }}
                          strokeDasharray="8 4"
                        />
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="min" 
                          stroke="#10b981" 
                          name="최저가" 
                          strokeWidth={3}
                          dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 6, fill: '#10b981' }}
                        />
                        <Bar 
                          yAxisId="right"
                          dataKey="count" 
                          fill="#fb923c" 
                          name="매물 수" 
                          opacity={0.5}
                          radius={[4, 4, 0, 0]}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                    <BarChart3 className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    선택한 기간에 데이터가 없습니다
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    다른 기간을 선택해보세요
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 필터링 패널 */}
          <div className="p-4 bg-muted rounded-lg space-y-4">
            {/* 거래유형 필터 */}
            <div>
              <h4 className="text-sm font-medium mb-2">거래유형</h4>
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTradeTypes.size === 3}
                    onChange={() => {
                      if (selectedTradeTypes.size === 3) {
                        setSelectedTradeTypes(new Set())
                      } else {
                        setSelectedTradeTypes(new Set(['매매', '전세', '월세']))
                      }
                    }}
                    className="cursor-pointer"
                  />
                  <span className="text-sm font-medium">전체</span>
                </label>
                {['매매', '전세', '월세'].map((type) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTradeTypes.has(type)}
                      onChange={() => handleTradeTypeChange(type)}
                      className="cursor-pointer"
                    />
                    <span className="text-sm">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 면적 필터 */}
            {areaOptions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">면적</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedAreas.size === areaOptions.length}
                      onChange={() => {
                        if (selectedAreas.size === areaOptions.length) {
                          setSelectedAreas(new Set())
                        } else {
                          setSelectedAreas(new Set(areaOptions))
                        }
                      }}
                      className="cursor-pointer"
                    />
                    <span className="text-sm font-medium">전체</span>
                  </label>
                  {areaOptions.map((area: string) => (
                    <label key={area} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedAreas.has(area)}
                        onChange={() => handleAreaChange(area)}
                        className="cursor-pointer"
                      />
                      <span className="text-sm">{area}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>


          {/* 매물 목록 */}
          {listingsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              <span className="ml-3 text-muted-foreground">매물 정보를 불러오는 중...</span>
            </div>
          ) : listings && listings.length > 0 ? (
            <div className="space-y-3">
              {/* 삭제 버튼 */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs"
                >
                  {selectedListings.size === listings.length && selectedListings.size > 0
                    ? '전체 해제'
                    : '전체 선택'}
                </Button>
                {selectedListings.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (window.confirm(`${selectedListings.size}개의 매물을 삭제하시겠습니까?`)) {
                        batchDeleteMutation.mutate(Array.from(selectedListings))
                      }
                    }}
                    disabled={batchDeleteMutation.isPending}
                    className="text-xs"
                  >
                    선택 삭제 ({selectedListings.size})
                  </Button>
                )}
                {listings.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (window.confirm('모든 매물을 삭제하시겠습니까?')) {
                        deleteAllMutation.mutate()
                      }
                    }}
                    disabled={deleteAllMutation.isPending}
                    className="text-xs"
                  >
                    전체 삭제
                  </Button>
                )}
              </div>

              {/* 테이블 */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4 w-8">
                        <input
                          type="checkbox"
                          checked={selectedListings.size > 0 && selectedListings.size === listings.length}
                          onChange={handleSelectAll}
                          className="cursor-pointer"
                        />
                      </th>
                      <th className="text-left py-2 px-4 cursor-pointer hover:bg-muted/50 select-none" onClick={() => handleSort('tradetype')}>
                        거래유형 {sortBy === 'tradetype' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="text-left py-2 px-4 cursor-pointer hover:bg-muted/50 select-none" onClick={() => handleSort('price')}>
                        가격 {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="text-left py-2 px-4">
                        평단가
                      </th>
                      <th className="text-left py-2 px-4 cursor-pointer hover:bg-muted/50 select-none" onClick={() => handleSort('area')}>
                        면적 {sortBy === 'area' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="text-left py-2 px-4 cursor-pointer hover:bg-muted/50 select-none" onClick={() => handleSort('floor')}>
                        층 {sortBy === 'floor' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="text-left py-2 px-4">방향</th>
                      <th className="text-left py-2 px-4">메모</th>
                      <th className="text-left py-2 px-4 cursor-pointer hover:bg-muted/50 select-none" onClick={() => handleSort('scrapedAt')}>
                        수집일시 {sortBy === 'scrapedAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(showAll ? listings : listings.slice(0, displayCount)).map((listing) => (
                      <tr key={listing.id} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-4 w-8">
                          <input
                            type="checkbox"
                            checked={selectedListings.has(listing.id)}
                            onChange={() => handleSelectListing(listing.id)}
                            className="cursor-pointer"
                          />
                        </td>
                        <td className="py-2 px-4">{listing.tradetype}</td>
                        <td className="py-2 px-4">
                          {formatPrice(listing.price)}
                        </td>
                        <td className="py-2 px-4 text-slate-500 text-sm">
                          {listing.supplyArea && listing.tradetype === '매매' ? (
                            `${Math.round(listing.price / (listing.supplyArea / 3.3058)).toLocaleString()}만`
                          ) : '-'}
                        </td>
                        <td className="py-2 px-4">{formatArea(listing.supplyArea, listing.area)}</td>
                        <td className="py-2 px-4">{listing.floor}층</td>
                        <td className="py-2 px-4">{listing.direction || '-'}</td>
                        <td className="py-2 px-4 max-w-xs truncate" title={listing.memo || ''}>
                          {listing.memo || '-'}
                        </td>
                        <td className="py-2 px-4">
                          {new Date(listing.scrapedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 레이지 로딩 버튼 */}
              {!showAll && listings.length > displayCount && (
                <div className="flex justify-center gap-3 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDisplayCount(prev => Math.min(prev + 50, listings.length))
                    }}
                    className="text-xs"
                  >
                    50개 더 보기 ({displayCount}/{listings.length})
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setShowAll(true)}
                    className="text-xs"
                  >
                    전체 로드 ({listings.length}개)
                  </Button>
                </div>
              )}

              {showAll && listings.length > 50 && (
                <div className="flex justify-center mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowAll(false)
                      setDisplayCount(50)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className="text-xs"
                  >
                    처음 50개만 보기
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              매물 정보가 없습니다. 크롤링 버튼을 눌러 매물을 수집하세요.
            </p>
          )}

        </CardContent>
      </Card>
    </div>
  )
}
