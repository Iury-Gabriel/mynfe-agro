import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SafraDeleteDialog } from './safra-delete-dialog'

import type { Safra } from '@/features/admin/api/safras-api'

import { renderWithProviders } from '@/test/render-with-providers'

const safra: Safra = {
  id: 's1',
  tenantId: 't1',
  areaId: 'a1',
  cultura: 'Soja',
  variedade: null,
  dataPlantio: null,
  dataColheitaPrevista: null,
  dataColheitaRealizada: null,
  estimativaProducao: null,
  status: 'planejado',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('SafraDeleteDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('não renderiza quando open é false', () => {
    renderWithProviders(
      <SafraDeleteDialog
        safra={safra}
        open={false}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isPending={false}
      />,
    )

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('exibe a cultura da safra e dispara onConfirm', async () => {
    const onConfirm = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <SafraDeleteDialog
        safra={safra}
        open
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
        isPending={false}
      />,
    )

    expect(screen.getByText('Soja')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('exibe "Excluindo..." e desabilita as ações quando isPending é true', () => {
    renderWithProviders(
      <SafraDeleteDialog safra={safra} open onOpenChange={vi.fn()} onConfirm={vi.fn()} isPending />,
    )

    expect(screen.getByRole('button', { name: 'Excluindo...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
  })
})
