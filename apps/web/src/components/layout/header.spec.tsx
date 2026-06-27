import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { Header } from './header'

import { renderWithProviders } from '@/test/render-with-providers'

const useAuthMock = vi.fn()

vi.mock('@/providers/auth-context', () => ({
  useAuth: () => useAuthMock() as unknown,
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
})
