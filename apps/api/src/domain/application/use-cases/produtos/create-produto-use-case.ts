import { Injectable } from '@nestjs/common'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { ProdutoRepository } from '@/domain/application/repositories/produto-repository'
import { Produto, type ProdutoTipo } from '@/domain/enterprise/entities/produto'

export interface CreateProdutoInput {
  tenantId: string
  empresaId: string
  descricao: string
  tipo: ProdutoTipo
  unidadeMedida: string
  precoPadrao?: number | null
  ncm?: string | null
  cest?: string | null
  cfopPadrao?: string | null
  origemMercadoria?: string | null
  cstCsosn?: string | null
  aliquotas?: Record<string, unknown> | null
}

export interface CreateProdutoOutput {
  produto: Produto
}

type CreateProdutoResult = Either<UnexpectedError, CreateProdutoOutput>

@Injectable()
export class CreateProdutoUseCase {
  constructor(private readonly produtos: ProdutoRepository) {}

  async execute(input: CreateProdutoInput): Promise<CreateProdutoResult> {
    try {
      const produto = Produto.create({
        tenantId: input.tenantId,
        empresaId: input.empresaId,
        descricao: input.descricao,
        tipo: input.tipo,
        unidadeMedida: input.unidadeMedida,
        precoPadrao: input.precoPadrao ?? null,
        ncm: input.ncm ?? null,
        cest: input.cest ?? null,
        cfopPadrao: input.cfopPadrao ?? null,
        origemMercadoria: input.origemMercadoria ?? null,
        cstCsosn: input.cstCsosn ?? null,
        aliquotas: input.aliquotas ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await this.produtos.create(produto)

      return right({ produto })
    } catch (err) {
      console.error('[CreateProdutoUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
