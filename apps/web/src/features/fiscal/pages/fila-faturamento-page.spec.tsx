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
    clienteId: 'cli1',
    numero: 'PED-0042',
    tipo: 'avulso',
    status: 'confirmado',
    valorTotal: 1284.5,
    data: '2026-06-20T00:00:00.000Z',
    ...overrides,
  }
}

function mockApiGet(pedidos: unknown[]) {
  vi.mocked(api.get).mockImplementation((url: string) => {
    if (url === '/api/fila-faturamento') {
      return Promise.resolve({
        data: { pedidos, total: pedidos.length, page: 1, perPage: 20, totalPages: 1 },
      })
    }
    if (url === '/api/empresas') {
      return Promise.resolve({
        data: {
          empresas: [
            {
              id: 'e1',
              razaoSocial: 'Verde Folha',
              cnpjCpfFormatado: '12.345.678/0001-90',
              regimeTributario: 'Simples',
              ambienteFiscal: 'homologacao',
              serieNfe: 1,
            },
          ],
        },
      })
    }
    if (url === '/api/clientes') {
      return Promise.resolve({
        data: {
          clientes: [
            {
              id: 'cli1',
              razaoSocialNome: 'Quitanda Horta Viva',
              cnpjCpfFormatado: '98.765.432/0001-10',
              municipio: 'Campinas',
              uf: 'SP',
            },
          ],
        },
      })
    }
    if (url === '/api/produtos') {
      return Promise.resolve({
        data: {
          produtos: [
            { id: 'p1', descricao: 'Alface Crespa', ncm: '0705.11.00', cfopPadrao: '5101', cstCsosn: '00' },
          ],
        },
      })
    }
    // GET /api/pedidos/:id
    return Promise.resolve({
      data: {
        pedido: {
          id: 'pd1',
          itens: [
            { id: 'it1', produtoId: 'p1', loteId: null, quantidade: 120, precoUnitario: 2.8, valorTotal: 336 },
          ],
        },
      },
    })
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
    mockApiGet([])
    renderWithProviders(<FilaFaturamentoPage />)
    expect(
      screen.getByText('Selecione uma empresa ativa para visualizar os dados.'),
    ).toBeInTheDocument()
  })

  it('lista pedidos aptos com número e empresa', async () => {
    mockApiGet([makePedido()])
    renderWithProviders(<FilaFaturamentoPage />)

    expect(await screen.findByText('PED-0042')).toBeInTheDocument()
    expect(screen.getByText('Verde Folha')).toBeInTheDocument()
  })

  it('exibe erro com retry', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('boom'))
    renderWithProviders(<FilaFaturamentoPage />)
    expect(await screen.findByText('Erro ao carregar a fila.')).toBeInTheDocument()
  })

  it('abre revisão e emite DANFE mostrando o status retornado', async () => {
    mockApiGet([makePedido()])
    vi.mocked(api.post).mockResolvedValue({
      data: { nota: { id: 'nf1', status: 'autorizada', numero: '1042', serie: '1', chaveAcesso: 'CHV', protocolo: 'PROTO', ambiente: 'homologacao', dataEmissao: null, mensagemRetorno: null, danfeUrl: null, xmlUrl: null } },
    })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<FilaFaturamentoPage />)

    await user.click(await screen.findByRole('button', { name: /Revisar DANFE/ }))

    expect(await screen.findByText(/Revisão da DANFE/)).toBeInTheDocument()
    expect(await screen.findByText('Quitanda Horta Viva')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Emitir DANFE/ }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/notas-fiscais/emitir', {
        empresaId: 'e1',
        pedidoId: 'pd1',
      })
    })
    expect(toastSuccess).toHaveBeenCalledWith('DANFE do pedido PED-0042: Autorizada.')
    expect(await screen.findByText('CHV')).toBeInTheDocument()
  })

  it('fecha a revisão ao cancelar', async () => {
    mockApiGet([makePedido()])
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<FilaFaturamentoPage />)

    await user.click(await screen.findByRole('button', { name: /Revisar DANFE/ }))
    expect(await screen.findByText(/Revisão da DANFE/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    await waitFor(() => {
      expect(screen.queryByText(/Revisão da DANFE/)).not.toBeInTheDocument()
    })
  })

  it('exibe erro de emissão via toast', async () => {
    mockApiGet([makePedido()])
    vi.mocked(api.post).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<FilaFaturamentoPage />)

    await user.click(await screen.findByRole('button', { name: /Revisar DANFE/ }))
    await user.click(await screen.findByRole('button', { name: /Emitir DANFE/ }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Não foi possível emitir a DANFE.')
    })
  })

  it('refaz a busca ao clicar em tentar novamente', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<FilaFaturamentoPage />)

    await user.click(await screen.findByRole('button', { name: 'Tentar novamente' }))
    await waitFor(() => {
      expect(vi.mocked(api.get).mock.calls.length).toBeGreaterThan(1)
    })
  })

  it('navega entre páginas', async () => {
    vi.mocked(api.get).mockImplementation((url: string, config?: unknown) => {
      if (url === '/api/fila-faturamento') {
        const page = (config as { params?: { page?: number } } | undefined)?.params?.page ?? 1
        return Promise.resolve({
          data: { pedidos: [makePedido()], total: 40, page, perPage: 20, totalPages: 2 },
        })
      }
      return Promise.resolve({ data: { empresas: [], clientes: [], produtos: [] } })
    })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<FilaFaturamentoPage />)

    await screen.findByText('PED-0042')
    await user.click(screen.getByRole('button', { name: 'Próxima' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Anterior' })).toBeEnabled()
    })

    await user.click(screen.getByRole('button', { name: 'Anterior' }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    })
  })

  it('oculta revisar para quem não tem permissão', async () => {
    useAuthMock.mockReturnValue({ user: { permissions: ['nota:read'] } })
    mockApiGet([makePedido()])
    renderWithProviders(<FilaFaturamentoPage />)
    await screen.findByText('PED-0042')
    expect(screen.queryByRole('button', { name: /Revisar DANFE/ })).not.toBeInTheDocument()
  })
})
