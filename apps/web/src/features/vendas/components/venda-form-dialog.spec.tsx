import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { VendaFormDialog } from './venda-form-dialog'

import { renderWithProviders } from '@/test/render-with-providers'

describe('VendaFormDialog', () => {
  it('renderiza título, cliente e a primeira linha de item quando aberto', () => {
    renderWithProviders(
      <VendaFormDialog
        open
        onOpenChange={vi.fn()}
        title="Novo pedido"
        description="Crie um pedido avulso."
        submitLabel="Criar pedido"
        showConfirmar
        onSubmit={vi.fn()}
        isPending={false}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Novo pedido' })).toBeInTheDocument()
    expect(screen.getByLabelText('Cliente')).toBeInTheDocument()
    expect(screen.getByLabelText('Produto')).toBeInTheDocument()
    expect(screen.getByText('Confirmar pedido ao criar (baixa estoque)')).toBeInTheDocument()
  })
})
