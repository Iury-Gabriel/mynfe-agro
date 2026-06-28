import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RemessasPage } from './remessas-page'

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

function makeRemessa(overrides: Record<string, unknown> = {}) {
  return {
    id: 'r1',
    tenantId: 't1',
    empresaFaturadoraId: 'Verde Folha',
    clienteId: 'Quitanda Horta Viva',
    numero: 'REM-0118',
    status: 'aberta',
    pedidoConsolidadoId: null,
    valorEstimado: 2180,
    data: '2026-06-03T00:00:00.000Z',
    observacoes: null,
    itens: [],
    lotes: [],
    createdAt: '2026-06-03T00:00:00.000Z',
    updatedAt: '2026-06-03T00:00:00.000Z',
    ...overrides,
  }
}

function mockList(remessas: unknown[]) {
  vi.mocked(api.get).mockResolvedValue({
    data: { remessas, total: remessas.length, page: 1, perPage: 20, totalPages: 1 },
  })
}

describe('RemessasPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    activeEmpresaId = 'e1'
    useAuthMock.mockReturnValue({
      user: { permissions: ['remessa:read', 'remessa:create', 'remessa:update', 'remessa:cancel'] },
    })
  })

  it('exibe gate quando não há empresa ativa', () => {
    activeEmpresaId = null
    mockList([])
    renderWithProviders(<RemessasPage />)
    expect(
      screen.getByText('Selecione uma empresa ativa para visualizar os dados.'),
    ).toBeInTheDocument()
  })

  it('lista remessas com número e status', async () => {
    mockList([makeRemessa()])
    renderWithProviders(<RemessasPage />)

    expect(await screen.findByText('REM-0118')).toBeInTheDocument()
    expect(screen.getByText('Aberta')).toBeInTheDocument()
  })

  it('exibe erro com retry', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('boom'))
    renderWithProviders(<RemessasPage />)
    expect(await screen.findByText('Erro ao carregar remessas.')).toBeInTheDocument()
  })

  it('marca remessa como entregue', async () => {
    mockList([makeRemessa()])
    vi.mocked(api.post).mockResolvedValue({ data: { remessa: makeRemessa({ status: 'entregue' }) } })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<RemessasPage />)

    await user.click(await screen.findByRole('button', { name: 'Entregue' }))
    await user.click(screen.getByRole('button', { name: 'Marcar entregue' }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/remessas/r1/entregue', { empresaId: 'e1' })
    })
    expect(toastSuccess).toHaveBeenCalledWith('Remessa marcada como entregue.')
  })

  it('cria uma remessa pelo formulário', async () => {
    mockList([])
    vi.mocked(api.post).mockResolvedValue({ data: { remessa: makeRemessa() } })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<RemessasPage />)

    await user.click(await screen.findByRole('button', { name: /Nova remessa/ }))
    await user.type(screen.getByLabelText('Cliente'), 'c1')
    await user.type(screen.getByLabelText('Produto'), 'p1')
    await user.type(screen.getByLabelText('Qtd.'), '5')
    await user.click(screen.getByRole('button', { name: 'Criar remessa' }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/api/remessas',
        expect.objectContaining({ empresaId: 'e1', clienteId: 'c1' }),
      )
    })
    expect(toastSuccess).toHaveBeenCalledWith('Remessa criada com sucesso.')
  })
})
