import { randomUUID } from 'node:crypto'

import { describe, it, expect, beforeEach } from 'vitest'

import { PrismaNotaFiscalRepository } from './prisma-nota-fiscal-repository'

import type { PrismaService } from '../prisma.service'
import type { PrismaClient } from '@prisma/client'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Empresa } from '@/domain/enterprise/entities/empresa'
import { NotaFiscal } from '@/domain/enterprise/entities/nota-fiscal'
import { NotaFiscalEvento } from '@/domain/enterprise/entities/nota-fiscal-evento'
import { NotaFiscalItem } from '@/domain/enterprise/entities/nota-fiscal-item'
import { CnpjCpf } from '@/domain/enterprise/entities/value-objects/cnpj-cpf'

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

async function createEmpresa(
  prisma: PrismaClient,
  tenantId: string,
  proximaNumeracaoNfe = 1n,
): Promise<string> {
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
      serieNfe: '1',
      proximaNumeracaoNfe,
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

async function createPedido(
  prisma: PrismaClient,
  tenantId: string,
  empresaId: string,
  clienteId: string,
): Promise<string> {
  const id = randomUUID()
  await prisma.pedido.create({
    data: {
      id,
      tenantId,
      empresaFaturadoraId: empresaId,
      clienteId,
      numero: '000001',
      tipo: 'avulso',
      status: 'confirmado',
      data: new Date(),
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
  pedidoId: string
}

function makeEmpresaEntity(ctx: SeedCtx, empresaId: string, proximaNumeracaoNfe: number): Empresa {
  const cnpjResult = CnpjCpf.create('11222333000181')
  if (cnpjResult.isLeft()) throw new Error('cnpj inválido na seed')
  return Empresa.create(
    {
      tenantId: ctx.tenantId,
      tipoPessoa: 'PJ',
      razaoSocial: 'Agro LTDA',
      cnpjCpf: cnpjResult.value,
      regimeTributario: 'simples_nacional',
      crt: '1',
      ambienteFiscal: 'homologacao',
      serieNfe: 1,
      proximaNumeracaoNfe,
      status: 'ativo',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID(empresaId),
  )
}

function makeNota(ctx: SeedCtx): NotaFiscal {
  const nota = NotaFiscal.create(
    {
      tenantId: ctx.tenantId,
      empresaEmitenteId: ctx.empresaId,
      pedidoId: ctx.pedidoId,
      clienteId: ctx.clienteId,
      numero: '1',
      serie: '1',
      ambiente: 'homologacao',
      status: 'emitindo',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID(randomUUID()),
  )
  nota.addItem(
    NotaFiscalItem.create({
      tenantId: ctx.tenantId,
      notaFiscalId: nota.id.toString(),
      produtoId: ctx.produtoId,
      descricao: 'Soja',
      quantidade: 100,
      valorUnitario: 12.34,
      impostos: { icms: { aliquota: 12 } },
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  )
  nota.addEvento(
    NotaFiscalEvento.create({
      tenantId: ctx.tenantId,
      notaFiscalId: nota.id.toString(),
      tipo: 'emissao',
      payload: { numero: '1' },
      data: new Date(),
    }),
  )
  return nota
}

describe(PrismaNotaFiscalRepository.name, () => {
  let prisma: PrismaClient
  let sut: PrismaNotaFiscalRepository

  beforeEach(async () => {
    prisma = globalThis.__E2E_PRISMA__!
    sut = new PrismaNotaFiscalRepository(prisma as unknown as PrismaService)
    await prisma.notaFiscalEvento.deleteMany()
    await prisma.notaFiscalItem.deleteMany()
    await prisma.notaFiscal.deleteMany()
    await prisma.pedidoItem.deleteMany()
    await prisma.pedido.deleteMany()
    await prisma.produto.deleteMany()
    await prisma.cliente.deleteMany()
    await prisma.empresa.deleteMany()
    await prisma.tenant.deleteMany()
  })

  async function seed(proximaNumeracaoNfe = 1n): Promise<SeedCtx> {
    const tenantId = await createTenant(prisma)
    const empresaId = await createEmpresa(prisma, tenantId, proximaNumeracaoNfe)
    const produtoId = await createProduto(prisma, tenantId, empresaId)
    const clienteId = await createCliente(prisma, tenantId)
    const pedidoId = await createPedido(prisma, tenantId, empresaId, clienteId)
    return { tenantId, empresaId, produtoId, clienteId, pedidoId }
  }

  it('criarEmissao persiste nota, itens, evento e atualiza a numeração da empresa', async () => {
    const ctx = await seed(5n)
    const nota = makeNota(ctx)
    const empresa = makeEmpresaEntity(ctx, ctx.empresaId, 6)

    await sut.criarEmissao({ nota, empresa })

    const persisted = await prisma.notaFiscal.findUnique({
      where: { id: nota.id.toString() },
      include: { itens: true, eventos: true },
    })
    expect(persisted).not.toBeNull()
    expect(persisted!.status).toBe('emitindo')
    expect(persisted!.itens).toHaveLength(1)
    expect(persisted!.eventos).toHaveLength(1)
    expect(persisted!.itens[0].valorTotal.toNumber()).toBe(1234)

    const empresaRow = await prisma.empresa.findUnique({ where: { id: ctx.empresaId } })
    expect(empresaRow!.proximaNumeracaoNfe).toBe(6n)
  })

  it('rollback: nota não é persistida quando o update da empresa falha (atomicidade)', async () => {
    const ctx = await seed()
    const nota = makeNota(ctx)
    const empresa = makeEmpresaEntity(ctx, randomUUID(), 2)

    await expect(sut.criarEmissao({ nota, empresa })).rejects.toThrow()

    expect(await prisma.notaFiscal.count()).toBe(0)
    expect(await prisma.notaFiscalItem.count()).toBe(0)
    expect(await prisma.notaFiscalEvento.count()).toBe(0)
  })

  it('atualizarStatusComEvento atualiza a nota e insere o evento', async () => {
    const ctx = await seed()
    const nota = makeNota(ctx)
    const empresa = makeEmpresaEntity(ctx, ctx.empresaId, 2)
    await sut.criarEmissao({ nota, empresa })

    const transicao = nota.marcarAutorizada({
      chaveAcesso: '0'.repeat(44),
      protocolo: 'protocolo-1',
      plugnotasId: 'pn-1',
      dataEmissao: new Date(),
    })
    expect(transicao.isRight()).toBe(true)

    const evento = NotaFiscalEvento.create({
      tenantId: ctx.tenantId,
      notaFiscalId: nota.id.toString(),
      tipo: 'emissao',
      payload: { status: 'autorizada' },
      data: new Date(),
    })

    await sut.atualizarStatusComEvento({ nota, evento })

    const persisted = await prisma.notaFiscal.findUnique({
      where: { id: nota.id.toString() },
      include: { eventos: true },
    })
    expect(persisted!.status).toBe('autorizada')
    expect(persisted!.chaveAcesso).toBe('0'.repeat(44))
    expect(persisted!.plugnotasId).toBe('pn-1')
    expect(persisted!.eventos).toHaveLength(2)
  })

  it('findById carrega itens e eventos; findByPlugnotasId localiza pela chave plugnotas', async () => {
    const ctx = await seed()
    const nota = makeNota(ctx)
    nota.registrarPlugnotasId('pn-find')
    const empresa = makeEmpresaEntity(ctx, ctx.empresaId, 2)
    await sut.criarEmissao({ nota, empresa })

    const byId = await sut.findById(nota.id.toString(), ctx.tenantId)
    expect(byId).not.toBeNull()
    expect(byId!.itens).toHaveLength(1)
    expect(byId!.eventos).toHaveLength(1)

    const byPlugnotas = await sut.findByPlugnotasId('pn-find', ctx.tenantId)
    expect(byPlugnotas!.id.toString()).toBe(nota.id.toString())

    const missing = await sut.findById('inexistente', ctx.tenantId)
    expect(missing).toBeNull()
    const missingPlug = await sut.findByPlugnotasId('nada', ctx.tenantId)
    expect(missingPlug).toBeNull()
  })

  it('findManyByEmpresa/count filtram por status e isolam por empresa; findAtivasByPedido lista por pedido', async () => {
    const ctx = await seed()
    const empresa = makeEmpresaEntity(ctx, ctx.empresaId, 2)

    const nota1 = makeNota(ctx)
    await sut.criarEmissao({ nota: nota1, empresa })

    const nota2 = makeNota(ctx)
    await sut.criarEmissao({ nota: nota2, empresa })
    const transicao = nota2.marcarAutorizada({
      chaveAcesso: '0'.repeat(44),
      protocolo: 'p',
      dataEmissao: new Date(),
    })
    expect(transicao.isRight()).toBe(true)
    await sut.save(nota2)

    const todas = await sut.findManyByEmpresa(ctx.tenantId, ctx.empresaId, {}, { page: 1, perPage: 20 })
    expect(todas).toHaveLength(2)

    const totalEmitindo = await sut.count(ctx.tenantId, ctx.empresaId, { status: 'emitindo' })
    expect(totalEmitindo).toBe(1)

    const totalAutorizada = await sut.count(ctx.tenantId, ctx.empresaId, { status: 'autorizada' })
    expect(totalAutorizada).toBe(1)

    const outraEmpresa = await sut.findManyByEmpresa(
      ctx.tenantId,
      randomUUID(),
      {},
      { page: 1, perPage: 20 },
    )
    expect(outraEmpresa).toHaveLength(0)

    const ativas = await sut.findAtivasByPedido(ctx.tenantId, ctx.pedidoId)
    expect(ativas).toHaveLength(2)
  })

  it('findManyByEmpresa/count filtram por pedidoId', async () => {
    const ctx = await seed()
    const empresa = makeEmpresaEntity(ctx, ctx.empresaId, 2)

    const nota1 = makeNota(ctx)
    await sut.criarEmissao({ nota: nota1, empresa })

    const outroPedidoId = await createPedido(prisma, ctx.tenantId, ctx.empresaId, ctx.clienteId)
    const nota2 = makeNota({ ...ctx, pedidoId: outroPedidoId })
    await sut.criarEmissao({ nota: nota2, empresa })

    const doPedido = await sut.findManyByEmpresa(
      ctx.tenantId,
      ctx.empresaId,
      { pedidoId: ctx.pedidoId },
      { page: 1, perPage: 20 },
    )
    expect(doPedido).toHaveLength(1)
    expect(doPedido[0].id.toString()).toBe(nota1.id.toString())

    const total = await sut.count(ctx.tenantId, ctx.empresaId, { pedidoId: outroPedidoId })
    expect(total).toBe(1)
  })
})
