import { Injectable } from '@nestjs/common'

import type { PaginatedResult } from '@/core/repositories/pagination-params'
import type { CustoProducao } from '@/domain/enterprise/entities/custo-producao'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { buildPaginatedResult, normalizePagination } from '@/core/repositories/pagination-params'
import { CustoProducaoRepository } from '@/domain/application/repositories/custo-producao-repository'

export interface ListCustosProducaoInput {
  tenantId: string
  page: number
  perPage?: number
}

export type ListCustosProducaoOutput = PaginatedResult<CustoProducao>

type ListCustosProducaoResult = Either<UnexpectedError, ListCustosProducaoOutput>

@Injectable()
export class ListCustosProducaoUseCase {
  constructor(private readonly custos: CustoProducaoRepository) {}

  async execute(input: ListCustosProducaoInput): Promise<ListCustosProducaoResult> {
    try {
      const params = normalizePagination({ page: input.page, perPage: input.perPage })
      const [items, total] = await Promise.all([
        this.custos.findManyByTenant(input.tenantId, params),
        this.custos.count(input.tenantId),
      ])

      return right(buildPaginatedResult(items, total, params))
    } catch (err) {
      console.error('[ListCustosProducaoUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
