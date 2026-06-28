import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { AjusteEstoqueDialog } from './ajuste-estoque-dialog'

import { renderWithProviders } from '@/test/render-with-providers'

describe('AjusteEstoqueDialog', () => {
  it('renderiza os campos quando aberto', () => {
    renderWithProviders(
      <AjusteEstoqueDialog
        open
        onOpenChange={vi.fn()}
        empresaId="e1"
        onSubmit={vi.fn()}
        isPending={false}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Ajuste de estoque' })).toBeInTheDocument()
    expect(screen.getByLabelText('Produto')).toBeInTheDocument()
    expect(screen.getByLabelText('Motivo')).toBeInTheDocument()
  })
})
