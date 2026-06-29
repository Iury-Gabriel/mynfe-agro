import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { Empresa } from '@/domain/enterprise/entities/empresa'

import { normalizePagination } from '@/core/repositories/pagination-params'
import { EmpresaRepository } from '@/domain/application/repositories/empresa-repository'

export class InMemoryEmpresaRepository extends EmpresaRepository {
  empresas: Empresa[] = []
  shouldFailOnCreate = false
  shouldFailOnSave = false

  async findById(id: string, tenantId: string): Promise<Empresa | null> {
    return (
      this.empresas.find((e) => e.id.toString() === id && e.tenantId === tenantId) ?? null
    )
  }

  async findManyByTenant(tenantId: string, params: PaginationParams): Promise<Empresa[]> {
    const { page, perPage } = normalizePagination(params)
    const ordered = this.empresas
      .filter((e) => e.tenantId === tenantId)
      .sort((a, b) => a.id.toString().localeCompare(b.id.toString()))
    const start = (page - 1) * perPage
    return ordered.slice(start, start + perPage)
  }

  async count(tenantId: string): Promise<number> {
    return this.empresas.filter((e) => e.tenantId === tenantId).length
  }

  async create(empresa: Empresa): Promise<void> {
    if (this.shouldFailOnCreate) throw new Error('create failed')
    this.empresas.push(empresa)
  }

  async save(empresa: Empresa): Promise<void> {
    if (this.shouldFailOnSave) throw new Error('save failed')
    const idx = this.empresas.findIndex((e) => e.id.equals(empresa.id))
    if (idx >= 0) this.empresas[idx] = empresa
    else this.empresas.push(empresa)
  }
}
