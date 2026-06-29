import { Injectable } from '@nestjs/common'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { ClienteRepository } from '@/domain/application/repositories/cliente-repository'
import { LoteRepository } from '@/domain/application/repositories/lote-repository'
import { PedidoRepository } from '@/domain/application/repositories/pedido-repository'
import { ProdutoRepository } from '@/domain/application/repositories/produto-repository'
import { TabelaPrecoClienteRepository } from '@/domain/application/repositories/tabela-preco-cliente-repository'
import { ClienteNotFoundError } from '@/domain/application/use-cases/errors/cliente-not-found-error'
import { LoteNotFoundError } from '@/domain/application/use-cases/errors/lote-not-found-error'
import { ProdutoNotFoundError } from '@/domain/application/use-cases/errors/produto-not-found-error'
import { Pedido } from '@/domain/enterprise/entities/pedido'
import { PedidoItem } from '@/domain/enterprise/entities/pedido-item'
import { resolvePreco } from '@/domain/enterprise/services/price-resolver'

export interface CriarPedidoItemInput {
  produtoId: string
  loteId?: string | null
  quantidade: number
  precoUnitario?: number | null
}

export interface CriarPedidoInput {
  tenantId: string
  empresaFaturadoraId: string
  clienteId: string
  data: Date
  confirmar?: boolean
  observacoes?: string | null
  itens: CriarPedidoItemInput[]
}

export interface CriarPedidoOutput {
  pedido: Pedido
}

type CriarPedidoResult = Either<
  ClienteNotFoundError | ProdutoNotFoundError | LoteNotFoundError | UnexpectedError,
  CriarPedidoOutput
>

@Injectable()
export class CriarPedidoUseCase {
  constructor(
    private readonly pedidos: PedidoRepository,
    private readonly produtos: ProdutoRepository,
    private readonly tabelasPreco: TabelaPrecoClienteRepository,
    private readonly clientes: ClienteRepository,
    private readonly lotes: LoteRepository,
  ) {}

  async execute(input: CriarPedidoInput): Promise<CriarPedidoResult> {
    try {
      const cliente = await this.clientes.findById(input.clienteId, input.tenantId)
      if (cliente === null) {
        return left(new ClienteNotFoundError())
      }

      for (const itemInput of input.itens) {
        const produto = await this.produtos.findById(itemInput.produtoId, input.tenantId)
        if (produto === null) {
          return left(new ProdutoNotFoundError())
        }
        if (itemInput.loteId !== undefined && itemInput.loteId !== null) {
          const lote = await this.lotes.findById(itemInput.loteId, input.tenantId)
          if (lote === null) {
            return left(new LoteNotFoundError())
          }
        }
      }

      const now = new Date()

      const numero = await this.pedidos.nextNumero(input.tenantId, input.empresaFaturadoraId)

      const pedido = Pedido.create({
        tenantId: input.tenantId,
        empresaFaturadoraId: input.empresaFaturadoraId,
        clienteId: input.clienteId,
        numero,
        tipo: 'avulso',
        status: input.confirmar === true ? 'confirmado' : 'rascunho',
        data: input.data,
        observacoes: input.observacoes ?? null,
        createdAt: now,
        updatedAt: now,
      })

      for (const itemInput of input.itens) {
        const precoUnitario = await this.resolverPreco(input, itemInput, now)

        const item = PedidoItem.create({
          tenantId: input.tenantId,
          pedidoId: pedido.id.toString(),
          produtoId: itemInput.produtoId,
          loteId: itemInput.loteId ?? null,
          quantidade: itemInput.quantidade,
          precoUnitario,
          createdAt: now,
          updatedAt: now,
        })

        pedido.addItem(item)
      }

      await this.pedidos.create(pedido)

      return right({ pedido })
    } catch (err) {
      console.error('[CriarPedidoUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }

  private async resolverPreco(
    input: CriarPedidoInput,
    itemInput: CriarPedidoItemInput,
    ref: Date,
  ): Promise<number> {
    if (itemInput.precoUnitario !== undefined && itemInput.precoUnitario !== null) {
      return itemInput.precoUnitario
    }

    const precosCliente = await this.tabelasPreco.findVigentesByClienteProduto(
      input.tenantId,
      input.clienteId,
      itemInput.produtoId,
      ref,
    )

    const produto = await this.produtos.findById(itemInput.produtoId, input.tenantId)

    const resolvido = resolvePreco({
      precosCliente,
      precoPadrao: produto?.precoPadrao ?? null,
      ref,
    })

    return resolvido ?? 0
  }
}
