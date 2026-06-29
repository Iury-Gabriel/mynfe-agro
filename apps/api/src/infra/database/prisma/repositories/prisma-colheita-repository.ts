import { Injectable } from '@nestjs/common'

import { PrismaColheitaMapper } from '../mappers/admin/prisma-colheita-mapper'
import { PrismaService } from '../prisma.service'

import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { Colheita } from '@/domain/enterprise/entities/colheita'

import { normalizePagination } from '@/core/repositories/pagination-params'
import { ColheitaRepository } from '@/domain/application/repositories/colheita-repository'

@Injectable()
export class PrismaColheitaRepository extends ColheitaRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findById(id: string, tenantId: string): Promise<Colheita | null> {
    const raw = await this.prisma.colheita.findFirst({
      where: { id, tenantId, deletedAt: null },
    })
    return raw ? PrismaColheitaMapper.toDomain(raw) : null
  }

  async findManyByEmpresa(
    tenantId: string,
    empresaId: string,
    params: PaginationParams,
  ): Promise<Colheita[]> {
    const { page, perPage } = normalizePagination(params)

    const raws = await this.prisma.colheita.findMany({
      where: { tenantId, empresaId, deletedAt: null },
      orderBy: { id: 'desc' },
      take: perPage,
      skip: (page - 1) * perPage,
    })

    return raws.map((raw) => PrismaColheitaMapper.toDomain(raw))
  }

  async count(tenantId: string, empresaId: string): Promise<number> {
    return this.prisma.colheita.count({ where: { tenantId, empresaId, deletedAt: null } })
  }
}
