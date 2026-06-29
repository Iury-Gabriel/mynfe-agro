import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { EmpresasPage } from './empresas-page'

import type { Empresa } from '@/features/admin/api/empresas-api'

import { api } from '@/lib/api-client'
import { renderWithProviders } from '@/test/render-with-providers'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}))

const useAuthMock = vi.fn()
vi.mock('@/providers/auth-context', () => ({
  useAuth: () => useAuthMock() as unknown,
}))

const ALL_PERMS = ['empresa:read', 'empresa:create', 'empresa:update', 'empresa:status']

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
    ambienteFiscal: 'producao',
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

function mockList(empresas: Empresa[], extra: Record<string, number> = {}) {
  vi.mocked(api.get).mockResolvedValue({
    data: {
      empresas,
      total: empresas.length,
      page: 1,
      perPage: 20,
      totalPages: 1,
      ...extra,
    },
  })
}

describe('EmpresasPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthMock.mockReturnValue({ user: { permissions: ALL_PERMS } })
  })

  it('exibe estado de carregamento', () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => undefined))
    renderWithProviders(<EmpresasPage />)
    expect(screen.getByText('Carregando empresas…')).toBeInTheDocument()
  })

  it('exibe erro e permite tentar novamente', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<EmpresasPage />)

    expect(await screen.findByText('Erro ao carregar empresas.')).toBeInTheDocument()

    mockList([makeEmpresa()])
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText('Verde Folha LTDA')).toBeInTheDocument()
  })

  it('lista empresas com documento, IE, regime e ambiente', async () => {
    mockList([makeEmpresa()])
    renderWithProviders(<EmpresasPage />)

    expect(await screen.findByText('Verde Folha LTDA')).toBeInTheDocument()
    expect(screen.getByText('12.345.678/0001-90')).toBeInTheDocument()
    expect(screen.getByText('123456')).toBeInTheDocument()
    expect(screen.getByText('Produção')).toBeInTheDocument()
    expect(screen.getByText('Ativo')).toBeInTheDocument()
  })

  it('exibe traço quando não há inscrição estadual', async () => {
    mockList([makeEmpresa({ inscricaoEstadual: null, nomeFantasia: null })])
    renderWithProviders(<EmpresasPage />)

    expect(await screen.findByText('Verde Folha LTDA')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('mostra empresa inativa com ambiente de homologação', async () => {
    mockList([makeEmpresa({ status: 'inativo', ambienteFiscal: 'homologacao' })])
    renderWithProviders(<EmpresasPage />)

    expect(await screen.findByText('Inativo')).toBeInTheDocument()
    expect(screen.getByText('Homologação')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ativar/ })).toBeInTheDocument()
  })

  it('oculta ações quando o usuário não tem permissão', async () => {
    useAuthMock.mockReturnValue({ user: { permissions: ['empresa:read'] } })
    mockList([makeEmpresa()])
    renderWithProviders(<EmpresasPage />)

    await screen.findByText('Verde Folha LTDA')
    expect(screen.queryByRole('button', { name: /Editar/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Inativar/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Nova empresa/ })).not.toBeInTheDocument()
  })

  it('abre o dialog de criação', async () => {
    mockList([])
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<EmpresasPage />)

    await screen.findByText('Nenhum registro encontrado.')
    await user.click(screen.getByRole('button', { name: /Nova empresa/ }))

    expect(screen.getByRole('heading', { name: 'Nova empresa' })).toBeInTheDocument()
  })

  it('abre o dialog de edição', async () => {
    mockList([makeEmpresa()])
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<EmpresasPage />)

    await screen.findByText('Verde Folha LTDA')
    await user.click(screen.getByRole('button', { name: /Editar/ }))

    expect(screen.getByRole('heading', { name: 'Editar empresa' })).toBeInTheDocument()
  })

  it('abre o dialog de inativação e o fecha limpando a seleção', async () => {
    mockList([makeEmpresa()])
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<EmpresasPage />)

    await screen.findByText('Verde Folha LTDA')
    await user.click(screen.getByRole('button', { name: /Inativar/ }))

    expect(screen.getByRole('heading', { name: 'Inativar empresa' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Inativar empresa' })).not.toBeInTheDocument()
    })
  })

  it('filtra empresas pela busca', async () => {
    mockList([
      makeEmpresa({ id: 'e1', razaoSocial: 'Alpha Agro', nomeFantasia: 'Alpha' }),
      makeEmpresa({ id: 'e2', razaoSocial: 'Beta Agro', nomeFantasia: 'Beta' }),
    ])
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<EmpresasPage />)

    await screen.findByText('Alpha Agro')
    await user.type(screen.getByLabelText('Buscar empresas'), 'beta')

    expect(screen.queryByText('Alpha Agro')).not.toBeInTheDocument()
    expect(screen.getByText('Beta Agro')).toBeInTheDocument()
  })

  it('navega entre páginas com Anterior/Próxima', async () => {
    const first = makeEmpresa({ id: 'e1', razaoSocial: 'Primeira' })
    const second = makeEmpresa({ id: 'e2', razaoSocial: 'Segunda' })
    vi.mocked(api.get).mockImplementation(
      (_url: string, config?: { params?: { page?: number } }) => {
        const page = config?.params?.page ?? 1
        const empresas = page === 1 ? [first] : [second]
        return Promise.resolve({
          data: { empresas, total: 2, page, perPage: 20, totalPages: 2 },
        })
      },
    )
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<EmpresasPage />)

    await screen.findByText('Primeira')
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Próxima' }))
    expect(await screen.findByText('Segunda')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Anterior' }))
    expect(await screen.findByText('Primeira')).toBeInTheDocument()
  })

  it('usa defaults de paginação quando a resposta omite os metadados', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { empresas: [makeEmpresa()] } })
    renderWithProviders(<EmpresasPage />)

    await screen.findByText('Verde Folha LTDA')
    expect(screen.getByText(/Página 1 de 1 · 0 empresas/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled()
  })

  it('filtra pelo nome fantasia ignorando empresas sem fantasia', async () => {
    mockList([
      makeEmpresa({ id: 'e1', razaoSocial: 'Alpha Agro', nomeFantasia: 'Folha Verde' }),
      makeEmpresa({ id: 'e2', razaoSocial: 'Beta Agro', nomeFantasia: null }),
    ])
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<EmpresasPage />)

    await screen.findByText('Alpha Agro')
    await user.type(screen.getByLabelText('Buscar empresas'), 'folha verde')

    expect(screen.getByText('Alpha Agro')).toBeInTheDocument()
    expect(screen.queryByText('Beta Agro')).not.toBeInTheDocument()
  })

  it('exibe o ambiente cru quando não há rótulo mapeado', async () => {
    mockList([makeEmpresa({ ambienteFiscal: 'desconhecido' as never })])
    renderWithProviders(<EmpresasPage />)

    expect(await screen.findByText('desconhecido')).toBeInTheDocument()
  })

  it('abre o dialog fiscal e o fecha limpando a seleção', async () => {
    mockList([makeEmpresa()])
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<EmpresasPage />)

    await screen.findByText('Verde Folha LTDA')
    await user.click(screen.getByRole('button', { name: /Fiscal/ }))

    expect(
      screen.getByRole('heading', { name: /Configuração fiscal/ }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: /Configuração fiscal/ }),
      ).not.toBeInTheDocument()
    })
  })
})
