import { Prisma } from '@prisma/client'
import { makeRemessa } from '@test/factories/make-remessa'
import { makeRemessaItem } from '@test/factories/make-remessa-item'
import { describe, expect, it } from 'vitest'

import { PrismaRemessaMapper } from './prisma-remessa-mapper'

import type { Remessa as PrismaRemessa, RemessaItem as PrismaRemessaItem } from '@prisma/client'

type PrismaRemessaWithItens = PrismaRemessa & { itens: PrismaRemessaItem[] }

function makePrismaItemRow(override: Partial<PrismaRemessaItem> = {}): PrismaRemessaItem {
  return {
    id: 'remessa-item-1',
    tenantId: 'tenant-1',
    remessaId: 'remessa-1',
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

function makePrismaRow(override: Partial<PrismaRemessaWithItens> = {}): PrismaRemessaWithItens {
  return {
    id: 'remessa-1',
    tenantId: 'tenant-1',
    empresaFaturadoraId: 'empresa-1',
    clienteId: 'cliente-1',
    numero: '000001',
    status: 'aberta',
    pedidoConsolidadoId: null,
    valorEstimado: new Prisma.Decimal('1500.50'),
    data: new Date('2024-10-01'),
    observacoes: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    deletedAt: null,
    itens: [],
    ...override,
  }
}

describe('PrismaRemessaMapper', () => {
  describe('toDomain', () => {
    it('mapeia todos os campos do registro Prisma para a entidade sem itens', () => {
      const remessa = PrismaRemessaMapper.toDomain(makePrismaRow())

      expect(remessa.id.toString()).toBe('remessa-1')
      expect(remessa.tenantId).toBe('tenant-1')
      expect(remessa.empresaFaturadoraId).toBe('empresa-1')
      expect(remessa.clienteId).toBe('cliente-1')
      expect(remessa.numero).toBe('000001')
      expect(remessa.status).toBe('aberta')
      expect(remessa.pedidoConsolidadoId).toBeNull()
      expect(remessa.valorEstimado).toBe(1500.5)
      expect(remessa.data).toEqual(new Date('2024-10-01'))
      expect(remessa.observacoes).toBeNull()
      expect(remessa.itens).toHaveLength(0)
      expect(remessa.createdAt).toEqual(new Date('2024-01-01'))
      expect(remessa.updatedAt).toEqual(new Date('2024-01-02'))
      expect(remessa.deletedAt).toBeNull()
    })

    it('mapeia os itens aninhados para entidades de domínio', () => {
      const remessa = PrismaRemessaMapper.toDomain(
        makePrismaRow({ itens: [makePrismaItemRow({ id: 'remessa-item-1', loteId: 'lote-1' })] }),
      )

      expect(remessa.itens).toHaveLength(1)
      expect(remessa.itens[0].id.toString()).toBe('remessa-item-1')
      expect(remessa.itens[0].loteId).toBe('lote-1')
      expect(remessa.itens[0].quantidade).toBe(100)
    })

    it('preserva pedidoConsolidadoId e observacoes quando presentes', () => {
      const remessa = PrismaRemessaMapper.toDomain(
        makePrismaRow({
          pedidoConsolidadoId: 'pedido-1',
          observacoes: 'obs',
          status: 'consolidada',
        }),
      )

      expect(remessa.pedidoConsolidadoId).toBe('pedido-1')
      expect(remessa.observacoes).toBe('obs')
      expect(remessa.status).toBe('consolidada')
    })

    it('preserva deletedAt quando presente', () => {
      const deletedAt = new Date('2024-02-01')
      const remessa = PrismaRemessaMapper.toDomain(makePrismaRow({ deletedAt }))
      expect(remessa.deletedAt).toEqual(deletedAt)
    })
  })

  describe('toPrismaCreate', () => {
    it('serializa a entidade para o input de criação com itens aninhados', () => {
      const remessa = makeRemessa({
        id: 'remessa-9',
        valorEstimado: 2000,
        pedidoConsolidadoId: 'pedido-1',
        observacoes: 'obs',
        itens: [makeRemessaItem({ id: 'remessa-item-9' })],
      })

      const data = PrismaRemessaMapper.toPrismaCreate(remessa)

      expect(data.id).toBe('remessa-9')
      expect(data.tenantId).toBe('tenant-1')
      expect(data.empresaFaturadoraId).toBe('empresa-1')
      expect(data.clienteId).toBe('cliente-1')
      expect(data.numero).toBe('000001')
      expect(data.status).toBe('aberta')
      expect(data.pedidoConsolidadoId).toBe('pedido-1')
      expect(data.valorEstimado).toBe(2000)
      expect(data.data).toEqual(new Date('2024-10-01'))
      expect(data.observacoes).toBe('obs')
      expect(data.createdAt).toEqual(new Date('2024-01-01'))
      expect(data.updatedAt).toEqual(new Date('2024-01-01'))
      expect(data.deletedAt).toBeNull()

      const nested = data.itens?.create
      const itens = Array.isArray(nested) ? nested : [nested]
      expect(itens).toHaveLength(1)
      expect(itens[0]?.id).toBe('remessa-item-9')
    })

    it('serializa o create com array de itens vazio quando não há itens', () => {
      const remessa = makeRemessa({ itens: [] })
      const data = PrismaRemessaMapper.toPrismaCreate(remessa)

      const nested = data.itens?.create
      const itens = Array.isArray(nested) ? nested : [nested]
      expect(itens).toHaveLength(0)
    })
  })

  describe('toPrismaUpdate', () => {
    it('serializa apenas os campos mutáveis da entidade', () => {
      const remessa = makeRemessa({
        status: 'consolidada',
        pedidoConsolidadoId: 'pedido-1',
        valorEstimado: 999,
        observacoes: 'atualizado',
        updatedAt: new Date('2024-03-01'),
        deletedAt: new Date('2024-03-02'),
      })

      const data = PrismaRemessaMapper.toPrismaUpdate(remessa)

      expect(data.status).toBe('consolidada')
      expect(data.pedidoConsolidadoId).toBe('pedido-1')
      expect(data.valorEstimado).toBe(999)
      expect(data.observacoes).toBe('atualizado')
      expect(data.updatedAt).toEqual(new Date('2024-03-01'))
      expect(data.deletedAt).toEqual(new Date('2024-03-02'))
    })

    it('mapeia campos nullable para null no update', () => {
      const remessa = makeRemessa({ pedidoConsolidadoId: null, observacoes: null })
      const data = PrismaRemessaMapper.toPrismaUpdate(remessa)
      expect(data.pedidoConsolidadoId).toBeNull()
      expect(data.observacoes).toBeNull()
      expect(data.deletedAt).toBeNull()
    })
  })
})
