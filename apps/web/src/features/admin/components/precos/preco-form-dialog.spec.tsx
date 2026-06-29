import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PrecoFormDialog } from './preco-form-dialog'

import { renderWithProviders } from '@/test/render-with-providers'

const useClientesMock = vi.fn()
const useProdutosMock = vi.fn()

vi.mock('@/features/admin/api/clientes-api', () => ({
  useClientes: () => useClientesMock(),
}))

vi.mock('@/features/admin/api/produtos-api', () => ({
  useProdutos: () => useProdutosMock(),
}))

function clientesResponse() {
  return {
    data: {
      clientes: [
        { id: 'c1', razaoSocialNome: 'Cliente Alfa' },
        { id: 'c2', razaoSocialNome: 'Cliente Beta' },
      ],
      total: 2,
      page: 1,
      perPage: 100,
      totalPages: 1,
    },
  }
}

function produtosResponse() {
  return {
    data: {
      produtos: [
        { id: 'p1', descricao: 'Soja' },
        { id: 'p2', descricao: 'Milho' },
      ],
      total: 2,
      page: 1,
      perPage: 100,
      totalPages: 1,
    },
  }
}

function selectByName(name: string, value: string): void {
  fireEvent.change(document.querySelector<HTMLSelectElement>(`select[name="${name}"]`)!, {
    target: { value },
  })
}

describe('PrecoFormDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useClientesMock.mockReturnValue(clientesResponse())
    useProdutosMock.mockReturnValue(produtosResponse())
  })

  it('não renderiza o conteúdo quando open é false', () => {
    renderWithProviders(
      <PrecoFormDialog open={false} onOpenChange={vi.fn()} onSubmit={vi.fn()} isPending={false} />,
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renderiza clientes e produtos como opções', () => {
    renderWithProviders(
      <PrecoFormDialog open onOpenChange={vi.fn()} onSubmit={vi.fn()} isPending={false} />,
    )

    const clienteSelect = document.querySelector<HTMLSelectElement>('select[name="clienteId"]')!
    expect(Array.from(clienteSelect.options).map((o) => o.value)).toEqual(
      expect.arrayContaining(['c1', 'c2']),
    )
    const produtoSelect = document.querySelector<HTMLSelectElement>('select[name="produtoId"]')!
    expect(Array.from(produtoSelect.options).map((o) => o.value)).toEqual(
      expect.arrayContaining(['p1', 'p2']),
    )
  })

  it('valida campos obrigatórios e não chama onSubmit', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <PrecoFormDialog open onOpenChange={vi.fn()} onSubmit={onSubmit} isPending={false} />,
    )

    await user.click(screen.getByRole('button', { name: 'Criar preço' }))

    expect(await screen.findByText('Cliente obrigatório')).toBeInTheDocument()
    expect(screen.getByText('Produto obrigatório')).toBeInTheDocument()
    expect(screen.getByText('Preço obrigatório')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('chama onSubmit com cliente, produto e preço selecionados', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <PrecoFormDialog open onOpenChange={vi.fn()} onSubmit={onSubmit} isPending={false} />,
    )

    selectByName('clienteId', 'c1')
    selectByName('produtoId', 'p2')
    await user.type(screen.getByLabelText('Preço'), '50')
    await user.click(screen.getByRole('button', { name: 'Criar preço' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ clienteId: 'c1', produtoId: 'p2', preco: '50' }),
        expect.anything(),
      )
    })
  })

  it('mostra estado vazio quando não há clientes nem produtos', () => {
    useClientesMock.mockReturnValue({ data: undefined })
    useProdutosMock.mockReturnValue({ data: undefined })
    renderWithProviders(
      <PrecoFormDialog open onOpenChange={vi.fn()} onSubmit={vi.fn()} isPending={false} />,
    )

    expect(screen.getByText('Nenhum cliente cadastrado')).toBeInTheDocument()
    expect(screen.getByText('Nenhum produto cadastrado')).toBeInTheDocument()
  })

  it('exibe erro quando as vigências excedem dez caracteres', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <PrecoFormDialog open onOpenChange={vi.fn()} onSubmit={onSubmit} isPending={false} />,
    )

    selectByName('clienteId', 'c1')
    selectByName('produtoId', 'p1')
    await user.type(screen.getByLabelText('Preço'), '50')
    fireEvent.change(screen.getByLabelText('Vigência início'), {
      target: { value: '202602-01-01' },
    })
    fireEvent.change(screen.getByLabelText('Vigência fim'), {
      target: { value: '202612-12-31' },
    })
    await user.click(screen.getByRole('button', { name: 'Criar preço' }))

    await waitFor(() => {
      expect(
        screen.getAllByText('String must contain at most 10 character(s)').length,
      ).toBe(2)
    })
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('fecha ao clicar em Cancelar', async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <PrecoFormDialog open onOpenChange={onOpenChange} onSubmit={vi.fn()} isPending={false} />,
    )

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('desabilita os botões e mostra "Salvando..." quando isPending', () => {
    renderWithProviders(
      <PrecoFormDialog open onOpenChange={vi.fn()} onSubmit={vi.fn()} isPending />,
    )

    expect(screen.getByRole('button', { name: 'Salvando...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
  })
})
