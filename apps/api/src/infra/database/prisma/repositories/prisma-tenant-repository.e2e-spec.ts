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
    await prisma.usuarioEmpresa.deleteMany()
    await prisma.empresa.deleteMany()
    await prisma.user.deleteMany()
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

  describe('findManyPaginated + count', () => {
    it('retorna tenants com contagens de empresas e usuários', async () => {
      const tenant = makeTenant({ nome: 'Com Contagens' })
      await sut.create(tenant)
      const tenantId = tenant.id.toString()

      await prisma.user.create({
        data: {
          id: randomUUID(),
          email: `${randomUUID()}@e2e.com`,
          name: 'User',
          tenantId,
        },
      })
      const empresaId = randomUUID()
      await prisma.empresa.create({
        data: {
          id: empresaId,
          tenantId,
          tipoPessoa: 'PJ',
          razaoSocial: 'Empresa E2E',
          cnpjCpf: '11222333000181',
          regimeTributario: 'simples_nacional',
          crt: '1',
        },
      })

      const items = await sut.findManyPaginated({ page: 1, perPage: 20 })
      const total = await sut.count()

      expect(total).toBe(1)
      const summary = items.find((i) => i.tenant.id.toString() === tenantId)
      expect(summary).toBeDefined()
      expect(summary!.empresasCount).toBe(1)
      expect(summary!.usuariosCount).toBe(1)
    })

    it('aplica skip/take na paginação e ordena por createdAt desc', async () => {
      const older = makeTenant({ nome: 'Antigo' })
      const newer = makeTenant({ nome: 'Novo' })
      await sut.create(older)
      await sut.create(newer)
      await prisma.tenant.update({
        where: { id: older.id.toString() },
        data: { createdAt: new Date('2020-01-01') },
      })
      await prisma.tenant.update({
        where: { id: newer.id.toString() },
        data: { createdAt: new Date('2026-01-01') },
      })

      const firstPage = await sut.findManyPaginated({ page: 1, perPage: 1 })
      expect(firstPage).toHaveLength(1)
      expect(firstPage[0].tenant.nome).toBe('Novo')

      const secondPage = await sut.findManyPaginated({ page: 2, perPage: 1 })
      expect(secondPage[0].tenant.nome).toBe('Antigo')
    })

    it('não conta tenants soft-deletados', async () => {
      const tenant = makeTenant()
      await sut.create(tenant)
      await prisma.tenant.update({
        where: { id: tenant.id.toString() },
        data: { deletedAt: new Date() },
      })

      expect(await sut.count()).toBe(0)
      expect(await sut.findManyPaginated({ page: 1, perPage: 20 })).toHaveLength(0)
    })
  })

  describe('updateStatus', () => {
    it('persiste a mudança de status', async () => {
      const tenant = makeTenant()
      await sut.create(tenant)

      await sut.updateStatus(tenant.id.toString(), 'suspenso')

      const found = await sut.findById(tenant.id.toString())
      expect(found!.status).toBe('suspenso')
    })
  })
})
