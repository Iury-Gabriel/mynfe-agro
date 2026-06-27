import { Injectable } from '@nestjs/common'

import type { PaginatedResult } from '@/core/repositories/pagination-params'
import type { Cliente } from '@/domain/enterprise/entities/cliente'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { buildPaginatedResult, normalizePagination } from '@/core/repositories/pagination-params'
import { ClienteRepository } from '@/domain/application/repositories/cliente-repository'

export interface ListClientesInput {
  tenantId: string
  page: number
  perPage?: number
}

export type ListClientesOutput = PaginatedResult<Cliente>

type ListClientesResult = Either<UnexpectedError, ListClientesOutput>

@Injectable()
export class ListClientesUseCase {
  constructor(private readonly clientes: ClienteRepository) {}

  async execute(input: ListClientesInput): Promise<ListClientesResult> {
    try {
      const params = normalizePagination({ page: input.page, perPage: input.perPage })
      const [items, total] = await Promise.all([
        this.clientes.findManyByTenant(input.tenantId, params),
        this.clientes.count(input.tenantId),
      ])

      return right(buildPaginatedResult(items, total, params))
    } catch (err) {
      console.error('[ListClientesUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
