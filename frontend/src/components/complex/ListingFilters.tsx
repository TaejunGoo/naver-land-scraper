import { Button } from '@/components/ui/button'

interface ListingFiltersProps {
  selectedTradeTypes: Set<string>
  setSelectedTradeTypes: (types: Set<string>) => void
  tableStartDate: string
  setTableStartDate: (date: string) => void
  tableEndDate: string
  setTableEndDate: (date: string) => void
  selectedAreas: Set<string>
  setSelectedAreas: (areas: Set<string>) => void
  areaOptions: string[]
  handleTradeTypeChange: (type: string) => void
  handleAreaChange: (area: string) => void
}

export function ListingFilters({
  selectedTradeTypes,
  setSelectedTradeTypes,
  tableStartDate,
  setTableStartDate,
  tableEndDate,
  setTableEndDate,
  selectedAreas,
  setSelectedAreas,
  areaOptions,
  handleTradeTypeChange,
  handleAreaChange
}: ListingFiltersProps) {
  return (
    <div className="p-4 bg-muted rounded-lg space-y-4">
      <div className="flex flex-wrap gap-6">
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

        {/* 조회 기간 필터 */}
        <div>
          <h4 className="text-sm font-medium mb-2">조회 기간 (수집일 기준)</h4>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                value={tableStartDate}
                onChange={(e) => setTableStartDate(e.target.value)}
                className="text-sm border border-slate-300 rounded px-2 py-1"
              />
              <span className="text-slate-500">~</span>
              <input 
                type="date" 
                value={tableEndDate}
                onChange={(e) => setTableEndDate(e.target.value)}
                className="text-sm border border-slate-300 rounded px-2 py-1"
              />
            </div>
            <div className="flex gap-1">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setTableStartDate('')
                  setTableEndDate('')
                }}
                className={`h-7 px-2 text-xs ${!tableStartDate && !tableEndDate ? 'bg-slate-100' : ''}`}
              >
                전체
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0]
                  setTableStartDate(today)
                  setTableEndDate(today)
                }}
                className="h-7 px-2 text-xs"
              >
                오늘
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  const end = new Date()
                  const start = new Date()
                  start.setDate(end.getDate() - 7)
                  setTableStartDate(start.toISOString().split('T')[0])
                  setTableEndDate(end.toISOString().split('T')[0])
                }}
                className="h-7 px-2 text-xs"
              >
                1주일
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  const end = new Date()
                  const start = new Date()
                  start.setMonth(end.getMonth() - 1)
                  setTableStartDate(start.toISOString().split('T')[0])
                  setTableEndDate(end.toISOString().split('T')[0])
                }}
                className="h-7 px-2 text-xs"
              >
                1개월
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  const end = new Date()
                  const start = new Date()
                  start.setMonth(end.getMonth() - 3)
                  setTableStartDate(start.toISOString().split('T')[0])
                  setTableEndDate(end.toISOString().split('T')[0])
                }}
                className="h-7 px-2 text-xs"
              >
                3개월
              </Button>
            </div>
          </div>
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
  )
}
