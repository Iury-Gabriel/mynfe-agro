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
})
