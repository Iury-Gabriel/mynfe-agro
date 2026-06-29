import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { Header } from './header'

import { renderWithProviders } from '@/test/render-with-providers'

const useAuthMock = vi.fn()

vi.mock('@/providers/auth-context', () => ({
  useAuth: () => useAuthMock() as unknown,
}))

vi.mock('@/features/admin/components/empresas/empresa-switcher', () => ({
  EmpresaSwitcher: () => <div data-testid="empresa-switcher" />,
}))

describe('Header', () => {
  it('exibe o nome e email do usuário quando autenticado', () => {
    useAuthMock.mockReturnValue({
      user: { id: 'u1', name: 'Test User', email: 'test@example.com', emailVerified: true },
    })

    renderWithProviders(<Header />)

    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('(test@example.com)')).toBeInTheDocument()
  })

  it('não exibe nome/email quando não há usuário autenticado', () => {
    useAuthMock.mockReturnValue({ user: null })

    renderWithProviders(<Header />)

    expect(screen.queryByText('Test User')).not.toBeInTheDocument()
  })

  it('renderiza o switcher de empresa quando o usuário tem empresa:read', () => {
    useAuthMock.mockReturnValue({
      user: { id: 'u1', name: 'Test', email: 't@e.com', permissions: ['empresa:read'] },
    })

    renderWithProviders(<Header />)

    expect(screen.getByTestId('empresa-switcher')).toBeInTheDocument()
  })

  it('não renderiza o switcher quando o usuário não tem empresa:read', () => {
    useAuthMock.mockReturnValue({
      user: { id: 'u1', name: 'Test', email: 't@e.com', permissions: [] },
    })

    renderWithProviders(<Header />)

    expect(screen.queryByTestId('empresa-switcher')).not.toBeInTheDocument()
  })

  it('invoca onMenuClick ao clicar no botão hambúrguer', () => {
    useAuthMock.mockReturnValue({ user: null })
    const onMenuClick = vi.fn()

    renderWithProviders(<Header onMenuClick={onMenuClick} />)

    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }))

    expect(onMenuClick).toHaveBeenCalledTimes(1)
  })
})
