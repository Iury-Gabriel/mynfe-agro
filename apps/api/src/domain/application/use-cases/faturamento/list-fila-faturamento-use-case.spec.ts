import { makeNotaFiscal } from '@test/factories/make-nota-fiscal'
import { makePedido } from '@test/factories/make-pedido'
import { InMemoryNotaFiscalRepository } from '@test/repositories/in-memory-nota-fiscal-repository'
import { InMemoryPedidoRepository } from '@test/repositories/in-memory-pedido-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ListFilaFaturamentoUseCase } from './list-fila-faturamento-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'

describe(ListFilaFaturamentoUseCase.name, () => {
  let pedidoRepo: InMemoryPedidoRepository
  let notaRepo: InMemoryNotaFiscalRepository
  let sut: ListFilaFaturamentoUseCase

  beforeEach(() => {
    pedidoRepo = new InMemoryPedidoRepository()
    notaRepo = new InMemoryNotaFiscalRepository()
    sut = new ListFilaFaturamentoUseCase(pedidoRepo, notaRepo)
  })

  it('lista pedidos confirmados sem nota autorizada/emitindo', async () => {
    pedidoRepo.pedidos.push(
      makePedido({ id: 'p-1', empresaFaturadoraId: 'empresa-1', status: 'confirmado' }),
      makePedido({ id: 'p-2', empresaFaturadoraId: 'empresa-1', status: 'confirmado' }),
      makePedido({ id: 'p-3', empresaFaturadoraId: 'empresa-1', status: 'rascunho' }),
    )
    notaRepo.notas.push(makeNotaFiscal({ id: 'n-1', pedidoId: 'p-2', status: 'autorizada' }))

    const result = await sut.execute({ tenantId: 'tenant-1', empresaEmitenteId: 'empresa-1', page: 1 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items.map((p) => p.id.toString())).toEqual(['p-1'])
      expect(result.value.total).toBe(1)
    }
  })

  it('inclui pedido cuja nota anterior foi rejeitada', async () => {
    pedidoRepo.pedidos.push(makePedido({ id: 'p-1', empresaFaturadoraId: 'empresa-1', status: 'confirmado' }))
    notaRepo.notas.push(makeNotaFiscal({ id: 'n-1', pedidoId: 'p-1', status: 'rejeitada' }))

    const result = await sut.execute({ tenantId: 'tenant-1', empresaEmitenteId: 'empresa-1', page: 1 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items).toHaveLength(1)
    }
  })

  it('exclui pedido com nota em emissão', async () => {
    pedidoRepo.pedidos.push(makePedido({ id: 'p-1', empresaFaturadoraId: 'empresa-1', status: 'confirmado' }))
    notaRepo.notas.push(makeNotaFiscal({ id: 'n-1', pedidoId: 'p-1', status: 'emitindo' }))

    const result = await sut.execute({ tenantId: 'tenant-1', empresaEmitenteId: 'empresa-1', page: 1 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items).toHaveLength(0)
    }
  })

  it('filtra por cliente', async () => {
    pedidoRepo.pedidos.push(
      makePedido({ id: 'p-1', empresaFaturadoraId: 'empresa-1', status: 'confirmado', clienteId: 'c-1' }),
      makePedido({ id: 'p-2', empresaFaturadoraId: 'empresa-1', status: 'confirmado', clienteId: 'c-2' }),
    )

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaEmitenteId: 'empresa-1',
      clienteId: 'c-1',
      page: 1,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items.map((p) => p.id.toString())).toEqual(['p-1'])
    }
  })

  it('retorna UnexpectedError quando o repositório lança', async () => {
    vi.spyOn(pedidoRepo, 'findManyByEmpresa').mockRejectedValueOnce(new Error('boom'))

    const result = await sut.execute({ tenantId: 'tenant-1', empresaEmitenteId: 'empresa-1', page: 1 })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
