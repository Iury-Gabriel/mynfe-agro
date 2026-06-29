import { Injectable } from '@nestjs/common'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { RemessaRepository } from '@/domain/application/repositories/remessa-repository'
import { RemessaNotFoundError } from '@/domain/application/use-cases/errors/remessa-not-found-error'
import { TransicaoInvalidaError } from '@/domain/application/use-cases/errors/transicao-invalida-error'
import { Remessa } from '@/domain/enterprise/entities/remessa'

export interface CancelarRemessaInput {
  tenantId: string
  empresaFaturadoraId: string
  remessaId: string
}

export interface CancelarRemessaOutput {
  remessa: Remessa
}

type CancelarRemessaResult = Either<
  RemessaNotFoundError | TransicaoInvalidaError | UnexpectedError,
  CancelarRemessaOutput
>

@Injectable()
export class CancelarRemessaUseCase {
  constructor(private readonly remessas: RemessaRepository) {}

  async execute(input: CancelarRemessaInput): Promise<CancelarRemessaResult> {
    try {
      const remessa = await this.remessas.findById(input.remessaId, input.tenantId)

      if (remessa?.empresaFaturadoraId !== input.empresaFaturadoraId) {
        return left(new RemessaNotFoundError())
      }

      const transicaoResult = remessa.cancelar()
      if (transicaoResult.isLeft()) {
        return left(transicaoResult.value)
      }

      await this.remessas.save(remessa)

      return right({ remessa })
    } catch (err) {
      console.error('[CancelarRemessaUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
