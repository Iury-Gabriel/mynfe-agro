import { Injectable } from '@nestjs/common'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { ProdutoFichaTecnicaRepository } from '@/domain/application/repositories/produto-ficha-tecnica-repository'
import { FichaTecnicaNotFoundError } from '@/domain/application/use-cases/errors/ficha-tecnica-not-found-error'

export interface DeleteFichaTecnicaInput {
  tenantId: string
  fichaTecnicaId: string
}

type DeleteFichaTecnicaResult = Either<FichaTecnicaNotFoundError | UnexpectedError, null>

@Injectable()
export class DeleteFichaTecnicaUseCase {
  constructor(private readonly fichas: ProdutoFichaTecnicaRepository) {}

  async execute(input: DeleteFichaTecnicaInput): Promise<DeleteFichaTecnicaResult> {
    const fichaTecnica = await this.fichas.findById(input.fichaTecnicaId, input.tenantId)
    if (!fichaTecnica) return left(new FichaTecnicaNotFoundError())

    fichaTecnica.markAsDeleted()

    try {
      await this.fichas.save(fichaTecnica)
    } catch (err) {
      console.error('[DeleteFichaTecnicaUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }

    return right(null)
  }
}
