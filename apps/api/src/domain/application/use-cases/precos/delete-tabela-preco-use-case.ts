import { Injectable } from '@nestjs/common'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { TabelaPrecoClienteRepository } from '@/domain/application/repositories/tabela-preco-cliente-repository'
import { TabelaPrecoNotFoundError } from '@/domain/application/use-cases/errors/tabela-preco-not-found-error'

export interface DeleteTabelaPrecoInput {
  tenantId: string
  tabelaPrecoId: string
}

type DeleteTabelaPrecoResult = Either<TabelaPrecoNotFoundError | UnexpectedError, null>

@Injectable()
export class DeleteTabelaPrecoUseCase {
  constructor(private readonly tabelas: TabelaPrecoClienteRepository) {}

  async execute(input: DeleteTabelaPrecoInput): Promise<DeleteTabelaPrecoResult> {
    const tabelaPreco = await this.tabelas.findById(input.tabelaPrecoId, input.tenantId)
    if (!tabelaPreco) return left(new TabelaPrecoNotFoundError())

    tabelaPreco.markAsDeleted()

    try {
      await this.tabelas.save(tabelaPreco)
    } catch (err) {
      console.error('[DeleteTabelaPrecoUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }

    return right(null)
  }
}
