import { randomUUID } from 'node:crypto'

import { describe, it, expect, beforeEach } from 'vitest'

import { PrismaColheitaRepository } from './prisma-colheita-repository'

import type { PrismaService } from '../prisma.service'
import type { PrismaClient } from '@prisma/client'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Colheita } from '@/domain/enterprise/entities/colheita'

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
      status: 'ativo',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })
  return id
}

async function createProduto(
  prisma: PrismaClient,
  tenantId: string,
  empresaId: string,
): Promise<string> {
  const id = randomUUID()
  await prisma.produto.create({
    data: {
      id,
      tenantId,
      empresaId,
      descricao: 'Soja',
      tipo: 'bruto',
      unidadeMedida: 'KG',
      status: 'ativo',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })
  return id
}

function makeColheita(
  tenantId: string,
  empresaId: string,
  produtoId: string,
  override: Partial<{ id: string; quantidade: number }> = {},
): Colheita {
  return Colheita.create(
    {
      tenantId,
      empresaId,
      produtoId,
      quantidade: override.quantidade ?? 1000.5,
      data: new Date('2024-10-01'),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID(override.id),
  )
}

describe(PrismaColheitaRepository.name, () => {
  let prisma: PrismaClient
  let sut: PrismaColheitaRepository

  beforeEach(async () => {
    prisma = globalThis.__E2E_PRISMA__!
    sut = new PrismaColheitaRepository(prisma as unknown as PrismaService)
    await prisma.lote.deleteMany()
    await prisma.colheita.deleteMany()
    await prisma.produto.deleteMany()
    await prisma.empresa.deleteMany()
    await prisma.tenant.deleteMany()
  })

  async function seed(): Promise<{ tenantId: string; empresaId: string; produtoId: string }> {
    const tenantId = await createTenant(prisma)
    const empresaId = await createEmpresa(prisma, tenantId)
    const produtoId = await createProduto(prisma, tenantId, empresaId)
    return { tenantId, empresaId, produtoId }
  }

  it('persiste e recupera colheita pelo id dentro do tenant (Decimal -> number)', async () => {
    const { tenantId, empresaId, produtoId } = await seed()
    const colheita = makeColheita(tenantId, empresaId, produtoId, { quantidade: 1234.567 })
    await prisma.colheita.create({
      data: {
        id: colheita.id.toString(),
        tenantId,
        empresaId,
        produtoId,
        quantidade: colheita.quantidade,
        data: colheita.data,
        createdAt: colheita.createdAt,
        updatedAt: colheita.updatedAt,
      },
    })

    const found = await sut.findById(colheita.id.toString(), tenantId)
    expect(found).not.toBeNull()
    expect(found!.quantidade).toBe(1234.567)
  })

  it('isola por tenant e ignora soft-deletadas em findManyByEmpresa + count', async () => {
    const a = await seed()
    const b = await seed()
    await prisma.colheita.createMany({
      data: [
        {
          id: randomUUID(),
          tenantId: a.tenantId,
          empresaId: a.empresaId,
          produtoId: a.produtoId,
          quantidade: 10,
          data: new Date('2024-10-01'),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: randomUUID(),
          tenantId: b.tenantId,
          empresaId: b.empresaId,
          produtoId: b.produtoId,
          quantidade: 20,
          data: new Date('2024-10-01'),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    })
    const deletedId = randomUUID()
    await prisma.colheita.create({
      data: {
        id: deletedId,
        tenantId: a.tenantId,
        empresaId: a.empresaId,
        produtoId: a.produtoId,
        quantidade: 30,
        data: new Date('2024-10-01'),
        deletedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    const items = await sut.findManyByEmpresa(a.tenantId, a.empresaId, { page: 1, perPage: 10 })
    const total = await sut.count(a.tenantId, a.empresaId)

    expect(items).toHaveLength(1)
    expect(total).toBe(1)
  })
})
