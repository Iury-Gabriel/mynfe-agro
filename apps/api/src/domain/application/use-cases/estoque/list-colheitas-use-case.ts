import { Injectable } from '@nestjs/common'

import type { PaginatedResult } from '@/core/repositories/pagination-params'
import type { Colheita } from '@/domain/enterprise/entities/colheita'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { buildPaginatedResult, normalizePagination } from '@/core/repositories/pagination-params'
import { ColheitaRepository } from '@/domain/application/repositories/colheita-repository'

export interface ListColheitasInput {
  tenantId: string
  empresaId: string
  page: number
  perPage?: number
}

export type ListColheitasOutput = PaginatedResult<Colheita>

type ListColheitasResult = Either<UnexpectedError, ListColheitasOutput>

@Injectable()
export class ListColheitasUseCase {
  constructor(private readonly colheitas: ColheitaRepository) {}

  async execute(input: ListColheitasInput): Promise<ListColheitasResult> {
    try {
      const params = normalizePagination({ page: input.page, perPage: input.perPage })
      const [items, total] = await Promise.all([
        this.colheitas.findManyByEmpresa(input.tenantId, input.empresaId, params),
        this.colheitas.count(input.tenantId, input.empresaId),
      ])

      return right(buildPaginatedResult(items, total, params))
    } catch (err) {
      console.error('[ListColheitasUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
