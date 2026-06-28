import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { RegistrarColheitaDialog } from './registrar-colheita-dialog'

import { renderWithProviders } from '@/test/render-with-providers'

describe('RegistrarColheitaDialog', () => {
  it('renderiza os campos quando aberto', () => {
    renderWithProviders(
      <RegistrarColheitaDialog
        open
        onOpenChange={vi.fn()}
        empresaId="e1"
        onSubmit={vi.fn()}
        isPending={false}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Registrar colheita' })).toBeInTheDocument()
    expect(screen.getByLabelText('Produto')).toBeInTheDocument()
    expect(screen.getByLabelText('Quantidade')).toBeInTheDocument()
  })
})
