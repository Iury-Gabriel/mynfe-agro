import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AtividadeCampoDeleteDialog } from './atividade-campo-delete-dialog'

import type { AtividadeCampo } from '@/features/admin/api/atividades-campo-api'

import { renderWithProviders } from '@/test/render-with-providers'

const atividade: AtividadeCampo = {
  id: 'at1',
  tenantId: 't1',
  safraId: null,
  areaId: null,
  tipo: 'plantio',
  data: '2026-01-10T00:00:00.000Z',
  responsavelUsuarioId: null,
  observacoes: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('AtividadeCampoDeleteDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('não renderiza quando open é false', () => {
    renderWithProviders(
      <AtividadeCampoDeleteDialog
        atividade={atividade}
        open={false}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isPending={false}
      />,
    )

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('exibe o tipo da atividade e dispara onConfirm', async () => {
    const onConfirm = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <AtividadeCampoDeleteDialog
        atividade={atividade}
        open
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
        isPending={false}
      />,
    )

    expect(screen.getByText('plantio')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('exibe "Excluindo..." e desabilita as ações quando isPending é true', () => {
    renderWithProviders(
      <AtividadeCampoDeleteDialog
        atividade={atividade}
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
