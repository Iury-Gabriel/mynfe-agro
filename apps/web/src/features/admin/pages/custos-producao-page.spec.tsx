import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CustosProducaoPage } from './custos-producao-page'

import type { CustoProducao } from '@/features/admin/api/custos-producao-api'

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
  api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}))

const useAuthMock = vi.fn<() => { user: { permissions: string[] } }>()
vi.mock('@/providers/auth-context', () => ({
  useAuth: () => useAuthMock(),
}))

const ALL_PERMS = ['custo:read', 'custo:create', 'custo:delete']

function makeCusto(overrides: Partial<CustoProducao> = {}): CustoProducao {
  return {
    id: 'cu1',
    tenantId: 't1',
    safraId: 's1',
    areaId: null,
    tipo: 'insumo',
    descricao: 'Sementes de soja',
    valor: 1500,
    data: '2026-01-10T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function mockList(custos: CustoProducao[], extra: Record<string, number> = {}) {
  vi.mocked(api.get).mockResolvedValue({
    data: { custos, total: custos.length, page: 1, perPage: 20, totalPages: 1, ...extra },
  })
}

describe('CustosProducaoPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthMock.mockReturnValue({ user: { permissions: ALL_PERMS } })
  })

  it('exibe estado de carregamento', () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => undefined))
    renderWithProviders(<CustosProducaoPage />)
    expect(screen.getByText('Carregando custos…')).toBeInTheDocument()
  })

  it('exibe erro e permite tentar novamente', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<CustosProducaoPage />)

    expect(await screen.findByText('Erro ao carregar custos.')).toBeInTheDocument()

    mockList([makeCusto()])
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText('Sementes de soja')).toBeInTheDocument()
  })

  it('lista custos com descrição, tipo e valor', async () => {
    mockList([makeCusto()])
    renderWithProviders(<CustosProducaoPage />)

    expect(await screen.findByText('Sementes de soja')).toBeInTheDocument()
    expect(screen.getByText('Insumo')).toBeInTheDocument()
    expect(screen.getByText(/1\.500/)).toBeInTheDocument()
  })

  it('oculta ações quando o usuário não tem permissão', async () => {
    useAuthMock.mockReturnValue({ user: { permissions: ['custo:read'] } })
    mockList([makeCusto()])
    renderWithProviders(<CustosProducaoPage />)

    await screen.findByText('Sementes de soja')
    expect(screen.queryByRole('button', { name: /Excluir/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Novo custo/ })).not.toBeInTheDocument()
  })

  it('cria um custo com sucesso', async () => {
    mockList([])
    vi.mocked(api.post).mockResolvedValue({ data: { custo: makeCusto() } })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<CustosProducaoPage />)

    await screen.findByText('Nenhum registro encontrado.')
    await user.click(screen.getByRole('button', { name: /Novo custo/ }))

    await user.type(screen.getByLabelText('Descrição'), 'Adubo')
    await user.type(screen.getByLabelText('Valor'), '200')
    await user.type(screen.getByLabelText('Data'), '2026-02-01')
    await user.click(screen.getByRole('button', { name: 'Criar custo' }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/api/custos-producao',
        expect.objectContaining({ descricao: 'Adubo', valor: 200, tipo: 'insumo' }),
      )
    })
    expect(toastSuccess).toHaveBeenCalledWith('Custo criado com sucesso.')
  })

  it('exibe toast de erro quando a criação falha', async () => {
    mockList([])
    vi.mocked(api.post).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<CustosProducaoPage />)

    await screen.findByText('Nenhum registro encontrado.')
    await user.click(screen.getByRole('button', { name: /Novo custo/ }))
    await user.type(screen.getByLabelText('Descrição'), 'Adubo')
    await user.type(screen.getByLabelText('Valor'), '200')
    await user.type(screen.getByLabelText('Data'), '2026-02-01')
    await user.click(screen.getByRole('button', { name: 'Criar custo' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Não foi possível salvar o custo.')
    })
  })

  it('exclui um custo', async () => {
    mockList([makeCusto()])
    vi.mocked(api.delete).mockResolvedValue({ data: { custo: makeCusto() } })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<CustosProducaoPage />)

    await screen.findByText('Sementes de soja')
    await user.click(screen.getByRole('button', { name: /Excluir/ }))

    expect(screen.getByRole('heading', { name: 'Excluir custo' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Excluir' }))

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/api/custos-producao/cu1')
    })
    expect(toastSuccess).toHaveBeenCalledWith('Custo excluído.')
  })

  it('cancela a exclusão e fecha o diálogo', async () => {
    mockList([makeCusto()])
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<CustosProducaoPage />)

    await screen.findByText('Sementes de soja')
    await user.click(screen.getByRole('button', { name: /Excluir/ }))
    expect(screen.getByRole('heading', { name: 'Excluir custo' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Excluir custo' })).not.toBeInTheDocument()
    })
  })

  it('exibe erro de conflito ao excluir custo vinculado', async () => {
    mockList([makeCusto()])
    vi.mocked(api.delete).mockRejectedValue(new ApiError('conflict', 'conflito', 409))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<CustosProducaoPage />)

    await screen.findByText('Sementes de soja')
    await user.click(screen.getByRole('button', { name: /Excluir/ }))
    await user.click(screen.getByRole('button', { name: 'Excluir' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Custo possui registros vinculados.')
    })
  })

  it('exibe erro genérico ao falhar a exclusão', async () => {
    mockList([makeCusto()])
    vi.mocked(api.delete).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<CustosProducaoPage />)

    await screen.findByText('Sementes de soja')
    await user.click(screen.getByRole('button', { name: /Excluir/ }))
    await user.click(screen.getByRole('button', { name: 'Excluir' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Não foi possível excluir o custo.')
    })
  })

  it('filtra custos pela busca', async () => {
    mockList([
      makeCusto({ id: 'cu1', descricao: 'Alpha' }),
      makeCusto({ id: 'cu2', descricao: 'Beta' }),
    ])
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<CustosProducaoPage />)

    await screen.findByText('Alpha')
    await user.type(screen.getByLabelText('Buscar custos'), 'beta')

    expect(screen.queryByText('Alpha')).not.toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
  })

  it('navega entre páginas com Anterior/Próxima', async () => {
    vi.mocked(api.get).mockImplementation(
      (_url: string, config?: { params?: { page?: number } }) => {
        const page = config?.params?.page ?? 1
        const custos =
          page === 1
            ? [makeCusto({ id: 'cu1', descricao: 'Primeira' })]
            : [makeCusto({ id: 'cu2', descricao: 'Segunda' })]
        return Promise.resolve({ data: { custos, total: 2, page, perPage: 20, totalPages: 2 } })
      },
    )
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<CustosProducaoPage />)

    await screen.findByText('Primeira')
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Próxima' }))
    expect(await screen.findByText('Segunda')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Anterior' }))
    expect(await screen.findByText('Primeira')).toBeInTheDocument()
  })
})
