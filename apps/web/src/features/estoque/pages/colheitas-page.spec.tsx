import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ColheitasPage } from './colheitas-page'

import { api } from '@/lib/api-client'
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
  api: { get: vi.fn(), post: vi.fn() },
}))

const useAuthMock = vi.fn<() => { user: { permissions: string[] } }>()
vi.mock('@/providers/auth-context', () => ({
  useAuth: () => useAuthMock(),
}))

let activeEmpresaId: string | null = 'e1'
vi.mock('@/stores/active-empresa-store', () => ({
  useActiveEmpresaStore: (selector: (s: { activeEmpresaId: string | null }) => unknown) =>
    selector({ activeEmpresaId }),
}))

const ALL_PERMS = ['colheita:read', 'colheita:create', 'embalagem:create']

function mockList(colheitas: unknown[]) {
  vi.mocked(api.get).mockResolvedValue({
    data: { colheitas, total: colheitas.length, page: 1, perPage: 20, totalPages: 1 },
  })
}

function makeColheita(overrides: Record<string, unknown> = {}) {
  return {
    id: 'c1',
    tenantId: 't1',
    empresaId: 'e1',
    produtoId: 'Alface',
    safraId: 'Safra 2026',
    areaId: 'Talhão A1',
    quantidade: 420,
    data: '2026-06-12T00:00:00.000Z',
    responsavelUsuarioId: null,
    createdAt: '2026-06-12T00:00:00.000Z',
    updatedAt: '2026-06-12T00:00:00.000Z',
    ...overrides,
  }
}

describe('ColheitasPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    activeEmpresaId = 'e1'
    useAuthMock.mockReturnValue({ user: { permissions: ALL_PERMS } })
  })

  it('exibe gate quando não há empresa ativa', () => {
    activeEmpresaId = null
    renderWithProviders(<ColheitasPage />)
    expect(
      screen.getByText('Selecione uma empresa ativa para visualizar os dados.'),
    ).toBeInTheDocument()
  })

  it('exibe carregamento', () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => undefined))
    renderWithProviders(<ColheitasPage />)
    expect(screen.getByText('Carregando colheitas…')).toBeInTheDocument()
  })

  it('exibe erro e permite tentar novamente', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<ColheitasPage />)

    expect(await screen.findByText('Erro ao carregar colheitas.')).toBeInTheDocument()
    mockList([makeColheita()])
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText('Alface')).toBeInTheDocument()
  })

  it('lista colheitas com data, produto e safra', async () => {
    mockList([makeColheita()])
    renderWithProviders(<ColheitasPage />)

    expect(await screen.findByText('Alface')).toBeInTheDocument()
    expect(screen.getByText('Safra 2026')).toBeInTheDocument()
    expect(screen.getByText('Talhão A1')).toBeInTheDocument()
  })

  it('exibe traços para campos opcionais nulos', async () => {
    mockList([makeColheita({ safraId: null, areaId: null })])
    renderWithProviders(<ColheitasPage />)

    await screen.findByText('Alface')
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('oculta botões quando o usuário não tem permissão', async () => {
    useAuthMock.mockReturnValue({ user: { permissions: ['colheita:read'] } })
    mockList([])
    renderWithProviders(<ColheitasPage />)

    await screen.findByText('Nenhum registro encontrado.')
    expect(screen.queryByRole('button', { name: /Registrar colheita/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Registrar embalagem/ })).not.toBeInTheDocument()
  })

  it('registra colheita com sucesso', async () => {
    mockList([])
    vi.mocked(api.post).mockResolvedValue({ data: { colheita: makeColheita(), lote: { id: 'l1' } } })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<ColheitasPage />)

    await screen.findByText('Nenhum registro encontrado.')
    await user.click(screen.getByRole('button', { name: /Registrar colheita/ }))

    await user.type(screen.getByLabelText('Produto'), 'p1')
    await user.type(screen.getByLabelText('Quantidade'), '10')
    await user.click(screen.getByRole('button', { name: 'Registrar colheita' }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/api/colheitas',
        expect.objectContaining({ produtoId: 'p1', quantidade: 10, empresaId: 'e1' }),
      )
    })
    expect(toastSuccess).toHaveBeenCalledWith('Colheita registrada com sucesso.')
  })

  it('exibe toast de erro quando a colheita falha', async () => {
    mockList([])
    vi.mocked(api.post).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<ColheitasPage />)

    await screen.findByText('Nenhum registro encontrado.')
    await user.click(screen.getByRole('button', { name: /Registrar colheita/ }))
    await user.type(screen.getByLabelText('Produto'), 'p1')
    await user.type(screen.getByLabelText('Quantidade'), '10')
    await user.click(screen.getByRole('button', { name: 'Registrar colheita' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Não foi possível registrar a colheita.')
    })
  })

  it('registra embalagem com sucesso', async () => {
    mockList([])
    vi.mocked(api.post).mockResolvedValue({ data: { lote: { id: 'l1' }, movimento: {} } })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<ColheitasPage />)

    await screen.findByText('Nenhum registro encontrado.')
    await user.click(screen.getByRole('button', { name: /Registrar embalagem/ }))

    await user.type(screen.getByLabelText('Produto'), 'p1')
    await user.type(screen.getByLabelText('Quantidade'), '5')
    await user.click(screen.getByRole('button', { name: 'Registrar embalagem' }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/api/embalagens',
        expect.objectContaining({ produtoId: 'p1', quantidade: 5 }),
      )
    })
    expect(toastSuccess).toHaveBeenCalledWith('Embalagem registrada com sucesso.')
  })

  it('exibe toast de erro quando a embalagem falha', async () => {
    mockList([])
    vi.mocked(api.post).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<ColheitasPage />)

    await screen.findByText('Nenhum registro encontrado.')
    await user.click(screen.getByRole('button', { name: /Registrar embalagem/ }))
    await user.type(screen.getByLabelText('Produto'), 'p1')
    await user.type(screen.getByLabelText('Quantidade'), '5')
    await user.click(screen.getByRole('button', { name: 'Registrar embalagem' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Não foi possível registrar a embalagem.')
    })
  })

  it('navega entre páginas', async () => {
    vi.mocked(api.get).mockImplementation((_url: string, config?: { params?: { page?: number } }) => {
      const page = config?.params?.page ?? 1
      const colheitas =
        page === 1 ? [makeColheita({ id: 'c1', produtoId: 'Primeira' })] : [makeColheita({ id: 'c2', produtoId: 'Segunda' })]
      return Promise.resolve({ data: { colheitas, total: 2, page, perPage: 20, totalPages: 2 } })
    })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<ColheitasPage />)

    await screen.findByText('Primeira')
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Próxima' }))
    expect(await screen.findByText('Segunda')).toBeInTheDocument()
  })
})
