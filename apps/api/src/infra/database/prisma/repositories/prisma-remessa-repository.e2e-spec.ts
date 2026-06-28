import { randomUUID } from 'node:crypto'

import { describe, it, expect, beforeEach } from 'vitest'

import { PrismaRemessaRepository } from './prisma-remessa-repository'

import type { PrismaService } from '../prisma.service'
import type { RemessaStatus } from '@/domain/enterprise/entities/remessa'
import type { PrismaClient } from '@prisma/client'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Remessa } from '@/domain/enterprise/entities/remessa'
import { RemessaItem } from '@/domain/enterprise/entities/remessa-item'

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

interface SeedCtx {
  tenantId: string
  empresaId: string
  produtoId: string
  clienteId: string
}

function makeItem(
  ctx: SeedCtx,
  override: Partial<{ quantidade: number; precoUnitario: number }> = {},
) {
  return RemessaItem.create({
    tenantId: ctx.tenantId,
    remessaId: '',
    produtoId: ctx.produtoId,
    quantidade: override.quantidade ?? 10,
    precoUnitario: override.precoUnitario ?? 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
}

function makeRemessa(
  ctx: SeedCtx,
  override: Partial<{
    id: string
    numero: string
    status: RemessaStatus
    clienteId: string
    data: Date
    pedidoConsolidadoId: string | null
    itens: RemessaItem[]
  }> = {},
): Remessa {
  const id = override.id ?? randomUUID()
  const remessa = Remessa.create(
    {
      tenantId: ctx.tenantId,
      empresaFaturadoraId: ctx.empresaId,
      clienteId: override.clienteId ?? ctx.clienteId,
      numero: override.numero ?? '000001',
      status: override.status ?? 'aberta',
      pedidoConsolidadoId: override.pedidoConsolidadoId ?? null,
      data: override.data ?? new Date('2024-10-15'),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID(id),
  )
  for (const item of override.itens ?? []) remessa.addItem(item)
  return remessa
}

describe(PrismaRemessaRepository.name, () => {
  let prisma: PrismaClient
  let sut: PrismaRemessaRepository

  beforeEach(async () => {
    prisma = globalThis.__E2E_PRISMA__!
    sut = new PrismaRemessaRepository(prisma as unknown as PrismaService)
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
    it('persiste a remessa com itens aninhados e recupera (Decimal -> number)', async () => {
      const ctx = await seed()
      const item = makeItem(ctx, { quantidade: 1234.567, precoUnitario: 12.34 })
      const remessa = makeRemessa(ctx, { itens: [item] })

      await sut.create(remessa)
      const found = await sut.findById(remessa.id.toString(), ctx.tenantId)

      expect(found).not.toBeNull()
      expect(found!.itens).toHaveLength(1)
      expect(found!.itens[0].quantidade).toBe(1234.567)
      expect(found!.itens[0].precoUnitario).toBe(12.34)
      expect(found!.valorEstimado).toBeCloseTo(1234.567 * 12.34, 2)
    })

    it('retorna null quando pertence a outro tenant (isolamento)', async () => {
      const ctx = await seed()
      const other = await seed()
      const remessa = makeRemessa(ctx, { itens: [makeItem(ctx)] })
      await sut.create(remessa)

      expect(await sut.findById(remessa.id.toString(), other.tenantId)).toBeNull()
    })

    it('retorna null para remessa soft-deletada', async () => {
      const ctx = await seed()
      const remessa = makeRemessa(ctx, { itens: [makeItem(ctx)] })
      await sut.create(remessa)
      await prisma.remessa.update({
        where: { id: remessa.id.toString() },
        data: { deletedAt: new Date() },
      })

      expect(await sut.findById(remessa.id.toString(), ctx.tenantId)).toBeNull()
    })
  })

  describe('findManyByEmpresa + count', () => {
    it('isola por tenant, ignora soft-deletados e aplica filtros + paginação', async () => {
      const ctx = await seed()
      const other = await seed()
      const clienteB = await createCliente(prisma, ctx.tenantId)

      await sut.create(
        makeRemessa(ctx, {
          numero: '000001',
          status: 'aberta',
          data: new Date('2024-10-05'),
          itens: [makeItem(ctx)],
        }),
      )
      await sut.create(
        makeRemessa(ctx, {
          numero: '000002',
          status: 'entregue',
          data: new Date('2024-10-20'),
          itens: [makeItem(ctx)],
        }),
      )
      await sut.create(
        makeRemessa(ctx, {
          numero: '000003',
          status: 'entregue',
          clienteId: clienteB,
          data: new Date('2024-11-10'),
          itens: [makeItem(ctx)],
        }),
      )
      await sut.create(makeRemessa(other, { numero: '000001', itens: [makeItem(other)] }))
      const deleted = makeRemessa(ctx, { numero: '000099', itens: [makeItem(ctx)] })
      await sut.create(deleted)
      await prisma.remessa.update({
        where: { id: deleted.id.toString() },
        data: { deletedAt: new Date() },
      })

      const todas = await sut.findManyByEmpresa(
        ctx.tenantId,
        ctx.empresaId,
        {},
        { page: 1, perPage: 10 },
      )
      expect(todas).toHaveLength(3)
      expect(await sut.count(ctx.tenantId, ctx.empresaId, {})).toBe(3)

      const porStatus = await sut.findManyByEmpresa(
        ctx.tenantId,
        ctx.empresaId,
        { status: 'entregue' },
        { page: 1, perPage: 10 },
      )
      expect(porStatus).toHaveLength(2)
      expect(await sut.count(ctx.tenantId, ctx.empresaId, { status: 'entregue' })).toBe(2)

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
    })

    it('aplica take/skip por página', async () => {
      const ctx = await seed()
      for (const numero of ['000001', '000002', '000003']) {
        await sut.create(makeRemessa(ctx, { numero, itens: [makeItem(ctx)] }))
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
      expect(new Set([...page1, ...page2].map((r) => r.id.toString())).size).toBe(3)
    })
  })

  describe('findNaoConsolidadasByClientePeriodo', () => {
    it('retorna só aberta/entregue dentro da janela para o cliente', async () => {
      const ctx = await seed()
      const inicio = new Date('2024-10-01')
      const fim = new Date('2024-10-31')

      const aberta = makeRemessa(ctx, {
        numero: '000001',
        status: 'aberta',
        data: new Date('2024-10-05'),
        itens: [makeItem(ctx)],
      })
      const entregue = makeRemessa(ctx, {
        numero: '000002',
        status: 'entregue',
        data: new Date('2024-10-20'),
        itens: [makeItem(ctx)],
      })
      const consolidada = makeRemessa(ctx, {
        numero: '000003',
        status: 'consolidada',
        data: new Date('2024-10-15'),
        itens: [makeItem(ctx)],
      })
      const foraJanela = makeRemessa(ctx, {
        numero: '000004',
        status: 'aberta',
        data: new Date('2024-11-05'),
        itens: [makeItem(ctx)],
      })
      const outroCliente = await createCliente(prisma, ctx.tenantId)
      const deOutroCliente = makeRemessa(ctx, {
        numero: '000005',
        status: 'aberta',
        clienteId: outroCliente,
        data: new Date('2024-10-10'),
        itens: [makeItem(ctx)],
      })

      for (const r of [aberta, entregue, consolidada, foraJanela, deOutroCliente]) {
        await sut.create(r)
      }

      const result = await sut.findNaoConsolidadasByClientePeriodo(
        ctx.tenantId,
        ctx.empresaId,
        ctx.clienteId,
        inicio,
        fim,
      )

      expect(result).toHaveLength(2)
      const numeros = result.map((r) => r.numero).sort()
      expect(numeros).toEqual(['000001', '000002'])
    })
  })

  async function createPedido(ctx: SeedCtx): Promise<string> {
    const id = randomUUID()
    await prisma.pedido.create({
      data: {
        id,
        tenantId: ctx.tenantId,
        empresaFaturadoraId: ctx.empresaId,
        clienteId: ctx.clienteId,
        numero: '000001',
        tipo: 'consolidado',
        status: 'confirmado',
        data: new Date('2024-10-31'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
    return id
  }

  describe('findByPedidoConsolidado', () => {
    it('retorna as remessas com o pedidoConsolidadoId informado', async () => {
      const ctx = await seed()
      const pedidoId = await createPedido(ctx)

      await sut.create(
        makeRemessa(ctx, {
          numero: '000001',
          status: 'consolidada',
          pedidoConsolidadoId: pedidoId,
          itens: [makeItem(ctx)],
        }),
      )
      await sut.create(
        makeRemessa(ctx, {
          numero: '000002',
          status: 'consolidada',
          pedidoConsolidadoId: pedidoId,
          itens: [makeItem(ctx)],
        }),
      )
      await sut.create(
        makeRemessa(ctx, {
          numero: '000003',
          status: 'aberta',
          pedidoConsolidadoId: null,
          itens: [makeItem(ctx)],
        }),
      )

      const result = await sut.findByPedidoConsolidado(ctx.tenantId, pedidoId)
      expect(result).toHaveLength(2)
      expect(result.every((r) => r.pedidoConsolidadoId === pedidoId)).toBe(true)
    })
  })

  describe('nextNumero', () => {
    it('começa em 000001, incrementa e é escopado por empresa', async () => {
      const ctx = await seed()
      const empresaB = await createEmpresa(prisma, ctx.tenantId)

      expect(await sut.nextNumero(ctx.tenantId, ctx.empresaId)).toBe('000001')

      await sut.create(makeRemessa(ctx, { numero: '000001', itens: [makeItem(ctx)] }))
      expect(await sut.nextNumero(ctx.tenantId, ctx.empresaId)).toBe('000002')

      expect(await sut.nextNumero(ctx.tenantId, empresaB)).toBe('000001')
    })
  })

  describe('save', () => {
    it('atualiza o status persistido', async () => {
      const ctx = await seed()
      const remessa = makeRemessa(ctx, { status: 'aberta', itens: [makeItem(ctx)] })
      await sut.create(remessa)

      const transicao = remessa.marcarEntregue()
      expect(transicao.isRight()).toBe(true)
      await sut.save(remessa)

      const found = await sut.findById(remessa.id.toString(), ctx.tenantId)
      expect(found!.status).toBe('entregue')
    })
  })
})
