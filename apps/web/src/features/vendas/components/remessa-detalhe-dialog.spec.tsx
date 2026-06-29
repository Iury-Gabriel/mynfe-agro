import { screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RemessaDetalheDialog } from './remessa-detalhe-dialog'

import type { Remessa } from '@/features/vendas/api/remessas-api'

import { api } from '@/lib/api-client'
import { renderWithProviders } from '@/test/render-with-providers'

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}))

function makeRemessa(overrides: Partial<Remessa> = {}): Remessa {
  return {
    id: 'rm1',
    tenantId: 't1',
    empresaFaturadoraId: 'Empresa Verde',
    clienteId: 'Cliente Alfa',
    numero: 'REM-001',
    status: 'consolidada',
    pedidoConsolidadoId: 'PED-009',
    valorEstimado: 800,
    data: '2026-06-20T00:00:00.000Z',
    observacoes: null,
    itens: [
      {
        id: 'it1',
        produtoId: 'Milho',
        loteId: 'lote-1',
        quantidade: 5,
        precoUnitario: 40,
        valorTotal: 200,
      },
    ],
    lotes: [{ id: 'lote-1', produtoId: 'Milho', codigoLote: 'LOTE-ABC', quantidadeAtual: 50 }],
    createdAt: '2026-06-20T00:00:00.000Z',
    updatedAt: '2026-06-20T00:00:00.000Z',
    ...overrides,
  }
}

describe('RemessaDetalheDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza cabeçalho, item com lote consumido e pedido de consolidação', async () => {
    const remessa = makeRemessa()
    vi.mocked(api.get).mockResolvedValue({ data: { remessa } })

    renderWithProviders(
      <RemessaDetalheDialog open onOpenChange={vi.fn()} empresaId="e1" remessa={remessa} />,
    )

    expect(screen.getByRole('heading', { name: 'Remessa REM-001' })).toBeInTheDocument()
    expect(screen.getByText('Milho')).toBeInTheDocument()

    await waitFor(() =>
      expect(api.get).toHaveBeenCalledWith('/api/remessas/rm1', { params: { empresaId: 'e1' } }),
    )
    await waitFor(() => expect(screen.getByText('Lote: LOTE-ABC')).toBeInTheDocument())
    expect(screen.getByText('PED-009')).toBeInTheDocument()
  })

  it('renderiza observações e item sem lote rastreado e ainda não consolidada', async () => {
    const remessa = makeRemessa({
      status: 'aberta',
      pedidoConsolidadoId: null,
      observacoes: 'Entregar cedo',
      itens: [
        {
          id: 'it1',
          produtoId: 'Trigo',
          loteId: null,
          quantidade: 3,
          precoUnitario: 10,
          valorTotal: 30,
        },
      ],
      lotes: [],
    })
    vi.mocked(api.get).mockResolvedValue({ data: { remessa } })

    renderWithProviders(
      <RemessaDetalheDialog open onOpenChange={vi.fn()} empresaId="e1" remessa={remessa} />,
    )

    expect(screen.getByText('Entregar cedo')).toBeInTheDocument()
    expect(screen.getByText('Trigo')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('Lote: —')).toBeInTheDocument())
    expect(
      screen.getByText('Ainda não consolidada em um pedido mensal.'),
    ).toBeInTheDocument()
  })

  it('mostra estado vazio quando a remessa não tem itens', async () => {
    const remessa = makeRemessa({ itens: [], lotes: [] })
    vi.mocked(api.get).mockResolvedValue({ data: { remessa } })

    renderWithProviders(
      <RemessaDetalheDialog open onOpenChange={vi.fn()} empresaId="e1" remessa={remessa} />,
    )

    await waitFor(() =>
      expect(screen.getByText('Nenhum item nesta remessa.')).toBeInTheDocument(),
    )
  })

  it('não busca dados quando fechado', () => {
    const remessa = makeRemessa()
    vi.mocked(api.get).mockResolvedValue({ data: { remessa } })

    renderWithProviders(
      <RemessaDetalheDialog open={false} onOpenChange={vi.fn()} empresaId="e1" remessa={remessa} />,
    )

    expect(api.get).not.toHaveBeenCalled()
  })

  it('exibe erro ao carregar os detalhes da remessa', async () => {
    const remessa = makeRemessa()
    vi.mocked(api.get).mockRejectedValue(new Error('boom'))

    renderWithProviders(
      <RemessaDetalheDialog open onOpenChange={vi.fn()} empresaId="e1" remessa={remessa} />,
    )

    await waitFor(() =>
      expect(screen.getByText('Erro ao carregar os detalhes da remessa.')).toBeInTheDocument(),
    )
  })
})
