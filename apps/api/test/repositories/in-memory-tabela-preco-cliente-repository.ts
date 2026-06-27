import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { TabelaPrecoCliente } from '@/domain/enterprise/entities/tabela-preco-cliente'

import { normalizePagination } from '@/core/repositories/pagination-params'
import { TabelaPrecoClienteRepository } from '@/domain/application/repositories/tabela-preco-cliente-repository'

export class InMemoryTabelaPrecoClienteRepository extends TabelaPrecoClienteRepository {
  tabelas: TabelaPrecoCliente[] = []
  shouldFailOnCreate = false
  shouldFailOnSave = false

  async findById(id: string, tenantId: string): Promise<TabelaPrecoCliente | null> {
    return (
      this.tabelas.find((t) => t.id.toString() === id && t.tenantId === tenantId) ?? null
    )
  }

  async findManyByTenant(
    tenantId: string,
    params: PaginationParams,
  ): Promise<TabelaPrecoCliente[]> {
    const { page, perPage } = normalizePagination(params)
    const ordered = this.tabelas
      .filter((t) => t.tenantId === tenantId)
      .sort((a, b) => a.id.toString().localeCompare(b.id.toString()))
    const start = (page - 1) * perPage
    return ordered.slice(start, start + perPage)
  }

  async findVigentesByClienteProduto(
    tenantId: string,
    clienteId: string,
    produtoId: string,
    ref: Date,
  ): Promise<TabelaPrecoCliente[]> {
    return this.tabelas.filter(
      (t) =>
        t.tenantId === tenantId &&
        t.clienteId === clienteId &&
        t.produtoId === produtoId &&
        t.isVigente(ref),
    )
  }

  async count(tenantId: string): Promise<number> {
    return this.tabelas.filter((t) => t.tenantId === tenantId).length
  }

  async create(tabelaPreco: TabelaPrecoCliente): Promise<void> {
    if (this.shouldFailOnCreate) throw new Error('create failed')
    this.tabelas.push(tabelaPreco)
  }

  async save(tabelaPreco: TabelaPrecoCliente): Promise<void> {
    if (this.shouldFailOnSave) throw new Error('save failed')
    const idx = this.tabelas.findIndex((t) => t.id.equals(tabelaPreco.id))
    if (idx >= 0) this.tabelas[idx] = tabelaPreco
    else this.tabelas.push(tabelaPreco)
  }
}
