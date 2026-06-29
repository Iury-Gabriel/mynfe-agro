import { Injectable } from '@nestjs/common'

import type { PaginatedResult } from '@/core/repositories/pagination-params'
import type { AtividadeCampo } from '@/domain/enterprise/entities/atividade-campo'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { buildPaginatedResult, normalizePagination } from '@/core/repositories/pagination-params'
import { AtividadeCampoRepository } from '@/domain/application/repositories/atividade-campo-repository'

export interface ListAtividadesCampoInput {
  tenantId: string
  page: number
  perPage?: number
}

export type ListAtividadesCampoOutput = PaginatedResult<AtividadeCampo>

type ListAtividadesCampoResult = Either<UnexpectedError, ListAtividadesCampoOutput>

@Injectable()
export class ListAtividadesCampoUseCase {
  constructor(private readonly atividades: AtividadeCampoRepository) {}

  async execute(input: ListAtividadesCampoInput): Promise<ListAtividadesCampoResult> {
    try {
      const params = normalizePagination({ page: input.page, perPage: input.perPage })
      const [items, total] = await Promise.all([
        this.atividades.findManyByTenant(input.tenantId, params),
        this.atividades.count(input.tenantId),
      ])

      return right(buildPaginatedResult(items, total, params))
    } catch (err) {
      console.error('[ListAtividadesCampoUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
