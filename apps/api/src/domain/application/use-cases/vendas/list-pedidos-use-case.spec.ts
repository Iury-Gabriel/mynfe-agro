import { makePedido } from '@test/factories/make-pedido'
import { InMemoryPedidoRepository } from '@test/repositories/in-memory-pedido-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ListPedidosUseCase } from './list-pedidos-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'

describe(ListPedidosUseCase.name, () => {
  let pedidoRepo: InMemoryPedidoRepository
  let sut: ListPedidosUseCase

  beforeEach(() => {
    pedidoRepo = new InMemoryPedidoRepository()
    sut = new ListPedidosUseCase(pedidoRepo)
  })

  it('lista pedidos paginados sem filtros', async () => {
    pedidoRepo.pedidos.push(makePedido({ id: 'pedido-1' }))
    pedidoRepo.pedidos.push(makePedido({ id: 'pedido-2', empresaFaturadoraId: 'outra' }))

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaFaturadoraId: 'empresa-1',
      page: 1,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items).toHaveLength(1)
      expect(result.value.total).toBe(1)
    }
  })

  it('aplica os filtros informados', async () => {
    pedidoRepo.pedidos.push(makePedido({ id: 'pedido-1', status: 'rascunho' }))
    pedidoRepo.pedidos.push(makePedido({ id: 'pedido-2', status: 'confirmado' }))

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaFaturadoraId: 'empresa-1',
      filtros: { status: 'confirmado' },
      page: 1,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items).toHaveLength(1)
      expect(result.value.items[0].id.toString()).toBe('pedido-2')
    }
  })

  it('retorna UnexpectedError quando o repositório lança', async () => {
    vi.spyOn(pedidoRepo, 'count').mockRejectedValueOnce(new Error('db down'))

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaFaturadoraId: 'empresa-1',
      page: 1,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
