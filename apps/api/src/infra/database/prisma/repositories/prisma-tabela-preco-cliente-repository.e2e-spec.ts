import { randomUUID } from 'node:crypto'

import { describe, it, expect, beforeEach } from 'vitest'

import { PrismaTabelaPrecoClienteRepository } from './prisma-tabela-preco-cliente-repository'

import type { PrismaService } from '../prisma.service'
import type { PrismaClient } from '@prisma/client'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { TabelaPrecoCliente } from '@/domain/enterprise/entities/tabela-preco-cliente'

function makeTabela(
  tenantId: string,
  clienteId: string,
  produtoId: string,
  override: Partial<{
    id: string
    preco: number
    vigenciaInicio: Date | null
    vigenciaFim: Date | null
  }> = {},
): TabelaPrecoCliente {
  return TabelaPrecoCliente.create(
    {
      tenantId,
      clienteId,
      produtoId,
      preco: override.preco ?? 100,
      vigenciaInicio: override.vigenciaInicio ?? null,
      vigenciaFim: override.vigenciaFim ?? null,
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
      cnpjCpf: '11222333000181',
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

async function createCliente(prisma: PrismaClient, tenantId: string): Promise<string> {
  const id = randomUUID()
  await prisma.cliente.create({
    data: {
      id,
      tenantId,
      tipoPessoa: 'PJ',
      razaoSocialNome: 'Cliente LTDA',
      cnpjCpf: '11444777000161',
      indicadorIe: '9',
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
      descricao: 'Soja a granel',
      tipo: 'bruto',
      unidadeMedida: 'KG',
      status: 'ativo',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })
  return id
}

interface Ctx {
  tenantId: string
  clienteId: string
  produtoId: string
}

async function createCtx(prisma: PrismaClient): Promise<Ctx> {
  const tenantId = await createTenant(prisma)
  const empresaId = await createEmpresa(prisma, tenantId)
  const clienteId = await createCliente(prisma, tenantId)
  const produtoId = await createProduto(prisma, tenantId, empresaId)
  return { tenantId, clienteId, produtoId }
}

describe(PrismaTabelaPrecoClienteRepository.name, () => {
  let prisma: PrismaClient
  let sut: PrismaTabelaPrecoClienteRepository

  beforeEach(async () => {
    prisma = globalThis.__E2E_PRISMA__!
    sut = new PrismaTabelaPrecoClienteRepository(prisma as unknown as PrismaService)
    await prisma.tabelaPrecoCliente.deleteMany()
    await prisma.produto.deleteMany()
    await prisma.cliente.deleteMany()
    await prisma.empresa.deleteMany()
    await prisma.tenant.deleteMany()
  })

  describe('create + findById', () => {
    it('persiste e recupera tabela de preço pelo id dentro do tenant', async () => {
      const { tenantId, clienteId, produtoId } = await createCtx(prisma)
      const tabela = makeTabela(tenantId, clienteId, produtoId, { preco: 250.75 })

      await sut.create(tabela)
      const found = await sut.findById(tabela.id.toString(), tenantId)

      expect(found).not.toBeNull()
      expect(found!.preco).toBe(250.75)
      expect(found!.clienteId).toBe(clienteId)
      expect(found!.produtoId).toBe(produtoId)
    })

    it('retorna null quando pertence a outro tenant (isolamento)', async () => {
      const ctx = await createCtx(prisma)
      const tenantB = await createTenant(prisma)
      const tabela = makeTabela(ctx.tenantId, ctx.clienteId, ctx.produtoId)
      await sut.create(tabela)

      const found = await sut.findById(tabela.id.toString(), tenantB)
      expect(found).toBeNull()
    })

    it('não retorna tabela soft-deletada', async () => {
      const { tenantId, clienteId, produtoId } = await createCtx(prisma)
      const tabela = makeTabela(tenantId, clienteId, produtoId)
      await sut.create(tabela)
      await prisma.tabelaPrecoCliente.update({
        where: { id: tabela.id.toString() },
        data: { deletedAt: new Date() },
      })

      const found = await sut.findById(tabela.id.toString(), tenantId)
      expect(found).toBeNull()
    })
  })

  describe('findManyByTenant + count', () => {
    it('lista apenas tabelas do tenant, paginadas e sem soft-deletadas', async () => {
      const ctxA = await createCtx(prisma)
      const ctxB = await createCtx(prisma)
      await sut.create(
        makeTabela(ctxA.tenantId, ctxA.clienteId, ctxA.produtoId, {
          vigenciaInicio: new Date('2024-01-01'),
        }),
      )
      await sut.create(
        makeTabela(ctxA.tenantId, ctxA.clienteId, ctxA.produtoId, {
          vigenciaInicio: new Date('2024-02-01'),
        }),
      )
      await sut.create(makeTabela(ctxB.tenantId, ctxB.clienteId, ctxB.produtoId))
      const deleted = makeTabela(ctxA.tenantId, ctxA.clienteId, ctxA.produtoId, {
        vigenciaInicio: new Date('2024-03-01'),
      })
      await sut.create(deleted)
      await prisma.tabelaPrecoCliente.update({
        where: { id: deleted.id.toString() },
        data: { deletedAt: new Date() },
      })

      const items = await sut.findManyByTenant(ctxA.tenantId, { page: 1, perPage: 10 })
      const total = await sut.count(ctxA.tenantId)

      expect(items).toHaveLength(2)
      expect(total).toBe(2)
      expect(items.every((t) => t.tenantId === ctxA.tenantId)).toBe(true)
    })

    it('aplica take/skip por página', async () => {
      const { tenantId, clienteId, produtoId } = await createCtx(prisma)
      await sut.create(
        makeTabela(tenantId, clienteId, produtoId, { vigenciaInicio: new Date('2024-01-01') }),
      )
      await sut.create(
        makeTabela(tenantId, clienteId, produtoId, { vigenciaInicio: new Date('2024-02-01') }),
      )
      await sut.create(
        makeTabela(tenantId, clienteId, produtoId, { vigenciaInicio: new Date('2024-03-01') }),
      )

      const page1 = await sut.findManyByTenant(tenantId, { page: 1, perPage: 2 })
      const page2 = await sut.findManyByTenant(tenantId, { page: 2, perPage: 2 })

      expect(page1).toHaveLength(2)
      expect(page2).toHaveLength(1)
    })
  })

  describe('findVigentesByClienteProduto', () => {
    it('retorna apenas preços vigentes na data de referência, filtrando tenant/deletedAt', async () => {
      const { tenantId, clienteId, produtoId } = await createCtx(prisma)
      const ref = new Date('2024-06-15')

      const vigenteAberto = makeTabela(tenantId, clienteId, produtoId, {
        preco: 100,
        vigenciaInicio: null,
        vigenciaFim: null,
      })
      const vigenteJanela = makeTabela(tenantId, clienteId, produtoId, {
        preco: 110,
        vigenciaInicio: new Date('2024-01-01'),
        vigenciaFim: new Date('2024-12-31'),
      })
      const expirado = makeTabela(tenantId, clienteId, produtoId, {
        preco: 90,
        vigenciaInicio: new Date('2023-01-01'),
        vigenciaFim: new Date('2023-12-31'),
      })
      const futuro = makeTabela(tenantId, clienteId, produtoId, {
        preco: 120,
        vigenciaInicio: new Date('2025-01-01'),
        vigenciaFim: null,
      })
      const deletado = makeTabela(tenantId, clienteId, produtoId, {
        preco: 999,
        vigenciaInicio: new Date('2024-03-01'),
        vigenciaFim: new Date('2024-09-01'),
      })

      await sut.create(vigenteAberto)
      await sut.create(vigenteJanela)
      await sut.create(expirado)
      await sut.create(futuro)
      await sut.create(deletado)
      await prisma.tabelaPrecoCliente.update({
        where: { id: deletado.id.toString() },
        data: { deletedAt: new Date() },
      })

      const vigentes = await sut.findVigentesByClienteProduto(
        tenantId,
        clienteId,
        produtoId,
        ref,
      )

      const precos = vigentes.map((t) => t.preco).sort((a, b) => a - b)
      expect(precos).toEqual([100, 110])
    })

    it('não retorna preços de outro tenant', async () => {
      const ctxA = await createCtx(prisma)
      const ctxB = await createCtx(prisma)
      const ref = new Date('2024-06-15')

      await sut.create(
        makeTabela(ctxA.tenantId, ctxA.clienteId, ctxA.produtoId, { preco: 100 }),
      )
      await sut.create(
        makeTabela(ctxB.tenantId, ctxB.clienteId, ctxB.produtoId, { preco: 200 }),
      )

      const vigentes = await sut.findVigentesByClienteProduto(
        ctxA.tenantId,
        ctxA.clienteId,
        ctxA.produtoId,
        ref,
      )

      expect(vigentes).toHaveLength(1)
      expect(vigentes[0]!.preco).toBe(100)
    })
  })

  describe('save', () => {
    it('atualiza os campos persistidos e marca como deletado', async () => {
      const { tenantId, clienteId, produtoId } = await createCtx(prisma)
      const tabela = makeTabela(tenantId, clienteId, produtoId, { preco: 100 })
      await sut.create(tabela)

      tabela.update({ preco: 333 })
      await sut.save(tabela)

      const found = await sut.findById(tabela.id.toString(), tenantId)
      expect(found!.preco).toBe(333)

      tabela.markAsDeleted()
      await sut.save(tabela)

      const afterDelete = await sut.findById(tabela.id.toString(), tenantId)
      expect(afterDelete).toBeNull()
    })
  })
})
