import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FazendaDeleteDialog } from './fazenda-delete-dialog'

import type { Fazenda } from '@/features/admin/api/fazendas-api'

import { renderWithProviders } from '@/test/render-with-providers'

const fazenda: Fazenda = {
  id: 'f1',
  tenantId: 't1',
  empresaId: 'e1',
  nome: 'Fazenda Boa Vista',
  enderecoLogradouro: null,
  enderecoNumero: null,
  enderecoBairro: null,
  enderecoCep: null,
  municipio: null,
  uf: null,
  latitude: null,
  longitude: null,
  car: null,
  nirfIncra: null,
  areaTotalHa: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('FazendaDeleteDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('não renderiza quando open é false', () => {
    renderWithProviders(
      <FazendaDeleteDialog
        fazenda={fazenda}
        open={false}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isPending={false}
      />,
    )

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('exibe o nome da fazenda e dispara onConfirm', async () => {
    const onConfirm = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <FazendaDeleteDialog
        fazenda={fazenda}
        open
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
        isPending={false}
      />,
    )

    expect(screen.getByText('Fazenda Boa Vista')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('exibe "Excluindo..." e desabilita as ações quando isPending é true', () => {
    renderWithProviders(
      <FazendaDeleteDialog
        fazenda={fazenda}
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
