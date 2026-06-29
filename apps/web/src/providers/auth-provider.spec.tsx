import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuth } from './auth-context'
import { AuthProvider } from './auth-provider'

import { api } from '@/lib/api-client'
import { renderWithProviders } from '@/test/render-with-providers'

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn() },
}))

const mockGet = vi.mocked(api.get)

function AuthConsumer() {
  const { user, isLoading, isAuthenticated, refresh } = useAuth()
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="user">{user?.name ?? 'nenhum'}</span>
      <span data-testid="empresas">{(user?.empresaIds ?? []).join(',')}</span>
      <span data-testid="super-admin">{String(user?.isSuperAdmin)}</span>
      <button onClick={() => void refresh()}>refresh</button>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('expõe o usuário autenticado com permissões quando a sessão é válida', async () => {
    mockGet.mockResolvedValue({
      data: {
        user: { id: 'u1', email: 'test@example.com', name: 'Test User', emailVerified: true },
        permissions: ['admin:users'],
      },
    })

    renderWithProviders(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('Test User')
    })
    expect(screen.getByTestId('authenticated').textContent).toBe('true')
  })

  it('retorna usuário nulo quando a sessão não tem user', async () => {
    mockGet.mockResolvedValue({ data: { user: null } })

    renderWithProviders(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('nenhum')
    })
    expect(screen.getByTestId('authenticated').textContent).toBe('false')
  })

  it('retorna usuário nulo quando a resposta é null', async () => {
    mockGet.mockResolvedValue({ data: null })

    renderWithProviders(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('nenhum')
    })
  })

  it('retorna usuário nulo quando a requisição falha', async () => {
    mockGet.mockRejectedValue(new Error('network'))

    renderWithProviders(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('nenhum')
    })
    expect(screen.getByTestId('authenticated').textContent).toBe('false')
  })

  it('usa permissões vazias quando permissions não está presente na resposta', async () => {
    mockGet.mockResolvedValue({
      data: {
        user: { id: 'u1', email: 'test@example.com', name: 'Test', emailVerified: true },
      },
    })

    renderWithProviders(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('Test')
    })
    expect(screen.getByTestId('empresas').textContent).toBe('')
  })

  it('expõe empresaIds quando presentes na sessão', async () => {
    mockGet.mockResolvedValue({
      data: {
        user: { id: 'u1', email: 'test@example.com', name: 'Test', emailVerified: true },
        permissions: [],
        empresaIds: ['e1', 'e2'],
      },
    })

    renderWithProviders(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('empresas').textContent).toBe('e1,e2')
    })
  })

  it('normaliza isSuperAdmin para false quando ausente e expõe true quando presente', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        user: { id: 'u1', email: 'test@example.com', name: 'Test', emailVerified: true },
        permissions: [],
      },
    })

    const { unmount } = renderWithProviders(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('super-admin').textContent).toBe('false')
    })
    unmount()

    mockGet.mockResolvedValueOnce({
      data: {
        user: {
          id: 'u1',
          email: 'test@example.com',
          name: 'Test',
          emailVerified: true,
          isSuperAdmin: true,
        },
        permissions: [],
      },
    })

    renderWithProviders(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('super-admin').textContent).toBe('true')
    })
  })

  it('chama refetch ao invocar refresh', async () => {
    mockGet.mockResolvedValue({
      data: {
        user: { id: 'u1', email: 'test@example.com', name: 'Test', emailVerified: true },
        permissions: [],
      },
    })

    const user = userEvent.setup({ delay: null })

    renderWithProviders(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('Test')
    })

    await user.click(screen.getByRole('button', { name: 'refresh' }))

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledTimes(2)
    })
  })
})
