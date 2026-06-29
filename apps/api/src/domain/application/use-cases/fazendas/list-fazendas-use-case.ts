import { Injectable } from '@nestjs/common'

import type { PaginatedResult } from '@/core/repositories/pagination-params'
import type { Fazenda } from '@/domain/enterprise/entities/fazenda'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { buildPaginatedResult, normalizePagination } from '@/core/repositories/pagination-params'
import { FazendaRepository } from '@/domain/application/repositories/fazenda-repository'

export interface ListFazendasInput {
  tenantId: string
  page: number
  perPage?: number
}

export type ListFazendasOutput = PaginatedResult<Fazenda>

type ListFazendasResult = Either<UnexpectedError, ListFazendasOutput>

@Injectable()
export class ListFazendasUseCase {
  constructor(private readonly fazendas: FazendaRepository) {}

  async execute(input: ListFazendasInput): Promise<ListFazendasResult> {
    try {
      const params = normalizePagination({ page: input.page, perPage: input.perPage })
      const [items, total] = await Promise.all([
        this.fazendas.findManyByTenant(input.tenantId, params),
        this.fazendas.count(input.tenantId),
      ])

      return right(buildPaginatedResult(items, total, params))
    } catch (err) {
      console.error('[ListFazendasUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
