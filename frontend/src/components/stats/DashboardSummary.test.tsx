import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { DashboardSummary } from './DashboardSummary';
import { describe, it, expect } from 'vitest';

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

describe('DashboardSummary', () => {
  it('should render summary data from API', async () => {
    render(<DashboardSummary />, { wrapper: createWrapper() });

    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByText('전일 대비 매물 증감')).toBeInTheDocument();
    });

    expect(screen.getByText('주간 시세 변동')).toBeInTheDocument();
    expect(screen.getByText('신고가 매물')).toBeInTheDocument();
    expect(screen.getByText('신저가 매물')).toBeInTheDocument();
  });

  it('should not render anything if loading', async () => {
    const { container } = render(<DashboardSummary />, { wrapper: createWrapper() });
    // Initially loading, so nothing should render
    expect(container.firstChild).toBeNull();
  });
});
