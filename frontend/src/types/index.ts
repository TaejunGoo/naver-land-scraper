export interface Complex {
  id: number;
  name: string;
  address: string;
  naverComplexId: string | null;
  customNotes: string | null;
  tags: string | null;
  type: string | null;
  units: number | null;
  buildings: number | null;
  year: number | null;
  approvalDate: string | null;
  lastScrapedAt: string | null;
  infoScrapedAt: string | null;
  createdAt: string;
  updatedAt: string;
  todayListingCount?: number;
  todayListingCounts?: {
    total: number;
    sale: number;
    jeonse: number;
    rent: number;
  };
  listingStats?: { // [추가]
    today: { total: number; sale: number; jeonse: number; rent: number; };
    yesterday: { total: number; sale: number; jeonse: number; rent: number; };
    diff: { total: number; sale: number; jeonse: number; rent: number; };
  };
  dataDaysCount?: number;
}

export interface Listing {
  id: number;
  complexId: number;
  tradetype: string;
  price: number;
  area: number;
  supplyArea: number;
  floor: string;
  direction: string | null;
  memo: string | null;
  url: string | null;
  scrapedAt: string;
}

export interface TrendData {
  history: {
    date: string;
    totalCount: number;
    saleCount: number;
    jeonseCount: number;
    rentCount: number;
    avgPricePerPyeong: number; // m2 -> Pyeong
  }[];
  summary: {
    todayTotal: number;
    todayAvgPricePerPyeong: number; // m2 -> Pyeong
    priceChange: number;
    countChange: number;
    newCount: number; // 수정: newListingCount -> newCount
    avgPrice84?: number;
    newLowCount?: number;
    newHighCount?: number;
  };
}

export interface ListingData {
  price: number;
  area: number;
  supplyArea: number;
  floor: string;
  direction: string | null;
  tradetype: string;
  memo: string | null;
  url: string | null;
}

export interface ComplexInfo {
  type?: string;
  units?: number;
  buildings?: number;
  year?: number;
  areaOptions?: string[];
  approvalDate?: string;
}

// API request types (for create/update operations)
export interface ComplexCreateInput {
  name: string;
  address: string;
  naverComplexId?: string | null;
  customNotes?: string | null;
  tags?: string[];
}

export interface ComplexUpdateInput extends Partial<ComplexCreateInput> {}
