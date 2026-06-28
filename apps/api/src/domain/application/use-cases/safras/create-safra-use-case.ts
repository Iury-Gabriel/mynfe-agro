import { Injectable } from '@nestjs/common'

import type { SafraStatus } from '@/domain/enterprise/entities/safra'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { SafraRepository } from '@/domain/application/repositories/safra-repository'
import { Safra } from '@/domain/enterprise/entities/safra'

export interface CreateSafraInput {
  tenantId: string
  areaId: string
  cultura: string
  variedade?: string | null
  dataPlantio?: Date | null
  dataColheitaPrevista?: Date | null
  dataColheitaRealizada?: Date | null
  estimativaProducao?: number | null
  status?: SafraStatus
}

export interface CreateSafraOutput {
  safra: Safra
}

type CreateSafraResult = Either<UnexpectedError, CreateSafraOutput>

@Injectable()
export class CreateSafraUseCase {
  constructor(private readonly safras: SafraRepository) {}

  async execute(input: CreateSafraInput): Promise<CreateSafraResult> {
    try {
      const safra = Safra.create({
        tenantId: input.tenantId,
        areaId: input.areaId,
        cultura: input.cultura,
        variedade: input.variedade ?? null,
        dataPlantio: input.dataPlantio ?? null,
        dataColheitaPrevista: input.dataColheitaPrevista ?? null,
        dataColheitaRealizada: input.dataColheitaRealizada ?? null,
        estimativaProducao: input.estimativaProducao ?? null,
        status: input.status,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await this.safras.create(safra)

      return right({ safra })
    } catch (err) {
      console.error('[CreateSafraUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
