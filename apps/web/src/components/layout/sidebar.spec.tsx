import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { Sidebar } from './sidebar'

import { renderWithProviders } from '@/test/render-with-providers'

vi.mock('./sidebar-nav', () => ({
  SidebarNav: () => <div data-testid="sidebar-nav" />,
}))

describe('Sidebar', () => {
  it('renderiza o aside fixo de desktop com a navegação', () => {
    renderWithProviders(<Sidebar />)

    const nav = screen.getByTestId('sidebar-nav')
    expect(nav).toBeInTheDocument()
    const aside = nav.closest('aside')
    expect(aside).not.toBeNull()
    expect(aside?.className).toContain('md:flex')
  })
})
