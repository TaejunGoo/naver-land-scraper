import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { listingApi } from '@/lib/api'
import { formatPrice, formatArea } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { useAlertStore } from '@/lib/store'
import { ArrowUpDown, Trash2, CheckSquare, Square } from 'lucide-react'

interface ListingTableProps {
  listings: any[] | undefined
  listingsLoading: boolean
  sortBy: string
  sortOrder: string
  handleSort: (field: string) => void
  complexId: string
}

export function ListingTable({
  listings,
  listingsLoading,
  sortBy,
  sortOrder,
  handleSort,
  complexId
}: ListingTableProps) {
  const queryClient = useQueryClient()
  const showAlert = useAlertStore((state) => state.showAlert)
  const [selectedListings, setSelectedListings] = useState<Set<number>>(new Set())
  const [displayCount, setDisplayCount] = useState(50)
  const [showAll, setShowAll] = useState(false)

  const handleSelectListing = (id: number) => {
    const newSelected = new Set(selectedListings)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedListings(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    if (listings && listings.length > 0) {
      if (!checked) {
        setSelectedListings(new Set())
      } else {
        setSelectedListings(new Set(listings.map(l => l.id)))
      }
    }
  }

  const batchDeleteMutation = useMutation({
    mutationFn: (ids: number[]) => listingApi.batchDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings', complexId] })
      setSelectedListings(new Set())
    },
  })

  const deleteAllMutation = useMutation({
    mutationFn: () => listingApi.deleteAll(Number(complexId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings', complexId] })
      setSelectedListings(new Set())
    },
  })

  if (listingsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-muted/30 rounded-lg border-2 border-dashed">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
        <span className="text-muted-foreground font-medium">매물 정보를 정성껏 불러오는 중입니다...</span>
      </div>
    )
  }

  if (!listings || listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-muted/30 rounded-lg border-2 border-dashed">
        <p className="text-muted-foreground font-medium mb-4">수집된 매물 정보가 없습니다.</p>
        <p className="text-sm text-muted-foreground/70">상단의 크롤링 버튼을 눌러 매물을 수집해 보세요.</p>
      </div>
    )
  }

  const getTradeTypeColor = (type: string) => {
    switch(type) {
      case '매매': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
      case '전세': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
      case '월세': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
      default: return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800'
    }
  }

  return (
    <div className="space-y-4">
      {/* 액션 바 */}
      <div className="flex items-center justify-between bg-card p-3 rounded-lg border shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-md border text-xs font-semibold">
            총 <span className="text-primary">{listings.length}</span>개의 매물
          </div>
          {selectedListings.size > 0 && (
            <div className="text-xs text-muted-foreground animate-in fade-in slide-in-from-left-2">
              <span className="font-bold text-foreground">{selectedListings.size}</span>개 선택됨
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          {selectedListings.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                showAlert({
                  title: "선택 삭제 확인",
                  description: `${selectedListings.size}개의 매물을 정말 삭제하시겠습니까?`,
                  onConfirm: () => batchDeleteMutation.mutate(Array.from(selectedListings))
                })
              }}
              disabled={batchDeleteMutation.isPending}
              className="h-8 text-xs gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              선택 삭제
            </Button>
          )}
          {listings.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                showAlert({
                  title: "전체 삭제 경고",
                  description: "이 단지의 모든 수집된 매물 데이터가 삭제됩니다. 계속하시겠습니까?",
                  onConfirm: () => deleteAllMutation.mutate()
                })
              }}
              disabled={deleteAllMutation.isPending}
              className="h-8 text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
            >
              전체 삭제
            </Button>
          )}
        </div>
      </div>

      {/* 테이블 */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[50px] text-center">
                <Checkbox 
                  checked={selectedListings.size > 0 && selectedListings.size === listings.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('tradetype')}>
                <div className="flex items-center gap-1.5 justify-center">
                  거래유형 <ArrowUpDown className="h-3 w-3 opacity-50" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('price')}>
                <div className="flex items-center gap-1.5 justify-end">
                  가격 <ArrowUpDown className="h-3 w-3 opacity-50" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('pricePerPyeong')}>
                <div className="flex items-center gap-1.5 justify-end">
                  평단가 <ArrowUpDown className="h-3 w-3 opacity-50" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('area')}>
                <div className="flex items-center gap-1.5 justify-center">
                  면적 <ArrowUpDown className="h-3 w-3 opacity-50" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:text-primary transition-colors text-center" onClick={() => handleSort('floor')}>
                층
              </TableHead>
              <TableHead className="text-center">방향</TableHead>
              <TableHead className="max-w-[200px]">메모</TableHead>
              <TableHead className="cursor-pointer hover:text-primary transition-colors text-right" onClick={() => handleSort('scrapedAt')}>
                수집일시
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(showAll ? listings : listings.slice(0, displayCount)).map((listing) => (
              <TableRow key={listing.id} className="group hover:bg-muted/30 transition-colors">
                <TableCell className="text-center">
                  <Checkbox 
                    checked={selectedListings.has(listing.id)}
                    onCheckedChange={() => handleSelectListing(listing.id)}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className={`font-semibold ${getTradeTypeColor(listing.tradetype)}`}>
                    {listing.tradetype}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-bold text-foreground">
                  {formatPrice(listing.price)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground text-xs">
                  {listing.supplyArea && listing.tradetype === '매매' ? (
                    `${Math.round(listing.price / (listing.supplyArea / 3.3058)).toLocaleString()}만`
                  ) : '-'}
                </TableCell>
                <TableCell className="text-center whitespace-nowrap">
                  {formatArea(listing.supplyArea, listing.area)}
                </TableCell>
                <TableCell className="text-center">{listing.floor}층</TableCell>
                <TableCell className="text-center text-muted-foreground">{listing.direction || '-'}</TableCell>
                <TableCell className="max-w-[200px] truncate" title={listing.memo || ''}>
                  <p className="text-xs text-muted-foreground truncate">
                    {listing.memo || '-'}
                  </p>
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap italic">
                  {new Date(listing.scrapedAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 레이지 로딩 버튼 */}
      {!showAll && listings.length > displayCount && (
        <div className="flex items-center justify-center gap-4 py-6">
          <div className="h-px flex-1 bg-border max-w-[100px]" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setDisplayCount(prev => Math.min(prev + 50, listings.length))
            }}
            className="rounded-full px-6 shadow-sm hover:bg-muted"
          >
            50개 더 보기 ({displayCount}/{listings.length})
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowAll(true)}
            className="rounded-full px-6 shadow-sm"
          >
            전체 로드
          </Button>
          <div className="h-px flex-1 bg-border max-w-[100px]" />
        </div>
      )}

      {showAll && listings.length > 50 && (
        <div className="flex justify-center py-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowAll(false)
              setDisplayCount(50)
              window.scrollTo({ top: 300, behavior: 'smooth' })
            }}
            className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          >
            처음 50개만 보기
          </Button>
        </div>
      )}
    </div>
  )
}

