import { describe, expect, it } from 'vitest'

import { makePedidoItem } from '@test/factories/make-pedido-item'

import { PedidoItem } from './pedido-item'

describe(PedidoItem.name, () => {
  it('calcula valorTotal a partir de quantidade x precoUnitario quando omitido', () => {
    const sut = PedidoItem.create({
      tenantId: 'tenant-1',
      pedidoId: 'pedido-1',
      produtoId: 'produto-1',
      quantidade: 12,
      precoUnitario: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    expect(sut.valorTotal).toBe(60)
    expect(sut.loteId).toBeNull()
    expect(sut.deletedAt).toBeNull()
  })

  it('respeita valorTotal explícito', () => {
    const sut = makePedidoItem({ quantidade: 10, precoUnitario: 5, valorTotal: 99 })

    expect(sut.valorTotal).toBe(99)
  })

  it('expõe getters', () => {
    const created = new Date('2024-01-01')
    const sut = makePedidoItem({
      tenantId: 'tenant-1',
      pedidoId: 'pedido-9',
      produtoId: 'produto-9',
      loteId: 'lote-9',
      quantidade: 3,
      precoUnitario: 7,
      valorTotal: 21,
      createdAt: created,
      updatedAt: created,
    })

    expect(sut.tenantId).toBe('tenant-1')
    expect(sut.pedidoId).toBe('pedido-9')
    expect(sut.produtoId).toBe('produto-9')
    expect(sut.loteId).toBe('lote-9')
    expect(sut.quantidade).toBe(3)
    expect(sut.precoUnitario).toBe(7)
    expect(sut.valorTotal).toBe(21)
    expect(sut.createdAt).toBe(created)
    expect(sut.updatedAt).toBe(created)
    expect(sut.deletedAt).toBeNull()
  })
})
