import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SidebarNav } from './sidebar-nav'

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

describe('SidebarNav', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    signOutState.isPending = false
  })

  it('mostra apenas os itens permitidos pelas permissões do usuário', () => {
    useAuthMock.mockReturnValue({ user: { name: 'A', email: 'a@e.com', permissions: ['admin:users'] } })

    renderWithProviders(<SidebarNav />)

    expect(screen.getByText('Usuários')).toBeInTheDocument()
    expect(screen.queryByText('Cargos')).not.toBeInTheDocument()
  })

  it('mostra ambos os itens quando o usuário tem as duas permissões', () => {
    useAuthMock.mockReturnValue({
      user: { name: 'A', email: 'a@e.com', permissions: ['admin:users', 'admin:roles'] },
    })

    renderWithProviders(<SidebarNav />)

    expect(screen.getByText('Usuários')).toBeInTheDocument()
    expect(screen.getByText('Cargos')).toBeInTheDocument()
  })

  it('renderiza o rótulo do grupo quando há itens visíveis nele', () => {
    useAuthMock.mockReturnValue({ user: { name: 'A', email: 'a@e.com', permissions: ['admin:users'] } })

    renderWithProviders(<SidebarNav />)

    expect(screen.getByText('Administração')).toBeInTheDocument()
  })

  it('esconde grupos inteiros quando nenhum item é permitido', () => {
    useAuthMock.mockReturnValue({ user: { name: 'A', email: 'a@e.com', permissions: ['admin:users'] } })

    renderWithProviders(<SidebarNav />)

    expect(screen.queryByText('Vendas')).not.toBeInTheDocument()
  })

  it('renderiza o grupo sem rótulo (Início) sem cabeçalho de seção', () => {
    useAuthMock.mockReturnValue({
      user: { name: 'A', email: 'a@e.com', permissions: ['view:dashboard'] },
    })

    renderWithProviders(<SidebarNav />)

    expect(screen.getByText('Início')).toBeInTheDocument()
  })

  it('esconde todos os itens e o rodapé quando não há usuário', () => {
    useAuthMock.mockReturnValue({ user: null })

    renderWithProviders(<SidebarNav />)

    expect(screen.queryByText('Usuários')).not.toBeInTheDocument()
    expect(screen.queryByText('Cargos')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Menu do usuário' })).not.toBeInTheDocument()
  })

  it('aplica a classe ativa no NavLink quando a rota atual coincide com o item', () => {
    useAuthMock.mockReturnValue({ user: { name: 'A', email: 'a@e.com', permissions: ['admin:users'] } })

    renderWithProviders(<SidebarNav />, { route: '/app/admin/users' })

    const link = screen.getByRole('link', { name: 'Usuários' })
    expect(link.className).toContain('bg-emerald-500/15')
  })

  it('aplica a classe inativa nos NavLinks que não coincidem com a rota atual', () => {
    useAuthMock.mockReturnValue({
      user: { name: 'A', email: 'a@e.com', permissions: ['admin:users', 'admin:roles'] },
    })

    renderWithProviders(<SidebarNav />, { route: '/app/admin/users' })

    const link = screen.getByRole('link', { name: 'Cargos' })
    expect(link.className).toContain('text-sidebar-foreground/70')
  })

  it('mostra o grupo Plataforma com Tenants quando o usuário é super-admin', () => {
    useAuthMock.mockReturnValue({
      user: { name: 'A', email: 'a@e.com', permissions: [], isSuperAdmin: true },
    })

    renderWithProviders(<SidebarNav />)

    expect(screen.getByText('Plataforma')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Tenants' })).toBeInTheDocument()
  })

  it('esconde o grupo Plataforma quando o usuário não é super-admin', () => {
    useAuthMock.mockReturnValue({
      user: { name: 'A', email: 'a@e.com', permissions: ['admin:users'], isSuperAdmin: false },
    })

    renderWithProviders(<SidebarNav />)

    expect(screen.queryByText('Plataforma')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Tenants' })).not.toBeInTheDocument()
  })

  it('invoca onNavigate ao clicar num item de navegação', () => {
    useAuthMock.mockReturnValue({ user: { name: 'A', email: 'a@e.com', permissions: ['admin:users'] } })
    const onNavigate = vi.fn()

    renderWithProviders(<SidebarNav onNavigate={onNavigate} />, { route: '/app' })

    fireEvent.click(screen.getByRole('link', { name: 'Usuários' }))

    expect(onNavigate).toHaveBeenCalledTimes(1)
  })

  it('renderiza o switcher de empresa quando o usuário tem empresa:read', () => {
    useAuthMock.mockReturnValue({
      user: { name: 'A', email: 'a@e.com', permissions: ['empresa:read'] },
    })

    renderWithProviders(<SidebarNav />)

    expect(screen.getByTestId('empresa-switcher')).toBeInTheDocument()
  })

  it('não renderiza o switcher quando o usuário não tem empresa:read', () => {
    useAuthMock.mockReturnValue({
      user: { name: 'A', email: 'a@e.com', permissions: ['admin:users'] },
    })

    renderWithProviders(<SidebarNav />)

    expect(screen.queryByTestId('empresa-switcher')).not.toBeInTheDocument()
  })

  it('exibe o avatar com iniciais e o nome do usuário no rodapé', () => {
    useAuthMock.mockReturnValue({
      user: { name: 'Test User', email: 'test@example.com', permissions: [] },
    })

    renderWithProviders(<SidebarNav />)

    expect(screen.getByText('TU')).toBeInTheDocument()
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Menu do usuário' })).toBeInTheDocument()
  })

  it('deriva iniciais de nome único usando os dois primeiros caracteres', () => {
    useAuthMock.mockReturnValue({ user: { name: 'Madonna', email: 'm@e.com', permissions: [] } })

    renderWithProviders(<SidebarNav />)

    expect(screen.getByText('MA')).toBeInTheDocument()
  })

  it('usa fallback de interrogação quando o nome é vazio', () => {
    useAuthMock.mockReturnValue({ user: { name: '   ', email: 'm@e.com', permissions: [] } })

    renderWithProviders(<SidebarNav />)

    expect(screen.getByText('?')).toBeInTheDocument()
  })

  it('abre o menu mostrando o email e faz logout ao clicar em Sair', async () => {
    useAuthMock.mockReturnValue({
      user: { name: 'Test User', email: 'test@example.com', permissions: [] },
    })
    const user = userEvent.setup({ delay: null })

    renderWithProviders(<SidebarNav />)

    await user.click(screen.getByRole('button', { name: 'Menu do usuário' }))

    const sair = await screen.findByRole('menuitem', { name: 'Sair' })
    expect(screen.getAllByText('test@example.com').length).toBeGreaterThan(1)

    await user.click(sair)

    await waitFor(() => {
      expect(signOutMutate).toHaveBeenCalledTimes(1)
    })
  })

  it('desabilita o item Sair enquanto o logout está pendente', async () => {
    signOutState.isPending = true
    useAuthMock.mockReturnValue({
      user: { name: 'Test User', email: 'test@example.com', permissions: [] },
    })
    const user = userEvent.setup({ delay: null })

    renderWithProviders(<SidebarNav />)

    await user.click(screen.getByRole('button', { name: 'Menu do usuário' }))

    const item = await screen.findByRole('menuitem', { name: 'Sair' })
    expect(item).toHaveAttribute('data-disabled')
  })
})
