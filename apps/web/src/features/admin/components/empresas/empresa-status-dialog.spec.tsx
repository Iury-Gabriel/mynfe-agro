import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { EmpresaStatusDialog } from './empresa-status-dialog'

import type { Empresa } from '@/features/admin/api/empresas-api'

import { api } from '@/lib/api-client'
import { renderWithProviders } from '@/test/render-with-providers'

const toastSuccess = vi.fn()
const toastError = vi.fn()

vi.mock('sonner', () => ({
  toast: {
    success: (msg: string) => toastSuccess(msg),
    error: (msg: string) => toastError(msg),
  },
}))

vi.mock('@/lib/api-client', () => ({
  api: { patch: vi.fn() },
}))

const baseEmpresa: Empresa = {
  id: 'e1',
  tenantId: 't1',
  tipoPessoa: 'PJ',
  razaoSocial: 'Verde Folha LTDA',
  nomeFantasia: null,
  cnpjCpf: '12345678000190',
  cnpjCpfFormatado: '12.345.678/0001-90',
  inscricaoEstadual: null,
  ieProdutorRural: null,
  regimeTributario: 'Simples',
  crt: '1',
  ambienteFiscal: 'homologacao',
  serieNfe: null,
  status: 'ativo',
  endereco: {
    logradouro: null,
    numero: null,
    complemento: null,
    bairro: null,
    municipio: null,
    uf: null,
    cep: null,
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('EmpresaStatusDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('inativa uma empresa ativa', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { empresa: baseEmpresa } })
    const onOpenChange = vi.fn()
    const user = userEvent.setup({ delay: null })

    renderWithProviders(
      <EmpresaStatusDialog empresa={baseEmpresa} open onOpenChange={onOpenChange} />,
    )

    expect(screen.getByRole('heading', { name: 'Inativar empresa' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Inativar' }))

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/api/empresas/e1/deactivate')
    })
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(toastSuccess).toHaveBeenCalledWith('Empresa inativada.')
  })

  it('ativa uma empresa inativa', async () => {
    const inativa = { ...baseEmpresa, status: 'inativo' as const }
    vi.mocked(api.patch).mockResolvedValue({ data: { empresa: inativa } })
    const user = userEvent.setup({ delay: null })

    renderWithProviders(<EmpresaStatusDialog empresa={inativa} open onOpenChange={vi.fn()} />)

    expect(screen.getByRole('heading', { name: 'Ativar empresa' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Ativar' }))

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/api/empresas/e1/activate')
    })
    expect(toastSuccess).toHaveBeenCalledWith('Empresa ativada.')
  })

  it('exibe toast de erro quando a mutação falha', async () => {
    vi.mocked(api.patch).mockRejectedValue(new Error('falhou'))
    const user = userEvent.setup({ delay: null })

    renderWithProviders(<EmpresaStatusDialog empresa={baseEmpresa} open onOpenChange={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Inativar' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Não foi possível alterar o status.')
    })
  })

  it('fecha ao cancelar', async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup({ delay: null })

    renderWithProviders(
      <EmpresaStatusDialog empresa={baseEmpresa} open onOpenChange={onOpenChange} />,
    )

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
