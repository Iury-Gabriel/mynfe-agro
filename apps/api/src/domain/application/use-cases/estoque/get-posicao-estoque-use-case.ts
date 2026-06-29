import { Injectable } from '@nestjs/common'

import type { PaginatedResult } from '@/core/repositories/pagination-params'
import type { EstoqueSaldo } from '@/domain/enterprise/entities/estoque-saldo'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { buildPaginatedResult, normalizePagination } from '@/core/repositories/pagination-params'
import { EstoqueSaldoRepository } from '@/domain/application/repositories/estoque-saldo-repository'

export interface GetPosicaoEstoqueInput {
  tenantId: string
  empresaId: string
  page: number
  perPage?: number
}

export type GetPosicaoEstoqueOutput = PaginatedResult<EstoqueSaldo>

type GetPosicaoEstoqueResult = Either<UnexpectedError, GetPosicaoEstoqueOutput>

@Injectable()
export class GetPosicaoEstoqueUseCase {
  constructor(private readonly saldos: EstoqueSaldoRepository) {}

  async execute(input: GetPosicaoEstoqueInput): Promise<GetPosicaoEstoqueResult> {
    try {
      const params = normalizePagination({ page: input.page, perPage: input.perPage })
      const [items, total] = await Promise.all([
        this.saldos.findManyByEmpresa(input.tenantId, input.empresaId, params),
        this.saldos.count(input.tenantId, input.empresaId),
      ])

      return right(buildPaginatedResult(items, total, params))
    } catch (err) {
      console.error('[GetPosicaoEstoqueUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
