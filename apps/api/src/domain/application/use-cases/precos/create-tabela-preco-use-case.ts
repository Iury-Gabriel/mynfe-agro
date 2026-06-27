import { Injectable } from '@nestjs/common'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { TabelaPrecoClienteRepository } from '@/domain/application/repositories/tabela-preco-cliente-repository'
import { TabelaPrecoCliente } from '@/domain/enterprise/entities/tabela-preco-cliente'

export interface CreateTabelaPrecoInput {
  tenantId: string
  clienteId: string
  produtoId: string
  preco: number
  vigenciaInicio?: Date | null
  vigenciaFim?: Date | null
}

export interface CreateTabelaPrecoOutput {
  tabelaPreco: TabelaPrecoCliente
}

type CreateTabelaPrecoResult = Either<UnexpectedError, CreateTabelaPrecoOutput>

@Injectable()
export class CreateTabelaPrecoUseCase {
  constructor(private readonly tabelas: TabelaPrecoClienteRepository) {}

  async execute(input: CreateTabelaPrecoInput): Promise<CreateTabelaPrecoResult> {
    try {
      const tabelaPreco = TabelaPrecoCliente.create({
        tenantId: input.tenantId,
        clienteId: input.clienteId,
        produtoId: input.produtoId,
        preco: input.preco,
        vigenciaInicio: input.vigenciaInicio ?? null,
        vigenciaFim: input.vigenciaFim ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await this.tabelas.create(tabelaPreco)

      return right({ tabelaPreco })
    } catch (err) {
      console.error('[CreateTabelaPrecoUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
