import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { EmpresaFormDialog } from './empresa-form-dialog'

import type { Empresa } from '@/features/admin/api/empresas-api'

import { api } from '@/lib/api-client'
import { ApiError } from '@/lib/api-error'
import { renderWithProviders } from '@/test/render-with-providers'

const toastSuccess = vi.fn()
const toastError = vi.fn()
vi.mock('sonner', () => ({
  toast: {
    success: (m: string) => toastSuccess(m),
    error: (m: string) => toastError(m),
  },
}))

vi.mock('@/lib/api-client', () => ({
  api: { post: vi.fn(), patch: vi.fn() },
}))

function makeEmpresa(overrides: Partial<Empresa> = {}): Empresa {
  return {
    id: 'e1',
    tenantId: 't1',
    tipoPessoa: 'PJ',
    razaoSocial: 'Verde Folha LTDA',
    nomeFantasia: 'Verde Folha',
    cnpjCpf: '12345678000190',
    cnpjCpfFormatado: '12.345.678/0001-90',
    inscricaoEstadual: '123456',
    ieProdutorRural: null,
    regimeTributario: 'Simples Nacional',
    crt: '1',
    ambienteFiscal: 'homologacao',
    serieNfe: 1,
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
    ...overrides,
  }
}

describe('EmpresaFormDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('não renderiza o conteúdo quando open é false', () => {
    renderWithProviders(<EmpresaFormDialog open={false} onOpenChange={vi.fn()} empresa={null} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('valida campos obrigatórios e não envia requisição', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<EmpresaFormDialog open onOpenChange={vi.fn()} empresa={null} />)

    await user.click(screen.getByRole('button', { name: 'Criar empresa' }))

    expect(await screen.findByText('Razão social obrigatória')).toBeInTheDocument()
    expect(screen.getByText('Mínimo 11 dígitos')).toBeInTheDocument()
    expect(screen.getByText('Regime tributário obrigatório')).toBeInTheDocument()
    expect(screen.getByText('CRT obrigatório')).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('cria empresa normalizando os campos opcionais e dispara onSuccess', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { empresa: makeEmpresa() } })
    const onOpenChange = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<EmpresaFormDialog open onOpenChange={onOpenChange} empresa={null} />)

    await user.type(screen.getByLabelText('Razão social'), 'Nova Agro')
    await user.type(screen.getByLabelText('CNPJ / CPF'), '12345678000190')
    await user.type(screen.getByLabelText('Regime tributário'), 'Simples Nacional')
    await user.type(screen.getByLabelText('CRT'), '1')
    await user.click(screen.getByRole('button', { name: 'Criar empresa' }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/api/empresas',
        expect.objectContaining({
          razaoSocial: 'Nova Agro',
          cnpjCpf: '12345678000190',
          nomeFantasia: null,
          serieNfe: null,
        }),
      )
    })
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(toastSuccess).toHaveBeenCalledWith('Empresa criada com sucesso.')
  })

  it('troca o tipo de pessoa e o ambiente fiscal pelos selects', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { empresa: makeEmpresa() } })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<EmpresaFormDialog open onOpenChange={vi.fn()} empresa={null} />)

    fireEvent.change(document.querySelector<HTMLSelectElement>('select[name="tipoPessoa"]')!, {
      target: { value: 'PF' },
    })
    fireEvent.change(document.querySelector<HTMLSelectElement>('select[name="ambienteFiscal"]')!, {
      target: { value: 'producao' },
    })

    await user.type(screen.getByLabelText('Razão social'), 'Nova Agro')
    await user.type(screen.getByLabelText('CNPJ / CPF'), '12345678901')
    await user.type(screen.getByLabelText('Regime tributário'), 'Simples')
    await user.type(screen.getByLabelText('CRT'), '1')
    await user.click(screen.getByRole('button', { name: 'Criar empresa' }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/api/empresas',
        expect.objectContaining({ tipoPessoa: 'PF', ambienteFiscal: 'producao' }),
      )
    })
  })

  it('edita empresa existente e envia série numérica', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { empresa: makeEmpresa() } })
    const onOpenChange = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <EmpresaFormDialog open onOpenChange={onOpenChange} empresa={makeEmpresa({ serieNfe: 7 })} />,
    )

    expect(screen.getByRole('heading', { name: 'Editar empresa' })).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Razão social'))
    await user.type(screen.getByLabelText('Razão social'), 'Verde Editada')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith(
        '/api/empresas/e1',
        expect.objectContaining({ razaoSocial: 'Verde Editada', serieNfe: 7 }),
      )
    })
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(toastSuccess).toHaveBeenCalledWith('Empresa atualizada com sucesso.')
  })

  it('aplica erros field-level vindos do servidor', async () => {
    vi.mocked(api.post).mockRejectedValue(
      new ApiError('bad-request', 'inválido', 400, [
        { path: 'razaoSocial', message: 'Já cadastrada' },
        { path: 'campoInexistente', message: 'ignorado' },
      ]),
    )
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<EmpresaFormDialog open onOpenChange={vi.fn()} empresa={null} />)

    await user.type(screen.getByLabelText('Razão social'), 'Nova Agro')
    await user.type(screen.getByLabelText('CNPJ / CPF'), '12345678000190')
    await user.type(screen.getByLabelText('Regime tributário'), 'Simples')
    await user.type(screen.getByLabelText('CRT'), '1')
    await user.click(screen.getByRole('button', { name: 'Criar empresa' }))

    expect(await screen.findByText('Já cadastrada')).toBeInTheDocument()
    expect(toastError).not.toHaveBeenCalled()
  })

  it('mostra toast genérico quando o erro não tem detalhes', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<EmpresaFormDialog open onOpenChange={vi.fn()} empresa={null} />)

    await user.type(screen.getByLabelText('Razão social'), 'Nova Agro')
    await user.type(screen.getByLabelText('CNPJ / CPF'), '12345678000190')
    await user.type(screen.getByLabelText('Regime tributário'), 'Simples')
    await user.type(screen.getByLabelText('CRT'), '1')
    await user.click(screen.getByRole('button', { name: 'Criar empresa' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Não foi possível salvar a empresa.')
    })
  })

  it('pré-preenche com defaults vazios quando os opcionais são nulos na edição', () => {
    renderWithProviders(
      <EmpresaFormDialog
        open
        onOpenChange={vi.fn()}
        empresa={makeEmpresa({ nomeFantasia: null, inscricaoEstadual: null, serieNfe: null })}
      />,
    )

    expect(screen.getByLabelText('Nome fantasia')).toHaveValue('')
    expect(screen.getByLabelText('Inscrição estadual')).toHaveValue('')
    expect(screen.getByLabelText('Série NF-e')).toHaveValue('')
  })

  it('exibe mensagens de erro nos campos opcionais quando excedem o tamanho', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<EmpresaFormDialog open onOpenChange={vi.fn()} empresa={null} />)

    await user.type(screen.getByLabelText('Razão social'), 'Nova Agro')
    await user.type(screen.getByLabelText('Nome fantasia'), 'x'.repeat(201))
    await user.type(screen.getByLabelText('CNPJ / CPF'), '12345678000190')
    await user.type(screen.getByLabelText('Inscrição estadual'), 'x'.repeat(31))
    await user.type(screen.getByLabelText('IE produtor rural'), 'x'.repeat(31))
    await user.type(screen.getByLabelText('Série NF-e'), '12345678901')
    await user.type(screen.getByLabelText('Regime tributário'), 'Simples')
    await user.type(screen.getByLabelText('CRT'), '1')
    await user.click(screen.getByRole('button', { name: 'Criar empresa' }))

    await waitFor(() => {
      expect(
        screen.getByText('String must contain at most 200 character(s)'),
      ).toBeInTheDocument()
    })
    expect(
      screen.getAllByText('String must contain at most 30 character(s)').length,
    ).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('String must contain at most 10 character(s)')).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('mostra "Salvando..." e desabilita o submit durante o envio', async () => {
    vi.mocked(api.patch).mockReturnValue(new Promise(() => undefined))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <EmpresaFormDialog open onOpenChange={vi.fn()} empresa={makeEmpresa()} />,
    )

    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByRole('button', { name: 'Salvando...' })).toBeDisabled()
  })

  it('fecha ao clicar em Cancelar', async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<EmpresaFormDialog open onOpenChange={onOpenChange} empresa={null} />)

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
