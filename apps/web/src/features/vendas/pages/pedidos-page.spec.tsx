import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PedidosPage } from './pedidos-page'

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

function makePedido(overrides: Record<string, unknown> = {}) {
  return {
    id: 'pd1',
    tenantId: 't1',
    empresaFaturadoraId: 'Verde Folha',
    clienteId: 'Quitanda Horta Viva',
    numero: 'PED-0042',
    tipo: 'avulso',
    status: 'rascunho',
    valorTotal: 8940,
    periodoConsolidacao: null,
    data: '2026-06-20T00:00:00.000Z',
    observacoes: null,
    itens: [],
    remessas: [],
    createdAt: '2026-06-20T00:00:00.000Z',
    updatedAt: '2026-06-20T00:00:00.000Z',
    ...overrides,
  }
}

function mockList(pedidos: unknown[]) {
  vi.mocked(api.get).mockResolvedValue({
    data: { pedidos, total: pedidos.length, page: 1, perPage: 20, totalPages: 1 },
  })
}

describe('PedidosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    activeEmpresaId = 'e1'
    useAuthMock.mockReturnValue({
      user: { permissions: ['pedido:read', 'pedido:create', 'pedido:confirm', 'pedido:cancel'] },
    })
  })

  it('exibe gate quando não há empresa ativa', () => {
    activeEmpresaId = null
    mockList([])
    renderWithProviders(<PedidosPage />)
    expect(
      screen.getByText('Selecione uma empresa ativa para visualizar os dados.'),
    ).toBeInTheDocument()
  })

  it('lista pedidos com número, cliente e valor', async () => {
    mockList([makePedido()])
    renderWithProviders(<PedidosPage />)

    expect(await screen.findByText('PED-0042')).toBeInTheDocument()
    expect(screen.getByText('Quitanda Horta Viva')).toBeInTheDocument()
    expect(screen.getByText('Rascunho')).toBeInTheDocument()
  })

  it('exibe erro com retry', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('boom'))
    renderWithProviders(<PedidosPage />)
    expect(await screen.findByText('Erro ao carregar pedidos.')).toBeInTheDocument()
  })

  it('confirma um pedido em rascunho', async () => {
    mockList([makePedido()])
    vi.mocked(api.post).mockResolvedValue({ data: { pedido: makePedido({ status: 'confirmado' }) } })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<PedidosPage />)

    await user.click(await screen.findByRole('button', { name: 'Confirmar' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar pedido' }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/pedidos/pd1/confirmar', { empresaId: 'e1' })
    })
    expect(toastSuccess).toHaveBeenCalledWith('Pedido confirmado.')
  })

  it('cria um pedido pelo formulário', async () => {
    mockList([])
    vi.mocked(api.post).mockResolvedValue({ data: { pedido: makePedido() } })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<PedidosPage />)

    await user.click(await screen.findByRole('button', { name: /Novo pedido/ }))
    await user.type(screen.getByLabelText('Cliente'), 'c1')
    await user.type(screen.getByLabelText('Produto'), 'p1')
    await user.type(screen.getByLabelText('Qtd.'), '10')
    await user.click(screen.getByRole('button', { name: 'Criar pedido' }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/api/pedidos',
        expect.objectContaining({ empresaId: 'e1', clienteId: 'c1' }),
      )
    })
    expect(toastSuccess).toHaveBeenCalledWith('Pedido criado com sucesso.')
  })

  it('oculta criar para quem não tem permissão', async () => {
    useAuthMock.mockReturnValue({ user: { permissions: ['pedido:read'] } })
    mockList([makePedido()])
    renderWithProviders(<PedidosPage />)
    await screen.findByText('PED-0042')
    expect(screen.queryByRole('button', { name: /Novo pedido/ })).not.toBeInTheDocument()
  })
})
