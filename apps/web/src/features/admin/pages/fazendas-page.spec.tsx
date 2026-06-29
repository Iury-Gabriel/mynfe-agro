import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FazendasPage } from './fazendas-page'

import type { Fazenda } from '@/features/admin/api/fazendas-api'

import { api } from '@/lib/api-client'
import { ApiError } from '@/lib/api-error'
import { renderWithProviders } from '@/test/render-with-providers'

const toastSuccess = vi.fn()
const toastError = vi.fn()
vi.mock('sonner', () => ({
  toast: {
    success: (m: string) => {
      toastSuccess(m)
    },
    error: (m: string) => {
      toastError(m)
    },
  },
}))

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

const useAuthMock = vi.fn<() => { user: { permissions: string[] } }>()
vi.mock('@/providers/auth-context', () => ({
  useAuth: () => useAuthMock(),
}))

const ALL_PERMS = ['fazenda:read', 'fazenda:create', 'fazenda:update', 'fazenda:delete']

function makeFazenda(overrides: Partial<Fazenda> = {}): Fazenda {
  return {
    id: 'f1',
    tenantId: 't1',
    empresaId: 'e1',
    nome: 'Fazenda Boa Vista',
    enderecoLogradouro: null,
    enderecoNumero: null,
    enderecoBairro: null,
    enderecoCep: null,
    municipio: 'Sorriso',
    uf: 'MT',
    latitude: null,
    longitude: null,
    car: 'CAR-123',
    nirfIncra: null,
    areaTotalHa: 1200,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function mockList(fazendas: Fazenda[], extra: Record<string, number> = {}) {
  vi.mocked(api.get).mockResolvedValue({
    data: { fazendas, total: fazendas.length, page: 1, perPage: 20, totalPages: 1, ...extra },
  })
}

describe('FazendasPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthMock.mockReturnValue({ user: { permissions: ALL_PERMS } })
  })

  it('exibe estado de carregamento', () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => undefined))
    renderWithProviders(<FazendasPage />)
    expect(screen.getByText('Carregando fazendas…')).toBeInTheDocument()
  })

  it('exibe erro e permite tentar novamente', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<FazendasPage />)

    expect(await screen.findByText('Erro ao carregar fazendas.')).toBeInTheDocument()

    mockList([makeFazenda()])
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText('Fazenda Boa Vista')).toBeInTheDocument()
  })

  it('lista fazendas com município, CAR e área', async () => {
    mockList([makeFazenda()])
    renderWithProviders(<FazendasPage />)

    expect(await screen.findByText('Fazenda Boa Vista')).toBeInTheDocument()
    expect(screen.getByText('Sorriso / MT')).toBeInTheDocument()
    expect(screen.getByText('CAR-123')).toBeInTheDocument()
    expect(screen.getByText('1.200')).toBeInTheDocument()
  })

  it('exibe traços quando campos opcionais são nulos', async () => {
    mockList([makeFazenda({ municipio: null, uf: null, car: null, areaTotalHa: null })])
    renderWithProviders(<FazendasPage />)

    await screen.findByText('Fazenda Boa Vista')
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('exibe município sem UF quando apenas o município está preenchido', async () => {
    mockList([makeFazenda({ uf: null })])
    renderWithProviders(<FazendasPage />)

    expect(await screen.findByText('Sorriso')).toBeInTheDocument()
  })

  it('oculta ações quando o usuário não tem permissão', async () => {
    useAuthMock.mockReturnValue({ user: { permissions: ['fazenda:read'] } })
    mockList([makeFazenda()])
    renderWithProviders(<FazendasPage />)

    await screen.findByText('Fazenda Boa Vista')
    expect(screen.queryByRole('button', { name: /Editar/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Excluir/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Nova fazenda/ })).not.toBeInTheDocument()
  })

  it('cria uma fazenda com sucesso', async () => {
    mockList([])
    vi.mocked(api.post).mockResolvedValue({ data: { fazenda: makeFazenda() } })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<FazendasPage />)

    await screen.findByText('Nenhum registro encontrado.')
    await user.click(screen.getByRole('button', { name: /Nova fazenda/ }))

    await user.type(screen.getByLabelText('Empresa'), 'e1')
    await user.type(screen.getByLabelText('Nome'), 'Fazenda X')
    await user.click(screen.getByRole('button', { name: 'Criar fazenda' }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/fazendas', expect.objectContaining({ nome: 'Fazenda X' }))
    })
    expect(toastSuccess).toHaveBeenCalledWith('Fazenda criada com sucesso.')
  })

  it('exibe toast de erro quando a criação falha', async () => {
    mockList([])
    vi.mocked(api.post).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<FazendasPage />)

    await screen.findByText('Nenhum registro encontrado.')
    await user.click(screen.getByRole('button', { name: /Nova fazenda/ }))
    await user.type(screen.getByLabelText('Empresa'), 'e1')
    await user.type(screen.getByLabelText('Nome'), 'Fazenda X')
    await user.click(screen.getByRole('button', { name: 'Criar fazenda' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Não foi possível salvar a fazenda.')
    })
  })

  it('edita uma fazenda existente sem enviar o empresaId', async () => {
    mockList([makeFazenda()])
    vi.mocked(api.patch).mockResolvedValue({ data: { fazenda: makeFazenda() } })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<FazendasPage />)

    await screen.findByText('Fazenda Boa Vista')
    await user.click(screen.getByRole('button', { name: /Editar/ }))

    expect(screen.getByRole('heading', { name: 'Editar fazenda' })).toBeInTheDocument()
    await user.clear(screen.getByLabelText('Nome'))
    await user.type(screen.getByLabelText('Nome'), 'Fazenda Editada')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith(
        '/api/fazendas/f1',
        expect.objectContaining({ nome: 'Fazenda Editada' }),
      )
    })
    const body = vi.mocked(api.patch).mock.calls[0]![1] as Record<string, unknown>
    expect(body).not.toHaveProperty('empresaId')
    expect(toastSuccess).toHaveBeenCalledWith('Fazenda atualizada com sucesso.')
  })

  it('exibe toast de erro quando a edição falha', async () => {
    mockList([makeFazenda()])
    vi.mocked(api.patch).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<FazendasPage />)

    await screen.findByText('Fazenda Boa Vista')
    await user.click(screen.getByRole('button', { name: /Editar/ }))
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Não foi possível salvar a fazenda.')
    })
  })

  it('exclui uma fazenda', async () => {
    mockList([makeFazenda()])
    vi.mocked(api.delete).mockResolvedValue({ data: { fazenda: makeFazenda() } })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<FazendasPage />)

    await screen.findByText('Fazenda Boa Vista')
    await user.click(screen.getByRole('button', { name: /Excluir/ }))

    expect(screen.getByRole('heading', { name: 'Excluir fazenda' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Excluir' }))

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/api/fazendas/f1')
    })
    expect(toastSuccess).toHaveBeenCalledWith('Fazenda excluída.')
  })

  it('exibe erro de conflito ao excluir fazenda vinculada', async () => {
    mockList([makeFazenda()])
    vi.mocked(api.delete).mockRejectedValue(new ApiError('conflict', 'conflito', 409))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<FazendasPage />)

    await screen.findByText('Fazenda Boa Vista')
    await user.click(screen.getByRole('button', { name: /Excluir/ }))
    await user.click(screen.getByRole('button', { name: 'Excluir' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Fazenda possui registros vinculados.')
    })
  })

  it('exibe erro genérico ao falhar a exclusão', async () => {
    mockList([makeFazenda()])
    vi.mocked(api.delete).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<FazendasPage />)

    await screen.findByText('Fazenda Boa Vista')
    await user.click(screen.getByRole('button', { name: /Excluir/ }))
    await user.click(screen.getByRole('button', { name: 'Excluir' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Não foi possível excluir a fazenda.')
    })
  })

  it('filtra fazendas pela busca', async () => {
    mockList([
      makeFazenda({ id: 'f1', nome: 'Alpha' }),
      makeFazenda({ id: 'f2', nome: 'Beta' }),
    ])
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<FazendasPage />)

    await screen.findByText('Alpha')
    await user.type(screen.getByLabelText('Buscar fazendas'), 'beta')

    expect(screen.queryByText('Alpha')).not.toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
  })

  it('usa defaults de paginação quando a resposta omite os metadados', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { fazendas: [makeFazenda()] } })
    renderWithProviders(<FazendasPage />)

    await screen.findByText('Fazenda Boa Vista')
    expect(screen.getByText(/Página 1 de 1 · 0 fazendas/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled()
  })

  it('filtra por município e CAR ignorando registros sem esses campos', async () => {
    mockList([
      makeFazenda({ id: 'f1', nome: 'Alpha', municipio: 'Lucas', car: 'CAR-1' }),
      makeFazenda({ id: 'f2', nome: 'Beta', municipio: null, car: null }),
    ])
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<FazendasPage />)

    await screen.findByText('Alpha')
    await user.type(screen.getByLabelText('Buscar fazendas'), 'lucas')

    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.queryByText('Beta')).not.toBeInTheDocument()
  })

  it('renderiza município sem UF quando só a UF é nula e mostra UF sem município', async () => {
    mockList([makeFazenda({ id: 'f1', municipio: null, uf: 'MT' })])
    renderWithProviders(<FazendasPage />)

    expect(await screen.findByText('— / MT')).toBeInTheDocument()
  })

  it('limpa a seleção ao fechar o diálogo de exclusão', async () => {
    mockList([makeFazenda()])
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<FazendasPage />)

    await screen.findByText('Fazenda Boa Vista')
    await user.click(screen.getByRole('button', { name: /Excluir/ }))
    expect(screen.getByRole('heading', { name: 'Excluir fazenda' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Excluir fazenda' })).not.toBeInTheDocument()
    })
  })

  it('navega entre páginas com Anterior/Próxima', async () => {
    vi.mocked(api.get).mockImplementation((_url: string, config?: { params?: { page?: number } }) => {
      const page = config?.params?.page ?? 1
      const fazendas = page === 1 ? [makeFazenda({ id: 'f1', nome: 'Primeira' })] : [makeFazenda({ id: 'f2', nome: 'Segunda' })]
      return Promise.resolve({ data: { fazendas, total: 2, page, perPage: 20, totalPages: 2 } })
    })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<FazendasPage />)

    await screen.findByText('Primeira')
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Próxima' }))
    expect(await screen.findByText('Segunda')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Anterior' }))
    expect(await screen.findByText('Primeira')).toBeInTheDocument()
  })
})
