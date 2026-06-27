import { randomUUID } from 'node:crypto'

import { describe, it, expect, beforeEach } from 'vitest'

import { PrismaAreaRepository } from './prisma-area-repository'

import type { PrismaService } from '../prisma.service'
import type { PrismaClient } from '@prisma/client'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Area } from '@/domain/enterprise/entities/area'

function makeArea(
  tenantId: string,
  fazendaId: string,
  override: Partial<{
    id: string
    identificacao: string
    tamanho: number | null
    geometria: Record<string, unknown> | null
  }> = {},
): Area {
  return Area.create(
    {
      tenantId,
      fazendaId,
      identificacao: override.identificacao ?? 'Talhão 01',
      tamanho: override.tamanho ?? null,
      unidadeTamanho: 'ha',
      geometria: override.geometria ?? null,
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

async function createFazenda(
  prisma: PrismaClient,
  tenantId: string,
  empresaId: string,
): Promise<string> {
  const id = randomUUID()
  await prisma.fazenda.create({
    data: {
      id,
      tenantId,
      empresaId,
      nome: 'Fazenda Boa Vista',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })
  return id
}

describe(PrismaAreaRepository.name, () => {
  let prisma: PrismaClient
  let sut: PrismaAreaRepository

  beforeEach(async () => {
    prisma = globalThis.__E2E_PRISMA__!
    sut = new PrismaAreaRepository(prisma as unknown as PrismaService)
    await prisma.area.deleteMany()
    await prisma.fazenda.deleteMany()
    await prisma.empresa.deleteMany()
    await prisma.tenant.deleteMany()
  })

  describe('create + findById', () => {
    it('persiste e recupera área pelo id dentro do tenant', async () => {
      const tenantId = await createTenant(prisma)
      const empresaId = await createEmpresa(prisma, tenantId)
      const fazendaId = await createFazenda(prisma, tenantId, empresaId)
      const area = makeArea(tenantId, fazendaId, {
        identificacao: 'Talhão Persistido',
        tamanho: 120.5,
        geometria: { type: 'Polygon' },
      })

      await sut.create(area)
      const found = await sut.findById(area.id.toString(), tenantId)

      expect(found).not.toBeNull()
      expect(found!.identificacao).toBe('Talhão Persistido')
      expect(found!.tamanho).toBe(120.5)
      expect(found!.geometria).toEqual({ type: 'Polygon' })
    })

    it('retorna null para id inexistente', async () => {
      const tenantId = await createTenant(prisma)
      const found = await sut.findById(randomUUID(), tenantId)
      expect(found).toBeNull()
    })

    it('retorna null quando a área pertence a outro tenant (isolamento)', async () => {
      const tenantA = await createTenant(prisma)
      const tenantB = await createTenant(prisma)
      const empresaId = await createEmpresa(prisma, tenantA)
      const fazendaId = await createFazenda(prisma, tenantA, empresaId)
      const area = makeArea(tenantA, fazendaId)
      await sut.create(area)

      const found = await sut.findById(area.id.toString(), tenantB)
      expect(found).toBeNull()
    })

    it('não retorna área soft-deletada', async () => {
      const tenantId = await createTenant(prisma)
      const empresaId = await createEmpresa(prisma, tenantId)
      const fazendaId = await createFazenda(prisma, tenantId, empresaId)
      const area = makeArea(tenantId, fazendaId)
      await sut.create(area)
      await prisma.area.update({
        where: { id: area.id.toString() },
        data: { deletedAt: new Date() },
      })

      const found = await sut.findById(area.id.toString(), tenantId)
      expect(found).toBeNull()
    })
  })

  describe('findManyByTenant + count', () => {
    it('lista apenas áreas do tenant, paginadas e sem soft-deletadas', async () => {
      const tenantA = await createTenant(prisma)
      const tenantB = await createTenant(prisma)
      const empresaA = await createEmpresa(prisma, tenantA)
      const empresaB = await createEmpresa(prisma, tenantB)
      const fazendaA = await createFazenda(prisma, tenantA, empresaA)
      const fazendaB = await createFazenda(prisma, tenantB, empresaB)
      await sut.create(makeArea(tenantA, fazendaA))
      await sut.create(makeArea(tenantA, fazendaA))
      await sut.create(makeArea(tenantB, fazendaB))
      const deleted = makeArea(tenantA, fazendaA)
      await sut.create(deleted)
      await prisma.area.update({
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
      const empresaId = await createEmpresa(prisma, tenantId)
      const fazendaId = await createFazenda(prisma, tenantId, empresaId)
      await sut.create(makeArea(tenantId, fazendaId))
      await sut.create(makeArea(tenantId, fazendaId))
      await sut.create(makeArea(tenantId, fazendaId))

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
      const empresaId = await createEmpresa(prisma, tenantId)
      const fazendaId = await createFazenda(prisma, tenantId, empresaId)
      const area = makeArea(tenantId, fazendaId, { identificacao: 'Original' })
      await sut.create(area)

      area.updateCadastro({ identificacao: 'Atualizado', tamanho: 99 })
      await sut.save(area)

      const found = await sut.findById(area.id.toString(), tenantId)
      expect(found!.identificacao).toBe('Atualizado')
      expect(found!.tamanho).toBe(99)
    })
  })
})
