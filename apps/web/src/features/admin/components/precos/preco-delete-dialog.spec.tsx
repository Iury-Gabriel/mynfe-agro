import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PrecoDeleteDialog } from './preco-delete-dialog'

import type { TabelaPreco } from '@/features/admin/api/tabela-precos-api'

import { renderWithProviders } from '@/test/render-with-providers'

const basePreco: TabelaPreco = {
  id: 'tp1',
  tenantId: 't1',
  clienteId: 'c1',
  produtoId: 'p1',
  preco: 10,
  vigenciaInicio: null,
  vigenciaFim: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('PrecoDeleteDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mostra cliente e produto e confirma a exclusão', async () => {
    const onConfirm = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <PrecoDeleteDialog
        preco={basePreco}
        open
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
        isPending={false}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Excluir preço' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(onConfirm).toHaveBeenCalled()
  })

  it('desabilita os botões e mostra "Excluindo..." quando isPending', () => {
    renderWithProviders(
      <PrecoDeleteDialog
        preco={basePreco}
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
