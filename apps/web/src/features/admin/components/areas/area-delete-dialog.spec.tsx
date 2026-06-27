import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AreaDeleteDialog } from './area-delete-dialog'

import type { Area } from '@/features/admin/api/areas-api'

import { renderWithProviders } from '@/test/render-with-providers'

const area: Area = {
  id: 'a1',
  tenantId: 't1',
  fazendaId: 'f1',
  identificacao: 'Talhão 1',
  tamanho: null,
  unidadeTamanho: null,
  rotulo: null,
  geometria: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('AreaDeleteDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('não renderiza quando open é false', () => {
    renderWithProviders(
      <AreaDeleteDialog
        area={area}
        open={false}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isPending={false}
      />,
    )

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('exibe a identificação e dispara onConfirm', async () => {
    const onConfirm = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <AreaDeleteDialog
        area={area}
        open
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
        isPending={false}
      />,
    )

    expect(screen.getByText('Talhão 1')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('exibe "Excluindo..." e desabilita as ações quando isPending é true', () => {
    renderWithProviders(
      <AreaDeleteDialog
        area={area}
        open
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isPending
      />,
    )

    expect(screen.getByRole('button', { name: 'Excluindo...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
  })
})
