import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { Cliente } from '@/domain/enterprise/entities/cliente'

export abstract class ClienteRepository {
  abstract findById(id: string, tenantId: string): Promise<Cliente | null>
  abstract findManyByTenant(tenantId: string, params: PaginationParams): Promise<Cliente[]>
  abstract count(tenantId: string): Promise<number>
  abstract create(cliente: Cliente): Promise<void>
  abstract save(cliente: Cliente): Promise<void>
}
