import { Injectable } from '@nestjs/common'

import type { Safra } from '@/domain/enterprise/entities/safra'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { SafraRepository } from '@/domain/application/repositories/safra-repository'
import { SafraNotFoundError } from '@/domain/application/use-cases/errors/safra-not-found-error'

export interface DeleteSafraInput {
  tenantId: string
  safraId: string
}

export interface DeleteSafraOutput {
  safra: Safra
}

type DeleteSafraResult = Either<SafraNotFoundError | UnexpectedError, DeleteSafraOutput>

@Injectable()
export class DeleteSafraUseCase {
  constructor(private readonly safras: SafraRepository) {}

  async execute(input: DeleteSafraInput): Promise<DeleteSafraResult> {
    const safra = await this.safras.findById(input.safraId, input.tenantId)
    if (!safra) return left(new SafraNotFoundError())

    safra.softDelete()

    try {
      await this.safras.save(safra)
    } catch (err) {
      console.error('[DeleteSafraUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }

    return right({ safra })
  }
}
