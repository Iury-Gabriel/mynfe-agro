import { Prisma } from '@prisma/client'
import { makeSafra } from '@test/factories/make-safra'
import { describe, expect, it } from 'vitest'

import { PrismaSafraMapper } from './prisma-safra-mapper'

import type { Safra as PrismaSafra } from '@prisma/client'

function makePrismaRow(override: Partial<PrismaSafra> = {}): PrismaSafra {
  return {
    id: 'safra-1',
    tenantId: 'tenant-1',
    areaId: 'area-1',
    cultura: 'Soja',
    variedade: 'Intacta',
    dataPlantio: new Date('2024-10-01'),
    dataColheitaPrevista: new Date('2025-02-01'),
    dataColheitaRealizada: null,
    estimativaProducao: new Prisma.Decimal('1200.500'),
    status: 'em_andamento',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    deletedAt: null,
    ...override,
  }
}

describe('PrismaSafraMapper', () => {
  describe('toDomain', () => {
    it('mapeia todos os campos do registro Prisma para a entidade', () => {
      const safra = PrismaSafraMapper.toDomain(makePrismaRow())

      expect(safra.id.toString()).toBe('safra-1')
      expect(safra.tenantId).toBe('tenant-1')
      expect(safra.areaId).toBe('area-1')
      expect(safra.cultura).toBe('Soja')
      expect(safra.variedade).toBe('Intacta')
      expect(safra.dataPlantio).toEqual(new Date('2024-10-01'))
      expect(safra.dataColheitaPrevista).toEqual(new Date('2025-02-01'))
      expect(safra.dataColheitaRealizada).toBeNull()
      expect(safra.estimativaProducao).toBe(1200.5)
      expect(safra.status).toBe('em_andamento')
      expect(safra.createdAt).toEqual(new Date('2024-01-01'))
      expect(safra.updatedAt).toEqual(new Date('2024-01-02'))
      expect(safra.deletedAt).toBeNull()
    })

    it('mapeia estimativaProducao null para null', () => {
      const safra = PrismaSafraMapper.toDomain(makePrismaRow({ estimativaProducao: null }))
      expect(safra.estimativaProducao).toBeNull()
    })

    it('preserva deletedAt quando presente', () => {
      const deletedAt = new Date('2024-02-01')
      const safra = PrismaSafraMapper.toDomain(makePrismaRow({ deletedAt }))
      expect(safra.deletedAt).toEqual(deletedAt)
    })
  })

  describe('toPrismaCreate', () => {
    it('serializa a entidade para o input de criação', () => {
      const safra = makeSafra({
        id: 'safra-9',
        cultura: 'Milho',
        estimativaProducao: 800.25,
        status: 'planejado',
      })

      const data = PrismaSafraMapper.toPrismaCreate(safra)

      expect(data.id).toBe('safra-9')
      expect(data.tenantId).toBe('tenant-1')
      expect(data.areaId).toBe('area-1')
      expect(data.cultura).toBe('Milho')
      expect(data.estimativaProducao).toBe(800.25)
      expect(data.status).toBe('planejado')
    })

    it('mapeia estimativaProducao null para null no create', () => {
      const safra = makeSafra({ estimativaProducao: null })
      const data = PrismaSafraMapper.toPrismaCreate(safra)
      expect(data.estimativaProducao).toBeNull()
    })
  })

  describe('toPrismaUpdate', () => {
    it('serializa a entidade para o input de atualização sem id', () => {
      const safra = makeSafra({ id: 'safra-7', cultura: 'Atualizada', status: 'colhido' })

      const data = PrismaSafraMapper.toPrismaUpdate(safra)

      expect(data).not.toHaveProperty('id')
      expect(data.cultura).toBe('Atualizada')
      expect(data.status).toBe('colhido')
      expect(data.updatedAt).toEqual(safra.updatedAt)
    })
  })
})
