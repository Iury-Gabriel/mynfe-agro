import { Injectable } from '@nestjs/common'

import { PrismaCustoProducaoMapper } from '../mappers/admin/prisma-custo-producao-mapper'
import { PrismaService } from '../prisma.service'

import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { CustoProducao } from '@/domain/enterprise/entities/custo-producao'

import { normalizePagination } from '@/core/repositories/pagination-params'
import { CustoProducaoRepository } from '@/domain/application/repositories/custo-producao-repository'

@Injectable()
export class PrismaCustoProducaoRepository extends CustoProducaoRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findById(id: string, tenantId: string): Promise<CustoProducao | null> {
    const raw = await this.prisma.custoProducao.findFirst({
      where: { id, tenantId, deletedAt: null },
    })
    return raw ? PrismaCustoProducaoMapper.toDomain(raw) : null
  }

  async findManyByTenant(tenantId: string, params: PaginationParams): Promise<CustoProducao[]> {
    const { page, perPage } = normalizePagination(params)

    const raws = await this.prisma.custoProducao.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { id: 'desc' },
      take: perPage,
      skip: (page - 1) * perPage,
    })

    return raws.map((raw) => PrismaCustoProducaoMapper.toDomain(raw))
  }

  async count(tenantId: string): Promise<number> {
    return this.prisma.custoProducao.count({ where: { tenantId, deletedAt: null } })
  }

  async create(custo: CustoProducao): Promise<void> {
    await this.prisma.custoProducao.create({
      data: PrismaCustoProducaoMapper.toPrismaCreate(custo),
    })
  }

  async save(custo: CustoProducao): Promise<void> {
    await this.prisma.custoProducao.update({
      where: { id: custo.id.toString() },
      data: PrismaCustoProducaoMapper.toPrismaUpdate(custo),
    })
  }
}
