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
