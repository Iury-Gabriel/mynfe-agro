import { Injectable } from '@nestjs/common'

import type { Safra, SafraStatus } from '@/domain/enterprise/entities/safra'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { SafraRepository } from '@/domain/application/repositories/safra-repository'
import { SafraNotFoundError } from '@/domain/application/use-cases/errors/safra-not-found-error'

export interface UpdateSafraInput {
  tenantId: string
  safraId: string
  cultura?: string
  variedade?: string | null
  dataPlantio?: Date | null
  dataColheitaPrevista?: Date | null
  dataColheitaRealizada?: Date | null
  estimativaProducao?: number | null
  status?: SafraStatus
}

export interface UpdateSafraOutput {
  safra: Safra
}

type UpdateSafraResult = Either<SafraNotFoundError | UnexpectedError, UpdateSafraOutput>

@Injectable()
export class UpdateSafraUseCase {
  constructor(private readonly safras: SafraRepository) {}

  async execute(input: UpdateSafraInput): Promise<UpdateSafraResult> {
    const safra = await this.safras.findById(input.safraId, input.tenantId)
    if (!safra) return left(new SafraNotFoundError())

    safra.updateCadastro({
      cultura: input.cultura,
      variedade: input.variedade,
      dataPlantio: input.dataPlantio,
      dataColheitaPrevista: input.dataColheitaPrevista,
      dataColheitaRealizada: input.dataColheitaRealizada,
      estimativaProducao: input.estimativaProducao,
      status: input.status,
    })

    try {
      await this.safras.save(safra)
    } catch (err) {
      console.error('[UpdateSafraUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }

    return right({ safra })
  }
}
