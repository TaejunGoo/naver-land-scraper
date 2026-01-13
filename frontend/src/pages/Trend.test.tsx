import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import Trend from './Trend';
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../test/mocks/server';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </BrowserRouter>
  );
};

describe('Trend Page', () => {
  it('should render the trend charts and table', async () => {
    render(<Trend />, { wrapper: createWrapper() });

    expect(screen.getByText('데이터를 불러오는 중...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('평균 평당가 추이')).toBeInTheDocument();
    });

    // Check for chart titles
    expect(screen.getByText('유형별 매물 수량 추이')).toBeInTheDocument();

    // Check for table content
    expect(screen.getByText('2026-01-07')).toBeInTheDocument();
    expect(screen.getByText('3,050만원')).toBeInTheDocument();
  });

  it('should show empty message when no data history', async () => {
    // Override handler for this test
    server.use(
      http.get('/api/stats/trend', () => {
        return HttpResponse.json({
          history: [],
          summary: {
            todayTotal: 0,
            todayAvgPricePerPyeong: 0,
            priceChange: 0,
            countChange: 0,
            newCount: 0,
            avgPrice84: 0,
            newLowCount: 0,
            newHighCount: 0,
          },
        });
      })
    );

    render(<Trend />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('추세를 분석하기 위한 데이터가 충분하지 않습니다.')).toBeInTheDocument();
    });
  });
});
