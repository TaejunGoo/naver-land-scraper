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
}

export interface Listing {
  id: number;
  complexId: number;
  tradetype: string;
  price: number;
  area: number;
  supplyArea: number;
  floor: number;
  direction: string | null;
  memo: string | null;
  url: string | null;
  scrapedAt: string;
}

export interface ListingData {
  price: number;
  area: number;
  supplyArea: number;
  floor: number;
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
