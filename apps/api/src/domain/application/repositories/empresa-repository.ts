import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { Empresa } from '@/domain/enterprise/entities/empresa'

export abstract class EmpresaRepository {
  abstract findById(id: string, tenantId: string): Promise<Empresa | null>
  abstract findManyByTenant(tenantId: string, params: PaginationParams): Promise<Empresa[]>
  abstract count(tenantId: string): Promise<number>
  abstract create(empresa: Empresa): Promise<void>
  abstract save(empresa: Empresa): Promise<void>
}
