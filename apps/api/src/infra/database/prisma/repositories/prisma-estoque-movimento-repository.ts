import { Injectable } from '@nestjs/common'

import { PrismaEstoqueMovimentoMapper } from '../mappers/admin/prisma-estoque-movimento-mapper'
import { PrismaService } from '../prisma.service'

import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { EstoqueMovimentoFiltros } from '@/domain/application/repositories/estoque-movimento-repository'
import type { EstoqueMovimento } from '@/domain/enterprise/entities/estoque-movimento'
import type { Prisma } from '@prisma/client'

import { normalizePagination } from '@/core/repositories/pagination-params'
import { EstoqueMovimentoRepository } from '@/domain/application/repositories/estoque-movimento-repository'

function buildWhere(
  tenantId: string,
  empresaId: string,
  filtros: EstoqueMovimentoFiltros,
): Prisma.EstoqueMovimentoWhereInput {
  return {
    tenantId,
    empresaId,
    deletedAt: null,
    ...(filtros.produtoId !== undefined ? { produtoId: filtros.produtoId } : {}),
    ...(filtros.loteId !== undefined ? { loteId: filtros.loteId } : {}),
    ...(filtros.tipo !== undefined ? { tipo: filtros.tipo } : {}),
    ...(filtros.origem !== undefined ? { origem: filtros.origem } : {}),
  }
}

@Injectable()
export class PrismaEstoqueMovimentoRepository extends EstoqueMovimentoRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findManyByEmpresa(
    tenantId: string,
    empresaId: string,
    filtros: EstoqueMovimentoFiltros,
    params: PaginationParams,
  ): Promise<EstoqueMovimento[]> {
    const { page, perPage } = normalizePagination(params)

    const raws = await this.prisma.estoqueMovimento.findMany({
      where: buildWhere(tenantId, empresaId, filtros),
      orderBy: { id: 'desc' },
      take: perPage,
      skip: (page - 1) * perPage,
    })

    return raws.map((raw) => PrismaEstoqueMovimentoMapper.toDomain(raw))
  }

  async count(
    tenantId: string,
    empresaId: string,
    filtros: EstoqueMovimentoFiltros,
  ): Promise<number> {
    return this.prisma.estoqueMovimento.count({
      where: buildWhere(tenantId, empresaId, filtros),
    })
  }
}
