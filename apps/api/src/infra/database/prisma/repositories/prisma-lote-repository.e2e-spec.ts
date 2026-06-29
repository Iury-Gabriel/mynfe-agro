import { randomUUID } from 'node:crypto'

import { describe, it, expect, beforeEach } from 'vitest'

import { PrismaLoteRepository } from './prisma-lote-repository'

import type { PrismaService } from '../prisma.service'
import type { PrismaClient } from '@prisma/client'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Lote } from '@/domain/enterprise/entities/lote'

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

function makeLote(
  tenantId: string,
  empresaId: string,
  produtoId: string,
  override: Partial<{ id: string; codigoLote: string; quantidadeAtual: number }> = {},
): Lote {
  return Lote.create(
    {
      tenantId,
      empresaId,
      produtoId,
      codigoLote: override.codigoLote ?? `LOTE-${randomUUID()}`,
      origemTipo: 'colheita',
      quantidadeInicial: 1000,
      quantidadeAtual: override.quantidadeAtual ?? 1000,
      dataEntrada: new Date('2024-10-01'),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID(override.id),
  )
}

async function persist(prisma: PrismaClient, lote: Lote): Promise<void> {
  await prisma.lote.create({
    data: {
      id: lote.id.toString(),
      tenantId: lote.tenantId,
      empresaId: lote.empresaId,
      produtoId: lote.produtoId,
      codigoLote: lote.codigoLote,
      origemTipo: lote.origemTipo,
      quantidadeInicial: lote.quantidadeInicial,
      quantidadeAtual: lote.quantidadeAtual,
      dataEntrada: lote.dataEntrada,
      createdAt: lote.createdAt,
      updatedAt: lote.updatedAt,
    },
  })
}

describe(PrismaLoteRepository.name, () => {
  let prisma: PrismaClient
  let sut: PrismaLoteRepository

  beforeEach(async () => {
    prisma = globalThis.__E2E_PRISMA__!
    sut = new PrismaLoteRepository(prisma as unknown as PrismaService)
    await prisma.lote.deleteMany()
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

  it('findById respeita tenant e soft delete', async () => {
    const { tenantId, empresaId, produtoId } = await seed()
    const lote = makeLote(tenantId, empresaId, produtoId, { quantidadeAtual: 750.25 })
    await persist(prisma, lote)

    const found = await sut.findById(lote.id.toString(), tenantId)
    expect(found!.quantidadeAtual).toBe(750.25)

    expect(await sut.findById(lote.id.toString(), 'outro')).toBeNull()

    await prisma.lote.update({
      where: { id: lote.id.toString() },
      data: { deletedAt: new Date() },
    })
    expect(await sut.findById(lote.id.toString(), tenantId)).toBeNull()
  })

  it('findByCodigo localiza por código dentro de empresa+tenant', async () => {
    const { tenantId, empresaId, produtoId } = await seed()
    const lote = makeLote(tenantId, empresaId, produtoId, { codigoLote: 'LOTE-X' })
    await persist(prisma, lote)

    const found = await sut.findByCodigo(tenantId, empresaId, 'LOTE-X')
    expect(found!.id.toString()).toBe(lote.id.toString())
    expect(await sut.findByCodigo(tenantId, empresaId, 'LOTE-NAO')).toBeNull()
  })

  it('findManyByEmpresa + count isolam empresa e paginam', async () => {
    const { tenantId, empresaId, produtoId } = await seed()
    await persist(prisma, makeLote(tenantId, empresaId, produtoId))
    await persist(prisma, makeLote(tenantId, empresaId, produtoId))
    await persist(prisma, makeLote(tenantId, empresaId, produtoId))

    const page1 = await sut.findManyByEmpresa(tenantId, empresaId, { page: 1, perPage: 2 })
    const page2 = await sut.findManyByEmpresa(tenantId, empresaId, { page: 2, perPage: 2 })
    expect(page1).toHaveLength(2)
    expect(page2).toHaveLength(1)
    expect(await sut.count(tenantId, empresaId)).toBe(3)
  })

  it('save atualiza quantidadeAtual', async () => {
    const { tenantId, empresaId, produtoId } = await seed()
    const lote = makeLote(tenantId, empresaId, produtoId)
    await persist(prisma, lote)

    lote.consumir(400)
    await sut.save(lote)

    const found = await sut.findById(lote.id.toString(), tenantId)
    expect(found!.quantidadeAtual).toBe(600)
  })
})
