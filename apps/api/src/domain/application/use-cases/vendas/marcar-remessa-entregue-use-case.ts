import { Injectable } from '@nestjs/common'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { RemessaRepository } from '@/domain/application/repositories/remessa-repository'
import { RemessaNotFoundError } from '@/domain/application/use-cases/errors/remessa-not-found-error'
import { TransicaoInvalidaError } from '@/domain/application/use-cases/errors/transicao-invalida-error'
import { Remessa } from '@/domain/enterprise/entities/remessa'

export interface MarcarRemessaEntregueInput {
  tenantId: string
  empresaFaturadoraId: string
  remessaId: string
}

export interface MarcarRemessaEntregueOutput {
  remessa: Remessa
}

type MarcarRemessaEntregueResult = Either<
  RemessaNotFoundError | TransicaoInvalidaError | UnexpectedError,
  MarcarRemessaEntregueOutput
>

@Injectable()
export class MarcarRemessaEntregueUseCase {
  constructor(private readonly remessas: RemessaRepository) {}

  async execute(input: MarcarRemessaEntregueInput): Promise<MarcarRemessaEntregueResult> {
    try {
      const remessa = await this.remessas.findById(input.remessaId, input.tenantId)

      if (remessa?.empresaFaturadoraId !== input.empresaFaturadoraId) {
        return left(new RemessaNotFoundError())
      }

      const transicaoResult = remessa.marcarEntregue()
      if (transicaoResult.isLeft()) {
        return left(transicaoResult.value)
      }

      await this.remessas.save(remessa)

      return right({ remessa })
    } catch (err) {
      console.error('[MarcarRemessaEntregueUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
