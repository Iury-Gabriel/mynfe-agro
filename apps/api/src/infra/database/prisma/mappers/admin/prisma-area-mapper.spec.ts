import { Prisma } from '@prisma/client'
import { makeArea } from '@test/factories/make-area'
import { describe, expect, it } from 'vitest'

import { PrismaAreaMapper } from './prisma-area-mapper'

import type { Area as PrismaArea } from '@prisma/client'

function makePrismaRow(override: Partial<PrismaArea> = {}): PrismaArea {
  return {
    id: 'area-1',
    tenantId: 'tenant-1',
    fazendaId: 'fazenda-1',
    identificacao: 'Talhão 01',
    tamanho: new Prisma.Decimal('120.500'),
    unidadeTamanho: 'ha',
    rotulo: 'Soja',
    geometria: { type: 'Polygon', coordinates: [] },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    deletedAt: null,
    ...override,
  }
}

describe('PrismaAreaMapper', () => {
  describe('toDomain', () => {
    it('mapeia todos os campos do registro Prisma para a entidade', () => {
      const area = PrismaAreaMapper.toDomain(makePrismaRow())

      expect(area.id.toString()).toBe('area-1')
      expect(area.tenantId).toBe('tenant-1')
      expect(area.fazendaId).toBe('fazenda-1')
      expect(area.identificacao).toBe('Talhão 01')
      expect(area.tamanho).toBe(120.5)
      expect(area.unidadeTamanho).toBe('ha')
      expect(area.rotulo).toBe('Soja')
      expect(area.geometria).toEqual({ type: 'Polygon', coordinates: [] })
      expect(area.createdAt).toEqual(new Date('2024-01-01'))
      expect(area.updatedAt).toEqual(new Date('2024-01-02'))
      expect(area.deletedAt).toBeNull()
    })

    it('mapeia tamanho null para null', () => {
      const area = PrismaAreaMapper.toDomain(makePrismaRow({ tamanho: null }))
      expect(area.tamanho).toBeNull()
    })

    it('mapeia geometria null para null', () => {
      const area = PrismaAreaMapper.toDomain(makePrismaRow({ geometria: null }))
      expect(area.geometria).toBeNull()
    })

    it('mapeia geometria não-objeto (array) para null', () => {
      const area = PrismaAreaMapper.toDomain(makePrismaRow({ geometria: [1, 2, 3] }))
      expect(area.geometria).toBeNull()
    })

    it('mapeia geometria primitiva para null', () => {
      const area = PrismaAreaMapper.toDomain(makePrismaRow({ geometria: 'foo' }))
      expect(area.geometria).toBeNull()
    })

    it('preserva deletedAt quando presente', () => {
      const deletedAt = new Date('2024-02-01')
      const area = PrismaAreaMapper.toDomain(makePrismaRow({ deletedAt }))
      expect(area.deletedAt).toEqual(deletedAt)
    })
  })

  describe('toPrismaCreate', () => {
    it('serializa a entidade para o input de criação', () => {
      const area = makeArea({
        id: 'area-9',
        identificacao: 'Talhão 09',
        tamanho: 50.25,
        unidadeTamanho: 'alq',
        rotulo: 'Milho',
        geometria: { type: 'Point' },
      })

      const data = PrismaAreaMapper.toPrismaCreate(area)

      expect(data.id).toBe('area-9')
      expect(data.tenantId).toBe('tenant-1')
      expect(data.fazendaId).toBe('fazenda-1')
      expect(data.identificacao).toBe('Talhão 09')
      expect(data.tamanho).toBe(50.25)
      expect(data.unidadeTamanho).toBe('alq')
      expect(data.rotulo).toBe('Milho')
      expect(data.geometria).toEqual({ type: 'Point' })
    })

    it('mapeia geometria null para Prisma.JsonNull no create', () => {
      const area = makeArea({ geometria: null })
      const data = PrismaAreaMapper.toPrismaCreate(area)
      expect(data.geometria).toBe(Prisma.JsonNull)
    })
  })

  describe('toPrismaUpdate', () => {
    it('serializa a entidade para o input de atualização sem id', () => {
      const area = makeArea({ id: 'area-7', identificacao: 'Atualizado', tamanho: 99 })

      const data = PrismaAreaMapper.toPrismaUpdate(area)

      expect(data).not.toHaveProperty('id')
      expect(data.identificacao).toBe('Atualizado')
      expect(data.tamanho).toBe(99)
      expect(data.updatedAt).toEqual(area.updatedAt)
    })

    it('mapeia geometria null para Prisma.JsonNull no update', () => {
      const area = makeArea({ geometria: null })
      const data = PrismaAreaMapper.toPrismaUpdate(area)
      expect(data.geometria).toBe(Prisma.JsonNull)
    })
  })
})
