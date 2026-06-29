import { Injectable } from '@nestjs/common'

import type { PaginatedResult } from '@/core/repositories/pagination-params'
import type { ProdutoFichaTecnica } from '@/domain/enterprise/entities/produto-ficha-tecnica'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { buildPaginatedResult, normalizePagination } from '@/core/repositories/pagination-params'
import { ProdutoFichaTecnicaRepository } from '@/domain/application/repositories/produto-ficha-tecnica-repository'

export interface ListFichasTecnicasInput {
  tenantId: string
  produtoId: string
  page: number
  perPage?: number
}

export type ListFichasTecnicasOutput = PaginatedResult<ProdutoFichaTecnica>

type ListFichasTecnicasResult = Either<UnexpectedError, ListFichasTecnicasOutput>

@Injectable()
export class ListFichasTecnicasUseCase {
  constructor(private readonly fichas: ProdutoFichaTecnicaRepository) {}

  async execute(input: ListFichasTecnicasInput): Promise<ListFichasTecnicasResult> {
    try {
      const params = normalizePagination({ page: input.page, perPage: input.perPage })
      const [items, total] = await Promise.all([
        this.fichas.findManyByProduto(input.tenantId, input.produtoId, params),
        this.fichas.countByProduto(input.tenantId, input.produtoId),
      ])

      return right(buildPaginatedResult(items, total, params))
    } catch (err) {
      console.error('[ListFichasTecnicasUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
