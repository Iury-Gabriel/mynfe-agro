import { Prisma } from '@prisma/client'
import { makeNotaFiscalItem } from '@test/factories'
import { describe, expect, it } from 'vitest'

import { PrismaNotaFiscalItemMapper } from './prisma-nota-fiscal-item-mapper'

import type { NotaFiscalItem as PrismaNotaFiscalItem } from '@prisma/client'

function makePrismaRow(override: Partial<PrismaNotaFiscalItem> = {}): PrismaNotaFiscalItem {
  return {
    id: 'nota-item-1',
    tenantId: 'tenant-1',
    notaFiscalId: 'nota-1',
    produtoId: 'produto-1',
    descricao: 'Soja a granel',
    ncm: '12019000',
    cfop: '5101',
    cstCsosn: '102',
    quantidade: new Prisma.Decimal('100.000'),
    valorUnitario: new Prisma.Decimal('10.00'),
    valorTotal: new Prisma.Decimal('1000.00'),
    impostos: { icms: { aliquota: 12 } },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    ...override,
  }
}

describe('PrismaNotaFiscalItemMapper', () => {
  describe('toDomain', () => {
    it('mapeia todos os campos do registro Prisma para a entidade', () => {
      const item = PrismaNotaFiscalItemMapper.toDomain(makePrismaRow())

      expect(item.id.toString()).toBe('nota-item-1')
      expect(item.tenantId).toBe('tenant-1')
      expect(item.notaFiscalId).toBe('nota-1')
      expect(item.produtoId).toBe('produto-1')
      expect(item.descricao).toBe('Soja a granel')
      expect(item.ncm).toBe('12019000')
      expect(item.cfop).toBe('5101')
      expect(item.cstCsosn).toBe('102')
      expect(item.quantidade).toBe(100)
      expect(item.valorUnitario).toBe(10)
      expect(item.valorTotal).toBe(1000)
      expect(item.impostos).toEqual({ icms: { aliquota: 12 } })
      expect(item.createdAt).toEqual(new Date('2024-01-01'))
      expect(item.updatedAt).toEqual(new Date('2024-01-02'))
    })

    it('mapeia campos nullable para null e impostos não-objeto para {}', () => {
      const item = PrismaNotaFiscalItemMapper.toDomain(
        makePrismaRow({ ncm: null, cfop: null, cstCsosn: null, impostos: null }),
      )

      expect(item.ncm).toBeNull()
      expect(item.cfop).toBeNull()
      expect(item.cstCsosn).toBeNull()
      expect(item.impostos).toEqual({})
    })

    it('mapeia impostos em formato de array para {}', () => {
      const item = PrismaNotaFiscalItemMapper.toDomain(makePrismaRow({ impostos: [1, 2] }))
      expect(item.impostos).toEqual({})
    })
  })

  describe('toPrismaCreate', () => {
    it('serializa a entidade para o input de criação', () => {
      const item = makeNotaFiscalItem({ id: 'nota-item-9', impostos: { pis: 1.65 } })
      const data = PrismaNotaFiscalItemMapper.toPrismaCreate(item)

      expect(data.id).toBe('nota-item-9')
      expect(data.notaFiscalId).toBe('nota-1')
      expect(data.descricao).toBe('Soja a granel')
      expect(data.quantidade).toBe(100)
      expect(data.impostos).toEqual({ pis: 1.65 })
    })
  })

  describe('toPrismaCreateNested', () => {
    it('serializa sem notaFiscalId (gerenciado pela relação aninhada)', () => {
      const item = makeNotaFiscalItem({ id: 'nota-item-7' })
      const data = PrismaNotaFiscalItemMapper.toPrismaCreateNested(item)

      expect(data.id).toBe('nota-item-7')
      expect(data).not.toHaveProperty('notaFiscalId')
      expect(data.produtoId).toBe('produto-1')
    })
  })
})
