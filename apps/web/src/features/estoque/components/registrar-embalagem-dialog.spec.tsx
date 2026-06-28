import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { RegistrarEmbalagemDialog } from './registrar-embalagem-dialog'

import { renderWithProviders } from '@/test/render-with-providers'

describe('RegistrarEmbalagemDialog', () => {
  it('renderiza os campos quando aberto', () => {
    renderWithProviders(
      <RegistrarEmbalagemDialog
        open
        onOpenChange={vi.fn()}
        empresaId="e1"
        onSubmit={vi.fn()}
        isPending={false}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Registrar embalagem' })).toBeInTheDocument()
    expect(screen.getByLabelText('Produto')).toBeInTheDocument()
    expect(screen.getByLabelText('Quantidade')).toBeInTheDocument()
  })
})
