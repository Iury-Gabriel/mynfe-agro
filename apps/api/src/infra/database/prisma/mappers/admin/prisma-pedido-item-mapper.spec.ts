import { Prisma } from '@prisma/client'
import { makePedidoItem } from '@test/factories/make-pedido-item'
import { describe, expect, it } from 'vitest'

import { PrismaPedidoItemMapper } from './prisma-pedido-item-mapper'

import type { PedidoItem as PrismaPedidoItem } from '@prisma/client'

function makePrismaRow(override: Partial<PrismaPedidoItem> = {}): PrismaPedidoItem {
  return {
    id: 'pedido-item-1',
    tenantId: 'tenant-1',
    pedidoId: 'pedido-1',
    produtoId: 'produto-1',
    loteId: null,
    quantidade: new Prisma.Decimal('100.500'),
    precoUnitario: new Prisma.Decimal('10.25'),
    valorTotal: new Prisma.Decimal('1030.13'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    deletedAt: null,
    ...override,
  }
}

describe('PrismaPedidoItemMapper', () => {
  describe('toDomain', () => {
    it('mapeia todos os campos do registro Prisma para a entidade com Decimal como number', () => {
      const item = PrismaPedidoItemMapper.toDomain(makePrismaRow())

      expect(item.id.toString()).toBe('pedido-item-1')
      expect(item.tenantId).toBe('tenant-1')
      expect(item.pedidoId).toBe('pedido-1')
      expect(item.produtoId).toBe('produto-1')
      expect(item.loteId).toBeNull()
      expect(item.quantidade).toBe(100.5)
      expect(item.precoUnitario).toBe(10.25)
      expect(item.valorTotal).toBe(1030.13)
      expect(item.createdAt).toEqual(new Date('2024-01-01'))
      expect(item.updatedAt).toEqual(new Date('2024-01-02'))
      expect(item.deletedAt).toBeNull()
    })

    it('preserva loteId quando presente', () => {
      const item = PrismaPedidoItemMapper.toDomain(makePrismaRow({ loteId: 'lote-1' }))
      expect(item.loteId).toBe('lote-1')
    })

    it('preserva deletedAt quando presente', () => {
      const deletedAt = new Date('2024-02-01')
      const item = PrismaPedidoItemMapper.toDomain(makePrismaRow({ deletedAt }))
      expect(item.deletedAt).toEqual(deletedAt)
    })
  })

  describe('toPrismaCreate', () => {
    it('serializa a entidade para o input de criação incluindo pedidoId', () => {
      const item = makePedidoItem({ id: 'pedido-item-9', loteId: 'lote-1', quantidade: 50, precoUnitario: 4 })

      const data = PrismaPedidoItemMapper.toPrismaCreate(item)

      expect(data.id).toBe('pedido-item-9')
      expect(data.tenantId).toBe('tenant-1')
      expect(data.pedidoId).toBe('pedido-1')
      expect(data.produtoId).toBe('produto-1')
      expect(data.loteId).toBe('lote-1')
      expect(data.quantidade).toBe(50)
      expect(data.precoUnitario).toBe(4)
      expect(data.valorTotal).toBe(200)
      expect(data.createdAt).toEqual(new Date('2024-01-01'))
      expect(data.updatedAt).toEqual(new Date('2024-01-01'))
      expect(data.deletedAt).toBeNull()
    })

    it('mapeia loteId nulo para null no create', () => {
      const item = makePedidoItem({ loteId: null })
      const data = PrismaPedidoItemMapper.toPrismaCreate(item)
      expect(data.loteId).toBeNull()
    })
  })

  describe('toPrismaCreateNested', () => {
    it('serializa a entidade omitindo pedidoId para create aninhado', () => {
      const item = makePedidoItem({ id: 'pedido-item-9', loteId: 'lote-1' })

      const data = PrismaPedidoItemMapper.toPrismaCreateNested(item)

      expect(data).not.toHaveProperty('pedidoId')
      expect(data.id).toBe('pedido-item-9')
      expect(data.tenantId).toBe('tenant-1')
      expect(data.produtoId).toBe('produto-1')
      expect(data.loteId).toBe('lote-1')
      expect(data.quantidade).toBe(100)
      expect(data.precoUnitario).toBe(10)
      expect(data.valorTotal).toBe(1000)
      expect(data.createdAt).toEqual(new Date('2024-01-01'))
      expect(data.updatedAt).toEqual(new Date('2024-01-01'))
      expect(data.deletedAt).toBeNull()
    })

    it('mapeia loteId nulo para null no create aninhado', () => {
      const item = makePedidoItem({ loteId: null })
      const data = PrismaPedidoItemMapper.toPrismaCreateNested(item)
      expect(data.loteId).toBeNull()
    })
  })
})
