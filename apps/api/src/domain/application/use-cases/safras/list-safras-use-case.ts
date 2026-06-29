import { Injectable } from '@nestjs/common'

import type { PaginatedResult } from '@/core/repositories/pagination-params'
import type { Safra } from '@/domain/enterprise/entities/safra'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { buildPaginatedResult, normalizePagination } from '@/core/repositories/pagination-params'
import { SafraRepository } from '@/domain/application/repositories/safra-repository'

export interface ListSafrasInput {
  tenantId: string
  page: number
  perPage?: number
}

export type ListSafrasOutput = PaginatedResult<Safra>

type ListSafrasResult = Either<UnexpectedError, ListSafrasOutput>

@Injectable()
export class ListSafrasUseCase {
  constructor(private readonly safras: SafraRepository) {}

  async execute(input: ListSafrasInput): Promise<ListSafrasResult> {
    try {
      const params = normalizePagination({ page: input.page, perPage: input.perPage })
      const [items, total] = await Promise.all([
        this.safras.findManyByTenant(input.tenantId, params),
        this.safras.count(input.tenantId),
      ])

      return right(buildPaginatedResult(items, total, params))
    } catch (err) {
      console.error('[ListSafrasUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
