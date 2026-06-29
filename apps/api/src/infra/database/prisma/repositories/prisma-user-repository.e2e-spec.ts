import { randomUUID } from 'node:crypto'

import { describe, it, expect, beforeEach } from 'vitest'

import { PrismaUserRepository } from './prisma-user-repository'

import type { PrismaService } from '../prisma.service'
import type { PrismaClient } from '@prisma/client'

async function createTestUser(
  prisma: PrismaClient,
  override?: Partial<{ name: string; email: string; tenantId: string }>,
) {
  return prisma.user.create({
    data: {
      id: randomUUID(),
      email: override?.email ?? `test-${randomUUID()}@example.com`,
      name: override?.name ?? 'Test User',
      emailVerified: false,
      tenantId: override?.tenantId ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })
}

async function createTenant(prisma: PrismaClient): Promise<string> {
  const tenant = await prisma.tenant.create({ data: { nome: `tenant-${randomUUID()}` } })
  return tenant.id
}

async function createTestRole(prisma: PrismaClient, override?: Partial<{ name: string }>) {
  const roleId = randomUUID()
  await prisma.role.create({
    data: {
      id: roleId,
      name: override?.name ?? `role-${randomUUID()}`,
      description: null,
      isSystem: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })
  return roleId
}

describe(PrismaUserRepository.name, () => {
  let prisma: PrismaClient
  let sut: PrismaUserRepository

  beforeEach(async () => {
    prisma = globalThis.__E2E_PRISMA__!
    sut = new PrismaUserRepository(prisma as unknown as PrismaService)
    await prisma.userRoleAssignment.deleteMany()
    await prisma.rolePermission.deleteMany()
    await prisma.role.deleteMany()
    await prisma.auditEvent.deleteMany()
    await prisma.user.deleteMany()
    await prisma.tenant.deleteMany()
  })

  describe('findById', () => {
    it('returns null for non-existent id', async () => {
      const result = await sut.findById(randomUUID())

      expect(result).toBeNull()
    })

    it('finds a user with correct roleIds', async () => {
      const user = await createTestUser(prisma)
      const roleIdA = await createTestRole(prisma)
      const roleIdB = await createTestRole(prisma)
      await prisma.userRoleAssignment.createMany({
        data: [
          { userId: user.id, roleId: roleIdA },
          { userId: user.id, roleId: roleIdB },
        ],
      })

      const result = await sut.findById(user.id)

      expect(result).not.toBeNull()
      expect(result!.id.toString()).toBe(user.id)
      expect(result!.email).toBe(user.email)
      expect(result!.roleIds).toHaveLength(2)
      expect([...result!.roleIds]).toEqual(expect.arrayContaining([roleIdA, roleIdB]))
    })
  })

  describe('findByEmail', () => {
    it('returns null for non-existent email', async () => {
      const result = await sut.findByEmail('nobody@example.com')

      expect(result).toBeNull()
    })

    it('finds a user by email', async () => {
      const user = await createTestUser(prisma, { email: 'alice@example.com' })

      const result = await sut.findByEmail('alice@example.com')

      expect(result).not.toBeNull()
      expect(result!.id.toString()).toBe(user.id)
      expect(result!.email).toBe('alice@example.com')
    })
  })

  describe('findMany', () => {
    it('returns first page with nextCursor when there are more rows', async () => {
      const tenantId = await createTenant(prisma)
      await createTestUser(prisma, { name: 'Charlie', tenantId })
      await createTestUser(prisma, { name: 'Alice', tenantId })
      await createTestUser(prisma, { name: 'Bob', tenantId })

      const result = await sut.findMany(tenantId, { limit: 2 })

      expect(result.users).toHaveLength(2)
      expect(result.nextCursor).not.toBeNull()
    })

    it('returns nextCursor null on the last page', async () => {
      const tenantId = await createTenant(prisma)
      await createTestUser(prisma, { name: 'Alice', tenantId })
      await createTestUser(prisma, { name: 'Bob', tenantId })

      const result = await sut.findMany(tenantId, { limit: 10 })

      expect(result.users).toHaveLength(2)
      expect(result.nextCursor).toBeNull()
    })

    it('continues from the cursor without repeating rows (orders by id desc)', async () => {
      const tenantId = await createTenant(prisma)
      for (let i = 0; i < 5; i++) {
        await createTestUser(prisma, { name: `User ${i}`, tenantId })
      }

      const first = await sut.findMany(tenantId, { limit: 2 })
      const second = await sut.findMany(tenantId, { limit: 2, cursor: first.nextCursor! })

      const firstIds = first.users.map((u) => u.id.toString())
      const secondIds = second.users.map((u) => u.id.toString())
      expect(firstIds.some((id) => secondIds.includes(id))).toBe(false)
      for (const id of secondIds) {
        expect(id < firstIds[firstIds.length - 1]).toBe(true)
      }
    })

    it('retorna usuários sem enriquecer roleIds (enriquecimento é do use-case)', async () => {
      const tenantId = await createTenant(prisma)
      const userA = await createTestUser(prisma, { name: 'Alice', tenantId })
      await createTestUser(prisma, { name: 'Bob', tenantId })
      const roleId = await createTestRole(prisma)
      await prisma.userRoleAssignment.create({ data: { userId: userA.id, roleId } })

      const result = await sut.findMany(tenantId, { limit: 10 })

      const alice = result.users.find((u) => u.id.toString() === userA.id)
      expect([...alice!.roleIds]).toEqual([])
    })

    it('isola por tenant: não retorna usuários de outro tenant', async () => {
      const tenantA = await createTenant(prisma)
      const tenantB = await createTenant(prisma)
      const userA = await createTestUser(prisma, { name: 'Alice', tenantId: tenantA })
      await createTestUser(prisma, { name: 'Bob', tenantId: tenantB })

      const result = await sut.findMany(tenantA, { limit: 10 })

      expect(result.users).toHaveLength(1)
      expect(result.users[0].id.toString()).toBe(userA.id)
    })
  })

  describe('saveWithAudit', () => {
    const seedAudit = {
      actorUserId: 'actor-audit',
      action: 'user.deactivate' as const,
      resourceType: 'user' as const,
    }

    it('persiste a mutação e o audit event atomicamente', async () => {
      const raw = await createTestUser(prisma)
      const user = await sut.findById(raw.id)
      user!.deactivate()

      await sut.saveWithAudit(user!, { ...seedAudit, resourceId: raw.id })

      const persisted = await prisma.user.findUnique({ where: { id: raw.id } })
      expect(persisted!.isActive).toBe(false)
      const event = await prisma.auditEvent.findFirst({ where: { actorUserId: 'actor-audit' } })
      expect(event).not.toBeNull()
      expect(event!.action).toBe('user.deactivate')
    })

    it('persiste isActive=true após reativar', async () => {
      const raw = await prisma.user.create({
        data: {
          id: randomUUID(),
          email: `test-${randomUUID()}@example.com`,
          name: 'Inactive User',
          emailVerified: false,
          isActive: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })
      const user = await sut.findById(raw.id)
      user!.reactivate()

      await sut.saveWithAudit(user!, { ...seedAudit, resourceId: raw.id })

      const persisted = await prisma.user.findUnique({ where: { id: raw.id } })
      expect(persisted!.isActive).toBe(true)
    })

    it('persiste isProtected corretamente', async () => {
      const raw = await createTestUser(prisma)
      const user = await sut.findById(raw.id)
      expect(user!.isProtected).toBe(false)

      await sut.saveWithAudit(user!, { ...seedAudit, resourceId: raw.id })

      const persisted = await prisma.user.findUnique({ where: { id: raw.id } })
      expect(persisted!.isProtected).toBe(false)
    })

    it('persiste alterações de name e email', async () => {
      const raw = await createTestUser(prisma)
      const user = await sut.findById(raw.id)
      user!.updateName('Nome Atualizado')
      user!.updateEmail('atualizado@example.com')

      await sut.saveWithAudit(user!, { ...seedAudit, resourceId: raw.id })

      const persisted = await prisma.user.findUnique({ where: { id: raw.id } })
      expect(persisted!.name).toBe('Nome Atualizado')
      expect(persisted!.email).toBe('atualizado@example.com')
    })
  })

  describe('deleteById', () => {
    it('removes the user', async () => {
      const user = await createTestUser(prisma)

      await sut.deleteById(user.id, {
        actorUserId: 'actor-1',
        action: 'user.delete',
        resourceType: 'user',
        resourceId: user.id,
      })

      const persisted = await prisma.user.findUnique({ where: { id: user.id } })
      expect(persisted).toBeNull()
    })

    it('persiste audit event junto com o deleteById', async () => {
      const user = await createTestUser(prisma)

      await sut.deleteById(user.id, {
        actorUserId: 'actor-audit',
        action: 'user.delete',
        resourceType: 'user',
        resourceId: user.id,
      })

      const event = await prisma.auditEvent.findFirst({ where: { actorUserId: 'actor-audit' } })
      expect(event).not.toBeNull()
      expect(event!.action).toBe('user.delete')
    })
  })
})
