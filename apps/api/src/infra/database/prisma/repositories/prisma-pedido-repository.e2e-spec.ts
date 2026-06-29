import { randomUUID } from 'node:crypto'

import { describe, it, expect, beforeEach } from 'vitest'

import { PrismaPedidoRepository } from './prisma-pedido-repository'

import type { PrismaService } from '../prisma.service'
import type { PedidoStatus } from '@/domain/enterprise/entities/pedido'
import type { PrismaClient } from '@prisma/client'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Pedido } from '@/domain/enterprise/entities/pedido'
import { PedidoItem } from '@/domain/enterprise/entities/pedido-item'

function cnpj(): string {
  return randomUUID().replace(/-/g, '').slice(0, 14)
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
      cnpjCpf: cnpj(),
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

async function createCliente(prisma: PrismaClient, tenantId: string): Promise<string> {
  const id = randomUUID()
  await prisma.cliente.create({
    data: {
      id,
      tenantId,
      tipoPessoa: 'PJ',
      razaoSocialNome: 'Cliente Agro LTDA',
      cnpjCpf: cnpj(),
      indicadorIe: '1',
      contribuinteIcms: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })
  return id
}

async function createLote(
  prisma: PrismaClient,
  tenantId: string,
  empresaId: string,
  produtoId: string,
): Promise<string> {
  const id = randomUUID()
  await prisma.lote.create({
    data: {
      id,
      tenantId,
      empresaId,
      produtoId,
      codigoLote: `LT-${id.slice(0, 8)}`,
      quantidadeInicial: 100,
      quantidadeAtual: 100,
      dataEntrada: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })
  return id
}

interface SeedCtx {
  tenantId: string
  empresaId: string
  produtoId: string
  clienteId: string
}

function makeItem(
  ctx: SeedCtx,
  override: Partial<{ quantidade: number; precoUnitario: number; loteId: string | null }> = {},
) {
  return PedidoItem.create({
    tenantId: ctx.tenantId,
    pedidoId: '',
    produtoId: ctx.produtoId,
    loteId: override.loteId ?? null,
    quantidade: override.quantidade ?? 10,
    precoUnitario: override.precoUnitario ?? 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
}

function makePedido(
  ctx: SeedCtx,
  override: Partial<{
    id: string
    numero: string
    status: PedidoStatus
    clienteId: string
    data: Date
    itens: PedidoItem[]
  }> = {},
): Pedido {
  const id = override.id ?? randomUUID()
  const pedido = Pedido.create(
    {
      tenantId: ctx.tenantId,
      empresaFaturadoraId: ctx.empresaId,
      clienteId: override.clienteId ?? ctx.clienteId,
      numero: override.numero ?? '000001',
      tipo: 'avulso',
      status: override.status ?? 'rascunho',
      data: override.data ?? new Date('2024-10-15'),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID(id),
  )
  for (const item of override.itens ?? []) pedido.addItem(item)
  return pedido
}

describe(PrismaPedidoRepository.name, () => {
  let prisma: PrismaClient
  let sut: PrismaPedidoRepository

  beforeEach(async () => {
    prisma = globalThis.__E2E_PRISMA__!
    sut = new PrismaPedidoRepository(prisma as unknown as PrismaService)
    await prisma.pedidoItem.deleteMany()
    await prisma.remessaItem.deleteMany()
    await prisma.remessa.deleteMany()
    await prisma.pedido.deleteMany()
    await prisma.lote.deleteMany()
    await prisma.produto.deleteMany()
    await prisma.cliente.deleteMany()
    await prisma.empresa.deleteMany()
    await prisma.tenant.deleteMany()
  })

  async function seed(): Promise<SeedCtx> {
    const tenantId = await createTenant(prisma)
    const empresaId = await createEmpresa(prisma, tenantId)
    const produtoId = await createProduto(prisma, tenantId, empresaId)
    const clienteId = await createCliente(prisma, tenantId)
    return { tenantId, empresaId, produtoId, clienteId }
  }

  describe('create + findById', () => {
    it('persiste o pedido com itens aninhados e recupera (Decimal -> number)', async () => {
      const ctx = await seed()
      const item = makeItem(ctx, { quantidade: 1234.567, precoUnitario: 12.34 })
      const pedido = makePedido(ctx, { itens: [item] })

      await sut.create(pedido)
      const found = await sut.findById(pedido.id.toString(), ctx.tenantId)

      expect(found).not.toBeNull()
      expect(found!.itens).toHaveLength(1)
      expect(found!.itens[0].quantidade).toBe(1234.567)
      expect(found!.itens[0].precoUnitario).toBe(12.34)
      expect(found!.itens[0].valorTotal).toBeCloseTo(1234.567 * 12.34, 2)
      expect(found!.valorTotal).toBeCloseTo(1234.567 * 12.34, 2)
    })

    it('retorna null quando pertence a outro tenant (isolamento)', async () => {
      const ctx = await seed()
      const other = await seed()
      const pedido = makePedido(ctx, { itens: [makeItem(ctx)] })
      await sut.create(pedido)

      const found = await sut.findById(pedido.id.toString(), other.tenantId)
      expect(found).toBeNull()
    })

    it('retorna null para pedido soft-deletado', async () => {
      const ctx = await seed()
      const pedido = makePedido(ctx, { itens: [makeItem(ctx)] })
      await sut.create(pedido)
      await prisma.pedido.update({
        where: { id: pedido.id.toString() },
        data: { deletedAt: new Date() },
      })

      const found = await sut.findById(pedido.id.toString(), ctx.tenantId)
      expect(found).toBeNull()
    })
  })

  describe('findManyByEmpresa + count', () => {
    it('isola por tenant, ignora soft-deletados e aplica filtros + paginação', async () => {
      const ctx = await seed()
      const other = await seed()
      const clienteB = await createCliente(prisma, ctx.tenantId)

      await sut.create(
        makePedido(ctx, {
          numero: '000001',
          status: 'rascunho',
          data: new Date('2024-10-05'),
          itens: [makeItem(ctx)],
        }),
      )
      await sut.create(
        makePedido(ctx, {
          numero: '000002',
          status: 'confirmado',
          data: new Date('2024-10-20'),
          itens: [makeItem(ctx)],
        }),
      )
      await sut.create(
        makePedido(ctx, {
          numero: '000003',
          status: 'confirmado',
          clienteId: clienteB,
          data: new Date('2024-11-10'),
          itens: [makeItem(ctx)],
        }),
      )
      // outro tenant — não deve aparecer
      await sut.create(makePedido(other, { numero: '000001', itens: [makeItem(other)] }))
      // soft-deletado — não deve aparecer
      const deleted = makePedido(ctx, { numero: '000099', itens: [makeItem(ctx)] })
      await sut.create(deleted)
      await prisma.pedido.update({
        where: { id: deleted.id.toString() },
        data: { deletedAt: new Date() },
      })

      const todos = await sut.findManyByEmpresa(
        ctx.tenantId,
        ctx.empresaId,
        {},
        { page: 1, perPage: 10 },
      )
      expect(todos).toHaveLength(3)
      expect(await sut.count(ctx.tenantId, ctx.empresaId, {})).toBe(3)

      const porStatus = await sut.findManyByEmpresa(
        ctx.tenantId,
        ctx.empresaId,
        { status: 'confirmado' },
        { page: 1, perPage: 10 },
      )
      expect(porStatus).toHaveLength(2)
      expect(await sut.count(ctx.tenantId, ctx.empresaId, { status: 'confirmado' })).toBe(2)

      const porCliente = await sut.findManyByEmpresa(
        ctx.tenantId,
        ctx.empresaId,
        { clienteId: clienteB },
        { page: 1, perPage: 10 },
      )
      expect(porCliente).toHaveLength(1)
      expect(porCliente[0].clienteId).toBe(clienteB)

      const porPeriodo = await sut.findManyByEmpresa(
        ctx.tenantId,
        ctx.empresaId,
        { periodoInicio: new Date('2024-10-01'), periodoFim: new Date('2024-10-31') },
        { page: 1, perPage: 10 },
      )
      expect(porPeriodo).toHaveLength(2)
      expect(
        await sut.count(ctx.tenantId, ctx.empresaId, {
          periodoInicio: new Date('2024-10-01'),
          periodoFim: new Date('2024-10-31'),
        }),
      ).toBe(2)
    })

    it('aplica take/skip por página', async () => {
      const ctx = await seed()
      for (const numero of ['000001', '000002', '000003']) {
        await sut.create(makePedido(ctx, { numero, itens: [makeItem(ctx)] }))
      }

      const page1 = await sut.findManyByEmpresa(
        ctx.tenantId,
        ctx.empresaId,
        {},
        { page: 1, perPage: 2 },
      )
      const page2 = await sut.findManyByEmpresa(
        ctx.tenantId,
        ctx.empresaId,
        {},
        { page: 2, perPage: 2 },
      )

      expect(page1).toHaveLength(2)
      expect(page2).toHaveLength(1)
      const ids = new Set([...page1, ...page2].map((p) => p.id.toString()))
      expect(ids.size).toBe(3)
    })
  })

  describe('nextNumero', () => {
    it('começa em 000001, incrementa e é escopado por empresa', async () => {
      const ctx = await seed()
      const empresaB = await createEmpresa(prisma, ctx.tenantId)

      expect(await sut.nextNumero(ctx.tenantId, ctx.empresaId)).toBe('000001')

      await sut.create(makePedido(ctx, { numero: '000001', itens: [makeItem(ctx)] }))
      expect(await sut.nextNumero(ctx.tenantId, ctx.empresaId)).toBe('000002')

      // segunda empresa reinicia em 000001
      expect(await sut.nextNumero(ctx.tenantId, empresaB)).toBe('000001')
    })
  })

  describe('save', () => {
    it('atualiza o status persistido', async () => {
      const ctx = await seed()
      const pedido = makePedido(ctx, { status: 'rascunho', itens: [makeItem(ctx)] })
      await sut.create(pedido)

      const transicao = pedido.confirmar()
      expect(transicao.isRight()).toBe(true)
      await sut.save(pedido)

      const found = await sut.findById(pedido.id.toString(), ctx.tenantId)
      expect(found!.status).toBe('confirmado')
    })
  })

  describe('findItensByLote', () => {
    it('retorna itens que referenciam o lote com dados do pedido e cliente', async () => {
      const ctx = await seed()
      const loteId = await createLote(prisma, ctx.tenantId, ctx.empresaId, ctx.produtoId)

      await sut.create(
        makePedido(ctx, {
          numero: '000010',
          status: 'confirmado',
          data: new Date('2024-10-09'),
          itens: [makeItem(ctx, { loteId, quantidade: 42, precoUnitario: 3 })],
        }),
      )
      // item de outro lote — não deve aparecer
      await sut.create(makePedido(ctx, { numero: '000011', itens: [makeItem(ctx)] }))

      const itens = await sut.findItensByLote(ctx.tenantId, loteId)

      expect(itens).toHaveLength(1)
      expect(itens[0]).toMatchObject({
        numero: '000010',
        clienteId: ctx.clienteId,
        clienteNome: 'Cliente Agro LTDA',
        quantidade: 42,
        status: 'confirmado',
      })
      expect(itens[0].data).toEqual(new Date('2024-10-09'))
    })

    it('isola por tenant e ignora pedidos/itens soft-deletados', async () => {
      const ctx = await seed()
      const other = await seed()
      const loteId = await createLote(prisma, ctx.tenantId, ctx.empresaId, ctx.produtoId)

      // outro tenant referenciando o mesmo loteId — não deve vazar
      await sut.create(
        makePedido(other, { numero: '000001', itens: [makeItem(other, { loteId })] }),
      )

      const deletedPedido = makePedido(ctx, {
        numero: '000020',
        itens: [makeItem(ctx, { loteId })],
      })
      await sut.create(deletedPedido)
      await prisma.pedido.update({
        where: { id: deletedPedido.id.toString() },
        data: { deletedAt: new Date() },
      })

      const itemDeletado = makePedido(ctx, {
        numero: '000021',
        itens: [makeItem(ctx, { loteId })],
      })
      await sut.create(itemDeletado)
      await prisma.pedidoItem.updateMany({
        where: { pedidoId: itemDeletado.id.toString() },
        data: { deletedAt: new Date() },
      })

      const itens = await sut.findItensByLote(ctx.tenantId, loteId)
      expect(itens).toHaveLength(0)
    })
  })
})
