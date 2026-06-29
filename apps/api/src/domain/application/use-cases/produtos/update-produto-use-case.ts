import { Injectable } from '@nestjs/common'

import type { Produto, ProdutoTipo } from '@/domain/enterprise/entities/produto'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { ProdutoRepository } from '@/domain/application/repositories/produto-repository'
import { RegistrarAuditoriaUseCase } from '@/domain/application/use-cases/auditoria/registrar-auditoria-use-case'
import { ProdutoNotFoundError } from '@/domain/application/use-cases/errors/produto-not-found-error'

export interface UpdateProdutoInput {
  tenantId: string
  produtoId: string
  descricao?: string
  tipo?: ProdutoTipo
  unidadeMedida?: string
  precoPadrao?: number | null
  ncm?: string | null
  cest?: string | null
  cfopPadrao?: string | null
  origemMercadoria?: string | null
  cstCsosn?: string | null
  aliquotas?: Record<string, unknown> | null
}

export interface UpdateProdutoOutput {
  produto: Produto
}

type UpdateProdutoResult = Either<ProdutoNotFoundError | UnexpectedError, UpdateProdutoOutput>

@Injectable()
export class UpdateProdutoUseCase {
  constructor(
    private readonly produtos: ProdutoRepository,
    private readonly registrarAuditoria: RegistrarAuditoriaUseCase,
  ) {}

  async execute(input: UpdateProdutoInput): Promise<UpdateProdutoResult> {
    const produto = await this.produtos.findById(input.produtoId, input.tenantId)
    if (!produto) return left(new ProdutoNotFoundError())

    const dadosAntes = { descricao: produto.descricao, status: produto.status }

    produto.updateCadastro({
      descricao: input.descricao,
      tipo: input.tipo,
      unidadeMedida: input.unidadeMedida,
      precoPadrao: input.precoPadrao,
      ncm: input.ncm,
      cest: input.cest,
      cfopPadrao: input.cfopPadrao,
      origemMercadoria: input.origemMercadoria,
      cstCsosn: input.cstCsosn,
      aliquotas: input.aliquotas,
    })

    try {
      await this.produtos.save(produto)
    } catch (err) {
      console.error('[UpdateProdutoUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }

    await this.registrarAuditoria.execute({
      tenantId: input.tenantId,
      entidade: 'produto',
      entidadeId: produto.id.toString(),
      acao: 'editar',
      dadosAntes,
      dadosDepois: { descricao: produto.descricao, status: produto.status },
    })

    return right({ produto })
  }
}
