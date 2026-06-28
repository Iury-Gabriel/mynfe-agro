import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CustoProducaoDeleteDialog } from './custo-producao-delete-dialog'

import type { CustoProducao } from '@/features/admin/api/custos-producao-api'

import { renderWithProviders } from '@/test/render-with-providers'

const custo: CustoProducao = {
  id: 'cu1',
  tenantId: 't1',
  safraId: null,
  areaId: null,
  tipo: 'insumo',
  descricao: 'Sementes de soja',
  valor: 1500,
  data: '2026-01-10T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('CustoProducaoDeleteDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('não renderiza quando open é false', () => {
    renderWithProviders(
      <CustoProducaoDeleteDialog
        custo={custo}
        open={false}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isPending={false}
      />,
    )

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('exibe a descrição do custo e dispara onConfirm', async () => {
    const onConfirm = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <CustoProducaoDeleteDialog
        custo={custo}
        open
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
        isPending={false}
      />,
    )

    expect(screen.getByText('Sementes de soja')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('exibe "Excluindo..." e desabilita as ações quando isPending é true', () => {
    renderWithProviders(
      <CustoProducaoDeleteDialog
        custo={custo}
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
