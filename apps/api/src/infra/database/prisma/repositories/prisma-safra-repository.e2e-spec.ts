import { randomUUID } from 'node:crypto'

import { describe, it, expect, beforeEach } from 'vitest'

import { PrismaSafraRepository } from './prisma-safra-repository'

import type { PrismaService } from '../prisma.service'
import type { PrismaClient } from '@prisma/client'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Safra } from '@/domain/enterprise/entities/safra'

function makeSafra(
  tenantId: string,
  areaId: string,
  override: Partial<{ id: string; cultura: string; estimativaProducao: number | null }> = {},
): Safra {
  return Safra.create(
    {
      tenantId,
      areaId,
      cultura: override.cultura ?? 'Soja',
      estimativaProducao: override.estimativaProducao ?? null,
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

async function createEmpresa(prisma: PrismaClient, tenantId: string): Promise<string> {
  const id = randomUUID()
  await prisma.empresa.create({
    data: {
      id,
      tenantId,
      tipoPessoa: 'PJ',
      razaoSocial: 'Agro LTDA',
      cnpjCpf: randomUUID().replace(/-/g, '').slice(0, 14),
      regimeTributario: 'simples_nacional',
      crt: '1',
      ambienteFiscal: 'homologacao',
      uf: 'MT',
      status: 'ativo',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })
  return id
}

async function createFazenda(prisma: PrismaClient, tenantId: string, empresaId: string): Promise<string> {
  const id = randomUUID()
  await prisma.fazenda.create({
    data: { id, tenantId, empresaId, nome: 'Fazenda Boa Vista', createdAt: new Date(), updatedAt: new Date() },
  })
  return id
}

async function createArea(prisma: PrismaClient, tenantId: string, fazendaId: string): Promise<string> {
  const id = randomUUID()
  await prisma.area.create({
    data: { id, tenantId, fazendaId, identificacao: 'Talhão 01', createdAt: new Date(), updatedAt: new Date() },
  })
  return id
}

async function createAreaChain(prisma: PrismaClient, tenantId: string): Promise<string> {
  const empresaId = await createEmpresa(prisma, tenantId)
  const fazendaId = await createFazenda(prisma, tenantId, empresaId)
  return createArea(prisma, tenantId, fazendaId)
}

describe(PrismaSafraRepository.name, () => {
  let prisma: PrismaClient
  let sut: PrismaSafraRepository

  beforeEach(async () => {
    prisma = globalThis.__E2E_PRISMA__!
    sut = new PrismaSafraRepository(prisma as unknown as PrismaService)
    await prisma.safra.deleteMany()
    await prisma.area.deleteMany()
    await prisma.fazenda.deleteMany()
    await prisma.empresa.deleteMany()
    await prisma.tenant.deleteMany()
  })

  describe('create + findById', () => {
    it('persiste e recupera safra pelo id dentro do tenant', async () => {
      const tenantId = await createTenant(prisma)
      const areaId = await createAreaChain(prisma, tenantId)
      const safra = makeSafra(tenantId, areaId, { cultura: 'Milho', estimativaProducao: 1500.5 })

      await sut.create(safra)
      const found = await sut.findById(safra.id.toString(), tenantId)

      expect(found).not.toBeNull()
      expect(found!.cultura).toBe('Milho')
      expect(found!.estimativaProducao).toBe(1500.5)
      expect(found!.status).toBe('planejado')
    })

    it('retorna null para id inexistente', async () => {
      const tenantId = await createTenant(prisma)
      const found = await sut.findById(randomUUID(), tenantId)
      expect(found).toBeNull()
    })

    it('retorna null quando a safra pertence a outro tenant (isolamento)', async () => {
      const tenantA = await createTenant(prisma)
      const tenantB = await createTenant(prisma)
      const areaId = await createAreaChain(prisma, tenantA)
      const safra = makeSafra(tenantA, areaId)
      await sut.create(safra)

      const found = await sut.findById(safra.id.toString(), tenantB)
      expect(found).toBeNull()
    })

    it('não retorna safra soft-deletada', async () => {
      const tenantId = await createTenant(prisma)
      const areaId = await createAreaChain(prisma, tenantId)
      const safra = makeSafra(tenantId, areaId)
      await sut.create(safra)
      await prisma.safra.update({ where: { id: safra.id.toString() }, data: { deletedAt: new Date() } })

      const found = await sut.findById(safra.id.toString(), tenantId)
      expect(found).toBeNull()
    })
  })

  describe('findManyByTenant + count', () => {
    it('lista apenas safras do tenant, paginadas e sem soft-deletadas', async () => {
      const tenantA = await createTenant(prisma)
      const tenantB = await createTenant(prisma)
      const areaA = await createAreaChain(prisma, tenantA)
      const areaB = await createAreaChain(prisma, tenantB)
      await sut.create(makeSafra(tenantA, areaA))
      await sut.create(makeSafra(tenantA, areaA))
      await sut.create(makeSafra(tenantB, areaB))
      const deleted = makeSafra(tenantA, areaA)
      await sut.create(deleted)
      await prisma.safra.update({ where: { id: deleted.id.toString() }, data: { deletedAt: new Date() } })

      const items = await sut.findManyByTenant(tenantA, { page: 1, perPage: 10 })
      const total = await sut.count(tenantA)

      expect(items).toHaveLength(2)
      expect(total).toBe(2)
      expect(items.every((s) => s.tenantId === tenantA)).toBe(true)
    })

    it('aplica take/skip por página', async () => {
      const tenantId = await createTenant(prisma)
      const areaId = await createAreaChain(prisma, tenantId)
      await sut.create(makeSafra(tenantId, areaId))
      await sut.create(makeSafra(tenantId, areaId))
      await sut.create(makeSafra(tenantId, areaId))

      const page1 = await sut.findManyByTenant(tenantId, { page: 1, perPage: 2 })
      const page2 = await sut.findManyByTenant(tenantId, { page: 2, perPage: 2 })

      expect(page1).toHaveLength(2)
      expect(page2).toHaveLength(1)
      const ids = new Set([...page1, ...page2].map((s) => s.id.toString()))
      expect(ids.size).toBe(3)
    })
  })

  describe('save', () => {
    it('atualiza os campos persistidos', async () => {
      const tenantId = await createTenant(prisma)
      const areaId = await createAreaChain(prisma, tenantId)
      const safra = makeSafra(tenantId, areaId, { cultura: 'Original' })
      await sut.create(safra)

      safra.updateCadastro({ cultura: 'Atualizada', status: 'colhido', estimativaProducao: 900 })
      await sut.save(safra)

      const found = await sut.findById(safra.id.toString(), tenantId)
      expect(found!.cultura).toBe('Atualizada')
      expect(found!.status).toBe('colhido')
      expect(found!.estimativaProducao).toBe(900)
    })
  })
})
