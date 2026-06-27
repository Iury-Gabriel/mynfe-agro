import { Injectable } from '@nestjs/common'

import type { Produto } from '@/domain/enterprise/entities/produto'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { ProdutoRepository } from '@/domain/application/repositories/produto-repository'
import { ProdutoNotFoundError } from '@/domain/application/use-cases/errors/produto-not-found-error'

export interface ActivateProdutoInput {
  tenantId: string
  produtoId: string
}

export interface ActivateProdutoOutput {
  produto: Produto
}

type ActivateProdutoResult = Either<ProdutoNotFoundError | UnexpectedError, ActivateProdutoOutput>

@Injectable()
export class ActivateProdutoUseCase {
  constructor(private readonly produtos: ProdutoRepository) {}

  async execute(input: ActivateProdutoInput): Promise<ActivateProdutoResult> {
    const produto = await this.produtos.findById(input.produtoId, input.tenantId)
    if (!produto) return left(new ProdutoNotFoundError())

    produto.activate()

    try {
      await this.produtos.save(produto)
    } catch (err) {
      console.error('[ActivateProdutoUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }

    return right({ produto })
  }
}
