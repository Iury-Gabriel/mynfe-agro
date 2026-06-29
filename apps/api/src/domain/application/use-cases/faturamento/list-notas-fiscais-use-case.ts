import { Injectable } from '@nestjs/common'

import type { PaginatedResult } from '@/core/repositories/pagination-params'
import type { NotaFiscalFiltros } from '@/domain/application/repositories/nota-fiscal-repository'
import type { NotaFiscal } from '@/domain/enterprise/entities/nota-fiscal'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { buildPaginatedResult, normalizePagination } from '@/core/repositories/pagination-params'
import { NotaFiscalRepository } from '@/domain/application/repositories/nota-fiscal-repository'

export interface ListNotasFiscaisInput {
  tenantId: string
  empresaEmitenteId: string
  filtros?: NotaFiscalFiltros
  page: number
  perPage?: number
}

export type ListNotasFiscaisOutput = PaginatedResult<NotaFiscal>

type ListNotasFiscaisResult = Either<UnexpectedError, ListNotasFiscaisOutput>

@Injectable()
export class ListNotasFiscaisUseCase {
  constructor(private readonly notas: NotaFiscalRepository) {}

  async execute(input: ListNotasFiscaisInput): Promise<ListNotasFiscaisResult> {
    try {
      const params = normalizePagination({ page: input.page, perPage: input.perPage })
      const filtros = input.filtros ?? {}
      const [items, total] = await Promise.all([
        this.notas.findManyByEmpresa(input.tenantId, input.empresaEmitenteId, filtros, params),
        this.notas.count(input.tenantId, input.empresaEmitenteId, filtros),
      ])

      return right(buildPaginatedResult(items, total, params))
    } catch (err) {
      console.error('[ListNotasFiscaisUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
