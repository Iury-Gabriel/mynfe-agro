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
          jusante: { pedidoItens: [{ id: 'pi1' }], remessaItens: [] },
        },
      })
    })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<LotesPage />)

    await screen.findByText('LT-2026-0142')
    await user.click(screen.getByRole('button', { name: 'Ver rastreabilidade' }))

    expect(await screen.findByText('1 documento(s) vinculado(s).')).toBeInTheDocument()
    expect(screen.getByText('Sem colheita de origem')).toBeInTheDocument()
  })

  it('exibe erro na rastreabilidade com retry', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/api/lotes') {
        return Promise.resolve({
          data: { lotes: [makeLote()], total: 1, page: 1, perPage: 20, totalPages: 1 },
        })
      }
      return Promise.reject(new Error('boom'))
    })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<LotesPage />)

    await screen.findByText('LT-2026-0142')
    await user.click(screen.getByRole('button', { name: 'Ver rastreabilidade' }))

    expect(await screen.findByText('Erro ao carregar rastreabilidade.')).toBeInTheDocument()
  })
})
