import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SafrasPage } from './safras-page'

import type { Safra } from '@/features/admin/api/safras-api'

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

const ALL_PERMS = ['safra:read', 'safra:create', 'safra:update', 'safra:delete']

function makeSafra(overrides: Partial<Safra> = {}): Safra {
  return {
    id: 's1',
    tenantId: 't1',
    areaId: 'a1',
    cultura: 'Soja',
    variedade: 'TMG 7062',
    dataPlantio: '2026-01-10T00:00:00.000Z',
    dataColheitaPrevista: '2026-05-10T00:00:00.000Z',
    dataColheitaRealizada: null,
    estimativaProducao: 3000,
    status: 'em_andamento',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function mockList(safras: Safra[], extra: Record<string, number> = {}) {
  vi.mocked(api.get).mockResolvedValue({
    data: { safras, total: safras.length, page: 1, perPage: 20, totalPages: 1, ...extra },
  })
}

describe('SafrasPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthMock.mockReturnValue({ user: { permissions: ALL_PERMS } })
  })

  it('exibe estado de carregamento', () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => undefined))
    renderWithProviders(<SafrasPage />)
    expect(screen.getByText('Carregando safras…')).toBeInTheDocument()
  })

  it('exibe erro e permite tentar novamente', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<SafrasPage />)

    expect(await screen.findByText('Erro ao carregar safras.')).toBeInTheDocument()

    mockList([makeSafra()])
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText('Soja')).toBeInTheDocument()
  })

  it('lista safras com cultura, variedade, status e plantio', async () => {
    mockList([makeSafra()])
    renderWithProviders(<SafrasPage />)

    expect(await screen.findByText('Soja')).toBeInTheDocument()
    expect(screen.getByText('TMG 7062')).toBeInTheDocument()
    expect(screen.getByText('Em andamento')).toBeInTheDocument()
  })

  it('exibe traços quando campos opcionais são nulos', async () => {
    mockList([makeSafra({ variedade: null, dataPlantio: null, status: 'planejado' })])
    renderWithProviders(<SafrasPage />)

    await screen.findByText('Soja')
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
    expect(screen.getByText('Planejado')).toBeInTheDocument()
  })

  it('exibe o status colhido', async () => {
    mockList([makeSafra({ status: 'colhido' })])
    renderWithProviders(<SafrasPage />)

    expect(await screen.findByText('Colhido')).toBeInTheDocument()
  })

  it('oculta ações quando o usuário não tem permissão', async () => {
    useAuthMock.mockReturnValue({ user: { permissions: ['safra:read'] } })
    mockList([makeSafra()])
    renderWithProviders(<SafrasPage />)

    await screen.findByText('Soja')
    expect(screen.queryByRole('button', { name: /Editar/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Excluir/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Nova safra/ })).not.toBeInTheDocument()
  })

  it('cria uma safra com sucesso', async () => {
    mockList([])
    vi.mocked(api.post).mockResolvedValue({ data: { safra: makeSafra() } })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<SafrasPage />)

    await screen.findByText('Nenhum registro encontrado.')
    await user.click(screen.getByRole('button', { name: /Nova safra/ }))

    await user.type(screen.getByLabelText('Área'), 'a1')
    await user.type(screen.getByLabelText('Cultura'), 'Milho')
    await user.click(screen.getByRole('button', { name: 'Criar safra' }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/api/safras',
        expect.objectContaining({ cultura: 'Milho', status: 'planejado' }),
      )
    })
    expect(toastSuccess).toHaveBeenCalledWith('Safra criada com sucesso.')
  })

  it('exibe toast de erro quando a criação falha', async () => {
    mockList([])
    vi.mocked(api.post).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<SafrasPage />)

    await screen.findByText('Nenhum registro encontrado.')
    await user.click(screen.getByRole('button', { name: /Nova safra/ }))
    await user.type(screen.getByLabelText('Área'), 'a1')
    await user.type(screen.getByLabelText('Cultura'), 'Milho')
    await user.click(screen.getByRole('button', { name: 'Criar safra' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Não foi possível salvar a safra.')
    })
  })

  it('edita uma safra existente sem enviar o areaId', async () => {
    mockList([makeSafra()])
    vi.mocked(api.patch).mockResolvedValue({ data: { safra: makeSafra() } })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<SafrasPage />)

    await screen.findByText('Soja')
    await user.click(screen.getByRole('button', { name: /Editar/ }))

    expect(screen.getByRole('heading', { name: 'Editar safra' })).toBeInTheDocument()
    await user.clear(screen.getByLabelText('Cultura'))
    await user.type(screen.getByLabelText('Cultura'), 'Algodão')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith(
        '/api/safras/s1',
        expect.objectContaining({ cultura: 'Algodão' }),
      )
    })
    const body = vi.mocked(api.patch).mock.calls[0][1] as Record<string, unknown>
    expect(body).not.toHaveProperty('areaId')
    expect(toastSuccess).toHaveBeenCalledWith('Safra atualizada com sucesso.')
  })

  it('exibe toast de erro quando a edição falha', async () => {
    mockList([makeSafra()])
    vi.mocked(api.patch).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<SafrasPage />)

    await screen.findByText('Soja')
    await user.click(screen.getByRole('button', { name: /Editar/ }))
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Não foi possível salvar a safra.')
    })
  })

  it('exclui uma safra', async () => {
    mockList([makeSafra()])
    vi.mocked(api.delete).mockResolvedValue({ data: { safra: makeSafra() } })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<SafrasPage />)

    await screen.findByText('Soja')
    await user.click(screen.getByRole('button', { name: /Excluir/ }))

    expect(screen.getByRole('heading', { name: 'Excluir safra' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Excluir' }))

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/api/safras/s1')
    })
    expect(toastSuccess).toHaveBeenCalledWith('Safra excluída.')
  })

  it('cancela a exclusão e fecha o diálogo', async () => {
    mockList([makeSafra()])
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<SafrasPage />)

    await screen.findByText('Soja')
    await user.click(screen.getByRole('button', { name: /Excluir/ }))
    expect(screen.getByRole('heading', { name: 'Excluir safra' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Excluir safra' })).not.toBeInTheDocument()
    })
  })

  it('exibe erro de conflito ao excluir safra vinculada', async () => {
    mockList([makeSafra()])
    vi.mocked(api.delete).mockRejectedValue(new ApiError('conflict', 'conflito', 409))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<SafrasPage />)

    await screen.findByText('Soja')
    await user.click(screen.getByRole('button', { name: /Excluir/ }))
    await user.click(screen.getByRole('button', { name: 'Excluir' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Safra possui registros vinculados.')
    })
  })

  it('exibe erro genérico ao falhar a exclusão', async () => {
    mockList([makeSafra()])
    vi.mocked(api.delete).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<SafrasPage />)

    await screen.findByText('Soja')
    await user.click(screen.getByRole('button', { name: /Excluir/ }))
    await user.click(screen.getByRole('button', { name: 'Excluir' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Não foi possível excluir a safra.')
    })
  })

  it('filtra safras pela busca', async () => {
    mockList([
      makeSafra({ id: 's1', cultura: 'Soja' }),
      makeSafra({ id: 's2', cultura: 'Milho' }),
    ])
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<SafrasPage />)

    await screen.findByText('Soja')
    await user.type(screen.getByLabelText('Buscar safras'), 'milho')

    expect(screen.queryByText('Soja')).not.toBeInTheDocument()
    expect(screen.getByText('Milho')).toBeInTheDocument()
  })

  it('navega entre páginas com Anterior/Próxima', async () => {
    vi.mocked(api.get).mockImplementation(
      (_url: string, config?: { params?: { page?: number } }) => {
        const page = config?.params?.page ?? 1
        const safras =
          page === 1
            ? [makeSafra({ id: 's1', cultura: 'Primeira' })]
            : [makeSafra({ id: 's2', cultura: 'Segunda' })]
        return Promise.resolve({ data: { safras, total: 2, page, perPage: 20, totalPages: 2 } })
      },
    )
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<SafrasPage />)

    await screen.findByText('Primeira')
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Próxima' }))
    expect(await screen.findByText('Segunda')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Anterior' }))
    expect(await screen.findByText('Primeira')).toBeInTheDocument()
  })
})
