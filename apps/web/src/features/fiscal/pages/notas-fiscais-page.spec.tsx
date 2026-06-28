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

  it('oculta cancelar para quem não tem permissão', async () => {
    useAuthMock.mockReturnValue({ user: { permissions: ['nota:read'] } })
    mockList([makeNota()])
    renderWithProviders(<NotasFiscaisPage />)
    await screen.findByText('1042 / 1')
    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument()
  })
})
