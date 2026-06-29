import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { SidebarNav } from './sidebar-nav'

import { renderWithProviders } from '@/test/render-with-providers'

const useAuthMock = vi.fn()

vi.mock('@/providers/auth-context', () => ({
  useAuth: () => useAuthMock() as unknown,
}))

describe('SidebarNav', () => {
  it('mostra apenas os itens permitidos pelas permissões do usuário', () => {
    useAuthMock.mockReturnValue({ user: { permissions: ['admin:users'] } })

    renderWithProviders(<SidebarNav />)

    expect(screen.getByText('Usuários')).toBeInTheDocument()
    expect(screen.queryByText('Cargos')).not.toBeInTheDocument()
  })

  it('mostra ambos os itens quando o usuário tem as duas permissões', () => {
    useAuthMock.mockReturnValue({ user: { permissions: ['admin:users', 'admin:roles'] } })

    renderWithProviders(<SidebarNav />)

    expect(screen.getByText('Usuários')).toBeInTheDocument()
    expect(screen.getByText('Cargos')).toBeInTheDocument()
  })

  it('renderiza o rótulo do grupo quando há itens visíveis nele', () => {
    useAuthMock.mockReturnValue({ user: { permissions: ['admin:users'] } })

    renderWithProviders(<SidebarNav />)

    expect(screen.getByText('Administração')).toBeInTheDocument()
  })

  it('esconde grupos inteiros quando nenhum item é permitido', () => {
    useAuthMock.mockReturnValue({ user: { permissions: ['admin:users'] } })

    renderWithProviders(<SidebarNav />)

    expect(screen.queryByText('Vendas')).not.toBeInTheDocument()
  })

  it('renderiza o grupo sem rótulo (Início) sem cabeçalho de seção', () => {
    useAuthMock.mockReturnValue({ user: { permissions: ['view:dashboard'] } })

    renderWithProviders(<SidebarNav />)

    expect(screen.getByText('Início')).toBeInTheDocument()
  })

  it('esconde todos os itens quando não há usuário (fallback de permissões vazio)', () => {
    useAuthMock.mockReturnValue({ user: null })

    renderWithProviders(<SidebarNav />)

    expect(screen.queryByText('Usuários')).not.toBeInTheDocument()
    expect(screen.queryByText('Cargos')).not.toBeInTheDocument()
  })

  it('aplica a classe ativa no NavLink quando a rota atual coincide com o item', () => {
    useAuthMock.mockReturnValue({ user: { permissions: ['admin:users'] } })

    renderWithProviders(<SidebarNav />, { route: '/app/admin/users' })

    const link = screen.getByRole('link', { name: 'Usuários' })
    expect(link.className).toContain('bg-emerald-500/15')
  })

  it('aplica a classe inativa nos NavLinks que não coincidem com a rota atual', () => {
    useAuthMock.mockReturnValue({ user: { permissions: ['admin:users', 'admin:roles'] } })

    renderWithProviders(<SidebarNav />, { route: '/app/admin/users' })

    const link = screen.getByRole('link', { name: 'Cargos' })
    expect(link.className).toContain('text-sidebar-foreground/70')
  })

  it('invoca onNavigate ao clicar num item de navegação', () => {
    useAuthMock.mockReturnValue({ user: { permissions: ['admin:users'] } })
    const onNavigate = vi.fn()

    renderWithProviders(<SidebarNav onNavigate={onNavigate} />, { route: '/app' })

    fireEvent.click(screen.getByRole('link', { name: 'Usuários' }))

    expect(onNavigate).toHaveBeenCalledTimes(1)
  })
})
