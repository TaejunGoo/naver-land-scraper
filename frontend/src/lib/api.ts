import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface Complex {
  id: number
  name: string
  address: string
  naverComplexId: string | null
  customNotes: string | null
  tags: string | null // JSON string
  type: string | null
  units: number | null
  buildings: number | null
  year: number | null
  areaOptions: string | null
  approvalDate: string | null
  lastScrapedAt: string | null
  infoScrapedAt: string | null
  createdAt: string
  updatedAt: string
  todayListingCount?: number
  todayListingCounts?: {
    total: number
    sale: number
    jeonse: number
    rent: number
  }
}

export interface Listing {
  id: number
  complexId: number
  price: number
  area: number
  supplyArea: number | null
  floor: number
  direction: string | null
  tradetype: string
  memo: string | null
  url: string | null
  scrapedAt: string
}

export const complexApi = {
  getAll: () => api.get<Complex[]>('/complexes'),
  getById: (id: number) => api.get<Complex>(`/complexes/${id}`),
  create: (data: Partial<Complex>) => api.post<Complex>('/complexes', data),
  update: (id: number, data: Partial<Complex>) => api.put<Complex>(`/complexes/${id}`, data),
  delete: (id: number) => api.delete(`/complexes/${id}`),
  scrape: (id: number) => api.post(`/complexes/${id}/scrape`),
  scrapeInfo: (id: number) => api.post(`/complexes/${id}/scrape-info`),
  scrapeAll: () => api.post('/complexes/scrape-all/listings'),
  createTestComplex: (days: number = 365) => api.post('/complexes/create-test-complex', { days }),
}

export const listingApi = {
  getByComplexId: (complexId: number, params?: {
    tradetype?: string[]
    areaMin?: number
    areaMax?: number
    sortBy?: string
    sortOrder?: string
  }) => {
    const queryParams = new URLSearchParams()
    if (params?.tradetype && params.tradetype.length > 0) {
      queryParams.append('tradetype', params.tradetype.join(','))
    }
    if (params?.areaMin) queryParams.append('areaMin', String(params.areaMin))
    if (params?.areaMax) queryParams.append('areaMax', String(params.areaMax))
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder)
    
    const query = queryParams.toString()
    const url = query ? `/listings/${complexId}?${query}` : `/listings/${complexId}`
    return api.get<Listing[]>(url)
  },
  delete: (id: number) => api.delete(`/listings/${id}`),
  batchDelete: (ids: number[]) => api.post('/listings/batch-delete', { ids }),
  deleteAll: (complexId: number) => api.delete(`/listings/complex/${complexId}/all`),
  generateDummy: (complexId: number, days: number = 365) => 
    api.post(`/listings/complex/${complexId}/generate-dummy`, { days }),
}

export default api
