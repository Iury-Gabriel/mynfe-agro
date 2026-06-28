import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { EmpresaFiscalDialog } from './empresa-fiscal-dialog'

import type { Empresa } from '@/features/admin/api/empresas-api'


import { api } from '@/lib/api-client'
import { renderWithProviders } from '@/test/render-with-providers'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

vi.mock('@/lib/api-client', () => ({
  api: { patch: vi.fn() },
}))

function makeEmpresa(overrides: Partial<Empresa> = {}): Empresa {
  return {
    id: 'e1',
    tenantId: 't1',
    tipoPessoa: 'PJ',
    razaoSocial: 'Verde Folha',
    nomeFantasia: null,
    cnpjCpf: '12345678000190',
    cnpjCpfFormatado: '12.345.678/0001-90',
    inscricaoEstadual: null,
    ieProdutorRural: null,
    regimeTributario: 'Simples',
    crt: '1',
    ambienteFiscal: 'homologacao',
    serieNfe: 1,
    proximaNumeracaoNfe: 42,
    plugnotasConfigurado: true,
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
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('EmpresaFiscalDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mostra numeração e status PlugNotas configurado sem expor segredo', () => {
    renderWithProviders(
      <EmpresaFiscalDialog open onOpenChange={vi.fn()} empresa={makeEmpresa()} canEdit />,
    )
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('Configurado')).toBeInTheDocument()
  })

  it('mostra "Não configurado" e "Não disponível" quando campos ausentes', () => {
    renderWithProviders(
      <EmpresaFiscalDialog
        open
        onOpenChange={vi.fn()}
        empresa={makeEmpresa({ plugnotasConfigurado: undefined, proximaNumeracaoNfe: undefined })}
        canEdit
      />,
    )
    expect(screen.getByText('Não configurado')).toBeInTheDocument()
    expect(screen.getByText('Não disponível')).toBeInTheDocument()
  })

  it('salva via update de empresa', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { empresa: makeEmpresa() } })
    const onOpenChange = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <EmpresaFiscalDialog open onOpenChange={onOpenChange} empresa={makeEmpresa()} canEdit />,
    )

    await user.click(screen.getByRole('button', { name: 'Salvar configuração' }))

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith(
        '/api/empresas/e1',
        expect.objectContaining({ ambienteFiscal: 'homologacao', serieNfe: 1 }),
      )
    })
  })

  it('oculta salvar quando sem permissão de edição', () => {
    renderWithProviders(
      <EmpresaFiscalDialog open onOpenChange={vi.fn()} empresa={makeEmpresa()} canEdit={false} />,
    )
    expect(screen.queryByRole('button', { name: 'Salvar configuração' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fechar painel' })).toBeInTheDocument()
  })
})
