import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Header from './Header';

const { useAuthMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: useAuthMock,
}));

const renderHeader = (props = {}) =>
  render(
    <MemoryRouter>
      <Header
        currentPage="home"
        onNavigate={vi.fn()}
        {...props}
      />
    </MemoryRouter>
  );

describe('Header', () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({
      isAdmin: false,
      user: null,
      logout: vi.fn(),
    });
  });

  it('muestra el enlace de inicio', () => {
    renderHeader();

    expect(screen.getByRole('button', { name: 'Inicio' })).toBeInTheDocument();
  });

  it('muestra el panel de administracion para un administrador', () => {
    useAuthMock.mockReturnValue({
      isAdmin: true,
      user: { email: 'admin@rutabus.com' },
      logout: vi.fn(),
    });

    renderHeader();

    expect(
      screen.getByRole('button', { name: 'Panel de administracion' })
    ).toBeInTheDocument();
  });

  it('informa el destino seleccionado', () => {
    const onNavigate = vi.fn();
    renderHeader({ onNavigate });

    fireEvent.click(screen.getByRole('button', { name: 'Inicio' }));

    expect(onNavigate).toHaveBeenCalledWith('home');
  });
});
