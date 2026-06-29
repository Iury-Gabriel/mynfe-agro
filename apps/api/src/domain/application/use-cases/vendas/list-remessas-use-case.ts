import { Injectable } from '@nestjs/common'

import type { PaginatedResult } from '@/core/repositories/pagination-params'
import type { RemessaFiltros } from '@/domain/application/repositories/remessa-repository'
import type { Remessa } from '@/domain/enterprise/entities/remessa'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { buildPaginatedResult, normalizePagination } from '@/core/repositories/pagination-params'
import { RemessaRepository } from '@/domain/application/repositories/remessa-repository'

export interface ListRemessasInput {
  tenantId: string
  empresaFaturadoraId: string
  filtros?: RemessaFiltros
  page: number
  perPage?: number
}

export type ListRemessasOutput = PaginatedResult<Remessa>

type ListRemessasResult = Either<UnexpectedError, ListRemessasOutput>

@Injectable()
export class ListRemessasUseCase {
  constructor(private readonly remessas: RemessaRepository) {}

  async execute(input: ListRemessasInput): Promise<ListRemessasResult> {
    try {
      const params = normalizePagination({ page: input.page, perPage: input.perPage })
      const filtros = input.filtros ?? {}
      const [items, total] = await Promise.all([
        this.remessas.findManyByEmpresa(
          input.tenantId,
          input.empresaFaturadoraId,
          filtros,
          params,
        ),
        this.remessas.count(input.tenantId, input.empresaFaturadoraId, filtros),
      ])

      return right(buildPaginatedResult(items, total, params))
    } catch (err) {
      console.error('[ListRemessasUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
