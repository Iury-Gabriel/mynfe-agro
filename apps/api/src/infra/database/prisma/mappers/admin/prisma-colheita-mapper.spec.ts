import { Prisma } from '@prisma/client'
import { makeColheita } from '@test/factories/make-colheita'
import { describe, expect, it } from 'vitest'

import { PrismaColheitaMapper } from './prisma-colheita-mapper'

import type { Colheita as PrismaColheita } from '@prisma/client'

function makePrismaRow(override: Partial<PrismaColheita> = {}): PrismaColheita {
  return {
    id: 'colheita-1',
    tenantId: 'tenant-1',
    empresaId: 'empresa-1',
    produtoId: 'produto-1',
    safraId: 'safra-1',
    areaId: 'area-1',
    quantidade: new Prisma.Decimal('1500.500'),
    data: new Date('2024-10-01'),
    responsavelUsuarioId: 'user-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    deletedAt: null,
    ...override,
  }
}

describe('PrismaColheitaMapper', () => {
  describe('toDomain', () => {
    it('mapeia todos os campos do registro Prisma para a entidade', () => {
      const colheita = PrismaColheitaMapper.toDomain(makePrismaRow())

      expect(colheita.id.toString()).toBe('colheita-1')
      expect(colheita.tenantId).toBe('tenant-1')
      expect(colheita.empresaId).toBe('empresa-1')
      expect(colheita.produtoId).toBe('produto-1')
      expect(colheita.safraId).toBe('safra-1')
      expect(colheita.areaId).toBe('area-1')
      expect(colheita.quantidade).toBe(1500.5)
      expect(colheita.data).toEqual(new Date('2024-10-01'))
      expect(colheita.responsavelUsuarioId).toBe('user-1')
      expect(colheita.createdAt).toEqual(new Date('2024-01-01'))
      expect(colheita.updatedAt).toEqual(new Date('2024-01-02'))
      expect(colheita.deletedAt).toBeNull()
    })

    it('preserva campos nullable como null', () => {
      const colheita = PrismaColheitaMapper.toDomain(
        makePrismaRow({ safraId: null, areaId: null, responsavelUsuarioId: null }),
      )
      expect(colheita.safraId).toBeNull()
      expect(colheita.areaId).toBeNull()
      expect(colheita.responsavelUsuarioId).toBeNull()
    })

    it('preserva deletedAt quando presente', () => {
      const deletedAt = new Date('2024-02-01')
      const colheita = PrismaColheitaMapper.toDomain(makePrismaRow({ deletedAt }))
      expect(colheita.deletedAt).toEqual(deletedAt)
    })
  })

  describe('toPrismaCreate', () => {
    it('serializa a entidade para o input de criação com Decimal como number', () => {
      const colheita = makeColheita({ id: 'colheita-9', quantidade: 800.25 })

      const data = PrismaColheitaMapper.toPrismaCreate(colheita)

      expect(data.id).toBe('colheita-9')
      expect(data.tenantId).toBe('tenant-1')
      expect(data.empresaId).toBe('empresa-1')
      expect(data.produtoId).toBe('produto-1')
      expect(data.quantidade).toBe(800.25)
    })

    it('mapeia campos nullable para null no create', () => {
      const colheita = makeColheita({ safraId: null, areaId: null, responsavelUsuarioId: null })
      const data = PrismaColheitaMapper.toPrismaCreate(colheita)
      expect(data.safraId).toBeNull()
      expect(data.areaId).toBeNull()
      expect(data.responsavelUsuarioId).toBeNull()
    })
  })
})
