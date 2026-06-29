import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AreasPage } from './areas-page'

import type { Area } from '@/features/admin/api/areas-api'

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

vi.mock('@/features/admin/api/fazendas-api', () => ({
  useFazendas: () => ({
    data: { fazendas: [{ id: 'f1', nome: 'Fazenda Boa Vista' }] },
  }),
}))

function selectFazenda(value: string): void {
  fireEvent.change(document.querySelector<HTMLSelectElement>('select[name="fazendaId"]')!, {
    target: { value },
  })
}

const ALL_PERMS = ['area:read', 'area:create', 'area:update', 'area:delete']

function makeArea(overrides: Partial<Area> = {}): Area {
  return {
    id: 'a1',
    tenantId: 't1',
    fazendaId: 'f1',
    identificacao: 'Talhão 1',
    tamanho: 50,
    unidadeTamanho: 'ha',
    rotulo: 'Soja',
    geometria: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function mockList(areas: Area[], extra: Record<string, number> = {}) {
  vi.mocked(api.get).mockResolvedValue({
    data: { areas, total: areas.length, page: 1, perPage: 20, totalPages: 1, ...extra },
  })
}

describe('AreasPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthMock.mockReturnValue({ user: { permissions: ALL_PERMS } })
  })

  it('exibe estado de carregamento', () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => undefined))
    renderWithProviders(<AreasPage />)
    expect(screen.getByText('Carregando áreas…')).toBeInTheDocument()
  })

  it('exibe erro e permite tentar novamente', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<AreasPage />)

    expect(await screen.findByText('Erro ao carregar áreas.')).toBeInTheDocument()

    mockList([makeArea()])
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText('Talhão 1')).toBeInTheDocument()
  })

  it('lista áreas com rótulo e tamanho formatado', async () => {
    mockList([makeArea()])
    renderWithProviders(<AreasPage />)

    expect(await screen.findByText('Talhão 1')).toBeInTheDocument()
    expect(screen.getByText('Soja')).toBeInTheDocument()
    expect(screen.getByText('50 ha')).toBeInTheDocument()
  })

  it('exibe traços quando rótulo e tamanho são nulos', async () => {
    mockList([makeArea({ rotulo: null, tamanho: null })])
    renderWithProviders(<AreasPage />)

    await screen.findByText('Talhão 1')
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('oculta ações sem permissão', async () => {
    useAuthMock.mockReturnValue({ user: { permissions: ['area:read'] } })
    mockList([makeArea()])
    renderWithProviders(<AreasPage />)

    await screen.findByText('Talhão 1')
    expect(screen.queryByRole('button', { name: /Editar/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Nova área/ })).not.toBeInTheDocument()
  })

  it('cria uma área com sucesso', async () => {
    mockList([])
    vi.mocked(api.post).mockResolvedValue({ data: { area: makeArea() } })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<AreasPage />)

    await screen.findByText('Nenhum registro encontrado.')
    await user.click(screen.getByRole('button', { name: /Nova área/ }))
    selectFazenda('f1')
    await user.type(screen.getByLabelText('Identificação'), 'Talhão Z')
    await user.click(screen.getByRole('button', { name: 'Criar área' }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/areas', expect.objectContaining({ identificacao: 'Talhão Z' }))
    })
    expect(toastSuccess).toHaveBeenCalledWith('Área criada com sucesso.')
  })

  it('exibe toast de erro quando a criação falha', async () => {
    mockList([])
    vi.mocked(api.post).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<AreasPage />)

    await screen.findByText('Nenhum registro encontrado.')
    await user.click(screen.getByRole('button', { name: /Nova área/ }))
    selectFazenda('f1')
    await user.type(screen.getByLabelText('Identificação'), 'Talhão Z')
    await user.click(screen.getByRole('button', { name: 'Criar área' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Não foi possível salvar a área.')
    })
  })

  it('edita uma área sem enviar o fazendaId', async () => {
    mockList([makeArea()])
    vi.mocked(api.patch).mockResolvedValue({ data: { area: makeArea() } })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<AreasPage />)

    await screen.findByText('Talhão 1')
    await user.click(screen.getByRole('button', { name: /Editar/ }))
    await user.clear(screen.getByLabelText('Identificação'))
    await user.type(screen.getByLabelText('Identificação'), 'Talhão Editado')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith(
        '/api/areas/a1',
        expect.objectContaining({ identificacao: 'Talhão Editado' }),
      )
    })
    const body = vi.mocked(api.patch).mock.calls[0]![1] as Record<string, unknown>
    expect(body).not.toHaveProperty('fazendaId')
    expect(toastSuccess).toHaveBeenCalledWith('Área atualizada com sucesso.')
  })

  it('exibe toast de erro quando a edição falha', async () => {
    mockList([makeArea()])
    vi.mocked(api.patch).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<AreasPage />)

    await screen.findByText('Talhão 1')
    await user.click(screen.getByRole('button', { name: /Editar/ }))
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Não foi possível salvar a área.')
    })
  })

  it('exclui uma área', async () => {
    mockList([makeArea()])
    vi.mocked(api.delete).mockResolvedValue({ data: { area: makeArea() } })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<AreasPage />)

    await screen.findByText('Talhão 1')
    await user.click(screen.getByRole('button', { name: /Excluir/ }))
    await user.click(screen.getByRole('button', { name: 'Excluir' }))

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/api/areas/a1')
    })
    expect(toastSuccess).toHaveBeenCalledWith('Área excluída.')
  })

  it('exibe erro de conflito ao excluir área vinculada', async () => {
    mockList([makeArea()])
    vi.mocked(api.delete).mockRejectedValue(new ApiError('conflict', 'conflito', 409))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<AreasPage />)

    await screen.findByText('Talhão 1')
    await user.click(screen.getByRole('button', { name: /Excluir/ }))
    await user.click(screen.getByRole('button', { name: 'Excluir' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Área possui registros vinculados.')
    })
  })

  it('exibe erro genérico ao falhar a exclusão', async () => {
    mockList([makeArea()])
    vi.mocked(api.delete).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<AreasPage />)

    await screen.findByText('Talhão 1')
    await user.click(screen.getByRole('button', { name: /Excluir/ }))
    await user.click(screen.getByRole('button', { name: 'Excluir' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Não foi possível excluir a área.')
    })
  })

  it('filtra áreas pela busca', async () => {
    mockList([
      makeArea({ id: 'a1', identificacao: 'Alpha' }),
      makeArea({ id: 'a2', identificacao: 'Beta' }),
    ])
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<AreasPage />)

    await screen.findByText('Alpha')
    await user.type(screen.getByLabelText('Buscar áreas'), 'beta')

    expect(screen.queryByText('Alpha')).not.toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
  })

  it('navega entre páginas', async () => {
    vi.mocked(api.get).mockImplementation((_url: string, config?: { params?: { page?: number } }) => {
      const page = config?.params?.page ?? 1
      const areas = page === 1 ? [makeArea({ id: 'a1', identificacao: 'Primeira' })] : [makeArea({ id: 'a2', identificacao: 'Segunda' })]
      return Promise.resolve({ data: { areas, total: 2, page, perPage: 20, totalPages: 2 } })
    })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<AreasPage />)

    await screen.findByText('Primeira')
    await user.click(screen.getByRole('button', { name: 'Próxima' }))
    expect(await screen.findByText('Segunda')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Anterior' }))
    expect(await screen.findByText('Primeira')).toBeInTheDocument()
  })

  it('usa defaults de paginação quando a resposta omite os metadados', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { areas: [makeArea()] } })
    renderWithProviders(<AreasPage />)

    await screen.findByText('Talhão 1')
    expect(screen.getByText(/Página 1 de 1 · 0 áreas/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled()
  })

  it('filtra pelo rótulo ignorando áreas sem rótulo', async () => {
    mockList([
      makeArea({ id: 'a1', identificacao: 'Alpha', rotulo: 'Milho' }),
      makeArea({ id: 'a2', identificacao: 'Beta', rotulo: null }),
    ])
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<AreasPage />)

    await screen.findByText('Alpha')
    await user.type(screen.getByLabelText('Buscar áreas'), 'milho')

    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.queryByText('Beta')).not.toBeInTheDocument()
  })

  it('exibe o tamanho sem unidade quando a unidade é nula', async () => {
    mockList([makeArea({ tamanho: 50, unidadeTamanho: null })])
    renderWithProviders(<AreasPage />)

    expect(await screen.findByText('50')).toBeInTheDocument()
  })

  it('cancela a exclusão e limpa a seleção', async () => {
    mockList([makeArea()])
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<AreasPage />)

    await screen.findByText('Talhão 1')
    await user.click(screen.getByRole('button', { name: /Excluir/ }))
    expect(screen.getByRole('heading', { name: 'Excluir área' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Excluir área' })).not.toBeInTheDocument()
    })
  })
})
