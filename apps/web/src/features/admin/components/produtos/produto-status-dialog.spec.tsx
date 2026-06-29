import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProdutoStatusDialog } from './produto-status-dialog'

import type { Produto } from '@/features/admin/api/produtos-api'

import { renderWithProviders } from '@/test/render-with-providers'

function makeProduto(overrides: Partial<Produto> = {}): Produto {
  return {
    id: 'p1',
    tenantId: 't1',
    empresaId: 'e1',
    descricao: 'Soja em grão',
    tipo: 'bruto',
    unidadeMedida: 'kg',
    precoPadrao: null,
    ncm: null,
    cest: null,
    cfopPadrao: null,
    origemMercadoria: null,
    cstCsosn: null,
    aliquotas: null,
    status: 'ativo',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('ProdutoStatusDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mostra "Inativar produto" para produto ativo e confirma', async () => {
    const onConfirm = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <ProdutoStatusDialog
        produto={makeProduto()}
        open
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
        isPending={false}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Inativar produto' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Inativar' }))
    expect(onConfirm).toHaveBeenCalled()
  })

  it('mostra "Ativar produto" para produto inativo', () => {
    renderWithProviders(
      <ProdutoStatusDialog
        produto={makeProduto({ status: 'inativo' })}
        open
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isPending={false}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Ativar produto' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ativar' })).toBeInTheDocument()
  })

  it('desabilita os botões e mostra "Salvando..." quando isPending', () => {
    renderWithProviders(
      <ProdutoStatusDialog
        produto={makeProduto()}
        open
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isPending
      />,
    )

    expect(screen.getByRole('button', { name: 'Salvando...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
  })
})
