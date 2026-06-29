import { makePedido } from '@test/factories/make-pedido'
import { InMemoryPedidoRepository } from '@test/repositories/in-memory-pedido-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CancelarPedidoUseCase } from './cancelar-pedido-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'
import { PedidoNotFoundError } from '@/domain/application/use-cases/errors/pedido-not-found-error'
import { TransicaoInvalidaError } from '@/domain/application/use-cases/errors/transicao-invalida-error'

describe(CancelarPedidoUseCase.name, () => {
  let pedidoRepo: InMemoryPedidoRepository
  let sut: CancelarPedidoUseCase

  beforeEach(() => {
    pedidoRepo = new InMemoryPedidoRepository()
    sut = new CancelarPedidoUseCase(pedidoRepo)
  })

  it('cancela um pedido em rascunho', async () => {
    pedidoRepo.pedidos.push(makePedido({ id: 'pedido-1', status: 'rascunho' }))

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaFaturadoraId: 'empresa-1',
      pedidoId: 'pedido-1',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.pedido.status).toBe('cancelado')
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

  it('retorna TransicaoInvalidaError quando o pedido já está cancelado', async () => {
    pedidoRepo.pedidos.push(makePedido({ id: 'pedido-1', status: 'cancelado' }))

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaFaturadoraId: 'empresa-1',
      pedidoId: 'pedido-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(TransicaoInvalidaError)
  })

  it('retorna UnexpectedError quando o repositório lança', async () => {
    pedidoRepo.pedidos.push(makePedido({ id: 'pedido-1', status: 'rascunho' }))
    vi.spyOn(pedidoRepo, 'save').mockRejectedValueOnce(new Error('db down'))

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaFaturadoraId: 'empresa-1',
      pedidoId: 'pedido-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
