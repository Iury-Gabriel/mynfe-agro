import { Injectable } from '@nestjs/common'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { LoteRepository } from '@/domain/application/repositories/lote-repository'
import { RemessaRepository } from '@/domain/application/repositories/remessa-repository'
import { RemessaNotFoundError } from '@/domain/application/use-cases/errors/remessa-not-found-error'
import { Lote } from '@/domain/enterprise/entities/lote'
import { Remessa } from '@/domain/enterprise/entities/remessa'

export interface GetRemessaInput {
  tenantId: string
  empresaFaturadoraId: string
  remessaId: string
}

export interface GetRemessaOutput {
  remessa: Remessa
  lotes: Lote[]
}

type GetRemessaResult = Either<RemessaNotFoundError | UnexpectedError, GetRemessaOutput>

@Injectable()
export class GetRemessaUseCase {
  constructor(
    private readonly remessas: RemessaRepository,
    private readonly lotes: LoteRepository,
  ) {}

  async execute(input: GetRemessaInput): Promise<GetRemessaResult> {
    try {
      const remessa = await this.remessas.findById(input.remessaId, input.tenantId)

      if (remessa?.empresaFaturadoraId !== input.empresaFaturadoraId) {
        return left(new RemessaNotFoundError())
      }

      const lotes: Lote[] = []
      for (const item of remessa.itens) {
        if (item.loteId !== null) {
          const lote = await this.lotes.findById(item.loteId, input.tenantId)
          if (lote !== null) {
            lotes.push(lote)
          }
        }
      }

      return right({ remessa, lotes })
    } catch (err) {
      console.error('[GetRemessaUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
