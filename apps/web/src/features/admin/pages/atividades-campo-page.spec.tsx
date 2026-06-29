import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AtividadesCampoPage } from './atividades-campo-page'

import type { AtividadeCampo } from '@/features/admin/api/atividades-campo-api'

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

const ALL_PERMS = ['atividade:read', 'atividade:create', 'atividade:delete']

function makeAtividade(overrides: Partial<AtividadeCampo> = {}): AtividadeCampo {
  return {
    id: 'at1',
    tenantId: 't1',
    safraId: 's1',
    areaId: 'a1',
    tipo: 'plantio',
    data: '2026-01-10T00:00:00.000Z',
    responsavelUsuarioId: null,
    observacoes: 'Plantio inicial',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function mockList(atividades: AtividadeCampo[], extra: Record<string, number> = {}) {
  vi.mocked(api.get).mockResolvedValue({
    data: { atividades, total: atividades.length, page: 1, perPage: 20, totalPages: 1, ...extra },
  })
}

describe('AtividadesCampoPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthMock.mockReturnValue({ user: { permissions: ALL_PERMS } })
  })

  it('exibe estado de carregamento', () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => undefined))
    renderWithProviders(<AtividadesCampoPage />)
    expect(screen.getByText('Carregando atividades…')).toBeInTheDocument()
  })

  it('exibe erro e permite tentar novamente', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<AtividadesCampoPage />)

    expect(await screen.findByText('Erro ao carregar atividades.')).toBeInTheDocument()

    mockList([makeAtividade()])
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText('Plantio')).toBeInTheDocument()
  })

  it('lista atividades com tipo e observações', async () => {
    mockList([makeAtividade()])
    renderWithProviders(<AtividadesCampoPage />)

    expect(await screen.findByText('Plantio')).toBeInTheDocument()
    expect(screen.getByText('Plantio inicial')).toBeInTheDocument()
  })

  it('exibe traço quando observações é nulo', async () => {
    mockList([makeAtividade({ observacoes: null })])
    renderWithProviders(<AtividadesCampoPage />)

    await screen.findByText('Plantio')
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('oculta ações quando o usuário não tem permissão', async () => {
    useAuthMock.mockReturnValue({ user: { permissions: ['atividade:read'] } })
    mockList([makeAtividade()])
    renderWithProviders(<AtividadesCampoPage />)

    await screen.findByText('Plantio')
    expect(screen.queryByRole('button', { name: /Excluir/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Nova atividade/ })).not.toBeInTheDocument()
  })

  it('cria uma atividade com sucesso', async () => {
    mockList([])
    vi.mocked(api.post).mockResolvedValue({ data: { atividade: makeAtividade() } })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<AtividadesCampoPage />)

    await screen.findByText('Nenhum registro encontrado.')
    await user.click(screen.getByRole('button', { name: /Nova atividade/ }))

    await user.type(screen.getByLabelText('Data'), '2026-02-01')
    await user.click(screen.getByRole('button', { name: 'Criar atividade' }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/api/atividades-campo',
        expect.objectContaining({ tipo: 'plantio', data: '2026-02-01' }),
      )
    })
    expect(toastSuccess).toHaveBeenCalledWith('Atividade criada com sucesso.')
  })

  it('exibe toast de erro quando a criação falha', async () => {
    mockList([])
    vi.mocked(api.post).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<AtividadesCampoPage />)

    await screen.findByText('Nenhum registro encontrado.')
    await user.click(screen.getByRole('button', { name: /Nova atividade/ }))
    await user.type(screen.getByLabelText('Data'), '2026-02-01')
    await user.click(screen.getByRole('button', { name: 'Criar atividade' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Não foi possível salvar a atividade.')
    })
  })

  it('exclui uma atividade', async () => {
    mockList([makeAtividade()])
    vi.mocked(api.delete).mockResolvedValue({ data: { atividade: makeAtividade() } })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<AtividadesCampoPage />)

    await screen.findByText('Plantio')
    await user.click(screen.getByRole('button', { name: /Excluir/ }))

    expect(screen.getByRole('heading', { name: 'Excluir atividade' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Excluir' }))

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/api/atividades-campo/at1')
    })
    expect(toastSuccess).toHaveBeenCalledWith('Atividade excluída.')
  })

  it('cancela a exclusão e fecha o diálogo', async () => {
    mockList([makeAtividade()])
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<AtividadesCampoPage />)

    await screen.findByText('Plantio')
    await user.click(screen.getByRole('button', { name: /Excluir/ }))
    expect(screen.getByRole('heading', { name: 'Excluir atividade' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Excluir atividade' })).not.toBeInTheDocument()
    })
  })

  it('exibe erro de conflito ao excluir atividade vinculada', async () => {
    mockList([makeAtividade()])
    vi.mocked(api.delete).mockRejectedValue(new ApiError('conflict', 'conflito', 409))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<AtividadesCampoPage />)

    await screen.findByText('Plantio')
    await user.click(screen.getByRole('button', { name: /Excluir/ }))
    await user.click(screen.getByRole('button', { name: 'Excluir' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Atividade possui registros vinculados.')
    })
  })

  it('exibe erro genérico ao falhar a exclusão', async () => {
    mockList([makeAtividade()])
    vi.mocked(api.delete).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<AtividadesCampoPage />)

    await screen.findByText('Plantio')
    await user.click(screen.getByRole('button', { name: /Excluir/ }))
    await user.click(screen.getByRole('button', { name: 'Excluir' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Não foi possível excluir a atividade.')
    })
  })

  it('filtra atividades pela busca', async () => {
    mockList([
      makeAtividade({ id: 'at1', tipo: 'plantio', observacoes: 'Alpha' }),
      makeAtividade({ id: 'at2', tipo: 'irrigacao', observacoes: 'Beta' }),
    ])
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<AtividadesCampoPage />)

    await screen.findByText('Alpha')
    await user.type(screen.getByLabelText('Buscar atividades'), 'irrigação')

    expect(screen.queryByText('Alpha')).not.toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
  })

  it('navega entre páginas com Anterior/Próxima', async () => {
    vi.mocked(api.get).mockImplementation(
      (_url: string, config?: { params?: { page?: number } }) => {
        const page = config?.params?.page ?? 1
        const atividades =
          page === 1
            ? [makeAtividade({ id: 'at1', observacoes: 'Primeira' })]
            : [makeAtividade({ id: 'at2', observacoes: 'Segunda' })]
        return Promise.resolve({ data: { atividades, total: 2, page, perPage: 20, totalPages: 2 } })
      },
    )
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<AtividadesCampoPage />)

    await screen.findByText('Primeira')
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Próxima' }))
    expect(await screen.findByText('Segunda')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Anterior' }))
    expect(await screen.findByText('Primeira')).toBeInTheDocument()
  })

  it('usa defaults de paginação quando a resposta omite os metadados', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { atividades: [makeAtividade()] } })
    renderWithProviders(<AtividadesCampoPage />)

    await screen.findByText('Plantio')
    expect(screen.getByText(/Página 1 de 1 · 0 atividades/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled()
  })

  it('filtra ignorando atividades sem observações', async () => {
    mockList([
      makeAtividade({ id: 'at1', tipo: 'plantio', observacoes: 'Alpha' }),
      makeAtividade({ id: 'at2', tipo: 'irrigacao', observacoes: null }),
    ])
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<AtividadesCampoPage />)

    await screen.findByText('Alpha')
    await user.type(screen.getByLabelText('Buscar atividades'), 'alpha')

    expect(screen.getByText('Alpha')).toBeInTheDocument()
  })
})
