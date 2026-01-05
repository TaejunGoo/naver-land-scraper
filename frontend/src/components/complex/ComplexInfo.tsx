import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { RefreshCw, Edit, Info, Building, FileText, ExternalLink } from 'lucide-react'
import { complexApi, type Complex } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

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

interface ComplexInfoProps {
  complex: Complex
  currentListingCounts: {
    total: number
    sale: number
    jeonse: number
    rent: number
  } | null
}

export function ComplexInfo({ complex, currentListingCounts }: ComplexInfoProps) {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<Complex>>({})
  const [subwayLines, setSubwayLines] = useState<string[]>([])
  const [otherTags, setOtherTags] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (isEditing && complex) {
      setFormData(complex)
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

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Complex>) => complexApi.update(complex.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complex', String(complex.id)] })
      setIsEditing(false)
      setToast({ message: '단지 정보가 수정되었습니다.', type: 'success' })
      setTimeout(() => setToast(null), 3000)
    },
  })

  const scrapeInfoMutation = useMutation({
    mutationFn: () => complexApi.scrapeInfo(complex.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complex', String(complex.id)] })
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

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    
    const otherTagsList = otherTags ? otherTags.split(',').map(t => t.trim()).filter(t => t) : []
    const allTags = Array.from(new Set([...subwayLines, ...otherTagsList]))
    
    updateMutation.mutate({
      ...formData,
      tags: JSON.stringify(allTags)
    })
  }

  const handleCheckboxChange = (line: string, checked: boolean) => {
    if (checked) {
      setSubwayLines(prev => [...prev, line])
    } else {
      setSubwayLines(prev => prev.filter(l => l !== line))
    }
  }

  return (
    <>
      {toast && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white animate-in fade-in slide-in-from-top-2 z-50 ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {toast.message}
        </div>
      )}
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
        </CardContent>
      </Card>
    </>
  )
}
