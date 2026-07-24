import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusChip } from './status-chip';

describe('StatusChip', () => {
  it('renders label text', () => {
    render(<StatusChip label="Activo" variant="success" />);
    expect(screen.getByText('Activo')).toBeInTheDocument();
  });

  it('renders with error variant', () => {
    render(<StatusChip label="Error" variant="error" />);
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('renders with warning variant', () => {
    render(<StatusChip label="Pendiente" variant="warning" />);
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  it('renders without crashing for all variants', () => {
    const variants = ['success', 'error', 'warning', 'info', 'pending'] as const;
    for (const v of variants) {
      const { container } = render(<StatusChip label={`Test-${v}`} variant={v} />);
      expect(container.firstChild).toBeTruthy();
    }
  });
});
