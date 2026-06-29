import { Injectable } from '@nestjs/common'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { ClienteRepository } from '@/domain/application/repositories/cliente-repository'
import { ProdutoRepository } from '@/domain/application/repositories/produto-repository'
import { TabelaPrecoClienteRepository } from '@/domain/application/repositories/tabela-preco-cliente-repository'
import { ClienteNotFoundError } from '@/domain/application/use-cases/errors/cliente-not-found-error'
import { ProdutoNotFoundError } from '@/domain/application/use-cases/errors/produto-not-found-error'
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

type CreateTabelaPrecoResult = Either<
  ClienteNotFoundError | ProdutoNotFoundError | UnexpectedError,
  CreateTabelaPrecoOutput
>

@Injectable()
export class CreateTabelaPrecoUseCase {
  constructor(
    private readonly tabelas: TabelaPrecoClienteRepository,
    private readonly clientes: ClienteRepository,
    private readonly produtos: ProdutoRepository,
  ) {}

  async execute(input: CreateTabelaPrecoInput): Promise<CreateTabelaPrecoResult> {
    try {
      const cliente = await this.clientes.findById(input.clienteId, input.tenantId)
      if (cliente === null) {
        return left(new ClienteNotFoundError())
      }

      const produto = await this.produtos.findById(input.produtoId, input.tenantId)
      if (produto === null) {
        return left(new ProdutoNotFoundError())
      }

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
