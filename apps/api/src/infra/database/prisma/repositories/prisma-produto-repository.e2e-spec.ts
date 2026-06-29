import { randomUUID } from 'node:crypto'

import { describe, it, expect, beforeEach } from 'vitest'

import { PrismaProdutoRepository } from './prisma-produto-repository'

import type { PrismaService } from '../prisma.service'
import type { PrismaClient } from '@prisma/client'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Produto } from '@/domain/enterprise/entities/produto'

function makeProduto(
  tenantId: string,
  empresaId: string,
  override: Partial<{
    id: string
    descricao: string
    precoPadrao: number | null
    status: 'ativo' | 'inativo'
    aliquotas: Record<string, unknown> | null
  }> = {},
): Produto {
  return Produto.create(
    {
      tenantId,
      empresaId,
      descricao: override.descricao ?? 'Soja a granel',
      tipo: 'bruto',
      unidadeMedida: 'KG',
      precoPadrao: override.precoPadrao ?? null,
      aliquotas: override.aliquotas ?? null,
      status: override.status ?? 'ativo',
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

describe(PrismaProdutoRepository.name, () => {
  let prisma: PrismaClient
  let sut: PrismaProdutoRepository

  beforeEach(async () => {
    prisma = globalThis.__E2E_PRISMA__!
    sut = new PrismaProdutoRepository(prisma as unknown as PrismaService)
    await prisma.produto.deleteMany()
    await prisma.empresa.deleteMany()
    await prisma.tenant.deleteMany()
  })

  describe('create + findById', () => {
    it('persiste e recupera produto pelo id dentro do tenant', async () => {
      const tenantId = await createTenant(prisma)
      const empresaId = await createEmpresa(prisma, tenantId)
      const produto = makeProduto(tenantId, empresaId, {
        descricao: 'Persistido',
        precoPadrao: 42.5,
        aliquotas: { icms: 12 },
      })

      await sut.create(produto)
      const found = await sut.findById(produto.id.toString(), tenantId)

      expect(found).not.toBeNull()
      expect(found!.descricao).toBe('Persistido')
      expect(found!.precoPadrao).toBe(42.5)
      expect(found!.aliquotas).toEqual({ icms: 12 })
    })

    it('retorna null para id inexistente', async () => {
      const tenantId = await createTenant(prisma)
      const found = await sut.findById(randomUUID(), tenantId)
      expect(found).toBeNull()
    })

    it('retorna null quando o produto pertence a outro tenant (isolamento)', async () => {
      const tenantA = await createTenant(prisma)
      const tenantB = await createTenant(prisma)
      const empresaA = await createEmpresa(prisma, tenantA)
      const produto = makeProduto(tenantA, empresaA)
      await sut.create(produto)

      const found = await sut.findById(produto.id.toString(), tenantB)
      expect(found).toBeNull()
    })

    it('não retorna produto soft-deletado', async () => {
      const tenantId = await createTenant(prisma)
      const empresaId = await createEmpresa(prisma, tenantId)
      const produto = makeProduto(tenantId, empresaId)
      await sut.create(produto)
      await prisma.produto.update({
        where: { id: produto.id.toString() },
        data: { deletedAt: new Date() },
      })

      const found = await sut.findById(produto.id.toString(), tenantId)
      expect(found).toBeNull()
    })
  })

  describe('findManyByTenant + count', () => {
    it('lista apenas produtos do tenant, paginados e sem soft-deletados', async () => {
      const tenantA = await createTenant(prisma)
      const tenantB = await createTenant(prisma)
      const empresaA = await createEmpresa(prisma, tenantA)
      const empresaB = await createEmpresa(prisma, tenantB)
      await sut.create(makeProduto(tenantA, empresaA))
      await sut.create(makeProduto(tenantA, empresaA))
      await sut.create(makeProduto(tenantB, empresaB))
      const deleted = makeProduto(tenantA, empresaA)
      await sut.create(deleted)
      await prisma.produto.update({
        where: { id: deleted.id.toString() },
        data: { deletedAt: new Date() },
      })

      const items = await sut.findManyByTenant(tenantA, { page: 1, perPage: 10 })
      const total = await sut.count(tenantA)

      expect(items).toHaveLength(2)
      expect(total).toBe(2)
      expect(items.every((p) => p.tenantId === tenantA)).toBe(true)
    })

    it('aplica take/skip por página', async () => {
      const tenantId = await createTenant(prisma)
      const empresaId = await createEmpresa(prisma, tenantId)
      await sut.create(makeProduto(tenantId, empresaId))
      await sut.create(makeProduto(tenantId, empresaId))
      await sut.create(makeProduto(tenantId, empresaId))

      const page1 = await sut.findManyByTenant(tenantId, { page: 1, perPage: 2 })
      const page2 = await sut.findManyByTenant(tenantId, { page: 2, perPage: 2 })

      expect(page1).toHaveLength(2)
      expect(page2).toHaveLength(1)
      const ids = new Set([...page1, ...page2].map((p) => p.id.toString()))
      expect(ids.size).toBe(3)
    })
  })

  describe('save', () => {
    it('atualiza os campos persistidos', async () => {
      const tenantId = await createTenant(prisma)
      const empresaId = await createEmpresa(prisma, tenantId)
      const produto = makeProduto(tenantId, empresaId, { descricao: 'Original' })
      await sut.create(produto)

      produto.updateCadastro({ descricao: 'Atualizado', precoPadrao: 99 })
      produto.deactivate()
      await sut.save(produto)

      const found = await sut.findById(produto.id.toString(), tenantId)
      expect(found!.descricao).toBe('Atualizado')
      expect(found!.precoPadrao).toBe(99)
      expect(found!.status).toBe('inativo')
    })
  })
})
