import { makeAtividadeCampo } from '@test/factories/make-atividade-campo'
import { describe, expect, it } from 'vitest'

import { PrismaAtividadeCampoMapper } from './prisma-atividade-campo-mapper'

import type { AtividadeCampo as PrismaAtividadeCampo } from '@prisma/client'

function makePrismaRow(override: Partial<PrismaAtividadeCampo> = {}): PrismaAtividadeCampo {
  return {
    id: 'atividade-1',
    tenantId: 'tenant-1',
    safraId: 'safra-1',
    areaId: 'area-1',
    tipo: 'plantio',
    data: new Date('2024-10-01'),
    responsavelUsuarioId: 'user-1',
    observacoes: 'Plantio direto',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    deletedAt: null,
    ...override,
  }
}

describe('PrismaAtividadeCampoMapper', () => {
  describe('toDomain', () => {
    it('mapeia todos os campos do registro Prisma para a entidade', () => {
      const atividade = PrismaAtividadeCampoMapper.toDomain(makePrismaRow())

      expect(atividade.id.toString()).toBe('atividade-1')
      expect(atividade.tenantId).toBe('tenant-1')
      expect(atividade.safraId).toBe('safra-1')
      expect(atividade.areaId).toBe('area-1')
      expect(atividade.tipo).toBe('plantio')
      expect(atividade.data).toEqual(new Date('2024-10-01'))
      expect(atividade.responsavelUsuarioId).toBe('user-1')
      expect(atividade.observacoes).toBe('Plantio direto')
      expect(atividade.createdAt).toEqual(new Date('2024-01-01'))
      expect(atividade.updatedAt).toEqual(new Date('2024-01-02'))
      expect(atividade.deletedAt).toBeNull()
    })

    it('mapeia campos opcionais nulos para null', () => {
      const atividade = PrismaAtividadeCampoMapper.toDomain(
        makePrismaRow({ safraId: null, areaId: null, responsavelUsuarioId: null, observacoes: null }),
      )
      expect(atividade.safraId).toBeNull()
      expect(atividade.areaId).toBeNull()
      expect(atividade.responsavelUsuarioId).toBeNull()
      expect(atividade.observacoes).toBeNull()
    })

    it('preserva deletedAt quando presente', () => {
      const deletedAt = new Date('2024-02-01')
      const atividade = PrismaAtividadeCampoMapper.toDomain(makePrismaRow({ deletedAt }))
      expect(atividade.deletedAt).toEqual(deletedAt)
    })
  })

  describe('toPrismaCreate', () => {
    it('serializa a entidade para o input de criação', () => {
      const atividade = makeAtividadeCampo({
        id: 'atividade-9',
        tipo: 'pulverizacao',
        safraId: 'safra-2',
      })

      const data = PrismaAtividadeCampoMapper.toPrismaCreate(atividade)

      expect(data.id).toBe('atividade-9')
      expect(data.tenantId).toBe('tenant-1')
      expect(data.tipo).toBe('pulverizacao')
      expect(data.safraId).toBe('safra-2')
    })
  })

  describe('toPrismaUpdate', () => {
    it('serializa a entidade para o input de atualização sem id', () => {
      const atividade = makeAtividadeCampo({ id: 'atividade-7', tipo: 'adubacao' })

      const data = PrismaAtividadeCampoMapper.toPrismaUpdate(atividade)

      expect(data).not.toHaveProperty('id')
      expect(data.tipo).toBe('adubacao')
      expect(data.updatedAt).toEqual(atividade.updatedAt)
    })
  })
})
