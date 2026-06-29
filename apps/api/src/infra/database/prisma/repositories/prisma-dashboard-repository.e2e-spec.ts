import { randomUUID } from 'node:crypto'

import { beforeEach, describe, expect, it } from 'vitest'

import { PrismaDashboardRepository } from './prisma-dashboard-repository'

import type { PrismaService } from '../prisma.service'
import type { PrismaClient } from '@prisma/client'

const periodoInicio = new Date('2024-10-01')
const periodoFim = new Date('2024-10-31')

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

async function createCliente(prisma: PrismaClient, tenantId: string): Promise<string> {
  const id = randomUUID()
  await prisma.cliente.create({
    data: {
      id,
      tenantId,
      tipoPessoa: 'PJ',
      razaoSocialNome: 'Cliente LTDA',
      cnpjCpf: randomUUID().replace(/-/g, '').slice(0, 14),
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

async function createArea(
  prisma: PrismaClient,
  tenantId: string,
  empresaId: string,
): Promise<string> {
  const fazendaId = randomUUID()
  await prisma.fazenda.create({
    data: {
      id: fazendaId,
      tenantId,
      empresaId,
      nome: 'Fazenda',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })
  const areaId = randomUUID()
  await prisma.area.create({
    data: {
      id: areaId,
      tenantId,
      fazendaId,
      identificacao: 'Talhão 1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })
  return areaId
}

async function createPedido(
  prisma: PrismaClient,
  tenantId: string,
  empresaId: string,
  clienteId: string,
  override: { status: string; valorTotal: number; data: Date; numero: string },
): Promise<void> {
  await prisma.pedido.create({
    data: {
      id: randomUUID(),
      tenantId,
      empresaFaturadoraId: empresaId,
      clienteId,
      numero: override.numero,
      tipo: 'avulso',
      status: override.status,
      valorTotal: override.valorTotal,
      data: override.data,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })
}

async function createRemessa(
  prisma: PrismaClient,
  tenantId: string,
  empresaId: string,
  clienteId: string,
  override: { data: Date; numero: string },
): Promise<void> {
  await prisma.remessa.create({
    data: {
      id: randomUUID(),
      tenantId,
      empresaFaturadoraId: empresaId,
      clienteId,
      numero: override.numero,
      status: 'aberta',
      data: override.data,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })
}

async function createNota(
  prisma: PrismaClient,
  tenantId: string,
  empresaId: string,
  pedidoId: string,
  clienteId: string,
  status: string,
): Promise<void> {
  await prisma.notaFiscal.create({
    data: {
      id: randomUUID(),
      tenantId,
      empresaEmitenteId: empresaId,
      pedidoId,
      clienteId,
      modelo: '55',
      status,
      ambiente: 'homologacao',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })
}

async function createLote(
  prisma: PrismaClient,
  tenantId: string,
  empresaId: string,
  produtoId: string,
  validade: Date | null,
): Promise<void> {
  await prisma.lote.create({
    data: {
      id: randomUUID(),
      tenantId,
      empresaId,
      produtoId,
      codigoLote: `LOTE-${randomUUID()}`,
      quantidadeInicial: 1000,
      quantidadeAtual: 1000,
      validade,
      dataEntrada: new Date('2024-10-01'),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })
}

async function createSafra(
  prisma: PrismaClient,
  tenantId: string,
  areaId: string,
  status: string,
): Promise<void> {
  await prisma.safra.create({
    data: {
      id: randomUUID(),
      tenantId,
      areaId,
      cultura: 'Soja',
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })
}

describe(PrismaDashboardRepository.name, () => {
  let prisma: PrismaClient
  let sut: PrismaDashboardRepository

  beforeEach(async () => {
    prisma = globalThis.__E2E_PRISMA__!
    sut = new PrismaDashboardRepository(prisma as unknown as PrismaService)
    await prisma.notaFiscal.deleteMany()
    await prisma.pedido.deleteMany()
    await prisma.remessa.deleteMany()
    await prisma.lote.deleteMany()
    await prisma.safra.deleteMany()
    await prisma.area.deleteMany()
    await prisma.fazenda.deleteMany()
    await prisma.produto.deleteMany()
    await prisma.cliente.deleteMany()
    await prisma.empresa.deleteMany()
    await prisma.tenant.deleteMany()
  })

  it('agrega contagens e somas escopadas por tenant + empresa no período', async () => {
    const tenantId = await createTenant(prisma)
    const empresaId = await createEmpresa(prisma, tenantId)
    const clienteId = await createCliente(prisma, tenantId)
    const produtoId = await createProduto(prisma, tenantId, empresaId)
    const areaId = await createArea(prisma, tenantId, empresaId)

    await createPedido(prisma, tenantId, empresaId, clienteId, {
      status: 'faturado',
      valorTotal: 1000,
      data: new Date('2024-10-05'),
      numero: '1',
    })
    await createPedido(prisma, tenantId, empresaId, clienteId, {
      status: 'confirmado',
      valorTotal: 500,
      data: new Date('2024-10-10'),
      numero: '2',
    })
    await createPedido(prisma, tenantId, empresaId, clienteId, {
      status: 'rascunho',
      valorTotal: 999,
      data: new Date('2024-10-10'),
      numero: '3',
    })
    await createPedido(prisma, tenantId, empresaId, clienteId, {
      status: 'faturado',
      valorTotal: 7,
      data: new Date('2024-09-30'),
      numero: '4',
    })

    await createRemessa(prisma, tenantId, empresaId, clienteId, {
      data: new Date('2024-10-02'),
      numero: '1',
    })
    await createRemessa(prisma, tenantId, empresaId, clienteId, {
      data: new Date('2024-11-02'),
      numero: '2',
    })

    const pedido = await prisma.pedido.findFirst({ where: { numero: '1' } })
    await createNota(prisma, tenantId, empresaId, pedido!.id, clienteId, 'autorizada')
    await createNota(prisma, tenantId, empresaId, pedido!.id, clienteId, 'pendente')
    await createNota(prisma, tenantId, empresaId, pedido!.id, clienteId, 'emitindo')
    await createNota(prisma, tenantId, empresaId, pedido!.id, clienteId, 'rejeitada')
    await createNota(prisma, tenantId, empresaId, pedido!.id, clienteId, 'cancelada')

    await createLote(prisma, tenantId, empresaId, produtoId, new Date('2024-11-02'))
    await createLote(prisma, tenantId, empresaId, produtoId, new Date('2025-01-01'))
    await createLote(prisma, tenantId, empresaId, produtoId, null)

    await createSafra(prisma, tenantId, areaId, 'em_andamento')
    await createSafra(prisma, tenantId, areaId, 'planejado')

    const resumo = await sut.resumo(tenantId, empresaId, { periodoInicio, periodoFim })

    expect(resumo.vendasNoPeriodo).toBe(1500)
    expect(resumo.totalPedidos).toBe(3)
    expect(resumo.totalRemessas).toBe(1)
    expect(resumo.notasEmitidas).toBe(1)
    expect(resumo.notasPendentes).toBe(3)
    expect(resumo.posicaoEstoque.totalLotes).toBe(3)
    expect(resumo.posicaoEstoque.lotesVencendo).toBe(1)
    expect(resumo.safrasEmAndamento).toBe(1)
  })

  it('retorna zeros quando empresa não tem dados', async () => {
    const tenantId = await createTenant(prisma)
    const empresaId = await createEmpresa(prisma, tenantId)

    const resumo = await sut.resumo(tenantId, empresaId, { periodoInicio, periodoFim })

    expect(resumo).toEqual({
      vendasNoPeriodo: 0,
      totalPedidos: 0,
      totalRemessas: 0,
      notasEmitidas: 0,
      notasPendentes: 0,
      posicaoEstoque: { totalLotes: 0, lotesVencendo: 0 },
      safrasEmAndamento: 0,
    })
  })

  it('isola por empresa (outra empresa não conta)', async () => {
    const tenantId = await createTenant(prisma)
    const empresaId = await createEmpresa(prisma, tenantId)
    const outraEmpresaId = await createEmpresa(prisma, tenantId)
    const clienteId = await createCliente(prisma, tenantId)

    await createPedido(prisma, tenantId, outraEmpresaId, clienteId, {
      status: 'faturado',
      valorTotal: 1000,
      data: new Date('2024-10-05'),
      numero: '1',
    })

    const resumo = await sut.resumo(tenantId, empresaId, { periodoInicio, periodoFim })

    expect(resumo.vendasNoPeriodo).toBe(0)
    expect(resumo.totalPedidos).toBe(0)
  })
})
