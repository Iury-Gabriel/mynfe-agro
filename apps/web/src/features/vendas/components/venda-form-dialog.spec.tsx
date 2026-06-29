import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { VendaFormDialog } from './venda-form-dialog'

import { renderWithProviders } from '@/test/render-with-providers'

describe('VendaFormDialog', () => {
  it('não renderiza o conteúdo quando fechado', () => {
    renderWithProviders(
      <VendaFormDialog
        open={false}
        onOpenChange={vi.fn()}
        title="Novo pedido"
        description="Crie um pedido avulso."
        submitLabel="Criar pedido"
        showConfirmar
        onSubmit={vi.fn()}
        isPending={false}
      />,
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

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

  it('submete com lote, preço, observações e confirmar preenchidos', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <VendaFormDialog
        open
        onOpenChange={vi.fn()}
        title="Novo pedido"
        description="Crie um pedido."
        submitLabel="Criar pedido"
        showConfirmar
        onSubmit={onSubmit}
        isPending={false}
      />,
    )

    await user.type(screen.getByLabelText('Cliente'), 'Cliente Alfa')
    await user.type(screen.getByLabelText('Produto'), 'Soja')
    await user.type(screen.getByLabelText('Lote'), 'L-99')
    await user.type(screen.getByLabelText('Qtd.'), '10')
    await user.type(screen.getByLabelText('Preço'), '5')
    await user.type(screen.getByLabelText('Observações'), 'Entregar cedo')
    await user.click(screen.getByLabelText('Confirmar pedido ao criar (baixa estoque)'))
    await user.click(screen.getByRole('button', { name: 'Criar pedido' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        clienteId: 'Cliente Alfa',
        observacoes: 'Entregar cedo',
        confirmar: true,
        itens: [
          expect.objectContaining({
            produtoId: 'Soja',
            loteId: 'L-99',
            quantidade: 10,
            precoUnitario: 5,
          }),
        ],
      }),
    )
  })

  it('submete sem lote, preço nem observações resultando em nulos', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <VendaFormDialog
        open
        onOpenChange={vi.fn()}
        title="Nova remessa"
        description="Crie uma remessa."
        submitLabel="Criar remessa"
        onSubmit={onSubmit}
        isPending={false}
      />,
    )

    await user.type(screen.getByLabelText('Cliente'), 'Cliente Beta')
    await user.type(screen.getByLabelText('Produto'), 'Milho')
    await user.type(screen.getByLabelText('Qtd.'), '3')
    await user.click(screen.getByRole('button', { name: 'Criar remessa' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        observacoes: null,
        confirmar: false,
        itens: [
          expect.objectContaining({ loteId: null, precoUnitario: null, quantidade: 3 }),
        ],
      }),
    )
  })

  it('exibe erros de validação quando os campos obrigatórios estão vazios', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <VendaFormDialog
        open
        onOpenChange={vi.fn()}
        title="Novo pedido"
        description="Crie um pedido."
        submitLabel="Criar pedido"
        onSubmit={onSubmit}
        isPending={false}
      />,
    )

    await user.clear(screen.getByLabelText('Data'))
    await user.click(screen.getByRole('button', { name: 'Criar pedido' }))

    expect(await screen.findByText('Cliente obrigatório')).toBeInTheDocument()
    expect(screen.getByText('Produto obrigatório')).toBeInTheDocument()
    expect(screen.getByText('Qtd. obrigatória')).toBeInTheDocument()
    expect(screen.getByText('Data obrigatória')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('adiciona e remove itens', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <VendaFormDialog
        open
        onOpenChange={vi.fn()}
        title="Novo pedido"
        description="Crie um pedido."
        submitLabel="Criar pedido"
        onSubmit={vi.fn()}
        isPending={false}
      />,
    )

    expect(screen.getAllByRole('button', { name: 'Remover item' })[0]).toBeDisabled()

    await user.click(screen.getByRole('button', { name: /Adicionar item/ }))
    expect(screen.getAllByLabelText('Produto')).toHaveLength(2)

    const removeButtons = screen.getAllByRole('button', { name: 'Remover item' })
    await user.click(removeButtons[1]!)
    expect(screen.getAllByLabelText('Produto')).toHaveLength(1)
  })

  it('fecha ao clicar em Cancelar e mostra rótulo de carregamento quando pendente', async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup({ delay: null })
    const { rerender } = renderWithProviders(
      <VendaFormDialog
        open
        onOpenChange={onOpenChange}
        title="Novo pedido"
        description="Crie um pedido."
        submitLabel="Criar pedido"
        onSubmit={vi.fn()}
        isPending={false}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)

    rerender(
      <VendaFormDialog
        open
        onOpenChange={onOpenChange}
        title="Novo pedido"
        description="Crie um pedido."
        submitLabel="Criar pedido"
        onSubmit={vi.fn()}
        isPending
      />,
    )
    expect(screen.getByRole('button', { name: 'Salvando...' })).toBeDisabled()
  })
})
