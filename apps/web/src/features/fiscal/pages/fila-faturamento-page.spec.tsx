import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FilaFaturamentoPage } from './fila-faturamento-page'

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
    status: 'confirmado',
    valorTotal: 1284.5,
    data: '2026-06-20T00:00:00.000Z',
    ...overrides,
  }
}

function mockList(pedidos: unknown[]) {
  vi.mocked(api.get).mockResolvedValue({
    data: { pedidos, total: pedidos.length, page: 1, perPage: 20, totalPages: 1 },
  })
}

describe('FilaFaturamentoPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    activeEmpresaId = 'e1'
    useAuthMock.mockReturnValue({ user: { permissions: ['nota:read', 'nota:emitir'] } })
  })

  it('exibe gate quando não há empresa ativa', () => {
    activeEmpresaId = null
    mockList([])
    renderWithProviders(<FilaFaturamentoPage />)
    expect(
      screen.getByText('Selecione uma empresa ativa para visualizar os dados.'),
    ).toBeInTheDocument()
  })

  it('lista pedidos aptos com número, cliente e empresa', async () => {
    mockList([makePedido()])
    renderWithProviders(<FilaFaturamentoPage />)

    expect(await screen.findByText('PED-0042')).toBeInTheDocument()
    expect(screen.getByText('Quitanda Horta Viva')).toBeInTheDocument()
    expect(screen.getByText('Verde Folha')).toBeInTheDocument()
  })

  it('exibe erro com retry', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('boom'))
    renderWithProviders(<FilaFaturamentoPage />)
    expect(await screen.findByText('Erro ao carregar a fila.')).toBeInTheDocument()
  })

  it('emite DANFE e mostra o status retornado', async () => {
    mockList([makePedido()])
    vi.mocked(api.post).mockResolvedValue({ data: { nota: { id: 'nf1', status: 'autorizada' } } })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<FilaFaturamentoPage />)

    await user.click(await screen.findByRole('button', { name: /Emitir DANFE/ }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/notas-fiscais/emitir', {
        empresaId: 'e1',
        pedidoId: 'pd1',
      })
    })
    expect(toastSuccess).toHaveBeenCalledWith('DANFE do pedido PED-0042: Autorizada.')
  })

  it('oculta emitir para quem não tem permissão', async () => {
    useAuthMock.mockReturnValue({ user: { permissions: ['nota:read'] } })
    mockList([makePedido()])
    renderWithProviders(<FilaFaturamentoPage />)
    await screen.findByText('PED-0042')
    expect(screen.queryByRole('button', { name: /Emitir DANFE/ })).not.toBeInTheDocument()
  })
})
