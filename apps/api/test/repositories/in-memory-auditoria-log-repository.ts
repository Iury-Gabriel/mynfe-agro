import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { AuditoriaLogFilters } from '@/domain/application/repositories/auditoria-log-repository'
import type { AuditoriaLog } from '@/domain/enterprise/entities/auditoria-log'

import { normalizePagination } from '@/core/repositories/pagination-params'
import { AuditoriaLogRepository } from '@/domain/application/repositories/auditoria-log-repository'

export class InMemoryAuditoriaLogRepository extends AuditoriaLogRepository {
  logs: AuditoriaLog[] = []
  shouldFailOnCreate = false

  private filter(tenantId: string, filters: AuditoriaLogFilters): AuditoriaLog[] {
    return this.logs.filter(
      (log) =>
        log.tenantId === tenantId &&
        (filters.entidade === undefined || log.entidade === filters.entidade) &&
        (filters.acao === undefined || log.acao === filters.acao) &&
        (filters.usuarioId === undefined || log.usuarioId === filters.usuarioId),
    )
  }

  async create(log: AuditoriaLog): Promise<void> {
    if (this.shouldFailOnCreate) throw new Error('create failed')
    this.logs.push(log)
  }

  async findManyByTenant(
    tenantId: string,
    filters: AuditoriaLogFilters,
    params: PaginationParams,
  ): Promise<AuditoriaLog[]> {
    const { page, perPage } = normalizePagination(params)
    const ordered = this.filter(tenantId, filters).sort(
      (a, b) => b.data.getTime() - a.data.getTime(),
    )
    const start = (page - 1) * perPage
    return ordered.slice(start, start + perPage)
  }

  async count(tenantId: string, filters: AuditoriaLogFilters): Promise<number> {
    return this.filter(tenantId, filters).length
  }
}
