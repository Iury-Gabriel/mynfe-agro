import { Prisma } from '@prisma/client'
import { makeProduto } from '@test/factories'
import { describe, expect, it } from 'vitest'

import { PrismaProdutoMapper } from './prisma-produto-mapper'

import type { Produto as PrismaProduto } from '@prisma/client'

function makePrismaRow(override: Partial<PrismaProduto> = {}): PrismaProduto {
  return {
    id: 'produto-1',
    tenantId: 'tenant-1',
    empresaId: 'empresa-1',
    descricao: 'Soja a granel',
    tipo: 'bruto',
    unidadeMedida: 'KG',
    precoPadrao: new Prisma.Decimal('12.50'),
    ncm: '12019000',
    cest: '170100',
    cfopPadrao: '5101',
    origemMercadoria: '0',
    cstCsosn: '00',
    aliquotas: { icms: 12 },
    status: 'ativo',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    deletedAt: null,
    ...override,
  }
}

describe('PrismaProdutoMapper', () => {
  describe('toDomain', () => {
    it('mapeia todos os campos do registro Prisma para a entidade', () => {
      const produto = PrismaProdutoMapper.toDomain(makePrismaRow())

      expect(produto.id.toString()).toBe('produto-1')
      expect(produto.tenantId).toBe('tenant-1')
      expect(produto.empresaId).toBe('empresa-1')
      expect(produto.descricao).toBe('Soja a granel')
      expect(produto.tipo).toBe('bruto')
      expect(produto.unidadeMedida).toBe('KG')
      expect(produto.precoPadrao).toBe(12.5)
      expect(produto.ncm).toBe('12019000')
      expect(produto.cest).toBe('170100')
      expect(produto.cfopPadrao).toBe('5101')
      expect(produto.origemMercadoria).toBe('0')
      expect(produto.cstCsosn).toBe('00')
      expect(produto.aliquotas).toEqual({ icms: 12 })
      expect(produto.status).toBe('ativo')
      expect(produto.createdAt).toEqual(new Date('2024-01-01'))
      expect(produto.updatedAt).toEqual(new Date('2024-01-02'))
      expect(produto.deletedAt).toBeNull()
    })

    it('mapeia precoPadrao null para null', () => {
      const produto = PrismaProdutoMapper.toDomain(makePrismaRow({ precoPadrao: null }))
      expect(produto.precoPadrao).toBeNull()
    })

    it('mapeia aliquotas null para null', () => {
      const produto = PrismaProdutoMapper.toDomain(makePrismaRow({ aliquotas: null }))
      expect(produto.aliquotas).toBeNull()
    })

    it('mapeia aliquotas não-objeto (array) para null', () => {
      const produto = PrismaProdutoMapper.toDomain(makePrismaRow({ aliquotas: [1, 2] }))
      expect(produto.aliquotas).toBeNull()
    })

    it('preserva deletedAt quando presente', () => {
      const deletedAt = new Date('2024-02-01')
      const produto = PrismaProdutoMapper.toDomain(makePrismaRow({ deletedAt }))
      expect(produto.deletedAt).toEqual(deletedAt)
    })
  })

  describe('toPrismaCreate', () => {
    it('serializa a entidade para o input de criação', () => {
      const produto = makeProduto({
        id: 'produto-9',
        descricao: 'Milho',
        precoPadrao: 30,
        aliquotas: { icms: 7 },
      })

      const data = PrismaProdutoMapper.toPrismaCreate(produto)

      expect(data.id).toBe('produto-9')
      expect(data.tenantId).toBe('tenant-1')
      expect(data.descricao).toBe('Milho')
      expect(data.precoPadrao).toBe(30)
      expect(data.aliquotas).toEqual({ icms: 7 })
      expect(data.status).toBe('ativo')
    })

    it('mapeia aliquotas null para Prisma.JsonNull no create', () => {
      const produto = makeProduto({ aliquotas: null })
      const data = PrismaProdutoMapper.toPrismaCreate(produto)
      expect(data.aliquotas).toBe(Prisma.JsonNull)
    })
  })

  describe('toPrismaUpdate', () => {
    it('serializa a entidade para o input de atualização sem id', () => {
      const produto = makeProduto({ id: 'produto-7', descricao: 'Novo', precoPadrao: 99 })

      const data = PrismaProdutoMapper.toPrismaUpdate(produto)

      expect(data).not.toHaveProperty('id')
      expect(data.descricao).toBe('Novo')
      expect(data.precoPadrao).toBe(99)
      expect(data.updatedAt).toEqual(produto.updatedAt)
    })

    it('mapeia aliquotas null para Prisma.JsonNull no update', () => {
      const produto = makeProduto({ aliquotas: null })
      const data = PrismaProdutoMapper.toPrismaUpdate(produto)
      expect(data.aliquotas).toBe(Prisma.JsonNull)
    })
  })
})
