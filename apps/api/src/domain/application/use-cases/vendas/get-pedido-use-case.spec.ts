import { makePedido } from '@test/factories/make-pedido'
import { makeRemessa } from '@test/factories/make-remessa'
import { InMemoryPedidoRepository } from '@test/repositories/in-memory-pedido-repository'
import { InMemoryRemessaRepository } from '@test/repositories/in-memory-remessa-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GetPedidoUseCase } from './get-pedido-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'
import { PedidoNotFoundError } from '@/domain/application/use-cases/errors/pedido-not-found-error'

describe(GetPedidoUseCase.name, () => {
  let pedidoRepo: InMemoryPedidoRepository
  let remessaRepo: InMemoryRemessaRepository
  let sut: GetPedidoUseCase

  beforeEach(() => {
    pedidoRepo = new InMemoryPedidoRepository()
    remessaRepo = new InMemoryRemessaRepository()
    sut = new GetPedidoUseCase(pedidoRepo, remessaRepo)
  })

  it('retorna o pedido com as remessas consolidadas', async () => {
    pedidoRepo.pedidos.push(makePedido({ id: 'pedido-1' }))
    remessaRepo.remessas.push(
      makeRemessa({ id: 'remessa-1', status: 'consolidada', pedidoConsolidadoId: 'pedido-1' }),
    )

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaFaturadoraId: 'empresa-1',
      pedidoId: 'pedido-1',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.pedido.id.toString()).toBe('pedido-1')
      expect(result.value.remessas).toHaveLength(1)
    }
  })

  it('retorna PedidoNotFoundError quando o pedido é de outra empresa', async () => {
    pedidoRepo.pedidos.push(makePedido({ id: 'pedido-1', empresaFaturadoraId: 'outra' }))

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaFaturadoraId: 'empresa-1',
      pedidoId: 'pedido-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(PedidoNotFoundError)
  })

  it('retorna UnexpectedError quando o repositório lança', async () => {
    pedidoRepo.pedidos.push(makePedido({ id: 'pedido-1' }))
    vi.spyOn(remessaRepo, 'findByPedidoConsolidado').mockRejectedValueOnce(new Error('db down'))

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaFaturadoraId: 'empresa-1',
      pedidoId: 'pedido-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
