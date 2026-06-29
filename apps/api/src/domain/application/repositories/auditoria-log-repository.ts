import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { AuditoriaAcao, AuditoriaLog } from '@/domain/enterprise/entities/auditoria-log'

export interface AuditoriaLogFilters {
  entidade?: string
  acao?: AuditoriaAcao
  usuarioId?: string
}

export abstract class AuditoriaLogRepository {
  abstract create(log: AuditoriaLog): Promise<void>
  abstract findManyByTenant(
    tenantId: string,
    filters: AuditoriaLogFilters,
    params: PaginationParams,
  ): Promise<AuditoriaLog[]>
  abstract count(tenantId: string, filters: AuditoriaLogFilters): Promise<number>
}
