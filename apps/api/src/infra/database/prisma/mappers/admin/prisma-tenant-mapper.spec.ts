import { makeTenant } from '@test/factories'
import { describe, expect, it } from 'vitest'

import { PrismaTenantMapper } from './prisma-tenant-mapper'

import type { Tenant as PrismaTenant } from '@prisma/client'

function makePrismaRow(override: Partial<PrismaTenant> = {}): PrismaTenant {
  return {
    id: 'tenant-1',
    nome: 'Fazenda Teste',
    status: 'ativo',
    labelArea: 'Talhão',
    diaCorteConsolidacao: 10,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    deletedAt: null,
    ...override,
  }
}

describe('PrismaTenantMapper', () => {
  describe('toDomain', () => {
    it('mapeia todos os campos do registro Prisma para a entidade', () => {
      const tenant = PrismaTenantMapper.toDomain(makePrismaRow())

      expect(tenant.id.toString()).toBe('tenant-1')
      expect(tenant.nome).toBe('Fazenda Teste')
      expect(tenant.status).toBe('ativo')
      expect(tenant.labelArea).toBe('Talhão')
      expect(tenant.diaCorteConsolidacao).toBe(10)
      expect(tenant.createdAt).toEqual(new Date('2024-01-01'))
      expect(tenant.updatedAt).toEqual(new Date('2024-01-02'))
      expect(tenant.deletedAt).toBeNull()
    })

    it('preserva diaCorteConsolidacao null e deletedAt', () => {
      const deletedAt = new Date('2024-03-01')
      const tenant = PrismaTenantMapper.toDomain(
        makePrismaRow({ diaCorteConsolidacao: null, deletedAt }),
      )
      expect(tenant.diaCorteConsolidacao).toBeNull()
      expect(tenant.deletedAt).toEqual(deletedAt)
    })
  })

  describe('toPrismaCreate', () => {
    it('serializa a entidade para o input de criação', () => {
      const tenant = makeTenant({ id: 'tenant-9', nome: 'Nova', diaCorteConsolidacao: 5 })

      const data = PrismaTenantMapper.toPrismaCreate(tenant)

      expect(data.id).toBe('tenant-9')
      expect(data.nome).toBe('Nova')
      expect(data.status).toBe('ativo')
      expect(data.labelArea).toBe('Talhão')
      expect(data.diaCorteConsolidacao).toBe(5)
    })
  })

  describe('toPrismaUpdate', () => {
    it('serializa a entidade para o input de atualização sem id', () => {
      const tenant = makeTenant({ id: 'tenant-7', nome: 'Renomeada' })

      const data = PrismaTenantMapper.toPrismaUpdate(tenant)

      expect(data).not.toHaveProperty('id')
      expect(data.nome).toBe('Renomeada')
      expect(data.updatedAt).toEqual(tenant.updatedAt)
    })
  })
})
