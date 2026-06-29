import { Injectable } from '@nestjs/common'

import type { PaginatedResult } from '@/core/repositories/pagination-params'
import type { TenantSummary } from '@/domain/application/repositories/tenant-repository'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { buildPaginatedResult, normalizePagination } from '@/core/repositories/pagination-params'
import { TenantRepository } from '@/domain/application/repositories/tenant-repository'

export interface ListTenantsInput {
  page: number
  perPage: number
}

export type ListTenantsOutput = PaginatedResult<TenantSummary>

type ListTenantsResult = Either<UnexpectedError, ListTenantsOutput>

@Injectable()
export class ListTenantsUseCase {
  constructor(private readonly tenants: TenantRepository) {}

  async execute(input: ListTenantsInput): Promise<ListTenantsResult> {
    try {
      const params = normalizePagination({ page: input.page, perPage: input.perPage })
      const [items, total] = await Promise.all([
        this.tenants.findManyPaginated(params),
        this.tenants.count(),
      ])
      return right(buildPaginatedResult(items, total, params))
    } catch (err) {
      console.error('[ListTenantsUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
