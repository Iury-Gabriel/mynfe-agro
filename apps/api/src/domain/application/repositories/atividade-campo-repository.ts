import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { AtividadeCampo } from '@/domain/enterprise/entities/atividade-campo'

export abstract class AtividadeCampoRepository {
  abstract findById(id: string, tenantId: string): Promise<AtividadeCampo | null>
  abstract findManyByTenant(tenantId: string, params: PaginationParams): Promise<AtividadeCampo[]>
  abstract count(tenantId: string): Promise<number>
  abstract create(atividade: AtividadeCampo): Promise<void>
  abstract save(atividade: AtividadeCampo): Promise<void>
}
