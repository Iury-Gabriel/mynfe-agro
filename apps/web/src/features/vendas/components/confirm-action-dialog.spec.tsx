import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ConfirmActionDialog } from './confirm-action-dialog'

import { renderWithProviders } from '@/test/render-with-providers'

describe('ConfirmActionDialog', () => {
  it('renderiza título/descrição e dispara onConfirm', async () => {
    const onConfirm = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <ConfirmActionDialog
        open
        onOpenChange={vi.fn()}
        title="Cancelar pedido"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Cancelar pedido"
        destructive
        onConfirm={onConfirm}
        isPending={false}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Cancelar pedido' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cancelar pedido' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('fecha o dialog ao clicar em Voltar', async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <ConfirmActionDialog
        open
        onOpenChange={onOpenChange}
        title="Confirmar pedido"
        description="Confirmar?"
        confirmLabel="Confirmar pedido"
        onConfirm={vi.fn()}
        isPending={false}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Voltar' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('mostra o rótulo de carregamento e desabilita as ações quando pendente', () => {
    renderWithProviders(
      <ConfirmActionDialog
        open
        onOpenChange={vi.fn()}
        title="Confirmar pedido"
        description="Confirmar?"
        confirmLabel="Confirmar pedido"
        pendingLabel="Confirmando..."
        onConfirm={vi.fn()}
        isPending
      />,
    )

    expect(screen.getByRole('button', { name: 'Confirmando...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeDisabled()
  })
})
