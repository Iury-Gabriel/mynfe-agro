import { randomUUID } from 'node:crypto'

import { describe, it, expect, beforeEach } from 'vitest'

import { PrismaEstoqueWriteRepository } from './prisma-estoque-write-repository'

import type { PrismaService } from '../prisma.service'
import type { PrismaClient } from '@prisma/client'

import { Colheita } from '@/domain/enterprise/entities/colheita'
import { EstoqueMovimento } from '@/domain/enterprise/entities/estoque-movimento'
import { EstoqueSaldo } from '@/domain/enterprise/entities/estoque-saldo'
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

describe(PrismaEstoqueWriteRepository.name, () => {
  let prisma: PrismaClient
  let sut: PrismaEstoqueWriteRepository

  beforeEach(async () => {
    prisma = globalThis.__E2E_PRISMA__!
    sut = new PrismaEstoqueWriteRepository(prisma as unknown as PrismaService)
    await prisma.estoqueMovimento.deleteMany()
    await prisma.estoqueSaldo.deleteMany()
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

  it('registrarColheita grava colheita + lote + movimento + saldo atomicamente', async () => {
    const { tenantId, empresaId, produtoId } = await seed()
    const now = new Date()
    const base = { tenantId, empresaId, produtoId, createdAt: now, updatedAt: now }

    const colheita = Colheita.create({ ...base, quantidade: 1000, data: now })
    const lote = Lote.create({
      ...base,
      codigoLote: `LOTE-${randomUUID()}`,
      origemTipo: 'colheita',
      colheitaId: colheita.id.toString(),
      quantidadeInicial: 1000,
      quantidadeAtual: 1000,
      dataEntrada: now,
    })
    const movimento = EstoqueMovimento.create({
      ...base,
      loteId: lote.id.toString(),
      tipo: 'entrada',
      origem: 'colheita',
      quantidade: 1000,
      data: now,
    })
    const saldo = EstoqueSaldo.create({
      ...base,
      loteId: lote.id.toString(),
      quantidadeDisponivel: 1000,
    })

    await sut.registrarColheita({ colheita, lote, movimento, saldo })

    expect(await prisma.colheita.count()).toBe(1)
    expect(await prisma.lote.count()).toBe(1)
    expect(await prisma.estoqueMovimento.count()).toBe(1)
    const persistedSaldo = await prisma.estoqueSaldo.findFirst()
    expect(persistedSaldo!.quantidadeDisponivel.toNumber()).toBe(1000)
  })

  it('registrarAjuste cria saldo sem lote (loteId null)', async () => {
    const { tenantId, empresaId, produtoId } = await seed()
    const now = new Date()
    const base = { tenantId, empresaId, produtoId, createdAt: now, updatedAt: now }

    const movimento = EstoqueMovimento.create({
      ...base,
      loteId: null,
      tipo: 'ajuste',
      origem: 'ajuste',
      quantidade: 50,
      data: now,
      motivo: 'inventário',
    })
    const saldo = EstoqueSaldo.create({ ...base, loteId: null, quantidadeDisponivel: 50 })

    await sut.registrarAjuste({ movimento, saldo, lote: null })

    const persisted = await prisma.estoqueSaldo.findFirst()
    expect(persisted!.loteId).toBeNull()
    expect(persisted!.quantidadeDisponivel.toNumber()).toBe(50)
    expect(await prisma.lote.count()).toBe(0)
  })

  it('rollback: nenhuma escrita parcial quando a transação falha (FK inválida)', async () => {
    const { tenantId, empresaId } = await seed()
    const now = new Date()
    const base = { tenantId, empresaId, produtoId: 'produto-inexistente', createdAt: now, updatedAt: now }

    const colheita = Colheita.create({ ...base, quantidade: 10, data: now })
    const lote = Lote.create({
      ...base,
      codigoLote: `LOTE-${randomUUID()}`,
      origemTipo: 'colheita',
      colheitaId: colheita.id.toString(),
      quantidadeInicial: 10,
      quantidadeAtual: 10,
      dataEntrada: now,
    })
    const movimento = EstoqueMovimento.create({
      ...base,
      loteId: lote.id.toString(),
      tipo: 'entrada',
      origem: 'colheita',
      quantidade: 10,
      data: now,
    })
    const saldo = EstoqueSaldo.create({
      ...base,
      loteId: lote.id.toString(),
      quantidadeDisponivel: 10,
    })

    await expect(sut.registrarColheita({ colheita, lote, movimento, saldo })).rejects.toThrow()

    expect(await prisma.colheita.count()).toBe(0)
    expect(await prisma.lote.count()).toBe(0)
    expect(await prisma.estoqueMovimento.count()).toBe(0)
    expect(await prisma.estoqueSaldo.count()).toBe(0)
  })
})
