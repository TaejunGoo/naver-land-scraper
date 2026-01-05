import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { listingApi } from '@/lib/api'
import { formatPrice, formatArea } from '@/lib/format'
import { Button } from '@/components/ui/button'

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

  const handleSelectAll = () => {
    if (listings && listings.length > 0) {
      if (selectedListings.size === listings.length) {
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
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <span className="ml-3 text-muted-foreground">매물 정보를 불러오는 중...</span>
      </div>
    )
  }

  if (!listings || listings.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        매물 정보가 없습니다. 크롤링 버튼을 눌러 매물을 수집하세요.
      </p>
    )
  }

  return (
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
              <th className="text-left py-2 px-4 cursor-pointer hover:bg-muted/50 select-none" onClick={() => handleSort('pricePerPyeong')}>
                평단가 {sortBy === 'pricePerPyeong' && (sortOrder === 'asc' ? '↑' : '↓')}
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
  )
}
