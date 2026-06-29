import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { AppShell } from './app-shell'

vi.mock('./sidebar', () => ({
  Sidebar: () => <aside data-testid="sidebar" />,
}))

vi.mock('./sidebar-nav', () => ({
  SidebarNav: ({ onNavigate }: { onNavigate?: () => void }) => (
    <div data-testid="sidebar-nav">
      <button type="button" onClick={onNavigate}>
        ir-para-pagina
      </button>
    </div>
  ),
}))

function renderShell() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<div>conteudo da pagina</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('AppShell', () => {
  it('renderiza a sidebar e o conteúdo da rota filha via Outlet, sem header', () => {
    renderShell()

    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    expect(screen.getByText('conteudo da pagina')).toBeInTheDocument()
    expect(screen.queryByRole('banner')).not.toBeInTheDocument()
  })

  it('mantém o drawer mobile fechado inicialmente', () => {
    renderShell()

    expect(screen.queryByText('Menu de navegação')).not.toBeInTheDocument()
  })

  it('abre o drawer mobile ao clicar no hambúrguer flutuante', () => {
    renderShell()

    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }))

    expect(screen.getByText('Menu de navegação')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar-nav')).toBeInTheDocument()
  })

  it('fecha o drawer ao navegar por um item (onNavigate)', () => {
    renderShell()

    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }))
    expect(screen.getByText('Menu de navegação')).toBeInTheDocument()

    fireEvent.click(screen.getByText('ir-para-pagina'))

    expect(screen.queryByText('Menu de navegação')).not.toBeInTheDocument()
  })
})
