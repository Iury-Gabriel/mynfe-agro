import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { EmpresaFiscalDialog } from './empresa-fiscal-dialog'

import type { Empresa } from '@/features/admin/api/empresas-api'


import { api } from '@/lib/api-client'
import { ApiError } from '@/lib/api-error'
import { renderWithProviders } from '@/test/render-with-providers'

import { toast } from 'sonner'

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

  it('não exibe o conteúdo quando fechado', () => {
    renderWithProviders(
      <EmpresaFiscalDialog open={false} onOpenChange={vi.fn()} empresa={makeEmpresa()} canEdit />,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
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

  it('salva, fecha o diálogo e exibe toast de sucesso', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { empresa: makeEmpresa() } })
    const onOpenChange = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <EmpresaFiscalDialog open onOpenChange={onOpenChange} empresa={makeEmpresa()} canEdit />,
    )

    await user.click(screen.getByRole('button', { name: 'Salvar configuração' }))

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
    expect(toast.success).toHaveBeenCalledWith('Configuração fiscal atualizada.')
  })

  it('troca o ambiente fiscal e envia série nula quando vazia', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { empresa: makeEmpresa() } })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <EmpresaFiscalDialog
        open
        onOpenChange={vi.fn()}
        empresa={makeEmpresa({ serieNfe: null })}
        canEdit
      />,
    )

    fireEvent.change(document.querySelector<HTMLSelectElement>('select[name="ambienteFiscal"]')!, {
      target: { value: 'producao' },
    })
    await user.click(screen.getByRole('button', { name: 'Salvar configuração' }))

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith(
        '/api/empresas/e1',
        expect.objectContaining({ ambienteFiscal: 'producao', serieNfe: null }),
      )
    })
  })

  it('aplica erros de validação do servidor nos campos', async () => {
    vi.mocked(api.patch).mockRejectedValue(
      new ApiError('bad-request', 'inválido', 400, [
        { path: 'crt', message: 'CRT inválido para o regime.' },
      ]),
    )
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <EmpresaFiscalDialog open onOpenChange={vi.fn()} empresa={makeEmpresa()} canEdit />,
    )

    await user.click(screen.getByRole('button', { name: 'Salvar configuração' }))

    expect(await screen.findByText('CRT inválido para o regime.')).toBeInTheDocument()
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('exibe toast genérico quando o erro não traz detalhes de campo', async () => {
    vi.mocked(api.patch).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <EmpresaFiscalDialog open onOpenChange={vi.fn()} empresa={makeEmpresa()} canEdit />,
    )

    await user.click(screen.getByRole('button', { name: 'Salvar configuração' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Não foi possível salvar a configuração fiscal.')
    })
  })

  it('ignora detalhes de erro com path desconhecido', async () => {
    vi.mocked(api.patch).mockRejectedValue(
      new ApiError('bad-request', 'inválido', 400, [
        { path: 'campoInexistente', message: 'não deve aparecer' },
      ]),
    )
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <EmpresaFiscalDialog open onOpenChange={vi.fn()} empresa={makeEmpresa()} canEdit />,
    )

    await user.click(screen.getByRole('button', { name: 'Salvar configuração' }))

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalled()
    })
    expect(screen.queryByText('não deve aparecer')).not.toBeInTheDocument()
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('exibe erros de validação local de série, regime e CRT', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <EmpresaFiscalDialog
        open
        onOpenChange={vi.fn()}
        empresa={makeEmpresa({ regimeTributario: 'Simples', crt: '1' })}
        canEdit
      />,
    )

    await user.type(screen.getByLabelText('Série NF-e'), '12345678901')
    await user.clear(screen.getByLabelText('Regime tributário'))
    await user.clear(screen.getByLabelText('CRT'))
    await user.click(screen.getByRole('button', { name: 'Salvar configuração' }))

    expect(await screen.findByText('Regime tributário obrigatório')).toBeInTheDocument()
    expect(screen.getByText('CRT obrigatório')).toBeInTheDocument()
    expect(api.patch).not.toHaveBeenCalled()
  })

  it('exibe "Salvando..." enquanto a configuração é persistida', async () => {
    vi.mocked(api.patch).mockReturnValue(new Promise(() => undefined))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <EmpresaFiscalDialog open onOpenChange={vi.fn()} empresa={makeEmpresa()} canEdit />,
    )

    await user.click(screen.getByRole('button', { name: 'Salvar configuração' }))

    expect(await screen.findByRole('button', { name: 'Salvando...' })).toBeDisabled()
  })

  it('fecha o painel ao clicar em Cancelar', async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <EmpresaFiscalDialog open onOpenChange={onOpenChange} empresa={makeEmpresa()} canEdit />,
    )

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('oculta salvar quando sem permissão de edição', () => {
    renderWithProviders(
      <EmpresaFiscalDialog open onOpenChange={vi.fn()} empresa={makeEmpresa()} canEdit={false} />,
    )
    expect(screen.queryByRole('button', { name: 'Salvar configuração' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fechar painel' })).toBeInTheDocument()
  })
})
