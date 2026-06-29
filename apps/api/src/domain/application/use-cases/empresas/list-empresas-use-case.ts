import { Injectable } from '@nestjs/common'

import type { PaginatedResult } from '@/core/repositories/pagination-params'
import type { Empresa } from '@/domain/enterprise/entities/empresa'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { buildPaginatedResult, normalizePagination } from '@/core/repositories/pagination-params'
import { EmpresaRepository } from '@/domain/application/repositories/empresa-repository'

export interface ListEmpresasInput {
  tenantId: string
  page: number
  perPage?: number
}

export type ListEmpresasOutput = PaginatedResult<Empresa>

type ListEmpresasResult = Either<UnexpectedError, ListEmpresasOutput>

@Injectable()
export class ListEmpresasUseCase {
  constructor(private readonly empresas: EmpresaRepository) {}

  async execute(input: ListEmpresasInput): Promise<ListEmpresasResult> {
    try {
      const params = normalizePagination({ page: input.page, perPage: input.perPage })
      const [items, total] = await Promise.all([
        this.empresas.findManyByTenant(input.tenantId, params),
        this.empresas.count(input.tenantId),
      ])

      return right(buildPaginatedResult(items, total, params))
    } catch (err) {
      console.error('[ListEmpresasUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
