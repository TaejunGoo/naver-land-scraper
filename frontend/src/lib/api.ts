import axios from 'axios'
import type { Complex, Listing } from '../types'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

export type { Complex, Listing }

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
