import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Header } from './header'

import { renderWithProviders } from '@/test/render-with-providers'

const useAuthMock = vi.fn()
const signOutMutate = vi.fn()
const signOutState = { isPending: false }

vi.mock('@/providers/auth-context', () => ({
  useAuth: () => useAuthMock() as unknown,
}))

vi.mock('@/features/auth/api/auth-api', () => ({
  useSignOut: () => ({ mutate: signOutMutate, isPending: signOutState.isPending }),
}))

vi.mock('@/features/admin/components/empresas/empresa-switcher', () => ({
  EmpresaSwitcher: () => <div data-testid="empresa-switcher" />,
}))

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    signOutState.isPending = false
  })

  it('exibe o avatar com iniciais e o nome do usuário autenticado', () => {
    useAuthMock.mockReturnValue({
      user: { id: 'u1', name: 'Test User', email: 'test@example.com', emailVerified: true },
    })

    renderWithProviders(<Header />)

    expect(screen.getByText('TU')).toBeInTheDocument()
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Menu do usuário' })).toBeInTheDocument()
  })

  it('deriva iniciais de nome único usando os dois primeiros caracteres', () => {
    useAuthMock.mockReturnValue({ user: { id: 'u1', name: 'Madonna', email: 'm@e.com' } })

    renderWithProviders(<Header />)

    expect(screen.getByText('MA')).toBeInTheDocument()
  })

  it('usa fallback de interrogação quando o nome é vazio', () => {
    useAuthMock.mockReturnValue({ user: { id: 'u1', name: '   ', email: 'm@e.com' } })

    renderWithProviders(<Header />)

    expect(screen.getByText('?')).toBeInTheDocument()
  })

  it('abre o menu mostrando o email e faz logout ao clicar em Sair', async () => {
    useAuthMock.mockReturnValue({
      user: { id: 'u1', name: 'Test User', email: 'test@example.com' },
    })
    const user = userEvent.setup({ delay: null })

    renderWithProviders(<Header />)

    await user.click(screen.getByRole('button', { name: 'Menu do usuário' }))

    expect(await screen.findByText('test@example.com')).toBeInTheDocument()

    await user.click(screen.getByRole('menuitem', { name: 'Sair' }))

    await waitFor(() => {
      expect(signOutMutate).toHaveBeenCalledTimes(1)
    })
  })

  it('desabilita o item Sair enquanto o logout está pendente', async () => {
    signOutState.isPending = true
    useAuthMock.mockReturnValue({
      user: { id: 'u1', name: 'Test User', email: 'test@example.com' },
    })
    const user = userEvent.setup({ delay: null })

    renderWithProviders(<Header />)

    await user.click(screen.getByRole('button', { name: 'Menu do usuário' }))

    const item = await screen.findByRole('menuitem', { name: 'Sair' })
    expect(item).toHaveAttribute('data-disabled')
  })

  it('não exibe o menu de usuário quando não há usuário autenticado', () => {
    useAuthMock.mockReturnValue({ user: null })

    renderWithProviders(<Header />)

    expect(screen.queryByRole('button', { name: 'Menu do usuário' })).not.toBeInTheDocument()
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
