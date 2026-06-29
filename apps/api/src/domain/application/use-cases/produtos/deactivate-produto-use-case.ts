import { Injectable } from '@nestjs/common'

import type { Produto } from '@/domain/enterprise/entities/produto'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { ProdutoRepository } from '@/domain/application/repositories/produto-repository'
import { RegistrarAuditoriaUseCase } from '@/domain/application/use-cases/auditoria/registrar-auditoria-use-case'
import { ProdutoNotFoundError } from '@/domain/application/use-cases/errors/produto-not-found-error'

export interface DeactivateProdutoInput {
  tenantId: string
  produtoId: string
}

export interface DeactivateProdutoOutput {
  produto: Produto
}

type DeactivateProdutoResult = Either<
  ProdutoNotFoundError | UnexpectedError,
  DeactivateProdutoOutput
>

@Injectable()
export class DeactivateProdutoUseCase {
  constructor(
    private readonly produtos: ProdutoRepository,
    private readonly registrarAuditoria: RegistrarAuditoriaUseCase,
  ) {}

  async execute(input: DeactivateProdutoInput): Promise<DeactivateProdutoResult> {
    const produto = await this.produtos.findById(input.produtoId, input.tenantId)
    if (!produto) return left(new ProdutoNotFoundError())

    const statusAntes = produto.status

    produto.deactivate()

    try {
      await this.produtos.save(produto)
    } catch (err) {
      console.error('[DeactivateProdutoUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }

    await this.registrarAuditoria.execute({
      tenantId: input.tenantId,
      entidade: 'produto',
      entidadeId: produto.id.toString(),
      acao: 'editar',
      dadosAntes: { status: statusAntes },
      dadosDepois: { status: produto.status },
    })

    return right({ produto })
  }
}
