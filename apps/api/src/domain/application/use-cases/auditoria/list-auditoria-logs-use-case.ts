import { Injectable } from '@nestjs/common'

import type { PaginatedResult } from '@/core/repositories/pagination-params'
import type { AuditoriaLogFilters } from '@/domain/application/repositories/auditoria-log-repository'
import type { AuditoriaLog } from '@/domain/enterprise/entities/auditoria-log'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { buildPaginatedResult, normalizePagination } from '@/core/repositories/pagination-params'
import { AuditoriaLogRepository } from '@/domain/application/repositories/auditoria-log-repository'

export interface ListAuditoriaLogsInput extends AuditoriaLogFilters {
  tenantId: string
  page: number
  perPage?: number
}

export type ListAuditoriaLogsOutput = PaginatedResult<AuditoriaLog>

type ListAuditoriaLogsResult = Either<UnexpectedError, ListAuditoriaLogsOutput>

@Injectable()
export class ListAuditoriaLogsUseCase {
  constructor(private readonly logs: AuditoriaLogRepository) {}

  async execute(input: ListAuditoriaLogsInput): Promise<ListAuditoriaLogsResult> {
    try {
      const params = normalizePagination({ page: input.page, perPage: input.perPage })
      const filters: AuditoriaLogFilters = {
        entidade: input.entidade,
        acao: input.acao,
        usuarioId: input.usuarioId,
      }
      const [items, total] = await Promise.all([
        this.logs.findManyByTenant(input.tenantId, filters, params),
        this.logs.count(input.tenantId, filters),
      ])

      return right(buildPaginatedResult(items, total, params))
    } catch (err) {
      console.error('[ListAuditoriaLogsUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
