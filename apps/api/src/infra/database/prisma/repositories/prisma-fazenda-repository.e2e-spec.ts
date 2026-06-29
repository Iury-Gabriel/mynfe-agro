import { randomUUID } from 'node:crypto'

import { describe, it, expect, beforeEach } from 'vitest'

import { PrismaFazendaRepository } from './prisma-fazenda-repository'

import type { PrismaService } from '../prisma.service'
import type { PrismaClient } from '@prisma/client'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Fazenda } from '@/domain/enterprise/entities/fazenda'

function makeFazenda(
  tenantId: string,
  empresaId: string,
  override: Partial<{
    id: string
    nome: string
    latitude: number | null
    longitude: number | null
    areaTotalHa: number | null
  }> = {},
): Fazenda {
  return Fazenda.create(
    {
      tenantId,
      empresaId,
      nome: override.nome ?? 'Fazenda Boa Vista',
      municipio: 'Sinop',
      uf: 'MT',
      latitude: override.latitude ?? null,
      longitude: override.longitude ?? null,
      areaTotalHa: override.areaTotalHa ?? null,
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

describe(PrismaFazendaRepository.name, () => {
  let prisma: PrismaClient
  let sut: PrismaFazendaRepository

  beforeEach(async () => {
    prisma = globalThis.__E2E_PRISMA__!
    sut = new PrismaFazendaRepository(prisma as unknown as PrismaService)
    await prisma.area.deleteMany()
    await prisma.fazenda.deleteMany()
    await prisma.empresa.deleteMany()
    await prisma.tenant.deleteMany()
  })

  describe('create + findById', () => {
    it('persiste e recupera fazenda pelo id dentro do tenant', async () => {
      const tenantId = await createTenant(prisma)
      const empresaId = await createEmpresa(prisma, tenantId)
      const fazenda = makeFazenda(tenantId, empresaId, {
        nome: 'Persistida',
        latitude: -11.86,
        areaTotalHa: 1500.5,
      })

      await sut.create(fazenda)
      const found = await sut.findById(fazenda.id.toString(), tenantId)

      expect(found).not.toBeNull()
      expect(found!.nome).toBe('Persistida')
      expect(found!.latitude).toBe(-11.86)
      expect(found!.areaTotalHa).toBe(1500.5)
    })

    it('retorna null para id inexistente', async () => {
      const tenantId = await createTenant(prisma)
      const found = await sut.findById(randomUUID(), tenantId)
      expect(found).toBeNull()
    })

    it('retorna null quando a fazenda pertence a outro tenant (isolamento)', async () => {
      const tenantA = await createTenant(prisma)
      const tenantB = await createTenant(prisma)
      const empresaId = await createEmpresa(prisma, tenantA)
      const fazenda = makeFazenda(tenantA, empresaId)
      await sut.create(fazenda)

      const found = await sut.findById(fazenda.id.toString(), tenantB)
      expect(found).toBeNull()
    })

    it('não retorna fazenda soft-deletada', async () => {
      const tenantId = await createTenant(prisma)
      const empresaId = await createEmpresa(prisma, tenantId)
      const fazenda = makeFazenda(tenantId, empresaId)
      await sut.create(fazenda)
      await prisma.fazenda.update({
        where: { id: fazenda.id.toString() },
        data: { deletedAt: new Date() },
      })

      const found = await sut.findById(fazenda.id.toString(), tenantId)
      expect(found).toBeNull()
    })
  })

  describe('findManyByTenant + count', () => {
    it('lista apenas fazendas do tenant, paginadas e sem soft-deletadas', async () => {
      const tenantA = await createTenant(prisma)
      const tenantB = await createTenant(prisma)
      const empresaA = await createEmpresa(prisma, tenantA)
      const empresaB = await createEmpresa(prisma, tenantB)
      await sut.create(makeFazenda(tenantA, empresaA))
      await sut.create(makeFazenda(tenantA, empresaA))
      await sut.create(makeFazenda(tenantB, empresaB))
      const deleted = makeFazenda(tenantA, empresaA)
      await sut.create(deleted)
      await prisma.fazenda.update({
        where: { id: deleted.id.toString() },
        data: { deletedAt: new Date() },
      })

      const items = await sut.findManyByTenant(tenantA, { page: 1, perPage: 10 })
      const total = await sut.count(tenantA)

      expect(items).toHaveLength(2)
      expect(total).toBe(2)
      expect(items.every((f) => f.tenantId === tenantA)).toBe(true)
    })

    it('aplica take/skip por página', async () => {
      const tenantId = await createTenant(prisma)
      const empresaId = await createEmpresa(prisma, tenantId)
      await sut.create(makeFazenda(tenantId, empresaId))
      await sut.create(makeFazenda(tenantId, empresaId))
      await sut.create(makeFazenda(tenantId, empresaId))

      const page1 = await sut.findManyByTenant(tenantId, { page: 1, perPage: 2 })
      const page2 = await sut.findManyByTenant(tenantId, { page: 2, perPage: 2 })

      expect(page1).toHaveLength(2)
      expect(page2).toHaveLength(1)
      const ids = new Set([...page1, ...page2].map((f) => f.id.toString()))
      expect(ids.size).toBe(3)
    })
  })

  describe('save', () => {
    it('atualiza os campos persistidos', async () => {
      const tenantId = await createTenant(prisma)
      const empresaId = await createEmpresa(prisma, tenantId)
      const fazenda = makeFazenda(tenantId, empresaId, { nome: 'Original' })
      await sut.create(fazenda)

      fazenda.updateCadastro({ nome: 'Atualizada', areaTotalHa: 900 })
      await sut.save(fazenda)

      const found = await sut.findById(fazenda.id.toString(), tenantId)
      expect(found!.nome).toBe('Atualizada')
      expect(found!.areaTotalHa).toBe(900)
    })
  })
})
