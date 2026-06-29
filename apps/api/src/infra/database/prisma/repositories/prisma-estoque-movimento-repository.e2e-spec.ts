import { randomUUID } from 'node:crypto'

import { describe, it, expect, beforeEach } from 'vitest'

import { PrismaEstoqueMovimentoRepository } from './prisma-estoque-movimento-repository'

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

async function createMovimento(
  prisma: PrismaClient,
  base: { tenantId: string; empresaId: string; produtoId: string },
  override: Partial<{ tipo: string; origem: string; quantidade: number }> = {},
): Promise<void> {
  await prisma.estoqueMovimento.create({
    data: {
      id: randomUUID(),
      tenantId: base.tenantId,
      empresaId: base.empresaId,
      produtoId: base.produtoId,
      tipo: override.tipo ?? 'entrada',
      origem: override.origem ?? 'colheita',
      quantidade: override.quantidade ?? 100,
      data: new Date('2024-10-01'),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })
}

describe(PrismaEstoqueMovimentoRepository.name, () => {
  let prisma: PrismaClient
  let sut: PrismaEstoqueMovimentoRepository

  beforeEach(async () => {
    prisma = globalThis.__E2E_PRISMA__!
    sut = new PrismaEstoqueMovimentoRepository(prisma as unknown as PrismaService)
    await prisma.estoqueMovimento.deleteMany()
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

  it('isola por tenant/empresa e mapeia Decimal -> number', async () => {
    const a = await seed()
    const b = await seed()
    await createMovimento(prisma, a, { quantidade: 12.5 })
    await createMovimento(prisma, b)

    const items = await sut.findManyByEmpresa(a.tenantId, a.empresaId, {}, { page: 1, perPage: 10 })
    expect(items).toHaveLength(1)
    expect(items[0].quantidade).toBe(12.5)
    expect(await sut.count(a.tenantId, a.empresaId, {})).toBe(1)
  })

  it('aplica filtros de tipo e origem', async () => {
    const base = await seed()
    await createMovimento(prisma, base, { tipo: 'entrada', origem: 'colheita' })
    await createMovimento(prisma, base, { tipo: 'ajuste', origem: 'ajuste' })

    const ajustes = await sut.findManyByEmpresa(
      base.tenantId,
      base.empresaId,
      { tipo: 'ajuste' },
      { page: 1, perPage: 10 },
    )
    expect(ajustes).toHaveLength(1)
    expect(ajustes[0].tipo).toBe('ajuste')
    expect(await sut.count(base.tenantId, base.empresaId, { origem: 'colheita' })).toBe(1)
  })
})
