import { randomUUID } from 'node:crypto'

import { describe, it, expect, beforeEach } from 'vitest'

import { PrismaCustoProducaoRepository } from './prisma-custo-producao-repository'

import type { PrismaService } from '../prisma.service'
import type { CustoProducaoTipo } from '@/domain/enterprise/entities/custo-producao'
import type { PrismaClient } from '@prisma/client'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { CustoProducao } from '@/domain/enterprise/entities/custo-producao'

function makeCusto(
  tenantId: string,
  override: Partial<{ id: string; tipo: CustoProducaoTipo; descricao: string; valor: number }> = {},
): CustoProducao {
  return CustoProducao.create(
    {
      tenantId,
      tipo: override.tipo ?? 'insumo',
      descricao: override.descricao ?? 'Adubo NPK',
      valor: override.valor ?? 5000,
      data: new Date('2024-10-01'),
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

describe(PrismaCustoProducaoRepository.name, () => {
  let prisma: PrismaClient
  let sut: PrismaCustoProducaoRepository

  beforeEach(async () => {
    prisma = globalThis.__E2E_PRISMA__!
    sut = new PrismaCustoProducaoRepository(prisma as unknown as PrismaService)
    await prisma.custoProducao.deleteMany()
    await prisma.tenant.deleteMany()
  })

  describe('create + findById', () => {
    it('persiste e recupera custo pelo id dentro do tenant', async () => {
      const tenantId = await createTenant(prisma)
      const custo = makeCusto(tenantId, { descricao: 'Semente', valor: 1234.56 })

      await sut.create(custo)
      const found = await sut.findById(custo.id.toString(), tenantId)

      expect(found).not.toBeNull()
      expect(found!.descricao).toBe('Semente')
      expect(found!.valor).toBe(1234.56)
      expect(found!.safraId).toBeNull()
    })

    it('retorna null para id inexistente', async () => {
      const tenantId = await createTenant(prisma)
      const found = await sut.findById(randomUUID(), tenantId)
      expect(found).toBeNull()
    })

    it('retorna null quando o custo pertence a outro tenant (isolamento)', async () => {
      const tenantA = await createTenant(prisma)
      const tenantB = await createTenant(prisma)
      const custo = makeCusto(tenantA)
      await sut.create(custo)

      const found = await sut.findById(custo.id.toString(), tenantB)
      expect(found).toBeNull()
    })

    it('não retorna custo soft-deletado', async () => {
      const tenantId = await createTenant(prisma)
      const custo = makeCusto(tenantId)
      await sut.create(custo)
      await prisma.custoProducao.update({
        where: { id: custo.id.toString() },
        data: { deletedAt: new Date() },
      })

      const found = await sut.findById(custo.id.toString(), tenantId)
      expect(found).toBeNull()
    })
  })

  describe('findManyByTenant + count', () => {
    it('lista apenas custos do tenant, paginados e sem soft-deletados', async () => {
      const tenantA = await createTenant(prisma)
      const tenantB = await createTenant(prisma)
      await sut.create(makeCusto(tenantA))
      await sut.create(makeCusto(tenantA))
      await sut.create(makeCusto(tenantB))
      const deleted = makeCusto(tenantA)
      await sut.create(deleted)
      await prisma.custoProducao.update({
        where: { id: deleted.id.toString() },
        data: { deletedAt: new Date() },
      })

      const items = await sut.findManyByTenant(tenantA, { page: 1, perPage: 10 })
      const total = await sut.count(tenantA)

      expect(items).toHaveLength(2)
      expect(total).toBe(2)
      expect(items.every((c) => c.tenantId === tenantA)).toBe(true)
    })

    it('aplica take/skip por página', async () => {
      const tenantId = await createTenant(prisma)
      await sut.create(makeCusto(tenantId))
      await sut.create(makeCusto(tenantId))
      await sut.create(makeCusto(tenantId))

      const page1 = await sut.findManyByTenant(tenantId, { page: 1, perPage: 2 })
      const page2 = await sut.findManyByTenant(tenantId, { page: 2, perPage: 2 })

      expect(page1).toHaveLength(2)
      expect(page2).toHaveLength(1)
      const ids = new Set([...page1, ...page2].map((c) => c.id.toString()))
      expect(ids.size).toBe(3)
    })
  })

  describe('save', () => {
    it('atualiza os campos persistidos', async () => {
      const tenantId = await createTenant(prisma)
      const custo = makeCusto(tenantId, { descricao: 'Original', valor: 100 })
      await sut.create(custo)

      custo.updateCadastro({ descricao: 'Atualizado', valor: 999 })
      await sut.save(custo)

      const found = await sut.findById(custo.id.toString(), tenantId)
      expect(found!.descricao).toBe('Atualizado')
      expect(found!.valor).toBe(999)
    })
  })
})
