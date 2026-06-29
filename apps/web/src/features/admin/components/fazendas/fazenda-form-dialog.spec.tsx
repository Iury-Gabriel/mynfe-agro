import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FazendaFormDialog } from './fazenda-form-dialog'

import type { Empresa } from '@/features/admin/api/empresas-api'
import type { Fazenda } from '@/features/admin/api/fazendas-api'

import { renderWithProviders } from '@/test/render-with-providers'

const useEmpresasMock = vi.fn()

vi.mock('@/features/admin/api/empresas-api', () => ({
  useEmpresas: () => useEmpresasMock(),
}))

function makeEmpresa(overrides: Partial<Empresa> = {}): Empresa {
  return {
    id: 'e1',
    tenantId: 't1',
    tipoPessoa: 'PJ',
    razaoSocial: 'Agro LTDA',
    nomeFantasia: 'Agro',
    cnpjCpf: '00000000000000',
    cnpjCpfFormatado: '00.000.000/0000-00',
    inscricaoEstadual: null,
    ieProdutorRural: null,
    regimeTributario: 'simples',
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

function empresasResponse() {
  return {
    data: {
      empresas: [
        makeEmpresa(),
        makeEmpresa({ id: 'e2', razaoSocial: 'Outra SA', nomeFantasia: null }),
      ],
      total: 2,
      page: 1,
      perPage: 100,
      totalPages: 1,
    },
  }
}

function makeFazenda(overrides: Partial<Fazenda> = {}): Fazenda {
  return {
    id: 'f1',
    tenantId: 't1',
    empresaId: 'e1',
    nome: 'Fazenda Boa Vista',
    enderecoLogradouro: 'Estrada Rural',
    enderecoNumero: 'km 5',
    enderecoBairro: 'Zona Rural',
    enderecoCep: '12345000',
    municipio: 'Sorriso',
    uf: 'MT',
    latitude: null,
    longitude: null,
    car: 'CAR-123',
    nirfIncra: 'NIRF-9',
    areaTotalHa: 1200,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function selectEmpresa(value: string): void {
  fireEvent.change(document.querySelector<HTMLSelectElement>('select[name="empresaId"]')!, {
    target: { value },
  })
}

describe('FazendaFormDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useEmpresasMock.mockReturnValue(empresasResponse())
  })

  it('não renderiza o conteúdo quando open é false', () => {
    renderWithProviders(
      <FazendaFormDialog open={false} onOpenChange={vi.fn()} fazenda={null} onSubmit={vi.fn()} isPending={false} />,
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renderiza as empresas (nomeFantasia ou razaoSocial) como opções', () => {
    renderWithProviders(
      <FazendaFormDialog open onOpenChange={vi.fn()} fazenda={null} onSubmit={vi.fn()} isPending={false} />,
    )

    const select = document.querySelector<HTMLSelectElement>('select[name="empresaId"]')!
    expect(Array.from(select.options).map((o) => o.value)).toEqual(
      expect.arrayContaining(['e1', 'e2']),
    )
  })

  it('valida campos obrigatórios e não chama onSubmit', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <FazendaFormDialog open onOpenChange={vi.fn()} fazenda={null} onSubmit={onSubmit} isPending={false} />,
    )

    await user.click(screen.getByRole('button', { name: 'Criar fazenda' }))

    expect(await screen.findByText('Empresa obrigatória')).toBeInTheDocument()
    expect(screen.getByText('Nome obrigatório')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('chama onSubmit com a empresa selecionada e payload normalizado', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <FazendaFormDialog open onOpenChange={vi.fn()} fazenda={null} onSubmit={onSubmit} isPending={false} />,
    )

    selectEmpresa('e2')
    await user.type(screen.getByLabelText('Nome'), 'Fazenda Nova')
    await user.type(screen.getByLabelText('UF'), 'mt')
    await user.type(screen.getByLabelText('Área total (ha)'), '500')
    await user.click(screen.getByRole('button', { name: 'Criar fazenda' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          empresaId: 'e2',
          nome: 'Fazenda Nova',
          uf: 'MT',
          areaTotalHa: 500,
          enderecoLogradouro: null,
        }),
      )
    })
  })

  it('mostra estado vazio quando não há empresas', () => {
    useEmpresasMock.mockReturnValue({ data: undefined })
    renderWithProviders(
      <FazendaFormDialog open onOpenChange={vi.fn()} fazenda={null} onSubmit={vi.fn()} isPending={false} />,
    )

    expect(screen.getByText('Nenhuma empresa cadastrada')).toBeInTheDocument()
  })

  it('vem pré-preenchido no modo edição e desabilita o select de empresa', () => {
    renderWithProviders(
      <FazendaFormDialog open onOpenChange={vi.fn()} fazenda={makeFazenda()} onSubmit={vi.fn()} isPending={false} />,
    )

    expect(screen.getByRole('heading', { name: 'Editar fazenda' })).toBeInTheDocument()
    expect(screen.getByLabelText('Nome')).toHaveValue('Fazenda Boa Vista')
    const select = document.querySelector<HTMLSelectElement>('select[name="empresaId"]')!
    expect(select.value).toBe('e1')
    expect(select).toBeDisabled()
  })

  it('preenche defaults vazios quando a fazenda tem campos nulos', () => {
    renderWithProviders(
      <FazendaFormDialog
        open
        onOpenChange={vi.fn()}
        fazenda={makeFazenda({
          enderecoLogradouro: null,
          enderecoNumero: null,
          enderecoBairro: null,
          enderecoCep: null,
          municipio: null,
          uf: null,
          car: null,
          nirfIncra: null,
          areaTotalHa: null,
        })}
        onSubmit={vi.fn()}
        isPending={false}
      />,
    )

    expect(screen.getByLabelText('Área total (ha)')).toHaveValue('')
    expect(screen.getByLabelText('UF')).toHaveValue('')
  })

  it('exibe erro quando a UF excede dois caracteres', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <FazendaFormDialog open onOpenChange={vi.fn()} fazenda={null} onSubmit={onSubmit} isPending={false} />,
    )

    selectEmpresa('e1')
    await user.type(screen.getByLabelText('Nome'), 'Fazenda Nova')
    fireEvent.change(screen.getByLabelText('UF'), { target: { value: 'XYZ' } })
    await user.click(screen.getByRole('button', { name: 'Criar fazenda' }))

    expect(
      await screen.findByText('String must contain at most 2 character(s)'),
    ).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('fecha o diálogo ao clicar em Cancelar', async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <FazendaFormDialog open onOpenChange={onOpenChange} fazenda={null} onSubmit={vi.fn()} isPending={false} />,
    )

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('exibe "Salvando..." e desabilita o submit quando isPending é true', () => {
    renderWithProviders(
      <FazendaFormDialog open onOpenChange={vi.fn()} fazenda={null} onSubmit={vi.fn()} isPending />,
    )

    expect(screen.getByRole('button', { name: 'Salvando...' })).toBeDisabled()
  })
})
