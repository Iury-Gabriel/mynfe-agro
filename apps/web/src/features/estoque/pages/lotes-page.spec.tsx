import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LotesPage } from './lotes-page'

import { api } from '@/lib/api-client'
import { renderWithProviders } from '@/test/render-with-providers'

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn() },
}))

let activeEmpresaId: string | null = 'e1'
vi.mock('@/stores/active-empresa-store', () => ({
  useActiveEmpresaStore: (selector: (s: { activeEmpresaId: string | null }) => unknown) =>
    selector({ activeEmpresaId }),
}))

function makeLote(overrides: Record<string, unknown> = {}) {
  return {
    id: 'l1',
    tenantId: 't1',
    empresaId: 'e1',
    produtoId: 'Alface',
    codigoLote: 'LT-2026-0142',
    origemTipo: 'colheita',
    colheitaId: 'c1',
    areaId: 'A1',
    quantidadeInicial: 420,
    quantidadeAtual: 420,
    validade: '2026-07-01T00:00:00.000Z',
    dataEntrada: '2026-06-12T00:00:00.000Z',
    createdAt: '2026-06-12T00:00:00.000Z',
    updatedAt: '2026-06-12T00:00:00.000Z',
    ...overrides,
  }
}

function makeColheita() {
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
  }
}

function mockList(lotes: unknown[]) {
  vi.mocked(api.get).mockImplementation((url: string) => {
    if (url === '/api/lotes') {
      return Promise.resolve({
        data: { lotes, total: lotes.length, page: 1, perPage: 20, totalPages: 1 },
      })
    }
    return Promise.resolve({
      data: {
        lote: makeLote(),
        montante: { colheita: makeColheita(), safraId: 'Safra 2026', areaId: 'Talhão A1' },
        jusante: { pedidoItens: [], remessaItens: [] },
      },
    })
  })
}

