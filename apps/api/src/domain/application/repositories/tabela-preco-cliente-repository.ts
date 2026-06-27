import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { TabelaPrecoCliente } from '@/domain/enterprise/entities/tabela-preco-cliente'

export abstract class TabelaPrecoClienteRepository {
  abstract findById(id: string, tenantId: string): Promise<TabelaPrecoCliente | null>
  abstract findManyByTenant(
    tenantId: string,
    params: PaginationParams,
  ): Promise<TabelaPrecoCliente[]>
  abstract findVigentesByClienteProduto(
    tenantId: string,
    clienteId: string,
    produtoId: string,
    ref: Date,
  ): Promise<TabelaPrecoCliente[]>
  abstract count(tenantId: string): Promise<number>
  abstract create(tabelaPreco: TabelaPrecoCliente): Promise<void>
  abstract save(tabelaPreco: TabelaPrecoCliente): Promise<void>
}
