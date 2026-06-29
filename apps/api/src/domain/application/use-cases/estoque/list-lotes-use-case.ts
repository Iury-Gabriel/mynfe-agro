import { Injectable } from '@nestjs/common'

import type { PaginatedResult } from '@/core/repositories/pagination-params'
import type { Lote } from '@/domain/enterprise/entities/lote'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { buildPaginatedResult, normalizePagination } from '@/core/repositories/pagination-params'
import { LoteRepository } from '@/domain/application/repositories/lote-repository'

export interface ListLotesInput {
  tenantId: string
  empresaId: string
  page: number
  perPage?: number
}

export type ListLotesOutput = PaginatedResult<Lote>

type ListLotesResult = Either<UnexpectedError, ListLotesOutput>

@Injectable()
export class ListLotesUseCase {
  constructor(private readonly lotes: LoteRepository) {}

  async execute(input: ListLotesInput): Promise<ListLotesResult> {
    try {
      const params = normalizePagination({ page: input.page, perPage: input.perPage })
      const [items, total] = await Promise.all([
        this.lotes.findManyByEmpresa(input.tenantId, input.empresaId, params),
        this.lotes.count(input.tenantId, input.empresaId),
      ])

      return right(buildPaginatedResult(items, total, params))
    } catch (err) {
      console.error('[ListLotesUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
