import { randomUUID } from 'node:crypto'

import { describe, it, expect, beforeEach } from 'vitest'

import { PrismaTenantRepository } from './prisma-tenant-repository'

import type { PrismaService } from '../prisma.service'
import type { PrismaClient } from '@prisma/client'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Tenant } from '@/domain/enterprise/entities/tenant'

function makeTenant(override: Partial<{ id: string; nome: string }> = {}): Tenant {
  return Tenant.create(
    {
      nome: override.nome ?? 'Fazenda Teste',
      labelArea: 'Talhão',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID(override.id),
  )
}

describe(PrismaTenantRepository.name, () => {
  let prisma: PrismaClient
  let sut: PrismaTenantRepository

  beforeEach(async () => {
    prisma = globalThis.__E2E_PRISMA__!
    sut = new PrismaTenantRepository(prisma as unknown as PrismaService)
    await prisma.empresa.deleteMany()
    await prisma.tenant.deleteMany()
  })

  describe('create + findById', () => {
    it('persiste e recupera tenant pelo id', async () => {
      const tenant = makeTenant({ nome: 'Persistido' })
      await sut.create(tenant)

      const found = await sut.findById(tenant.id.toString())
      expect(found).not.toBeNull()
      expect(found!.nome).toBe('Persistido')
      expect(found!.labelArea).toBe('Talhão')
    })

    it('retorna null para id inexistente', async () => {
      const found = await sut.findById(randomUUID())
      expect(found).toBeNull()
    })

    it('não retorna tenant soft-deletado', async () => {
      const tenant = makeTenant()
      await sut.create(tenant)
      await prisma.tenant.update({
        where: { id: tenant.id.toString() },
        data: { deletedAt: new Date() },
      })

      const found = await sut.findById(tenant.id.toString())
      expect(found).toBeNull()
    })
  })

  describe('save', () => {
    it('atualiza os campos persistidos', async () => {
      const tenant = makeTenant({ nome: 'Original' })
      await sut.create(tenant)

      tenant.rename('Renomeado')
      tenant.deactivate()
      await sut.save(tenant)

      const found = await sut.findById(tenant.id.toString())
      expect(found!.nome).toBe('Renomeado')
      expect(found!.status).toBe('inativo')
    })
  })
})
