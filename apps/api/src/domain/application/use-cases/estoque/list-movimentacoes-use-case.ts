import { Injectable } from '@nestjs/common'

import type { PaginatedResult } from '@/core/repositories/pagination-params'
import type { EstoqueMovimentoFiltros } from '@/domain/application/repositories/estoque-movimento-repository'
import type { EstoqueMovimento } from '@/domain/enterprise/entities/estoque-movimento'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { buildPaginatedResult, normalizePagination } from '@/core/repositories/pagination-params'
import { EstoqueMovimentoRepository } from '@/domain/application/repositories/estoque-movimento-repository'

export interface ListMovimentacoesInput {
  tenantId: string
  empresaId: string
  filtros?: EstoqueMovimentoFiltros
  page: number
  perPage?: number
}

export type ListMovimentacoesOutput = PaginatedResult<EstoqueMovimento>

type ListMovimentacoesResult = Either<UnexpectedError, ListMovimentacoesOutput>

@Injectable()
export class ListMovimentacoesUseCase {
  constructor(private readonly movimentos: EstoqueMovimentoRepository) {}

  async execute(input: ListMovimentacoesInput): Promise<ListMovimentacoesResult> {
    try {
      const params = normalizePagination({ page: input.page, perPage: input.perPage })
      const filtros = input.filtros ?? {}
      const [items, total] = await Promise.all([
        this.movimentos.findManyByEmpresa(input.tenantId, input.empresaId, filtros, params),
        this.movimentos.count(input.tenantId, input.empresaId, filtros),
      ])

      return right(buildPaginatedResult(items, total, params))
    } catch (err) {
      console.error('[ListMovimentacoesUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
