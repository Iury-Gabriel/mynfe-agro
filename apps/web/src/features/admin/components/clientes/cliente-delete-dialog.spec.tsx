import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ClienteDeleteDialog } from './cliente-delete-dialog'

import type { Cliente } from '@/features/admin/api/clientes-api'

import { renderWithProviders } from '@/test/render-with-providers'

const cliente: Cliente = {
  id: 'c1',
  tenantId: 't1',
  tipoPessoa: 'PF',
  razaoSocialNome: 'João da Silva',
  cnpjCpf: '12345678901',
  cnpjCpfFormatado: '123.456.789-01',
  inscricaoEstadual: null,
  indicadorIe: '9',
  contribuinteIcms: false,
  enderecoLogradouro: null,
  enderecoNumero: null,
  enderecoBairro: null,
  enderecoCep: null,
  municipio: null,
  codMunicipioIbge: null,
  uf: null,
  email: null,
  telefone: null,
  vendedorUsuarioId: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('ClienteDeleteDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('não renderiza quando open é false', () => {
    renderWithProviders(
      <ClienteDeleteDialog
        cliente={cliente}
        open={false}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isPending={false}
      />,
    )

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('exibe o nome e dispara onConfirm', async () => {
    const onConfirm = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <ClienteDeleteDialog
        cliente={cliente}
        open
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
        isPending={false}
      />,
    )

    expect(screen.getByText('João da Silva')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('exibe "Excluindo..." e desabilita as ações quando isPending é true', () => {
    renderWithProviders(
      <ClienteDeleteDialog
        cliente={cliente}
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
