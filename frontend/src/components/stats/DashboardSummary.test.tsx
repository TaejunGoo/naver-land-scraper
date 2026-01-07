import { render, screen, waitFor } from '@testing-library/react';
import { DashboardSummary } from './DashboardSummary';
import { describe, it, expect } from 'vitest';

describe('DashboardSummary', () => {
  it('should render summary data from API', async () => {
    render(<DashboardSummary />);

    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByText('12')).toBeInTheDocument(); // newListingCount
    });

    expect(screen.getByText('신규 등록 매물')).toBeInTheDocument();
    expect(screen.getByText('3,050')).toBeInTheDocument(); // avgPricePerPyeong
    expect(screen.getByText('1.61%')).toBeInTheDocument(); // priceChange
    expect(screen.getByText('하락세')).toBeInTheDocument(); // priceChange < -0.5
  });

  it('should not render anything if data is null', async () => {
    // Note: In a real scenario, you might want to mock a failed response
    // for this test, but here we just check if it handles the initial null state.
    const { container } = render(<DashboardSummary />);
    expect(container.firstChild).toBeNull();
  });
});
