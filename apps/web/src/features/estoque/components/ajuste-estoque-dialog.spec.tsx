import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

  it('não renderiza conteúdo quando fechado', () => {
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

  it('exibe mensagens de validação ao submeter vazio', async () => {
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

    await user.type(screen.getByLabelText('Produto'), '  p1  ')
    await user.type(screen.getByLabelText('Lote'), 'LT-9')
    await user.type(screen.getByLabelText('Quantidade'), '12')
    await user.type(screen.getByLabelText('Motivo'), 'perda')
    const direcaoSelect = document.querySelector<HTMLSelectElement>('select[name="direcao"]')!
    fireEvent.change(direcaoSelect, { target: { value: 'saida' } })
    await user.click(screen.getByRole('button', { name: 'Registrar ajuste' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          empresaId: 'e1',
          produtoId: 'p1',
          delta: -12,
          motivo: 'perda',
          loteId: 'LT-9',
        }),
      )
    })
  })

  it('submete uma entrada sem lote', async () => {
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

    await user.type(screen.getByLabelText('Produto'), 'p2')
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
