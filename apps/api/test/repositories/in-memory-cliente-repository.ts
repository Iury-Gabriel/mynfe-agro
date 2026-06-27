import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { Cliente } from '@/domain/enterprise/entities/cliente'

import { normalizePagination } from '@/core/repositories/pagination-params'
import { ClienteRepository } from '@/domain/application/repositories/cliente-repository'

export class InMemoryClienteRepository extends ClienteRepository {
  clientes: Cliente[] = []
  shouldFailOnCreate = false
  shouldFailOnSave = false

  async findById(id: string, tenantId: string): Promise<Cliente | null> {
    return (
      this.clientes.find(
        (c) => c.id.toString() === id && c.tenantId === tenantId && c.deletedAt === null,
      ) ?? null
    )
  }

  async findManyByTenant(tenantId: string, params: PaginationParams): Promise<Cliente[]> {
    const { page, perPage } = normalizePagination(params)
    const ordered = this.clientes
      .filter((c) => c.tenantId === tenantId && c.deletedAt === null)
      .sort((a, b) => a.id.toString().localeCompare(b.id.toString()))
    const start = (page - 1) * perPage
    return ordered.slice(start, start + perPage)
  }

  async count(tenantId: string): Promise<number> {
    return this.clientes.filter((c) => c.tenantId === tenantId && c.deletedAt === null).length
  }

  async create(cliente: Cliente): Promise<void> {
    if (this.shouldFailOnCreate) throw new Error('create failed')
    this.clientes.push(cliente)
  }

  async save(cliente: Cliente): Promise<void> {
    if (this.shouldFailOnSave) throw new Error('save failed')
    const idx = this.clientes.findIndex((c) => c.id.equals(cliente.id))
    if (idx >= 0) this.clientes[idx] = cliente
    else this.clientes.push(cliente)
  }
}
