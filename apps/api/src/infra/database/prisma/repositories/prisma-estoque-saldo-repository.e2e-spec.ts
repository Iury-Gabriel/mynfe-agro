import { randomUUID } from 'node:crypto'

import { describe, it, expect, beforeEach } from 'vitest'

import { PrismaEstoqueSaldoRepository } from './prisma-estoque-saldo-repository'

import type { PrismaService } from '../prisma.service'
import type { PrismaClient } from '@prisma/client'

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

async function createLote(
  prisma: PrismaClient,
  base: { tenantId: string; empresaId: string; produtoId: string },
): Promise<string> {
  const id = randomUUID()
  await prisma.lote.create({
    data: {
      id,
      tenantId: base.tenantId,
      empresaId: base.empresaId,
      produtoId: base.produtoId,
      codigoLote: `LOTE-${id.slice(0, 8)}`,
      quantidadeInicial: 1000,
      quantidadeAtual: 1000,
      dataEntrada: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })
  return id
}

async function createSaldo(
  prisma: PrismaClient,
  base: { tenantId: string; empresaId: string; produtoId: string },
  loteId: string | null,
  quantidadeDisponivel: number,
): Promise<void> {
  await prisma.estoqueSaldo.create({
    data: {
      id: randomUUID(),
      tenantId: base.tenantId,
      empresaId: base.empresaId,
      produtoId: base.produtoId,
      loteId,
      quantidadeDisponivel,
      quantidadeReservada: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })
}

describe(PrismaEstoqueSaldoRepository.name, () => {
  let prisma: PrismaClient
  let sut: PrismaEstoqueSaldoRepository

  beforeEach(async () => {
    prisma = globalThis.__E2E_PRISMA__!
    sut = new PrismaEstoqueSaldoRepository(prisma as unknown as PrismaService)
    await prisma.estoqueSaldo.deleteMany()
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

  it('findByChave localiza saldo sem lote (loteId null) e mapeia Decimal', async () => {
    const base = await seed()
    await createSaldo(prisma, base, null, 500.5)

    const found = await sut.findByChave(base.tenantId, base.empresaId, base.produtoId, null)
    expect(found).not.toBeNull()
    expect(found!.loteId).toBeNull()
    expect(found!.quantidadeDisponivel).toBe(500.5)
  })

  it('findByChave distingue saldo com lote de saldo sem lote', async () => {
    const base = await seed()
    const loteId = await createLote(prisma, base)
    await createSaldo(prisma, base, null, 100)
    await createSaldo(prisma, base, loteId, 200)

    const semLote = await sut.findByChave(base.tenantId, base.empresaId, base.produtoId, null)
    const comLote = await sut.findByChave(base.tenantId, base.empresaId, base.produtoId, loteId)
    expect(semLote!.quantidadeDisponivel).toBe(100)
    expect(comLote!.quantidadeDisponivel).toBe(200)
  })

  it('findManyByEmpresa + count isolam por empresa/tenant', async () => {
    const a = await seed()
    const b = await seed()
    const loteA = await createLote(prisma, a)
    await createSaldo(prisma, a, null, 1)
    await createSaldo(prisma, a, loteA, 2)
    await createSaldo(prisma, b, null, 3)

    const items = await sut.findManyByEmpresa(a.tenantId, a.empresaId, { page: 1, perPage: 10 })
    expect(items).toHaveLength(2)
    expect(await sut.count(a.tenantId, a.empresaId)).toBe(2)
  })
})
