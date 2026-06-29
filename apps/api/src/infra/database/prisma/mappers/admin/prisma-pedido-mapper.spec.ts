import { Prisma } from '@prisma/client'
import { makePedido } from '@test/factories/make-pedido'
import { makePedidoItem } from '@test/factories/make-pedido-item'
import { describe, expect, it } from 'vitest'

import { PrismaPedidoMapper } from './prisma-pedido-mapper'

import type { Pedido as PrismaPedido, PedidoItem as PrismaPedidoItem } from '@prisma/client'

type PrismaPedidoWithItens = PrismaPedido & { itens: PrismaPedidoItem[] }

function makePrismaItemRow(override: Partial<PrismaPedidoItem> = {}): PrismaPedidoItem {
  return {
    id: 'pedido-item-1',
    tenantId: 'tenant-1',
    pedidoId: 'pedido-1',
    produtoId: 'produto-1',
    loteId: null,
    quantidade: new Prisma.Decimal('100.000'),
    precoUnitario: new Prisma.Decimal('10.00'),
    valorTotal: new Prisma.Decimal('1000.00'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
    ...override,
  }
}

function makePrismaRow(override: Partial<PrismaPedidoWithItens> = {}): PrismaPedidoWithItens {
  return {
    id: 'pedido-1',
    tenantId: 'tenant-1',
    empresaFaturadoraId: 'empresa-1',
    clienteId: 'cliente-1',
    numero: '000001',
    tipo: 'avulso',
    status: 'rascunho',
    valorTotal: new Prisma.Decimal('1500.50'),
    periodoConsolidacao: null,
    data: new Date('2024-10-01'),
    observacoes: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    deletedAt: null,
    itens: [],
    ...override,
  }
}

describe('PrismaPedidoMapper', () => {
  describe('toDomain', () => {
    it('mapeia todos os campos do registro Prisma para a entidade sem itens', () => {
      const pedido = PrismaPedidoMapper.toDomain(makePrismaRow())

      expect(pedido.id.toString()).toBe('pedido-1')
      expect(pedido.tenantId).toBe('tenant-1')
      expect(pedido.empresaFaturadoraId).toBe('empresa-1')
      expect(pedido.clienteId).toBe('cliente-1')
      expect(pedido.numero).toBe('000001')
      expect(pedido.tipo).toBe('avulso')
      expect(pedido.status).toBe('rascunho')
      expect(pedido.valorTotal).toBe(1500.5)
      expect(pedido.periodoConsolidacao).toBeNull()
      expect(pedido.data).toEqual(new Date('2024-10-01'))
      expect(pedido.observacoes).toBeNull()
      expect(pedido.itens).toHaveLength(0)
      expect(pedido.createdAt).toEqual(new Date('2024-01-01'))
      expect(pedido.updatedAt).toEqual(new Date('2024-01-02'))
      expect(pedido.deletedAt).toBeNull()
    })

    it('mapeia os itens aninhados para entidades de domínio', () => {
      const pedido = PrismaPedidoMapper.toDomain(
        makePrismaRow({ itens: [makePrismaItemRow({ id: 'pedido-item-1', loteId: 'lote-1' })] }),
      )

      expect(pedido.itens).toHaveLength(1)
      expect(pedido.itens[0].id.toString()).toBe('pedido-item-1')
      expect(pedido.itens[0].loteId).toBe('lote-1')
      expect(pedido.itens[0].quantidade).toBe(100)
    })

    it('preserva periodoConsolidacao e observacoes quando presentes', () => {
      const periodoConsolidacao = new Date('2024-09-30')
      const pedido = PrismaPedidoMapper.toDomain(
        makePrismaRow({ periodoConsolidacao, observacoes: 'obs', status: 'confirmado', tipo: 'consolidado' }),
      )

      expect(pedido.periodoConsolidacao).toEqual(periodoConsolidacao)
      expect(pedido.observacoes).toBe('obs')
      expect(pedido.status).toBe('confirmado')
      expect(pedido.tipo).toBe('consolidado')
    })

    it('preserva deletedAt quando presente', () => {
      const deletedAt = new Date('2024-02-01')
      const pedido = PrismaPedidoMapper.toDomain(makePrismaRow({ deletedAt }))
      expect(pedido.deletedAt).toEqual(deletedAt)
    })
  })

  describe('toPrismaCreate', () => {
    it('serializa a entidade para o input de criação com itens aninhados', () => {
      const pedido = makePedido({
        id: 'pedido-9',
        valorTotal: 2000,
        observacoes: 'obs',
        itens: [makePedidoItem({ id: 'pedido-item-9' })],
      })

      const data = PrismaPedidoMapper.toPrismaCreate(pedido)

      expect(data.id).toBe('pedido-9')
      expect(data.tenantId).toBe('tenant-1')
      expect(data.empresaFaturadoraId).toBe('empresa-1')
      expect(data.clienteId).toBe('cliente-1')
      expect(data.numero).toBe('000001')
      expect(data.tipo).toBe('avulso')
      expect(data.status).toBe('rascunho')
      expect(data.valorTotal).toBe(2000)
      expect(data.periodoConsolidacao).toBeNull()
      expect(data.data).toEqual(new Date('2024-10-01'))
      expect(data.observacoes).toBe('obs')
      expect(data.createdAt).toEqual(new Date('2024-01-01'))
      expect(data.updatedAt).toEqual(new Date('2024-01-01'))
      expect(data.deletedAt).toBeNull()

      const nested = data.itens?.create
      const itens = Array.isArray(nested) ? nested : [nested]
      expect(itens).toHaveLength(1)
      expect(itens[0]?.id).toBe('pedido-item-9')
    })

    it('serializa o create com array de itens vazio quando não há itens', () => {
      const pedido = makePedido({ itens: [] })
      const data = PrismaPedidoMapper.toPrismaCreate(pedido)

      const nested = data.itens?.create
      const itens = Array.isArray(nested) ? nested : [nested]
      expect(itens).toHaveLength(0)
    })
  })

  describe('toPrismaUpdate', () => {
    it('serializa apenas os campos mutáveis da entidade', () => {
      const pedido = makePedido({
        status: 'confirmado',
        tipo: 'consolidado',
        valorTotal: 999,
        periodoConsolidacao: new Date('2024-09-30'),
        observacoes: 'atualizado',
        updatedAt: new Date('2024-03-01'),
        deletedAt: new Date('2024-03-02'),
      })

      const data = PrismaPedidoMapper.toPrismaUpdate(pedido)

      expect(data.status).toBe('confirmado')
      expect(data.tipo).toBe('consolidado')
      expect(data.valorTotal).toBe(999)
      expect(data.periodoConsolidacao).toEqual(new Date('2024-09-30'))
      expect(data.observacoes).toBe('atualizado')
      expect(data.updatedAt).toEqual(new Date('2024-03-01'))
      expect(data.deletedAt).toEqual(new Date('2024-03-02'))
    })

    it('mapeia campos nullable para null no update', () => {
      const pedido = makePedido({ periodoConsolidacao: null, observacoes: null })
      const data = PrismaPedidoMapper.toPrismaUpdate(pedido)
      expect(data.periodoConsolidacao).toBeNull()
      expect(data.observacoes).toBeNull()
      expect(data.deletedAt).toBeNull()
    })
  })
})
