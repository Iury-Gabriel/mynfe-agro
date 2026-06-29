import { Injectable } from '@nestjs/common'

import type { PaginatedResult } from '@/core/repositories/pagination-params'
import type { Produto } from '@/domain/enterprise/entities/produto'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { buildPaginatedResult, normalizePagination } from '@/core/repositories/pagination-params'
import { ProdutoRepository } from '@/domain/application/repositories/produto-repository'

export interface ListProdutosInput {
  tenantId: string
  page: number
  perPage?: number
}

export type ListProdutosOutput = PaginatedResult<Produto>

type ListProdutosResult = Either<UnexpectedError, ListProdutosOutput>

@Injectable()
export class ListProdutosUseCase {
  constructor(private readonly produtos: ProdutoRepository) {}

  async execute(input: ListProdutosInput): Promise<ListProdutosResult> {
    try {
      const params = normalizePagination({ page: input.page, perPage: input.perPage })
      const [items, total] = await Promise.all([
        this.produtos.findManyByTenant(input.tenantId, params),
        this.produtos.count(input.tenantId),
      ])

      return right(buildPaginatedResult(items, total, params))
    } catch (err) {
      console.error('[ListProdutosUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
