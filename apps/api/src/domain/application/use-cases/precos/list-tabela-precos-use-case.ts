import { Injectable } from '@nestjs/common'

import type { PaginatedResult } from '@/core/repositories/pagination-params'
import type { TabelaPrecoCliente } from '@/domain/enterprise/entities/tabela-preco-cliente'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { buildPaginatedResult, normalizePagination } from '@/core/repositories/pagination-params'
import { TabelaPrecoClienteRepository } from '@/domain/application/repositories/tabela-preco-cliente-repository'

export interface ListTabelaPrecosInput {
  tenantId: string
  page: number
  perPage?: number
}

export type ListTabelaPrecosOutput = PaginatedResult<TabelaPrecoCliente>

type ListTabelaPrecosResult = Either<UnexpectedError, ListTabelaPrecosOutput>

@Injectable()
export class ListTabelaPrecosUseCase {
  constructor(private readonly tabelas: TabelaPrecoClienteRepository) {}

  async execute(input: ListTabelaPrecosInput): Promise<ListTabelaPrecosResult> {
    try {
      const params = normalizePagination({ page: input.page, perPage: input.perPage })
      const [items, total] = await Promise.all([
        this.tabelas.findManyByTenant(input.tenantId, params),
        this.tabelas.count(input.tenantId),
      ])

      return right(buildPaginatedResult(items, total, params))
    } catch (err) {
      console.error('[ListTabelaPrecosUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
