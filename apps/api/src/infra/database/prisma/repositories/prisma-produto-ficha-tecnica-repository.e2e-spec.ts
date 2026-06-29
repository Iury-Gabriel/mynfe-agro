import { randomUUID } from 'node:crypto'

import { describe, it, expect, beforeEach } from 'vitest'

import { PrismaProdutoFichaTecnicaRepository } from './prisma-produto-ficha-tecnica-repository'

import type { PrismaService } from '../prisma.service'
import type { PrismaClient } from '@prisma/client'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ProdutoFichaTecnica } from '@/domain/enterprise/entities/produto-ficha-tecnica'

function makeFicha(
  tenantId: string,
  produtoId: string,
  override: Partial<{
    id: string
    descricaoComponente: string
    quantidadeReferencia: number | null
    observacoes: string | null
  }> = {},
): ProdutoFichaTecnica {
  return ProdutoFichaTecnica.create(
    {
      tenantId,
      produtoId,
      descricaoComponente: override.descricaoComponente ?? 'Milho moído',
      quantidadeReferencia: override.quantidadeReferencia ?? null,
      observacoes: override.observacoes ?? null,
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

async function createProduto(prisma: PrismaClient, tenantId: string): Promise<string> {
  const empresaId = randomUUID()
  await prisma.empresa.create({
    data: {
      id: empresaId,
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
  const produtoId = randomUUID()
  await prisma.produto.create({
    data: {
      id: produtoId,
      tenantId,
      empresaId,
      descricao: 'Ração embalada',
      tipo: 'embalado',
      unidadeMedida: 'SC',
      status: 'ativo',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })
  return produtoId
}

describe(PrismaProdutoFichaTecnicaRepository.name, () => {
  let prisma: PrismaClient
  let sut: PrismaProdutoFichaTecnicaRepository

  beforeEach(async () => {
    prisma = globalThis.__E2E_PRISMA__!
    sut = new PrismaProdutoFichaTecnicaRepository(prisma as unknown as PrismaService)
    await prisma.produtoFichaTecnica.deleteMany()
    await prisma.produto.deleteMany()
    await prisma.empresa.deleteMany()
    await prisma.tenant.deleteMany()
  })

  describe('create + findById', () => {
    it('persiste e recupera ficha pelo id dentro do tenant', async () => {
      const tenantId = await createTenant(prisma)
      const produtoId = await createProduto(prisma, tenantId)
      const ficha = makeFicha(tenantId, produtoId, {
        descricaoComponente: 'Persistido',
        quantidadeReferencia: 4.5,
        observacoes: 'Obs',
      })

      await sut.create(ficha)
      const found = await sut.findById(ficha.id.toString(), tenantId)

      expect(found).not.toBeNull()
      expect(found!.descricaoComponente).toBe('Persistido')
      expect(found!.quantidadeReferencia).toBe(4.5)
      expect(found!.observacoes).toBe('Obs')
    })

    it('retorna null para id inexistente', async () => {
      const tenantId = await createTenant(prisma)
      const found = await sut.findById(randomUUID(), tenantId)
      expect(found).toBeNull()
    })

    it('retorna null quando a ficha pertence a outro tenant (isolamento)', async () => {
      const tenantA = await createTenant(prisma)
      const tenantB = await createTenant(prisma)
      const produtoA = await createProduto(prisma, tenantA)
      const ficha = makeFicha(tenantA, produtoA)
      await sut.create(ficha)

      const found = await sut.findById(ficha.id.toString(), tenantB)
      expect(found).toBeNull()
    })

    it('não retorna ficha soft-deletada', async () => {
      const tenantId = await createTenant(prisma)
      const produtoId = await createProduto(prisma, tenantId)
      const ficha = makeFicha(tenantId, produtoId)
      await sut.create(ficha)
      await prisma.produtoFichaTecnica.update({
        where: { id: ficha.id.toString() },
        data: { deletedAt: new Date() },
      })

      const found = await sut.findById(ficha.id.toString(), tenantId)
      expect(found).toBeNull()
    })
  })

  describe('findManyByProduto + countByProduto', () => {
    it('lista apenas fichas do produto, paginadas e sem soft-deletadas', async () => {
      const tenantId = await createTenant(prisma)
      const produtoA = await createProduto(prisma, tenantId)
      const produtoB = await createProduto(prisma, tenantId)
      await sut.create(makeFicha(tenantId, produtoA))
      await sut.create(makeFicha(tenantId, produtoA))
      await sut.create(makeFicha(tenantId, produtoB))
      const deleted = makeFicha(tenantId, produtoA)
      await sut.create(deleted)
      await prisma.produtoFichaTecnica.update({
        where: { id: deleted.id.toString() },
        data: { deletedAt: new Date() },
      })

      const items = await sut.findManyByProduto(tenantId, produtoA, { page: 1, perPage: 10 })
      const total = await sut.countByProduto(tenantId, produtoA)

      expect(items).toHaveLength(2)
      expect(total).toBe(2)
      expect(items.every((f) => f.produtoId === produtoA)).toBe(true)
    })

    it('aplica take/skip por página', async () => {
      const tenantId = await createTenant(prisma)
      const produtoId = await createProduto(prisma, tenantId)
      await sut.create(makeFicha(tenantId, produtoId))
      await sut.create(makeFicha(tenantId, produtoId))
      await sut.create(makeFicha(tenantId, produtoId))

      const page1 = await sut.findManyByProduto(tenantId, produtoId, { page: 1, perPage: 2 })
      const page2 = await sut.findManyByProduto(tenantId, produtoId, { page: 2, perPage: 2 })

      expect(page1).toHaveLength(2)
      expect(page2).toHaveLength(1)
      const ids = new Set([...page1, ...page2].map((f) => f.id.toString()))
      expect(ids.size).toBe(3)
    })
  })

  describe('save', () => {
    it('atualiza os campos persistidos', async () => {
      const tenantId = await createTenant(prisma)
      const produtoId = await createProduto(prisma, tenantId)
      const ficha = makeFicha(tenantId, produtoId, { descricaoComponente: 'Original' })
      await sut.create(ficha)

      ficha.update({ descricaoComponente: 'Atualizado', quantidadeReferencia: 9 })
      await sut.save(ficha)

      const found = await sut.findById(ficha.id.toString(), tenantId)
      expect(found!.descricaoComponente).toBe('Atualizado')
      expect(found!.quantidadeReferencia).toBe(9)
    })
  })
})
