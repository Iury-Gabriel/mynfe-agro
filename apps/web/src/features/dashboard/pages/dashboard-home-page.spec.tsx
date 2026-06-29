import { screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DashboardHomePage } from './dashboard-home-page'

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

function makeResumo(overrides: Record<string, unknown> = {}) {
  return {
    vendasNoPeriodo: 184520,
    totalPedidos: 12,
    totalRemessas: 6,
    notasEmitidas: 38,
    notasPendentes: 2,
    posicaoEstoque: { totalLotes: 126, lotesVencendo: 4 },
    safrasEmAndamento: 3,
    ...overrides,
  }
}

describe('DashboardHomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    activeEmpresaId = 'e1'
  })

  it('mostra o gate quando não há empresa ativa', () => {
    activeEmpresaId = null
    renderWithProviders(<DashboardHomePage />)
    expect(screen.getByText(/Selecione uma empresa ativa/i)).toBeInTheDocument()
    expect(api.get).not.toHaveBeenCalled()
  })

  it('mostra estado de carregamento', () => {
    vi.mocked(api.get).mockReturnValue(
      new Promise(() => {
        return
      }),
    )
    renderWithProviders(<DashboardHomePage />)
    expect(screen.getByText(/Carregando resumo/i)).toBeInTheDocument()
  })

  it('renderiza os KPIs e safras com dados reais', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { resumo: makeResumo() } })

    renderWithProviders(<DashboardHomePage />)

    await waitFor(() => expect(screen.getByText('Vendas no mês')).toBeInTheDocument())
    expect(screen.getByText('Notas emitidas')).toBeInTheDocument()
    expect(screen.getByText('/ 2 pend.')).toBeInTheDocument()
    expect(screen.getByText('Safras em andamento')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText(/4 vencendo/i)).toBeInTheDocument()
  })

  it('mostra mensagem de vazio quando não há movimento', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        resumo: makeResumo({
          vendasNoPeriodo: 0,
          totalPedidos: 0,
          totalRemessas: 0,
          notasEmitidas: 0,
          notasPendentes: 0,
          posicaoEstoque: { totalLotes: 0, lotesVencendo: 0 },
          safrasEmAndamento: 0,
        }),
      },
    })

    renderWithProviders(<DashboardHomePage />)

    await waitFor(() =>
      expect(screen.getByText(/Nenhum movimento registrado no período/i)).toBeInTheDocument(),
    )
  })

  it('mostra estado de erro', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('falhou'))

    renderWithProviders(<DashboardHomePage />)

    await waitFor(() =>
      expect(screen.getByText(/Erro ao carregar o resumo/i)).toBeInTheDocument(),
    )
  })
})
