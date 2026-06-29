import { Injectable } from '@nestjs/common'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { ProdutoFichaTecnicaRepository } from '@/domain/application/repositories/produto-ficha-tecnica-repository'
import { ProdutoRepository } from '@/domain/application/repositories/produto-repository'
import { ProdutoNotFoundError } from '@/domain/application/use-cases/errors/produto-not-found-error'
import { ProdutoFichaTecnica } from '@/domain/enterprise/entities/produto-ficha-tecnica'

export interface CreateFichaTecnicaInput {
  tenantId: string
  produtoId: string
  descricaoComponente: string
  quantidadeReferencia?: number | null
  observacoes?: string | null
}

export interface CreateFichaTecnicaOutput {
  fichaTecnica: ProdutoFichaTecnica
}

type CreateFichaTecnicaResult = Either<
  ProdutoNotFoundError | UnexpectedError,
  CreateFichaTecnicaOutput
>

@Injectable()
export class CreateFichaTecnicaUseCase {
  constructor(
    private readonly fichas: ProdutoFichaTecnicaRepository,
    private readonly produtos: ProdutoRepository,
  ) {}

  async execute(input: CreateFichaTecnicaInput): Promise<CreateFichaTecnicaResult> {
    const produto = await this.produtos.findById(input.produtoId, input.tenantId)
    if (!produto) return left(new ProdutoNotFoundError())

    const fichaTecnica = ProdutoFichaTecnica.create({
      tenantId: input.tenantId,
      produtoId: input.produtoId,
      descricaoComponente: input.descricaoComponente,
      quantidadeReferencia: input.quantidadeReferencia ?? null,
      observacoes: input.observacoes ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    try {
      await this.fichas.create(fichaTecnica)
    } catch (err) {
      console.error('[CreateFichaTecnicaUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }

    return right({ fichaTecnica })
  }
}
