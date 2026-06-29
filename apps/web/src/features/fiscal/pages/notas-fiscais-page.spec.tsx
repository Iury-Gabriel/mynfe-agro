import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { NotasFiscaisPage } from './notas-fiscais-page'

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

function makeNota(overrides: Record<string, unknown> = {}) {
  return {
    id: 'nf1',
    tenantId: 't1',
    empresaEmitenteId: 'Verde Folha',
    pedidoId: 'pd1',
    clienteId: 'Sacolão do Bairro',
    numero: '1042',
    serie: '1',
    modelo: '55',
    naturezaOperacao: 'Venda',
    status: 'autorizada',
    chaveAcesso: '35260612345678000190550010000010421000010428',
    protocolo: '135260000891234',
    valorTotal: 2156.3,
    ambiente: 'homologacao',
    xmlUrl: null,
    danfeUrl: null,
    mensagemRetorno: null,
    dataEmissao: '2026-06-26T00:00:00.000Z',
    itens: [],
    eventos: [],
    createdAt: '2026-06-26T00:00:00.000Z',
    updatedAt: '2026-06-26T00:00:00.000Z',
    ...overrides,
  }
}

function mockList(notas: unknown[]) {
  vi.mocked(api.get).mockResolvedValue({
    data: { notas, total: notas.length, page: 1, perPage: 20, totalPages: 1 },
  })
}

describe('NotasFiscaisPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    activeEmpresaId = 'e1'
    useAuthMock.mockReturnValue({ user: { permissions: ['nota:read', 'nota:cancelar'] } })
  })

  it('exibe gate quando não há empresa ativa', () => {
    activeEmpresaId = null
    mockList([])
    renderWithProviders(<NotasFiscaisPage />)
    expect(
      screen.getByText('Selecione uma empresa ativa para visualizar os dados.'),
    ).toBeInTheDocument()
  })

  it('lista notas com número/série, cliente e status', async () => {
    mockList([makeNota()])
    renderWithProviders(<NotasFiscaisPage />)

    expect(await screen.findByText('1042 / 1')).toBeInTheDocument()
    expect(screen.getByText('Sacolão do Bairro')).toBeInTheDocument()
    expect(screen.getByText('Autorizada')).toBeInTheDocument()
  })

  it('usa traço quando a nota não tem número nem série', async () => {
    mockList([makeNota({ id: 'nf2', numero: null, serie: null, status: 'pendente' })])
    renderWithProviders(<NotasFiscaisPage />)

    await screen.findByText('Pendente')
    expect(
      screen.getByText(
        (_content, element) =>
          element?.tagName === 'SPAN' && element.textContent === '— / —',
      ),
    ).toBeInTheDocument()
  })

  it('exibe erro com retry', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('boom'))
    renderWithProviders(<NotasFiscaisPage />)
    expect(await screen.findByText('Erro ao carregar notas.')).toBeInTheDocument()
  })

  it('abre o detalhe ao clicar em Detalhe', async () => {
    mockList([makeNota()])
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { notas: [makeNota()], total: 1, page: 1, perPage: 20, totalPages: 1 },
    })
    vi.mocked(api.get).mockResolvedValueOnce({ data: { nota: makeNota() } })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<NotasFiscaisPage />)

    await user.click(await screen.findByRole('button', { name: 'Detalhe' }))

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/api/notas-fiscais/nf1', { params: { empresaId: 'e1' } })
    })
    expect(await screen.findByText('NF-e 1042 / Série 1')).toBeInTheDocument()
  })

  it('cancela uma nota autorizada', async () => {
    mockList([makeNota()])
    vi.mocked(api.post).mockResolvedValue({
      data: { nota: makeNota({ status: 'cancelada' }) },
    })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<NotasFiscaisPage />)

    await user.click(await screen.findByRole('button', { name: 'Cancelar' }))
    await user.click(screen.getByRole('button', { name: 'Cancelar nota' }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/api/notas-fiscais/nf1/cancelar',
        expect.objectContaining({ empresaId: 'e1' }),
      )
    })
    expect(toastSuccess).toHaveBeenCalledWith('Nota cancelada.')
  })

  it('filtra por status recarregando a primeira página', async () => {
    mockList([makeNota()])
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<NotasFiscaisPage />)

    await screen.findByText('1042 / 1')
    await user.click(screen.getByRole('combobox', { name: 'Filtrar por status' }))
    await user.click(await screen.findByRole('option', { name: 'Autorizada' }))

    await waitFor(() => {
      expect(
        vi.mocked(api.get).mock.calls.some(
          ([, config]) =>
            (config as { params?: { status?: string } })?.params?.status === 'autorizada',
        ),
      ).toBe(true)
    })
  })

  it('refaz a busca ao clicar em tentar novamente', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<NotasFiscaisPage />)

    await user.click(await screen.findByRole('button', { name: 'Tentar novamente' }))
    await waitFor(() => {
      expect(vi.mocked(api.get).mock.calls.length).toBeGreaterThan(1)
    })
  })

  it('navega entre páginas', async () => {
    vi.mocked(api.get).mockImplementation((_url: string, config?: unknown) => {
      const page = (config as { params?: { page?: number } } | undefined)?.params?.page ?? 1
      return Promise.resolve({
        data: { notas: [makeNota()], total: 40, page, perPage: 20, totalPages: 2 },
      })
    })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<NotasFiscaisPage />)

    await screen.findByText('1042 / 1')
    await user.click(screen.getByRole('button', { name: 'Próxima' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Anterior' })).toBeEnabled()
    })

    await user.click(screen.getByRole('button', { name: 'Anterior' }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    })
  })

  it('fecha o detalhe ao trocar o estado do diálogo', async () => {
    mockList([makeNota()])
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { notas: [makeNota()], total: 1, page: 1, perPage: 20, totalPages: 1 },
    })
    vi.mocked(api.get).mockResolvedValueOnce({ data: { nota: makeNota() } })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<NotasFiscaisPage />)

    await user.click(await screen.findByRole('button', { name: 'Detalhe' }))
    expect(await screen.findByText('NF-e 1042 / Série 1')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.queryByText('NF-e 1042 / Série 1')).not.toBeInTheDocument()
    })
  })

  it('exibe erro de cancelamento via toast', async () => {
    mockList([makeNota()])
    vi.mocked(api.post).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<NotasFiscaisPage />)

    await user.click(await screen.findByRole('button', { name: 'Cancelar' }))
    await user.click(screen.getByRole('button', { name: 'Cancelar nota' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Não foi possível cancelar a nota.')
    })
  })

  it('fecha o diálogo de cancelamento ao voltar', async () => {
    mockList([makeNota()])
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<NotasFiscaisPage />)

    await user.click(await screen.findByRole('button', { name: 'Cancelar' }))
    await user.click(await screen.findByRole('button', { name: 'Voltar' }))

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Cancelar nota fiscal' })).not.toBeInTheDocument()
    })
  })

  it('oculta cancelar para quem não tem permissão', async () => {
    useAuthMock.mockReturnValue({ user: { permissions: ['nota:read'] } })
    mockList([makeNota()])
    renderWithProviders(<NotasFiscaisPage />)
    await screen.findByText('1042 / 1')
    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument()
  })
})
