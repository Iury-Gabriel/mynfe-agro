import { Injectable } from '@nestjs/common'

import type { PaginatedResult } from '@/core/repositories/pagination-params'
import type { Area } from '@/domain/enterprise/entities/area'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { buildPaginatedResult, normalizePagination } from '@/core/repositories/pagination-params'
import { AreaRepository } from '@/domain/application/repositories/area-repository'

export interface ListAreasInput {
  tenantId: string
  page: number
  perPage?: number
}

export type ListAreasOutput = PaginatedResult<Area>

type ListAreasResult = Either<UnexpectedError, ListAreasOutput>

@Injectable()
export class ListAreasUseCase {
  constructor(private readonly areas: AreaRepository) {}

  async execute(input: ListAreasInput): Promise<ListAreasResult> {
    try {
      const params = normalizePagination({ page: input.page, perPage: input.perPage })
      const [items, total] = await Promise.all([
        this.areas.findManyByTenant(input.tenantId, params),
        this.areas.count(input.tenantId),
      ])

      return right(buildPaginatedResult(items, total, params))
    } catch (err) {
      console.error('[ListAreasUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
