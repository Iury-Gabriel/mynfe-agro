import { randomUUID } from 'node:crypto'

import { describe, it, expect, beforeEach } from 'vitest'

import { PrismaRemessaRepository } from './prisma-remessa-repository'
import { PrismaVendaWriteRepository } from './prisma-venda-write-repository'

import type { PrismaService } from '../prisma.service'
import type { PrismaClient } from '@prisma/client'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Pedido } from '@/domain/enterprise/entities/pedido'
import { PedidoItem } from '@/domain/enterprise/entities/pedido-item'
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

function makeRemessa(ctx: SeedCtx, numero: string): Remessa {
  const remessa = Remessa.create(
    {
      tenantId: ctx.tenantId,
      empresaFaturadoraId: ctx.empresaId,
      clienteId: ctx.clienteId,
      numero,
      status: 'aberta',
      data: new Date('2024-10-15'),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID(randomUUID()),
  )
  remessa.addItem(
    RemessaItem.create({
      tenantId: ctx.tenantId,
      remessaId: remessa.id.toString(),
      produtoId: ctx.produtoId,
      quantidade: 100.5,
      precoUnitario: 12.34,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  )
  return remessa
}

function makeConsolidado(ctx: SeedCtx, remessas: Remessa[]): Pedido {
  const pedido = Pedido.create(
    {
      tenantId: ctx.tenantId,
      empresaFaturadoraId: ctx.empresaId,
      clienteId: ctx.clienteId,
      numero: '000001',
      tipo: 'consolidado',
      status: 'confirmado',
      periodoConsolidacao: new Date('2024-10-31'),
      data: new Date('2024-10-31'),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID(randomUUID()),
  )
  for (const remessa of remessas) {
    for (const item of remessa.itens) {
      pedido.addItem(
        PedidoItem.create({
          tenantId: ctx.tenantId,
          pedidoId: pedido.id.toString(),
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          precoUnitario: item.precoUnitario,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      )
    }
  }
  return pedido
}

describe(PrismaVendaWriteRepository.name, () => {
  let prisma: PrismaClient
  let sut: PrismaVendaWriteRepository
  let remessaRepo: PrismaRemessaRepository

  beforeEach(async () => {
    prisma = globalThis.__E2E_PRISMA__!
    sut = new PrismaVendaWriteRepository(prisma as unknown as PrismaService)
    remessaRepo = new PrismaRemessaRepository(prisma as unknown as PrismaService)
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

  it('consolidar cria o pedido consolidado e marca as remessas como consolidadas', async () => {
    const ctx = await seed()
    const remessas = [makeRemessa(ctx, '000001'), makeRemessa(ctx, '000002')]
    for (const remessa of remessas) await remessaRepo.create(remessa)

    const pedido = makeConsolidado(ctx, remessas)
    for (const remessa of remessas) {
      const transicao = remessa.marcarConsolidada(pedido.id.toString())
      expect(transicao.isRight()).toBe(true)
    }

    await sut.consolidar({ pedido, remessas })

    const persistedPedido = await prisma.pedido.findFirst({
      where: { id: pedido.id.toString() },
      include: { itens: true },
    })
    expect(persistedPedido).not.toBeNull()
    expect(persistedPedido!.tipo).toBe('consolidado')
    expect(persistedPedido!.status).toBe('confirmado')
    expect(persistedPedido!.itens).toHaveLength(2)

    for (const remessa of remessas) {
      const row = await prisma.remessa.findUnique({ where: { id: remessa.id.toString() } })
      expect(row!.status).toBe('consolidada')
      expect(row!.pedidoConsolidadoId).toBe(pedido.id.toString())
    }
  })

  it('rollback: pedido não é persistido quando uma remessa update falha (atomicidade)', async () => {
    const ctx = await seed()
    const remessas = [makeRemessa(ctx, '000001'), makeRemessa(ctx, '000002')]
    await remessaRepo.create(remessas[0])
    // a segunda remessa NÃO é persistida — o update dentro da transação vai falhar

    const pedido = makeConsolidado(ctx, remessas)
    for (const remessa of remessas) remessa.marcarConsolidada(pedido.id.toString())

    await expect(sut.consolidar({ pedido, remessas })).rejects.toThrow()

    expect(await prisma.pedido.count()).toBe(0)
    expect(await prisma.pedidoItem.count()).toBe(0)
    const persistedRemessa = await prisma.remessa.findUnique({
      where: { id: remessas[0].id.toString() },
    })
    expect(persistedRemessa!.status).toBe('aberta')
    expect(persistedRemessa!.pedidoConsolidadoId).toBeNull()
  })
})
