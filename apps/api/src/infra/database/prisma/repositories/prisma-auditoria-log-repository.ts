import { Injectable } from '@nestjs/common'

import { PrismaAuditoriaLogMapper } from '../mappers/admin/prisma-auditoria-log-mapper'
import { PrismaService } from '../prisma.service'

import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { AuditoriaLogFilters } from '@/domain/application/repositories/auditoria-log-repository'
import type { AuditoriaLog } from '@/domain/enterprise/entities/auditoria-log'
import type { Prisma } from '@prisma/client'

import { normalizePagination } from '@/core/repositories/pagination-params'
import { AuditoriaLogRepository } from '@/domain/application/repositories/auditoria-log-repository'

@Injectable()
export class PrismaAuditoriaLogRepository extends AuditoriaLogRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  private buildWhere(
    tenantId: string,
    filters: AuditoriaLogFilters,
  ): Prisma.AuditoriaLogWhereInput {
    return {
      tenantId,
      ...(filters.entidade !== undefined ? { entidade: filters.entidade } : {}),
      ...(filters.acao !== undefined ? { acao: filters.acao } : {}),
      ...(filters.usuarioId !== undefined ? { usuarioId: filters.usuarioId } : {}),
    }
  }

  async create(log: AuditoriaLog): Promise<void> {
    await this.prisma.auditoriaLog.create({
      data: PrismaAuditoriaLogMapper.toPrismaCreate(log),
    })
  }

  async findManyByTenant(
    tenantId: string,
    filters: AuditoriaLogFilters,
    params: PaginationParams,
  ): Promise<AuditoriaLog[]> {
    const { page, perPage } = normalizePagination(params)

    const raws = await this.prisma.auditoriaLog.findMany({
      where: this.buildWhere(tenantId, filters),
      orderBy: { data: 'desc' },
      take: perPage,
      skip: (page - 1) * perPage,
    })

    return raws.map((raw) => PrismaAuditoriaLogMapper.toDomain(raw))
  }

  async count(tenantId: string, filters: AuditoriaLogFilters): Promise<number> {
    return this.prisma.auditoriaLog.count({ where: this.buildWhere(tenantId, filters) })
  }
}
