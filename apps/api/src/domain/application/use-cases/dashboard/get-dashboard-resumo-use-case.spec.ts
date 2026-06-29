import { makeLote } from '@test/factories/make-lote'
import { makeNotaFiscal } from '@test/factories/make-nota-fiscal'
import { makePedido } from '@test/factories/make-pedido'
import { makeRemessa } from '@test/factories/make-remessa'
import { makeSafra } from '@test/factories/make-safra'
import { InMemoryDashboardRepository } from '@test/repositories/in-memory-dashboard-repository'
import { InMemoryLoteRepository } from '@test/repositories/in-memory-lote-repository'
import { InMemoryNotaFiscalRepository } from '@test/repositories/in-memory-nota-fiscal-repository'
import { InMemoryPedidoRepository } from '@test/repositories/in-memory-pedido-repository'
import { InMemoryRemessaRepository } from '@test/repositories/in-memory-remessa-repository'
import { InMemorySafraRepository } from '@test/repositories/in-memory-safra-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GetDashboardResumoUseCase } from './get-dashboard-resumo-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'

const periodoInicio = new Date('2024-10-01')
const periodoFim = new Date('2024-10-31')

describe(GetDashboardResumoUseCase.name, () => {
  let pedidos: InMemoryPedidoRepository
  let remessas: InMemoryRemessaRepository
  let notas: InMemoryNotaFiscalRepository
  let lotes: InMemoryLoteRepository
  let safras: InMemorySafraRepository
  let dashboard: InMemoryDashboardRepository
  let sut: GetDashboardResumoUseCase

  beforeEach(() => {
    pedidos = new InMemoryPedidoRepository()
    remessas = new InMemoryRemessaRepository()
    notas = new InMemoryNotaFiscalRepository()
    lotes = new InMemoryLoteRepository()
    safras = new InMemorySafraRepository()
    dashboard = new InMemoryDashboardRepository(pedidos, remessas, notas, lotes, safras)
    sut = new GetDashboardResumoUseCase(dashboard)
  })

  function input() {
    return { tenantId: 'tenant-1', empresaId: 'empresa-1', periodoInicio, periodoFim }
  }

  it('agrega vendas, pedidos, remessas, notas, estoque e safras da empresa no período', async () => {
    pedidos.pedidos.push(
      makePedido({ id: 'p-1', status: 'faturado', valorTotal: 1000, data: new Date('2024-10-05') }),
      makePedido({ id: 'p-2', status: 'confirmado', valorTotal: 500, data: new Date('2024-10-10') }),
      makePedido({ id: 'p-3', status: 'rascunho', valorTotal: 999, data: new Date('2024-10-10') }),
      makePedido({ id: 'p-4', status: 'faturado', valorTotal: 7, data: new Date('2024-09-30') }),
    )
    remessas.remessas.push(
      makeRemessa({ id: 'r-1', data: new Date('2024-10-02') }),
      makeRemessa({ id: 'r-2', data: new Date('2024-11-02') }),
    )
    notas.notas.push(
      makeNotaFiscal({ id: 'n-1', status: 'autorizada' }),
      makeNotaFiscal({ id: 'n-2', status: 'pendente' }),
      makeNotaFiscal({ id: 'n-3', status: 'emitindo' }),
      makeNotaFiscal({ id: 'n-4', status: 'rejeitada' }),
      makeNotaFiscal({ id: 'n-5', status: 'cancelada' }),
    )
    lotes.lotes.push(
      makeLote({ id: 'l-1', validade: new Date('2024-11-02') }),
      makeLote({ id: 'l-2', validade: new Date('2025-01-01') }),
      makeLote({ id: 'l-3', validade: null }),
    )
    safras.safras.push(
      makeSafra({ id: 's-1', status: 'em_andamento' }),
      makeSafra({ id: 's-2', status: 'planejado' }),
    )

    const result = await sut.execute(input())

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      const { resumo } = result.value
      expect(resumo.vendasNoPeriodo).toBe(1500)
      expect(resumo.totalPedidos).toBe(3)
      expect(resumo.totalRemessas).toBe(1)
      expect(resumo.notasEmitidas).toBe(1)
      expect(resumo.notasPendentes).toBe(3)
      expect(resumo.posicaoEstoque.totalLotes).toBe(3)
      expect(resumo.posicaoEstoque.lotesVencendo).toBe(1)
      expect(resumo.safrasEmAndamento).toBe(1)
    }
  })

  it('isola por tenant e empresa', async () => {
    pedidos.pedidos.push(
      makePedido({ id: 'p-1', tenantId: 'tenant-2', status: 'faturado', valorTotal: 100, data: new Date('2024-10-05') }),
      makePedido({ id: 'p-2', empresaFaturadoraId: 'outra', status: 'faturado', valorTotal: 100, data: new Date('2024-10-05') }),
    )

    const result = await sut.execute(input())

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.resumo.vendasNoPeriodo).toBe(0)
      expect(result.value.resumo.totalPedidos).toBe(0)
    }
  })

  it('retorna zeros quando não há dados', async () => {
    const result = await sut.execute(input())

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.resumo).toEqual({
        vendasNoPeriodo: 0,
        totalPedidos: 0,
        totalRemessas: 0,
        notasEmitidas: 0,
        notasPendentes: 0,
        posicaoEstoque: { totalLotes: 0, lotesVencendo: 0 },
        safrasEmAndamento: 0,
      })
    }
  })

  it('retorna UnexpectedError quando o repositório lança', async () => {
    vi.spyOn(dashboard, 'resumo').mockRejectedValueOnce(new Error('db down'))

    const result = await sut.execute(input())

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
