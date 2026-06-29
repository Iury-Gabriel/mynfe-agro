import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { VendaFormDialog } from './venda-form-dialog'

import { renderWithProviders } from '@/test/render-with-providers'

const clientesData = vi.fn<() => { data?: { clientes: { id: string; razaoSocialNome: string }[] } }>()
const produtosData = vi.fn<() => { data?: { produtos: { id: string; descricao: string }[] } }>()
const lotesData = vi.fn<() => { data?: { lotes: { id: string; codigoLote: string }[] } }>()

vi.mock('@/features/admin/api/clientes-api', () => ({
  useClientes: () => clientesData(),
}))
vi.mock('@/features/admin/api/produtos-api', () => ({
  useProdutos: () => produtosData(),
}))
vi.mock('@/features/estoque/api/lotes-api', () => ({
  useLotes: () => lotesData(),
}))

function setLists(): void {
  clientesData.mockReturnValue({
    data: { clientes: [{ id: 'c1', razaoSocialNome: 'Cliente Alfa' }] },
  })
  produtosData.mockReturnValue({
    data: { produtos: [{ id: 'p1', descricao: 'Soja' }, { id: 'p2', descricao: 'Milho' }] },
  })
  lotesData.mockReturnValue({ data: { lotes: [{ id: 'l99', codigoLote: 'L-99' }] } })
}

function selectByName(name: string, value: string): void {
  fireEvent.change(document.querySelector<HTMLSelectElement>(`select[name="${name}"]`)!, {
    target: { value },
  })
}

describe('VendaFormDialog', () => {
  it('não renderiza o conteúdo quando fechado', () => {
    setLists()
    renderWithProviders(
      <VendaFormDialog
        open={false}
        onOpenChange={vi.fn()}
        empresaId="e1"
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
    setLists()
    renderWithProviders(
      <VendaFormDialog
        open
        onOpenChange={vi.fn()}
        empresaId="e1"
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

  it('mostra opções desabilitadas quando não há cliente nem produto', () => {
    clientesData.mockReturnValue({})
    produtosData.mockReturnValue({})
    lotesData.mockReturnValue({})
    renderWithProviders(
      <VendaFormDialog
        open
        onOpenChange={vi.fn()}
        empresaId="e1"
        title="Novo pedido"
        description="Crie um pedido."
        submitLabel="Criar pedido"
        onSubmit={vi.fn()}
        isPending={false}
      />,
    )

    expect(screen.getByText('Nenhum cliente cadastrado')).toBeInTheDocument()
    expect(screen.getByText('Nenhum produto cadastrado')).toBeInTheDocument()
  })

  it('submete com lote, preço, observações e confirmar preenchidos', async () => {
    setLists()
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <VendaFormDialog
        open
        onOpenChange={vi.fn()}
        empresaId="e1"
        title="Novo pedido"
        description="Crie um pedido."
        submitLabel="Criar pedido"
        showConfirmar
        onSubmit={onSubmit}
        isPending={false}
      />,
    )

    selectByName('clienteId', 'c1')
    selectByName('item-0-produto', 'p1')
    selectByName('item-0-lote', 'l99')
    await user.type(screen.getByLabelText('Qtd.'), '10')
    await user.type(screen.getByLabelText('Preço'), '5')
    await user.type(screen.getByLabelText('Observações'), 'Entregar cedo')
    await user.click(screen.getByLabelText('Confirmar pedido ao criar (baixa estoque)'))
    await user.click(screen.getByRole('button', { name: 'Criar pedido' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        clienteId: 'c1',
        observacoes: 'Entregar cedo',
        confirmar: true,
        itens: [
          expect.objectContaining({
            produtoId: 'p1',
            loteId: 'l99',
            quantidade: 10,
            precoUnitario: 5,
          }),
        ],
      }),
    )
  })

  it('submete sem lote, preço nem observações resultando em nulos', async () => {
    setLists()
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <VendaFormDialog
        open
        onOpenChange={vi.fn()}
        empresaId="e1"
        title="Nova remessa"
        description="Crie uma remessa."
        submitLabel="Criar remessa"
        onSubmit={onSubmit}
        isPending={false}
      />,
    )

    selectByName('clienteId', 'c1')
    selectByName('item-0-produto', 'p2')
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

  it('volta o lote do item para "Sem lote" zerando o campo', async () => {
    setLists()
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <VendaFormDialog
        open
        onOpenChange={vi.fn()}
        empresaId="e1"
        title="Novo pedido"
        description="Crie um pedido."
        submitLabel="Criar pedido"
        onSubmit={onSubmit}
        isPending={false}
      />,
    )

    selectByName('clienteId', 'c1')
    selectByName('item-0-produto', 'p1')
    selectByName('item-0-lote', 'l99')
    selectByName('item-0-lote', '__none__')
    await user.type(screen.getByLabelText('Qtd.'), '2')
    await user.click(screen.getByRole('button', { name: 'Criar pedido' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ itens: [expect.objectContaining({ loteId: null })] }),
    )
  })

  it('exibe erros de validação quando os campos obrigatórios estão vazios', async () => {
    setLists()
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <VendaFormDialog
        open
        onOpenChange={vi.fn()}
        empresaId="e1"
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
    setLists()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <VendaFormDialog
        open
        onOpenChange={vi.fn()}
        empresaId="e1"
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
    setLists()
    const onOpenChange = vi.fn()
    const user = userEvent.setup({ delay: null })
    const { rerender } = renderWithProviders(
      <VendaFormDialog
        open
        onOpenChange={onOpenChange}
        empresaId="e1"
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
        empresaId="e1"
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
