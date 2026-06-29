import { Injectable } from '@nestjs/common'

import type { ProdutoFichaTecnica } from '@/domain/enterprise/entities/produto-ficha-tecnica'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { ProdutoFichaTecnicaRepository } from '@/domain/application/repositories/produto-ficha-tecnica-repository'
import { FichaTecnicaNotFoundError } from '@/domain/application/use-cases/errors/ficha-tecnica-not-found-error'

export interface UpdateFichaTecnicaInput {
  tenantId: string
  fichaTecnicaId: string
  descricaoComponente?: string
  quantidadeReferencia?: number | null
  observacoes?: string | null
}

export interface UpdateFichaTecnicaOutput {
  fichaTecnica: ProdutoFichaTecnica
}

type UpdateFichaTecnicaResult = Either<
  FichaTecnicaNotFoundError | UnexpectedError,
  UpdateFichaTecnicaOutput
>

@Injectable()
export class UpdateFichaTecnicaUseCase {
  constructor(private readonly fichas: ProdutoFichaTecnicaRepository) {}

  async execute(input: UpdateFichaTecnicaInput): Promise<UpdateFichaTecnicaResult> {
    const fichaTecnica = await this.fichas.findById(input.fichaTecnicaId, input.tenantId)
    if (!fichaTecnica) return left(new FichaTecnicaNotFoundError())

    fichaTecnica.update({
      descricaoComponente: input.descricaoComponente,
      quantidadeReferencia: input.quantidadeReferencia,
      observacoes: input.observacoes,
    })

    try {
      await this.fichas.save(fichaTecnica)
    } catch (err) {
      console.error('[UpdateFichaTecnicaUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }

    return right({ fichaTecnica })
  }
}
