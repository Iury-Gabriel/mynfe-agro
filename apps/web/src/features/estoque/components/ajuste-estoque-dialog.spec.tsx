import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AjusteEstoqueDialog } from './ajuste-estoque-dialog'

import { renderWithProviders } from '@/test/render-with-providers'

const produtosData = vi.fn<() => { data?: { produtos: { id: string; descricao: string }[] } }>()
const lotesData = vi.fn<() => { data?: { lotes: { id: string; codigoLote: string }[] } }>()

vi.mock('@/features/admin/api/produtos-api', () => ({
  useProdutos: () => produtosData(),
}))
vi.mock('@/features/estoque/api/lotes-api', () => ({
  useLotes: () => lotesData(),
}))

function setLists(): void {
  produtosData.mockReturnValue({
    data: { produtos: [{ id: 'p1', descricao: 'Alface' }, { id: 'p2', descricao: 'Tomate' }] },
  })
  lotesData.mockReturnValue({ data: { lotes: [{ id: 'lt9', codigoLote: 'LT-9' }] } })
}

function selectByName(name: string, value: string): void {
  fireEvent.change(document.querySelector<HTMLSelectElement>(`select[name="${name}"]`)!, {
    target: { value },
  })
}

describe('AjusteEstoqueDialog', () => {
  it('renderiza os campos quando aberto', () => {
    setLists()
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

  it('não renderiza conteúdo quando fechado', () => {
    setLists()
    renderWithProviders(
      <AjusteEstoqueDialog
        open={false}
        onOpenChange={vi.fn()}
        empresaId="e1"
        onSubmit={vi.fn()}
        isPending={false}
      />,
    )

    expect(screen.queryByRole('heading', { name: 'Ajuste de estoque' })).not.toBeInTheDocument()
  })

  it('mostra opção desabilitada quando não há produtos', () => {
    produtosData.mockReturnValue({})
    lotesData.mockReturnValue({})
    renderWithProviders(
      <AjusteEstoqueDialog
        open
        onOpenChange={vi.fn()}
        empresaId="e1"
        onSubmit={vi.fn()}
        isPending={false}
      />,
    )

    expect(screen.getByText('Nenhum produto cadastrado')).toBeInTheDocument()
  })

  it('exibe mensagens de validação ao submeter vazio', async () => {
    setLists()
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <AjusteEstoqueDialog
        open
        onOpenChange={vi.fn()}
        empresaId="e1"
        onSubmit={onSubmit}
        isPending={false}
      />,
    )

    await user.clear(screen.getByLabelText('Data'))
    await user.click(screen.getByRole('button', { name: 'Registrar ajuste' }))

    expect(await screen.findByText('Produto obrigatório')).toBeInTheDocument()
    expect(screen.getByText('Quantidade obrigatória')).toBeInTheDocument()
    expect(screen.getByText('Motivo obrigatório')).toBeInTheDocument()
    expect(screen.getByText('Data obrigatória')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submete uma saída com lote informado', async () => {
    setLists()
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <AjusteEstoqueDialog
        open
        onOpenChange={vi.fn()}
        empresaId="e1"
        onSubmit={onSubmit}
        isPending={false}
      />,
    )

    selectByName('produtoId', 'p1')
    selectByName('loteId', 'lt9')
    await user.type(screen.getByLabelText('Quantidade'), '12')
    await user.type(screen.getByLabelText('Motivo'), 'perda')
    selectByName('direcao', 'saida')
    await user.click(screen.getByRole('button', { name: 'Registrar ajuste' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          empresaId: 'e1',
          produtoId: 'p1',
          delta: -12,
          motivo: 'perda',
          loteId: 'lt9',
        }),
      )
    })
  })

  it('volta o lote para "Sem lote" zerando o campo', async () => {
    setLists()
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <AjusteEstoqueDialog
        open
        onOpenChange={vi.fn()}
        empresaId="e1"
        onSubmit={onSubmit}
        isPending={false}
      />,
    )

    selectByName('produtoId', 'p1')
    selectByName('loteId', 'lt9')
    selectByName('loteId', '__none__')
    await user.type(screen.getByLabelText('Quantidade'), '4')
    await user.type(screen.getByLabelText('Motivo'), 'ajuste')
    await user.click(screen.getByRole('button', { name: 'Registrar ajuste' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ loteId: null }))
    })
  })

  it('submete uma entrada sem lote', async () => {
    setLists()
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <AjusteEstoqueDialog
        open
        onOpenChange={vi.fn()}
        empresaId="e1"
        onSubmit={onSubmit}
        isPending={false}
      />,
    )

    selectByName('produtoId', 'p2')
    await user.type(screen.getByLabelText('Quantidade'), '8')
    await user.type(screen.getByLabelText('Motivo'), 'entrada')
    await user.click(screen.getByRole('button', { name: 'Registrar ajuste' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ delta: 8, loteId: null }),
      )
    })
  })

  it('desabilita os botões enquanto está pendente', () => {
    setLists()
    renderWithProviders(
      <AjusteEstoqueDialog
        open
        onOpenChange={vi.fn()}
        empresaId="e1"
        onSubmit={vi.fn()}
        isPending
      />,
    )

    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Salvando...' })).toBeDisabled()
  })

  it('fecha ao clicar em cancelar', async () => {
    setLists()
    const onOpenChange = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <AjusteEstoqueDialog
        open
        onOpenChange={onOpenChange}
        empresaId="e1"
        onSubmit={vi.fn()}
        isPending={false}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
