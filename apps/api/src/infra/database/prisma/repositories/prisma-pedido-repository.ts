import { Injectable } from '@nestjs/common'

import { PrismaPedidoMapper } from '../mappers/admin/prisma-pedido-mapper'
import { PrismaService } from '../prisma.service'

import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { PedidoFiltros } from '@/domain/application/repositories/pedido-repository'
import type { Pedido } from '@/domain/enterprise/entities/pedido'
import type { Prisma } from '@prisma/client'

import { normalizePagination } from '@/core/repositories/pagination-params'
import { PedidoRepository } from '@/domain/application/repositories/pedido-repository'

function buildWhere(
  tenantId: string,
  empresaFaturadoraId: string,
  filtros: PedidoFiltros,
): Prisma.PedidoWhereInput {
  const where: Prisma.PedidoWhereInput = {
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
export class PrismaPedidoRepository extends PedidoRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findById(id: string, tenantId: string): Promise<Pedido | null> {
    const raw = await this.prisma.pedido.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { itens: { where: { deletedAt: null } } },
    })
    return raw ? PrismaPedidoMapper.toDomain(raw) : null
  }

  async findManyByEmpresa(
    tenantId: string,
    empresaFaturadoraId: string,
    filtros: PedidoFiltros,
    params: PaginationParams,
  ): Promise<Pedido[]> {
    const { page, perPage } = normalizePagination(params)

    const raws = await this.prisma.pedido.findMany({
      where: buildWhere(tenantId, empresaFaturadoraId, filtros),
      include: { itens: { where: { deletedAt: null } } },
      orderBy: { numero: 'desc' },
      take: perPage,
      skip: (page - 1) * perPage,
    })

    return raws.map((raw) => PrismaPedidoMapper.toDomain(raw))
  }

  async count(
    tenantId: string,
    empresaFaturadoraId: string,
    filtros: PedidoFiltros,
  ): Promise<number> {
    return this.prisma.pedido.count({
      where: buildWhere(tenantId, empresaFaturadoraId, filtros),
    })
  }

  async nextNumero(tenantId: string, empresaFaturadoraId: string): Promise<string> {
    const total = await this.prisma.pedido.count({
      where: { tenantId, empresaFaturadoraId },
    })
    return String(total + 1).padStart(6, '0')
  }

  async create(pedido: Pedido): Promise<void> {
    await this.prisma.pedido.create({ data: PrismaPedidoMapper.toPrismaCreate(pedido) })
  }

  async save(pedido: Pedido): Promise<void> {
    await this.prisma.pedido.update({
      where: { id: pedido.id.toString() },
      data: PrismaPedidoMapper.toPrismaUpdate(pedido),
    })
  }
}
