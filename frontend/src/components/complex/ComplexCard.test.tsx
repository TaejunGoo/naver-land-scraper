import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ComplexCard } from './ComplexCard'
import { BrowserRouter } from 'react-router-dom'

const mockComplex = {
  id: 1,
  name: '테스트 아파트',
  address: '서울시 강남구',
  naverComplexId: '12345',
  units: 1000,
  approvalDate: '2020.01.01',
  tags: '["신축", "대단지"]',
  todayListingCount: 10,
  todayListingCounts: { sale: 5, jeonse: 3, rent: 2 },
  lastScrapedAt: '2024-01-01T00:00:00.000Z',
  infoScrapedAt: '2024-01-01T00:00:00.000Z'
}

describe('ComplexCard', () => {
  it('renders complex information correctly', () => {
    const onEdit = vi.fn()
    
    render(
      <BrowserRouter>
        <ComplexCard complex={mockComplex as any} onEdit={onEdit} />
      </BrowserRouter>
    )
    
    expect(screen.getByText('테스트 아파트')).toBeInTheDocument()
    expect(screen.getByText('서울시 강남구')).toBeInTheDocument()
    expect(screen.getByText('1000')).toBeInTheDocument()
    // 2020년 완공 기준 2026년 현재 6년차 (currentDate is 2026 in context)
    expect(screen.getByText(/년차/)).toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn()
    
    render(
      <BrowserRouter>
        <ComplexCard complex={mockComplex as any} onEdit={onEdit} />
      </BrowserRouter>
    )
    
    // Pencil icon is in a button
    const editButton = screen.getAllByRole('button')[1] // 0 is ExternalLink, 1 is Pencil
    fireEvent.click(editButton)
    
    expect(onEdit).toHaveBeenCalledWith(mockComplex)
  })

  it('shows naver link when naverComplexId exists', () => {
    const onEdit = vi.fn()
    
    render(
      <BrowserRouter>
        <ComplexCard complex={mockComplex as any} onEdit={onEdit} />
      </BrowserRouter>
    )
    
    const naverLink = screen.getByRole('link', { name: '네이버 부동산 이동' })
    expect(naverLink).toHaveAttribute('href', 'https://new.land.naver.com/complexes/12345')
  })
})
