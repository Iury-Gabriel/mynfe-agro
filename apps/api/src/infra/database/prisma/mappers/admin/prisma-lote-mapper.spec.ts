import { Prisma } from '@prisma/client'
import { makeLote } from '@test/factories/make-lote'
import { describe, expect, it } from 'vitest'

import { PrismaLoteMapper } from './prisma-lote-mapper'

import type { Lote as PrismaLote } from '@prisma/client'

function makePrismaRow(override: Partial<PrismaLote> = {}): PrismaLote {
  return {
    id: 'lote-1',
    tenantId: 'tenant-1',
    empresaId: 'empresa-1',
    produtoId: 'produto-1',
    codigoLote: 'LOTE-001',
    origemTipo: 'colheita',
    colheitaId: 'colheita-1',
    areaId: 'area-1',
    quantidadeInicial: new Prisma.Decimal('1000.000'),
    quantidadeAtual: new Prisma.Decimal('750.500'),
    validade: new Date('2025-01-01'),
    dataEntrada: new Date('2024-10-01'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    deletedAt: null,
    ...override,
  }
}

describe('PrismaLoteMapper', () => {
  describe('toDomain', () => {
    it('mapeia todos os campos do registro Prisma para a entidade', () => {
      const lote = PrismaLoteMapper.toDomain(makePrismaRow())

      expect(lote.id.toString()).toBe('lote-1')
      expect(lote.tenantId).toBe('tenant-1')
      expect(lote.empresaId).toBe('empresa-1')
      expect(lote.produtoId).toBe('produto-1')
      expect(lote.codigoLote).toBe('LOTE-001')
      expect(lote.origemTipo).toBe('colheita')
      expect(lote.colheitaId).toBe('colheita-1')
      expect(lote.areaId).toBe('area-1')
      expect(lote.quantidadeInicial).toBe(1000)
      expect(lote.quantidadeAtual).toBe(750.5)
      expect(lote.validade).toEqual(new Date('2025-01-01'))
      expect(lote.dataEntrada).toEqual(new Date('2024-10-01'))
      expect(lote.deletedAt).toBeNull()
    })

    it('preserva campos nullable como null', () => {
      const lote = PrismaLoteMapper.toDomain(
        makePrismaRow({ origemTipo: null, colheitaId: null, areaId: null, validade: null }),
      )
      expect(lote.origemTipo).toBeNull()
      expect(lote.colheitaId).toBeNull()
      expect(lote.areaId).toBeNull()
      expect(lote.validade).toBeNull()
    })
  })

  describe('toPrismaCreate', () => {
    it('serializa a entidade para o input de criação', () => {
      const lote = makeLote({ id: 'lote-9', codigoLote: 'LOTE-9', quantidadeAtual: 500 })

      const data = PrismaLoteMapper.toPrismaCreate(lote)

      expect(data.id).toBe('lote-9')
      expect(data.codigoLote).toBe('LOTE-9')
      expect(data.quantidadeAtual).toBe(500)
      expect(data.origemTipo).toBe('colheita')
    })
  })

  describe('toPrismaUpdate', () => {
    it('serializa a entidade para o input de atualização sem id', () => {
      const lote = makeLote({ id: 'lote-7', quantidadeAtual: 200 })

      const data = PrismaLoteMapper.toPrismaUpdate(lote)

      expect(data).not.toHaveProperty('id')
      expect(data.quantidadeAtual).toBe(200)
      expect(data.updatedAt).toEqual(lote.updatedAt)
    })
  })
})
