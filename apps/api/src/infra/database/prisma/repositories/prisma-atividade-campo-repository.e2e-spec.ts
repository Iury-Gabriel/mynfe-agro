import { randomUUID } from 'node:crypto'

import { describe, it, expect, beforeEach } from 'vitest'

import { PrismaAtividadeCampoRepository } from './prisma-atividade-campo-repository'

import type { PrismaService } from '../prisma.service'
import type { AtividadeCampoTipo } from '@/domain/enterprise/entities/atividade-campo'
import type { PrismaClient } from '@prisma/client'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { AtividadeCampo } from '@/domain/enterprise/entities/atividade-campo'

function makeAtividade(
  tenantId: string,
  override: Partial<{ id: string; tipo: AtividadeCampoTipo; observacoes: string | null }> = {},
): AtividadeCampo {
  return AtividadeCampo.create(
    {
      tenantId,
      tipo: override.tipo ?? 'plantio',
      data: new Date('2024-10-01'),
      observacoes: override.observacoes ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
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

describe(PrismaAtividadeCampoRepository.name, () => {
  let prisma: PrismaClient
  let sut: PrismaAtividadeCampoRepository

  beforeEach(async () => {
    prisma = globalThis.__E2E_PRISMA__!
    sut = new PrismaAtividadeCampoRepository(prisma as unknown as PrismaService)
    await prisma.atividadeCampo.deleteMany()
    await prisma.tenant.deleteMany()
  })

  describe('create + findById', () => {
    it('persiste e recupera atividade pelo id dentro do tenant', async () => {
      const tenantId = await createTenant(prisma)
      const atividade = makeAtividade(tenantId, { tipo: 'irrigacao', observacoes: 'Pivô' })

      await sut.create(atividade)
      const found = await sut.findById(atividade.id.toString(), tenantId)

      expect(found).not.toBeNull()
      expect(found!.tipo).toBe('irrigacao')
      expect(found!.observacoes).toBe('Pivô')
      expect(found!.safraId).toBeNull()
    })

    it('retorna null para id inexistente', async () => {
      const tenantId = await createTenant(prisma)
      const found = await sut.findById(randomUUID(), tenantId)
      expect(found).toBeNull()
    })

    it('retorna null quando a atividade pertence a outro tenant (isolamento)', async () => {
      const tenantA = await createTenant(prisma)
      const tenantB = await createTenant(prisma)
      const atividade = makeAtividade(tenantA)
      await sut.create(atividade)

      const found = await sut.findById(atividade.id.toString(), tenantB)
      expect(found).toBeNull()
    })

    it('não retorna atividade soft-deletada', async () => {
      const tenantId = await createTenant(prisma)
      const atividade = makeAtividade(tenantId)
      await sut.create(atividade)
      await prisma.atividadeCampo.update({
        where: { id: atividade.id.toString() },
        data: { deletedAt: new Date() },
      })

      const found = await sut.findById(atividade.id.toString(), tenantId)
      expect(found).toBeNull()
    })
  })

  describe('findManyByTenant + count', () => {
    it('lista apenas atividades do tenant, paginadas e sem soft-deletadas', async () => {
      const tenantA = await createTenant(prisma)
      const tenantB = await createTenant(prisma)
      await sut.create(makeAtividade(tenantA))
      await sut.create(makeAtividade(tenantA))
      await sut.create(makeAtividade(tenantB))
      const deleted = makeAtividade(tenantA)
      await sut.create(deleted)
      await prisma.atividadeCampo.update({
        where: { id: deleted.id.toString() },
        data: { deletedAt: new Date() },
      })

      const items = await sut.findManyByTenant(tenantA, { page: 1, perPage: 10 })
      const total = await sut.count(tenantA)

      expect(items).toHaveLength(2)
      expect(total).toBe(2)
      expect(items.every((a) => a.tenantId === tenantA)).toBe(true)
    })

    it('aplica take/skip por página', async () => {
      const tenantId = await createTenant(prisma)
      await sut.create(makeAtividade(tenantId))
      await sut.create(makeAtividade(tenantId))
      await sut.create(makeAtividade(tenantId))

      const page1 = await sut.findManyByTenant(tenantId, { page: 1, perPage: 2 })
      const page2 = await sut.findManyByTenant(tenantId, { page: 2, perPage: 2 })

      expect(page1).toHaveLength(2)
      expect(page2).toHaveLength(1)
      const ids = new Set([...page1, ...page2].map((a) => a.id.toString()))
      expect(ids.size).toBe(3)
    })
  })

  describe('save', () => {
    it('atualiza os campos persistidos', async () => {
      const tenantId = await createTenant(prisma)
      const atividade = makeAtividade(tenantId, { tipo: 'plantio' })
      await sut.create(atividade)

      atividade.updateCadastro({ tipo: 'adubacao', observacoes: 'NPK' })
      await sut.save(atividade)

      const found = await sut.findById(atividade.id.toString(), tenantId)
      expect(found!.tipo).toBe('adubacao')
      expect(found!.observacoes).toBe('NPK')
    })
  })
})
