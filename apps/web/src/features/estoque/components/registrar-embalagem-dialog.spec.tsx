import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { RegistrarEmbalagemDialog } from './registrar-embalagem-dialog'

import { renderWithProviders } from '@/test/render-with-providers'

const produtosData = vi.fn<() => { data?: { produtos: { id: string; descricao: string }[] } }>()

vi.mock('@/features/admin/api/produtos-api', () => ({
  useProdutos: () => produtosData(),
}))

function setLists(): void {
  produtosData.mockReturnValue({
    data: { produtos: [{ id: 'p1', descricao: 'Caixa de Alface' }] },
  })
}

function selectByName(name: string, value: string): void {
  fireEvent.change(document.querySelector<HTMLSelectElement>(`select[name="${name}"]`)!, {
    target: { value },
  })
}

describe('RegistrarEmbalagemDialog', () => {
  it('renderiza os campos quando aberto', () => {
    setLists()
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

  it('não renderiza conteúdo quando fechado', () => {
    setLists()
    renderWithProviders(
      <RegistrarEmbalagemDialog
        open={false}
        onOpenChange={vi.fn()}
        empresaId="e1"
        onSubmit={vi.fn()}
        isPending={false}
      />,
    )

    expect(screen.queryByRole('heading', { name: 'Registrar embalagem' })).not.toBeInTheDocument()
  })

  it('mostra opção desabilitada quando não há produtos', () => {
    produtosData.mockReturnValue({})
    renderWithProviders(
      <RegistrarEmbalagemDialog
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
      <RegistrarEmbalagemDialog
        open
        onOpenChange={vi.fn()}
        empresaId="e1"
        onSubmit={onSubmit}
        isPending={false}
      />,
    )

    await user.clear(screen.getByLabelText('Data'))
    await user.click(screen.getByRole('button', { name: 'Registrar embalagem' }))

    expect(await screen.findByText('Produto obrigatório')).toBeInTheDocument()
    expect(screen.getByText('Quantidade obrigatória')).toBeInTheDocument()
    expect(screen.getByText('Data obrigatória')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submete com campos opcionais preenchidos', async () => {
    setLists()
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <RegistrarEmbalagemDialog
        open
        onOpenChange={vi.fn()}
        empresaId="e1"
        onSubmit={onSubmit}
        isPending={false}
      />,
    )

    selectByName('produtoId', 'p1')
    await user.type(screen.getByLabelText('Quantidade'), '5')
    await user.type(screen.getByLabelText('Código do lote'), 'LT-1')
    await user.type(screen.getByLabelText('Validade'), '2026-08-01')
    await user.click(screen.getByRole('button', { name: 'Registrar embalagem' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          empresaId: 'e1',
          produtoId: 'p1',
          quantidade: 5,
          codigoLote: 'LT-1',
        }),
      )
    })
    const payload = onSubmit.mock.calls[0]![0] as { validade: string | null }
    expect(payload.validade).not.toBeNull()
  })

  it('submete com campos opcionais vazios convertidos para null', async () => {
    setLists()
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <RegistrarEmbalagemDialog
        open
        onOpenChange={vi.fn()}
        empresaId="e1"
        onSubmit={onSubmit}
        isPending={false}
      />,
    )

    selectByName('produtoId', 'p1')
    await user.type(screen.getByLabelText('Quantidade'), '3')
    await user.click(screen.getByRole('button', { name: 'Registrar embalagem' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ codigoLote: null, validade: null }),
      )
    })
  })

  it('desabilita os botões enquanto está pendente', () => {
    setLists()
    renderWithProviders(
      <RegistrarEmbalagemDialog
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
      <RegistrarEmbalagemDialog
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
