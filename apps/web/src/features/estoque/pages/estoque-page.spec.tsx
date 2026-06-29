import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { EstoquePage } from './estoque-page'

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

function makeSaldo(overrides: Record<string, unknown> = {}) {
  return {
    id: 's1',
    tenantId: 't1',
    empresaId: 'e1',
    produtoId: 'Alface',
    loteId: 'LT-1',
    quantidadeDisponivel: 1240,
    quantidadeReservada: 180,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeMovimento(overrides: Record<string, unknown> = {}) {
  return {
    id: 'm1',
    tenantId: 't1',
    empresaId: 'e1',
    produtoId: 'Rúcula',
    loteId: 'LT-2',
    tipo: 'saida',
    origem: 'pedido',
    referenciaId: null,
    quantidade: 80,
    data: '2026-06-20T00:00:00.000Z',
    usuarioId: null,
    motivo: 'Pedido PV-1',
    createdAt: '2026-06-20T00:00:00.000Z',
    updatedAt: '2026-06-20T00:00:00.000Z',
    ...overrides,
  }
}

function mockPosicao(saldos: unknown[]) {
  vi.mocked(api.get).mockImplementation((url: string) => {
    if (url === '/api/estoque/posicao') {
      return Promise.resolve({
        data: { saldos, total: saldos.length, page: 1, perPage: 20, totalPages: 1 },
      })
    }
    return Promise.resolve({
      data: { movimentos: [], total: 0, page: 1, perPage: 20, totalPages: 1 },
    })
  })
}

describe('EstoquePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    activeEmpresaId = 'e1'
    useAuthMock.mockReturnValue({ user: { permissions: ['estoque:read', 'estoque:ajuste'] } })
  })

  it('exibe gate quando não há empresa ativa', () => {
    activeEmpresaId = null
    mockPosicao([])
    renderWithProviders(<EstoquePage />)
    expect(
      screen.getByText('Selecione uma empresa ativa para visualizar os dados.'),
    ).toBeInTheDocument()
  })

  it('lista a posição de estoque', async () => {
    mockPosicao([makeSaldo()])
    renderWithProviders(<EstoquePage />)

    expect(await screen.findByText('Alface')).toBeInTheDocument()
    expect(screen.getByText('1.240')).toBeInTheDocument()
    expect(screen.getByText('180')).toBeInTheDocument()
  })

  it('exibe erro na posição com retry', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('boom'))
    renderWithProviders(<EstoquePage />)
    expect(await screen.findByText('Erro ao carregar posição de estoque.')).toBeInTheDocument()
  })

  it('recarrega a posição ao tentar novamente', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error('boom'))
    mockPosicao([makeSaldo()])
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<EstoquePage />)

    await screen.findByText('Erro ao carregar posição de estoque.')
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText('Alface')).toBeInTheDocument()
  })

  it('navega entre as páginas da posição', async () => {
    vi.mocked(api.get).mockImplementation(
      (url: string, config?: { params?: { page?: number } }) => {
        if (url === '/api/estoque/posicao') {
          const page = config?.params?.page ?? 1
          const produtoId = page === 1 ? 'Alface' : 'Rúcula'
          return Promise.resolve({
            data: {
              saldos: [makeSaldo({ id: `s${page}`, produtoId })],
              total: 2,
              page,
              perPage: 20,
              totalPages: 2,
            },
          })
        }
        return Promise.resolve({
          data: { movimentos: [], total: 0, page: 1, perPage: 20, totalPages: 1 },
        })
      },
    )
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<EstoquePage />)

    await screen.findByText('Alface')
    await user.click(screen.getByRole('button', { name: 'Próxima' }))
    expect(await screen.findByText('Rúcula')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Anterior' }))
    expect(await screen.findByText('Alface')).toBeInTheDocument()
  })

  it('recarrega movimentações ao tentar novamente', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/api/estoque/movimentos') {
        return Promise.reject(new Error('boom'))
      }
      return Promise.resolve({
        data: { saldos: [], total: 0, page: 1, perPage: 20, totalPages: 1 },
      })
    })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<EstoquePage />)

    await user.click(screen.getByRole('button', { name: 'Movimentações' }))
    await screen.findByText('Erro ao carregar movimentações.')

    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/api/estoque/movimentos') {
        return Promise.resolve({
          data: { movimentos: [makeMovimento()], total: 1, page: 1, perPage: 20, totalPages: 1 },
        })
      }
      return Promise.resolve({
        data: { saldos: [], total: 0, page: 1, perPage: 20, totalPages: 1 },
      })
    })
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText('Rúcula')).toBeInTheDocument()
  })

  it('navega entre as páginas das movimentações', async () => {
    vi.mocked(api.get).mockImplementation(
      (url: string, config?: { params?: { page?: number } }) => {
        if (url === '/api/estoque/movimentos') {
          const page = config?.params?.page ?? 1
          const produtoId = page === 1 ? 'Rúcula' : 'Couve'
          return Promise.resolve({
            data: {
              movimentos: [makeMovimento({ id: `m${page}`, produtoId })],
              total: 2,
              page,
              perPage: 20,
              totalPages: 2,
            },
          })
        }
        return Promise.resolve({
          data: { saldos: [], total: 0, page: 1, perPage: 20, totalPages: 1 },
        })
      },
    )
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<EstoquePage />)

    await user.click(screen.getByRole('button', { name: 'Movimentações' }))
    expect(await screen.findByText('Rúcula')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Próxima' }))
    expect(await screen.findByText('Couve')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Anterior' }))
    expect(await screen.findByText('Rúcula')).toBeInTheDocument()
  })

  it('exibe movimentações ao trocar de aba', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/api/estoque/movimentos') {
        return Promise.resolve({
          data: { movimentos: [makeMovimento()], total: 1, page: 1, perPage: 20, totalPages: 1 },
        })
      }
      return Promise.resolve({
        data: { saldos: [], total: 0, page: 1, perPage: 20, totalPages: 1 },
      })
    })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<EstoquePage />)

    await user.click(screen.getByRole('button', { name: 'Movimentações' }))
    expect(await screen.findByText('Rúcula')).toBeInTheDocument()
    expect(screen.getByText('Saída')).toBeInTheDocument()
    expect(screen.getByText('Pedido PV-1')).toBeInTheDocument()
  })

  it('usa fallbacks para tipo desconhecido e campos nulos', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/api/estoque/movimentos') {
        return Promise.resolve({
          data: {
            movimentos: [makeMovimento({ tipo: 'transferencia', loteId: null, motivo: null })],
            total: 1,
            page: 1,
            perPage: 20,
            totalPages: 1,
          },
        })
      }
      return Promise.resolve({
        data: { saldos: [], total: 0, page: 1, perPage: 20, totalPages: 1 },
      })
    })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<EstoquePage />)

    await user.click(screen.getByRole('button', { name: 'Movimentações' }))
    expect(await screen.findByText('transferencia')).toBeInTheDocument()
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('usa o estado local quando a resposta não traz paginação', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/api/estoque/movimentos') {
        return Promise.resolve({ data: { movimentos: [makeMovimento()] } })
      }
      return Promise.resolve({ data: { saldos: [makeSaldo()] } })
    })
    renderWithProviders(<EstoquePage />)

    expect(await screen.findByText('Alface')).toBeInTheDocument()
    expect(screen.getByText('Página 1 de 1 · 0 saldos')).toBeInTheDocument()
  })

  it('exibe traço quando o saldo não tem lote', async () => {
    mockPosicao([makeSaldo({ loteId: null })])
    renderWithProviders(<EstoquePage />)

    await screen.findByText('Alface')
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('usa defaults de paginação nas movimentações sem metadados', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/api/estoque/movimentos') {
        return Promise.resolve({ data: { movimentos: [makeMovimento()] } })
      }
      return Promise.resolve({ data: { saldos: [] } })
    })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<EstoquePage />)

    await user.click(screen.getByRole('button', { name: 'Movimentações' }))
    expect(await screen.findByText('Rúcula')).toBeInTheDocument()
    expect(screen.getByText('Página 1 de 1 · 0 movimentos')).toBeInTheDocument()
  })

  it('registra um ajuste com sucesso', async () => {
    mockPosicao([])
    vi.mocked(api.post).mockResolvedValue({ data: { movimento: { id: 'm1' }, saldo: { id: 's1' } } })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<EstoquePage />)

    await user.click(screen.getByRole('button', { name: 'Ajuste' }))
    await user.click(screen.getByRole('button', { name: /Registrar ajuste/ }))

    await user.type(screen.getByLabelText('Produto'), 'p1')
    await user.type(screen.getByLabelText('Quantidade'), '12')
    await user.type(screen.getByLabelText('Motivo'), 'inventário')
    await user.click(screen.getByRole('button', { name: 'Registrar ajuste' }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/api/estoque/ajustes',
        expect.objectContaining({ produtoId: 'p1', delta: 12, motivo: 'inventário' }),
      )
    })
    expect(toastSuccess).toHaveBeenCalledWith('Ajuste registrado com sucesso.')
  })

  it('exibe toast de erro quando o ajuste falha', async () => {
    mockPosicao([])
    vi.mocked(api.post).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<EstoquePage />)

    await user.click(screen.getByRole('button', { name: 'Ajuste' }))
    await user.click(screen.getByRole('button', { name: /Registrar ajuste/ }))
    await user.type(screen.getByLabelText('Produto'), 'p1')
    await user.type(screen.getByLabelText('Quantidade'), '12')
    await user.type(screen.getByLabelText('Motivo'), 'inventário')
    await user.click(screen.getByRole('button', { name: 'Registrar ajuste' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Não foi possível registrar o ajuste.')
    })
  })

  it('oculta ajuste para quem não tem permissão', async () => {
    useAuthMock.mockReturnValue({ user: { permissions: ['estoque:read'] } })
    mockPosicao([])
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<EstoquePage />)

    await user.click(screen.getByRole('button', { name: 'Ajuste' }))
    expect(
      screen.getByText('Você não tem permissão para ajustar o estoque.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Registrar ajuste/ })).not.toBeInTheDocument()
  })
})