describe('LotesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    activeEmpresaId = 'e1'
  })

  it('exibe gate quando não há empresa ativa', () => {
    activeEmpresaId = null
    renderWithProviders(<LotesPage />)
    expect(
      screen.getByText('Selecione uma empresa ativa para visualizar os dados.'),
    ).toBeInTheDocument()
  })

  it('exibe carregamento', () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => undefined))
    renderWithProviders(<LotesPage />)
    expect(screen.getByText('Carregando lotes…')).toBeInTheDocument()
  })

  it('exibe erro com retry', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('boom'))
    renderWithProviders(<LotesPage />)
    expect(await screen.findByText('Erro ao carregar lotes.')).toBeInTheDocument()
  })

  it('recarrega a lista ao tentar novamente', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error('boom'))
    mockList([makeLote()])
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<LotesPage />)

    await screen.findByText('Erro ao carregar lotes.')
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText('LT-2026-0142')).toBeInTheDocument()
  })

  it('navega entre as páginas de lotes', async () => {
    vi.mocked(api.get).mockImplementation(
      (url: string, config?: { params?: { page?: number } }) => {
        if (url === '/api/lotes') {
          const page = config?.params?.page ?? 1
          const codigoLote = page === 1 ? 'LT-PAGINA-1' : 'LT-PAGINA-2'
          return Promise.resolve({
            data: {
              lotes: [makeLote({ id: `l${page}`, codigoLote })],
              total: 2,
              page,
              perPage: 20,
              totalPages: 2,
            },
          })
        }
        return Promise.resolve({
          data: {
            lote: makeLote(),
            montante: { colheita: null, safraId: null, areaId: null },
            jusante: { pedidoItens: [], remessaItens: [] },
          },
        })
      },
    )
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<LotesPage />)

    await screen.findByText('LT-PAGINA-1')
    await user.click(screen.getByRole('button', { name: 'Próxima' }))
    expect(await screen.findByText('LT-PAGINA-2')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Anterior' }))
    expect(await screen.findByText('LT-PAGINA-1')).toBeInTheDocument()
  })

  it('lista lotes', async () => {
    mockList([makeLote()])
    renderWithProviders(<LotesPage />)

    expect(await screen.findByText('LT-2026-0142')).toBeInTheDocument()
    expect(screen.getByText('colheita')).toBeInTheDocument()
  })

  it('exibe "Sem validade" quando o lote não tem validade', async () => {
    mockList([makeLote({ validade: null })])
    renderWithProviders(<LotesPage />)

    expect(await screen.findByText('Sem validade')).toBeInTheDocument()
  })

  it('exibe traço para lote sem origem', async () => {
    mockList([makeLote({ origemTipo: null })])
    renderWithProviders(<LotesPage />)

    await screen.findByText('LT-2026-0142')
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('usa o estado local quando a resposta não traz paginação', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { lotes: [makeLote()] } })
    renderWithProviders(<LotesPage />)

    expect(await screen.findByText('LT-2026-0142')).toBeInTheDocument()
    expect(screen.getByText('Página 1 de 1 · 0 lotes')).toBeInTheDocument()
  })

  it('abre a rastreabilidade ao clicar em ver', async () => {
    mockList([makeLote()])
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<LotesPage />)

    await screen.findByText('LT-2026-0142')
    await user.click(screen.getByRole('button', { name: 'Ver rastreabilidade' }))

    expect(await screen.findByText('Cadeia do lote LT-2026-0142')).toBeInTheDocument()
    expect(screen.getByText('Safra 2026')).toBeInTheDocument()
    expect(screen.getByText('Nenhum consumo registrado para este lote.')).toBeInTheDocument()
  })

  it('exibe consumo quando há documentos jusante', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/api/lotes') {
        return Promise.resolve({
          data: { lotes: [makeLote()], total: 1, page: 1, perPage: 20, totalPages: 1 },
        })
      }
      return Promise.resolve({
        data: {
          lote: makeLote(),
          montante: { colheita: null, safraId: null, areaId: null },
          jusante: {
            pedidoItens: [
              {
                itemId: 'pi1',
                pedidoId: 'p1',
                numero: '000009',
                clienteId: 'cli1',
                clienteNome: 'Atacadão Verde',
                quantidade: 25,
                data: '2026-06-13T00:00:00.000Z',
                status: 'confirmado',
              },
            ],
            remessaItens: [
              {
                itemId: 'ri1',
                remessaId: 'r1',
                numero: '000004',
                clienteId: 'cli1',
                clienteNome: 'Mercado Sol',
                quantidade: 8,
                data: '2026-06-14T00:00:00.000Z',
                status: 'entregue',
              },
            ],
          },
        },
      })
    })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<LotesPage />)

    await screen.findByText('LT-2026-0142')
    await user.click(screen.getByRole('button', { name: 'Ver rastreabilidade' }))

    expect(await screen.findByText('#000009')).toBeInTheDocument()
    expect(screen.getByText('Atacadão Verde')).toBeInTheDocument()
    expect(screen.getByText('Pedido')).toBeInTheDocument()
    expect(screen.getByText('#000004')).toBeInTheDocument()
    expect(screen.getByText('Mercado Sol')).toBeInTheDocument()
    expect(screen.getByText('Remessa')).toBeInTheDocument()
    expect(screen.getByText('Sem colheita de origem')).toBeInTheDocument()
  })

  it('exibe erro na rastreabilidade com retry', async () => {
    let rastreabilidadeOk = false
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/api/lotes') {
        return Promise.resolve({
          data: { lotes: [makeLote()], total: 1, page: 1, perPage: 20, totalPages: 1 },
        })
      }
      if (!rastreabilidadeOk) {
        return Promise.reject(new Error('boom'))
      }
      return Promise.resolve({
        data: {
          lote: makeLote(),
          montante: { colheita: makeColheita(), safraId: 'Safra 2026', areaId: 'Talhão A1' },
          jusante: { pedidoItens: [], remessaItens: [] },
        },
      })
    })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<LotesPage />)

    await screen.findByText('LT-2026-0142')
    await user.click(screen.getByRole('button', { name: 'Ver rastreabilidade' }))

    expect(await screen.findByText('Erro ao carregar rastreabilidade.')).toBeInTheDocument()

    rastreabilidadeOk = true
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText('Cadeia do lote LT-2026-0142')).toBeInTheDocument()
  })
})
