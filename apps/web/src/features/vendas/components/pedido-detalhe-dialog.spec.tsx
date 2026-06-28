import { screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PedidoDetalheDialog } from './pedido-detalhe-dialog'

import type { NotaFiscal } from '@/features/fiscal/api/notas-fiscais-api'
import type { Pedido } from '@/features/vendas/api/pedidos-api'

import { api } from '@/lib/api-client'
import { renderWithProviders } from '@/test/render-with-providers'

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}))

function makePedido(overrides: Partial<Pedido> = {}): Pedido {
  return {
    id: 'pd1',
    tenantId: 't1',
    empresaFaturadoraId: 'Empresa Verde',
    clienteId: 'Cliente Alfa',
    numero: 'PED-001',
    tipo: 'consolidado',
    status: 'faturado',
    valorTotal: 1500,
    periodoConsolidacao: '2026-06',
    data: '2026-06-20T00:00:00.000Z',
    observacoes: 'Entregar pela manhã',
    itens: [
      {
        id: 'it1',
        produtoId: 'Soja',
        loteId: 'L-99',
        quantidade: 10,
        precoUnitario: 100,
        valorTotal: 1000,
      },
    ],
    remessas: [{ id: 'rm1', numero: 'REM-001', status: 'consolidada', valorEstimado: 500 }],
    createdAt: '2026-06-20T00:00:00.000Z',
    updatedAt: '2026-06-20T00:00:00.000Z',
    ...overrides,
  }
}

function makeNota(overrides: Partial<NotaFiscal> = {}): NotaFiscal {
  return {
    id: 'nf1',
    tenantId: 't1',
    empresaEmitenteId: 'e1',
    pedidoId: 'pd1',
    clienteId: 'Cliente Alfa',
    numero: '123',
    serie: '1',
    modelo: '55',
    naturezaOperacao: 'Venda',
    status: 'autorizada',
    chaveAcesso: '35260612345678000199550010000001231000000017',
    protocolo: 'p1',
    valorTotal: 1500,
    ambiente: 'producao',
    xmlUrl: 'https://files/nf1.xml',
    danfeUrl: 'https://files/nf1.pdf',
    mensagemRetorno: null,
    dataEmissao: '2026-06-21T00:00:00.000Z',
    itens: [],
    eventos: [],
    createdAt: '2026-06-21T00:00:00.000Z',
    updatedAt: '2026-06-21T00:00:00.000Z',
    ...overrides,
  }
}

function mockGet(nota: NotaFiscal | null, pedido: Pedido): void {
  vi.mocked(api.get).mockImplementation((url: string) => {
    if (url.startsWith('/api/notas-fiscais')) {
      return Promise.resolve({
        data: {
          notas: nota ? [nota] : [],
          total: nota ? 1 : 0,
          page: 1,
          perPage: 100,
          totalPages: 1,
        },
      })
    }
    return Promise.resolve({ data: { pedido } })
  })
}

describe('PedidoDetalheDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza cabeçalho, itens, remessas e DANFE com número/chave/links', async () => {
    const pedido = makePedido()
    mockGet(makeNota(), pedido)

    renderWithProviders(
      <PedidoDetalheDialog open onOpenChange={vi.fn()} empresaId="e1" pedido={pedido} />,
    )

    expect(screen.getByRole('heading', { name: 'Pedido PED-001' })).toBeInTheDocument()
    expect(screen.getByText('Cliente Alfa')).toBeInTheDocument()
    expect(screen.getByText('Soja')).toBeInTheDocument()
    expect(screen.getByText('Situação fiscal (DANFE)')).toBeInTheDocument()

    await waitFor(() => expect(screen.getByText('REM-001')).toBeInTheDocument())
    await waitFor(() => expect(screen.getByText('Autorizada')).toBeInTheDocument())
    expect(
      screen.getByText('35260612345678000199550010000001231000000017'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'DANFE (PDF)' })).toHaveAttribute(
      'href',
      'https://files/nf1.pdf',
    )
    expect(screen.getByRole('link', { name: 'XML' })).toHaveAttribute(
      'href',
      'https://files/nf1.xml',
    )
  })

  it('mostra estado vazio quando não há DANFE emitida', async () => {
    const pedido = makePedido({ tipo: 'avulso', remessas: [] })
    mockGet(null, pedido)

    renderWithProviders(
      <PedidoDetalheDialog open onOpenChange={vi.fn()} empresaId="e1" pedido={pedido} />,
    )

    await waitFor(() =>
      expect(screen.getByText('Nenhuma DANFE emitida para este pedido.')).toBeInTheDocument(),
    )
  })
})
