import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CashRegisterPage from './cash-register-page';
import { useAuth } from '@/contexts/auth-context';
import { useQuery } from '@tanstack/react-query';

// Mock dependencies
vi.mock('@/contexts/auth-context');
vi.mock('@tanstack/react-query');
vi.mock('react-router-dom', () => ({
  useParams: () => ({ storeId: 'test-store' }),
}));
vi.mock('@/hooks/use-api', () => ({
  useApiMutation: () => ({ mutateAsync: vi.fn(), isLoading: false }),
}));
vi.mock('@/services/api-client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('CashRegisterPage', () => {
  const mockUser = { id: 'user-1', name: 'Test Cashier' };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: mockUser });
  });

  it('renders "Abrir Caja Ahora" when no active shift exists', () => {
    // First call is for activeShift, second is for stats
    (useQuery as any)
      .mockReturnValueOnce({ data: null, isLoading: false })
      .mockReturnValueOnce({ data: { cashSales: 0, cardSales: 0 }, isLoading: false });

    render(<CashRegisterPage />);

    expect(screen.getByText(/Abrir Caja Ahora/i)).toBeInTheDocument();
  });

  it('renders shift details when an active shift exists', () => {
    const mockShift = {
      id: 'shift-123',
      status: 'OPEN',
      openedAt: new Date().toISOString(),
      startingCash: 500,
      actualCash: 500,
    };

    const mockStats = {
      cashSales: 150.50,
      cardSales: 50.00,
      totalSales: 200.50,
    };

    // First call is for activeShift, second is for stats
    (useQuery as any)
      .mockReturnValueOnce({ data: mockShift, isLoading: false })
      .mockReturnValueOnce({ data: mockStats, isLoading: false });

    render(<CashRegisterPage />);

    expect(screen.getByText(/Turno Abierto/i)).toBeInTheDocument();
    expect(screen.getByText(/Finalizar Turno Actual/i)).toBeInTheDocument();
    expect(screen.getByText(/C\$ 150.50/i)).toBeInTheDocument();
  });
});
