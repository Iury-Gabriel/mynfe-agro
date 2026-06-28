import { Injectable } from '@nestjs/common'

import { PrismaRemessaMapper } from '../mappers/admin/prisma-remessa-mapper'
import { PrismaService } from '../prisma.service'

import type { PaginationParams } from '@/core/repositories/pagination-params'
import type {
  RemessaFiltros,
  RemessaItemConsumo,
} from '@/domain/application/repositories/remessa-repository'
import type { Remessa, RemessaStatus } from '@/domain/enterprise/entities/remessa'
import type { Prisma } from '@prisma/client'

import { normalizePagination } from '@/core/repositories/pagination-params'
import { RemessaRepository } from '@/domain/application/repositories/remessa-repository'

function buildWhere(
  tenantId: string,
  empresaFaturadoraId: string,
  filtros: RemessaFiltros,
): Prisma.RemessaWhereInput {
  const where: Prisma.RemessaWhereInput = {
    tenantId,
    empresaFaturadoraId,
    deletedAt: null,
  }
  if (filtros.status !== undefined) where.status = filtros.status
  if (filtros.clienteId !== undefined) where.clienteId = filtros.clienteId
  if (filtros.periodoInicio !== undefined || filtros.periodoFim !== undefined) {
    where.data = {}
    if (filtros.periodoInicio !== undefined) where.data.gte = filtros.periodoInicio
    if (filtros.periodoFim !== undefined) where.data.lte = filtros.periodoFim
  }
  return where
}

@Injectable()
export class PrismaRemessaRepository extends RemessaRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findById(id: string, tenantId: string): Promise<Remessa | null> {
    const raw = await this.prisma.remessa.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { itens: { where: { deletedAt: null } } },
    })
    return raw ? PrismaRemessaMapper.toDomain(raw) : null
  }

  async findManyByEmpresa(
    tenantId: string,
    empresaFaturadoraId: string,
    filtros: RemessaFiltros,
    params: PaginationParams,
  ): Promise<Remessa[]> {
    const { page, perPage } = normalizePagination(params)

    const raws = await this.prisma.remessa.findMany({
      where: buildWhere(tenantId, empresaFaturadoraId, filtros),
      include: { itens: { where: { deletedAt: null } } },
      orderBy: { numero: 'desc' },
      take: perPage,
      skip: (page - 1) * perPage,
    })

    return raws.map((raw) => PrismaRemessaMapper.toDomain(raw))
  }

  async findItensByLote(tenantId: string, loteId: string): Promise<RemessaItemConsumo[]> {
    const itens = await this.prisma.remessaItem.findMany({
      where: {
        tenantId,
        loteId,
        deletedAt: null,
        remessa: { deletedAt: null },
      },
      include: { remessa: { include: { cliente: true } } },
      orderBy: { remessa: { numero: 'desc' } },
    })

    return itens.map((item) => ({
      itemId: item.id,
      remessaId: item.remessaId,
      numero: item.remessa.numero,
      clienteId: item.remessa.clienteId,
      clienteNome: item.remessa.cliente.razaoSocialNome,
      quantidade: item.quantidade.toNumber(),
      data: item.remessa.data,
      status: item.remessa.status as RemessaStatus,
    }))
  }

  async count(
    tenantId: string,
    empresaFaturadoraId: string,
    filtros: RemessaFiltros,
  ): Promise<number> {
    return this.prisma.remessa.count({
      where: buildWhere(tenantId, empresaFaturadoraId, filtros),
    })
  }

  async findNaoConsolidadasByClientePeriodo(
    tenantId: string,
    empresaFaturadoraId: string,
    clienteId: string,
    periodoInicio: Date,
    periodoFim: Date,
  ): Promise<Remessa[]> {
    const raws = await this.prisma.remessa.findMany({
      where: {
        tenantId,
        empresaFaturadoraId,
        clienteId,
        deletedAt: null,
        status: { in: ['aberta', 'entregue'] },
        data: { gte: periodoInicio, lte: periodoFim },
      },
      include: { itens: { where: { deletedAt: null } } },
      orderBy: { numero: 'asc' },
    })
    return raws.map((raw) => PrismaRemessaMapper.toDomain(raw))
  }

  async findByPedidoConsolidado(tenantId: string, pedidoId: string): Promise<Remessa[]> {
    const raws = await this.prisma.remessa.findMany({
      where: { tenantId, pedidoConsolidadoId: pedidoId, deletedAt: null },
      include: { itens: { where: { deletedAt: null } } },
      orderBy: { numero: 'asc' },
    })
    return raws.map((raw) => PrismaRemessaMapper.toDomain(raw))
  }

  async nextNumero(tenantId: string, empresaFaturadoraId: string): Promise<string> {
    const total = await this.prisma.remessa.count({
      where: { tenantId, empresaFaturadoraId },
    })
    return String(total + 1).padStart(6, '0')
  }

  async create(remessa: Remessa): Promise<void> {
    await this.prisma.remessa.create({ data: PrismaRemessaMapper.toPrismaCreate(remessa) })
  }

  async save(remessa: Remessa): Promise<void> {
    await this.prisma.remessa.update({
      where: { id: remessa.id.toString() },
      data: PrismaRemessaMapper.toPrismaUpdate(remessa),
    })
  }
}
