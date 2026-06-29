import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSyncExternalStore } from 'react'
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
const empresaListeners = new Set<() => void>()
function setActiveEmpresaId(id: string | null): void {
  activeEmpresaId = id
  empresaListeners.forEach((l) => {
    l()
  })
}
vi.mock('@/stores/active-empresa-store', () => ({
  useActiveEmpresaStore: (selector: (s: { activeEmpresaId: string | null }) => unknown) => {
    const subscribe = (l: () => void): (() => void) => {
      empresaListeners.add(l)
      return () => empresaListeners.delete(l)
    }
    const getSnapshot = (): unknown => selector({ activeEmpresaId })
    return useSyncExternalStore(subscribe, getSnapshot)
  },
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
    empresaListeners.clear()
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

  it('filtra por status e reseta a página', async () => {
    mockList([makeRemessa()])
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<RemessasPage />)

    await screen.findByText('REM-0118')
    await user.click(screen.getByRole('combobox', { name: 'Filtrar por status' }))
    await user.click(await screen.findByRole('option', { name: 'Entregue' }))

    await waitFor(() => {
      expect(api.get).toHaveBeenLastCalledWith(
        '/api/remessas',
        expect.objectContaining({
          params: expect.objectContaining({ status: 'entregue', page: 1 }),
        }),
      )
    })
  })

  it('tenta novamente após erro', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error('boom'))
    vi.mocked(api.get).mockResolvedValue({
      data: { remessas: [makeRemessa()], total: 1, page: 1, perPage: 20, totalPages: 1 },
    })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<RemessasPage />)

    await user.click(await screen.findByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText('REM-0118')).toBeInTheDocument()
  })

  it('navega entre páginas', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { remessas: [makeRemessa()], total: 40, page: 1, perPage: 20, totalPages: 2 },
    })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<RemessasPage />)

    await screen.findByText('REM-0118')
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Próxima' }))

    await waitFor(() => {
      expect(api.get).toHaveBeenLastCalledWith(
        '/api/remessas',
        expect.objectContaining({ params: expect.objectContaining({ page: 2 }) }),
      )
    })
  })

  it('abre o dialog de detalhes da remessa', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/api/remessas/r1') {
        return Promise.resolve({ data: { remessa: makeRemessa() } })
      }
      return Promise.resolve({
        data: { remessas: [makeRemessa()], total: 1, page: 1, perPage: 20, totalPages: 1 },
      })
    })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<RemessasPage />)

    await user.click(
      await screen.findByRole('button', { name: 'Ver detalhes da remessa REM-0118' }),
    )

    expect(await screen.findByRole('heading', { name: 'Remessa REM-0118' })).toBeInTheDocument()
  })

  it('cancela uma remessa aberta e fecha o dialog de confirmação', async () => {
    mockList([makeRemessa()])
    vi.mocked(api.post).mockResolvedValue({
      data: { remessa: makeRemessa({ status: 'cancelada' }) },
    })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<RemessasPage />)

    await user.click(await screen.findByRole('button', { name: 'Cancelar' }))
    await user.click(screen.getByRole('button', { name: 'Voltar' }))
    expect(screen.queryByRole('heading', { name: 'Cancelar remessa' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    await user.click(screen.getByRole('button', { name: 'Cancelar remessa' }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/remessas/r1/cancelar', { empresaId: 'e1' })
    })
    expect(toastSuccess).toHaveBeenCalledWith('Remessa cancelada.')
  })

  it('permite cancelar uma remessa já entregue', async () => {
    mockList([makeRemessa({ status: 'entregue' })])
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<RemessasPage />)

    await screen.findByText('REM-0118')
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Entregue' })).not.toBeInTheDocument()
  })

  it('exibe toast de erro quando a ação falha', async () => {
    mockList([makeRemessa()])
    vi.mocked(api.post).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<RemessasPage />)

    await user.click(await screen.findByRole('button', { name: 'Entregue' }))
    await user.click(screen.getByRole('button', { name: 'Marcar entregue' }))

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith('Não foi possível concluir a ação.'),
    )
  })

  it('exibe toast de erro quando a criação falha', async () => {
    mockList([])
    vi.mocked(api.post).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<RemessasPage />)

    await user.click(await screen.findByRole('button', { name: /Nova remessa/ }))
    await user.type(screen.getByLabelText('Cliente'), 'c1')
    await user.type(screen.getByLabelText('Produto'), 'p1')
    await user.type(screen.getByLabelText('Qtd.'), '5')
    await user.click(screen.getByRole('button', { name: 'Criar remessa' }))

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith('Não foi possível criar a remessa.'),
    )
  })

  it('volta para a página anterior', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { remessas: [makeRemessa()], total: 40, page: 2, perPage: 20, totalPages: 2 },
    })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<RemessasPage />)

    await screen.findByText('REM-0118')
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Anterior' }))

    await waitFor(() => {
      expect(api.get).toHaveBeenLastCalledWith(
        '/api/remessas',
        expect.objectContaining({ params: expect.objectContaining({ page: 1 }) }),
      )
    })
  })

  it('fecha o dialog de detalhes', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/api/remessas/r1') {
        return Promise.resolve({ data: { remessa: makeRemessa() } })
      }
      return Promise.resolve({
        data: { remessas: [makeRemessa()], total: 1, page: 1, perPage: 20, totalPages: 1 },
      })
    })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<RemessasPage />)

    await user.click(
      await screen.findByRole('button', { name: 'Ver detalhes da remessa REM-0118' }),
    )
    await screen.findByRole('heading', { name: 'Remessa REM-0118' })
    await user.keyboard('{Escape}')

    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: 'Remessa REM-0118' }),
      ).not.toBeInTheDocument(),
    )
  })

  it('aborta a ação quando a empresa ativa some antes de confirmar', async () => {
    mockList([makeRemessa()])
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<RemessasPage />)

    await user.click(await screen.findByRole('button', { name: 'Entregue' }))
    act(() => {
      setActiveEmpresaId(null)
    })
    await user.click(screen.getByRole('button', { name: 'Marcar entregue' }))

    expect(api.post).not.toHaveBeenCalled()
  })
})
