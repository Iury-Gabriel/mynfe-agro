import { randomUUID } from 'node:crypto'

import { describe, it, expect, beforeEach } from 'vitest'

import { PrismaAuditoriaLogRepository } from './prisma-auditoria-log-repository'

import type { PrismaService } from '../prisma.service'
import type { AuditoriaAcao } from '@/domain/enterprise/entities/auditoria-log'
import type { PrismaClient } from '@prisma/client'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { AuditoriaLog } from '@/domain/enterprise/entities/auditoria-log'

function makeLog(
  tenantId: string,
  override: Partial<{
    id: string
    usuarioId: string | null
    entidade: string
    acao: AuditoriaAcao
    dadosAntes: Record<string, unknown> | null
    dadosDepois: Record<string, unknown> | null
    data: Date
  }> = {},
): AuditoriaLog {
  return AuditoriaLog.create(
    {
      tenantId,
      usuarioId: override.usuarioId ?? null,
      entidade: override.entidade ?? 'tenant',
      entidadeId: tenantId,
      acao: override.acao ?? 'editar',
      dadosAntes: override.dadosAntes ?? null,
      dadosDepois: override.dadosDepois ?? null,
      data: override.data ?? new Date('2024-01-01'),
    },
    new UniqueEntityID(override.id),
  )
}

async function createTenant(prisma: PrismaClient): Promise<string> {
  const id = randomUUID()
  await prisma.tenant.create({
    data: { id, nome: `Tenant ${id}`, createdAt: new Date(), updatedAt: new Date() },
  })
  return id
}

describe(PrismaAuditoriaLogRepository.name, () => {
  let prisma: PrismaClient
  let sut: PrismaAuditoriaLogRepository

  beforeEach(async () => {
    prisma = globalThis.__E2E_PRISMA__!
    sut = new PrismaAuditoriaLogRepository(prisma as unknown as PrismaService)
    await prisma.auditoriaLog.deleteMany()
    await prisma.tenant.deleteMany()
  })

  describe('create', () => {
    it('persiste log com dadosAntes/dadosDepois JSON', async () => {
      const tenantId = await createTenant(prisma)
      const log = makeLog(tenantId, {
        usuarioId: 'user-1',
        dadosAntes: { nome: 'Antes' },
        dadosDepois: { nome: 'Depois' },
      })

      await sut.create(log)

      const items = await sut.findManyByTenant(tenantId, {}, { page: 1, perPage: 10 })
      expect(items).toHaveLength(1)
      expect(items[0].usuarioId).toBe('user-1')
      expect(items[0].dadosAntes).toEqual({ nome: 'Antes' })
      expect(items[0].dadosDepois).toEqual({ nome: 'Depois' })
    })

    it('persiste log sem JSON (null)', async () => {
      const tenantId = await createTenant(prisma)
      await sut.create(makeLog(tenantId, { acao: 'criar' }))

      const items = await sut.findManyByTenant(tenantId, {}, { page: 1, perPage: 10 })
      expect(items[0].dadosAntes).toBeNull()
      expect(items[0].dadosDepois).toBeNull()
    })
  })

  describe('findManyByTenant + count', () => {
    it('lista apenas logs do tenant ordenados por data desc', async () => {
      const tenantA = await createTenant(prisma)
      const tenantB = await createTenant(prisma)
      await sut.create(makeLog(tenantA, { data: new Date('2024-01-01') }))
      await sut.create(makeLog(tenantA, { data: new Date('2024-03-01') }))
      await sut.create(makeLog(tenantB))

      const items = await sut.findManyByTenant(tenantA, {}, { page: 1, perPage: 10 })
      const total = await sut.count(tenantA, {})

      expect(items).toHaveLength(2)
      expect(total).toBe(2)
      expect(items[0].data.getTime()).toBeGreaterThan(items[1].data.getTime())
    })

    it('filtra por entidade, acao e usuarioId', async () => {
      const tenantId = await createTenant(prisma)
      await sut.create(makeLog(tenantId, { entidade: 'tenant', acao: 'editar', usuarioId: 'u1' }))
      await sut.create(makeLog(tenantId, { entidade: 'produto', acao: 'criar', usuarioId: 'u2' }))

      const items = await sut.findManyByTenant(
        tenantId,
        { entidade: 'tenant', acao: 'editar', usuarioId: 'u1' },
        { page: 1, perPage: 10 },
      )
      const total = await sut.count(
        tenantId,
        { entidade: 'tenant', acao: 'editar', usuarioId: 'u1' },
      )

      expect(items).toHaveLength(1)
      expect(total).toBe(1)
      expect(items[0].entidade).toBe('tenant')
    })

    it('aplica take/skip por página', async () => {
      const tenantId = await createTenant(prisma)
      await sut.create(makeLog(tenantId, { data: new Date('2024-01-01') }))
      await sut.create(makeLog(tenantId, { data: new Date('2024-02-01') }))
      await sut.create(makeLog(tenantId, { data: new Date('2024-03-01') }))

      const page1 = await sut.findManyByTenant(tenantId, {}, { page: 1, perPage: 2 })
      const page2 = await sut.findManyByTenant(tenantId, {}, { page: 2, perPage: 2 })

      expect(page1).toHaveLength(2)
      expect(page2).toHaveLength(1)
    })
  })
})
