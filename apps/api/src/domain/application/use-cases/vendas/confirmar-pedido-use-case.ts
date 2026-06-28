import { Injectable } from '@nestjs/common'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { EstoqueSaldoRepository } from '@/domain/application/repositories/estoque-saldo-repository'
import { EstoqueWriteRepository } from '@/domain/application/repositories/estoque-write-repository'
import { LoteRepository } from '@/domain/application/repositories/lote-repository'
import { PedidoRepository } from '@/domain/application/repositories/pedido-repository'
import { EstoqueInsuficienteError } from '@/domain/application/use-cases/errors/estoque-insuficiente-error'
import { PedidoNotFoundError } from '@/domain/application/use-cases/errors/pedido-not-found-error'
import { TransicaoInvalidaError } from '@/domain/application/use-cases/errors/transicao-invalida-error'
import { EstoqueMovimento } from '@/domain/enterprise/entities/estoque-movimento'
import { EstoqueSaldo } from '@/domain/enterprise/entities/estoque-saldo'
import { Lote } from '@/domain/enterprise/entities/lote'
import { Pedido } from '@/domain/enterprise/entities/pedido'

export interface ConfirmarPedidoInput {
  tenantId: string
  empresaFaturadoraId: string
  pedidoId: string
  usuarioId?: string | null
}

export interface ConfirmarPedidoOutput {
  pedido: Pedido
}

type ConfirmarPedidoResult = Either<
  | PedidoNotFoundError
  | TransicaoInvalidaError
  | EstoqueInsuficienteError
  | UnexpectedError,
  ConfirmarPedidoOutput
>

@Injectable()
export class ConfirmarPedidoUseCase {
  constructor(
    private readonly pedidos: PedidoRepository,
    private readonly saldos: EstoqueSaldoRepository,
    private readonly lotes: LoteRepository,
    private readonly estoqueWrite: EstoqueWriteRepository,
  ) {}

  async execute(input: ConfirmarPedidoInput): Promise<ConfirmarPedidoResult> {
    try {
      const pedido = await this.pedidos.findById(input.pedidoId, input.tenantId)

      if (pedido?.empresaFaturadoraId !== input.empresaFaturadoraId) {
        return left(new PedidoNotFoundError())
      }

      const transicaoResult = pedido.confirmar()
      if (transicaoResult.isLeft()) {
        return left(transicaoResult.value)
      }

      const now = new Date()
      const movimentos: EstoqueMovimento[] = []
      const saldos: EstoqueSaldo[] = []
      const lotes: Lote[] = []

      for (const item of pedido.itens) {
        const existing = await this.saldos.findByChave(
          input.tenantId,
          input.empresaFaturadoraId,
          item.produtoId,
          item.loteId,
        )

        const saldo =
          existing ??
          EstoqueSaldo.create({
            tenantId: input.tenantId,
            empresaId: input.empresaFaturadoraId,
            produtoId: item.produtoId,
            loteId: item.loteId,
            createdAt: now,
            updatedAt: now,
          })

        const saidaResult = saldo.aplicarSaida(item.quantidade)
        if (saidaResult.isLeft()) {
          return left(saidaResult.value)
        }
        saldos.push(saldo)

        movimentos.push(
          EstoqueMovimento.create({
            tenantId: input.tenantId,
            empresaId: input.empresaFaturadoraId,
            produtoId: item.produtoId,
            loteId: item.loteId,
            tipo: 'saida',
            origem: 'pedido',
            referenciaId: pedido.id.toString(),
            quantidade: item.quantidade,
            data: now,
            usuarioId: input.usuarioId ?? null,
            createdAt: now,
            updatedAt: now,
          }),
        )

        if (item.loteId !== null) {
          const lote = await this.lotes.findById(item.loteId, input.tenantId)
          if (lote === null) {
            return left(new EstoqueInsuficienteError(0, item.quantidade))
          }
          const consumoResult = lote.consumir(item.quantidade)
          if (consumoResult.isLeft()) {
            return left(consumoResult.value)
          }
          lotes.push(lote)
        }
      }

      await this.estoqueWrite.registrarSaidaVenda({ movimentos, saldos, lotes })
      await this.pedidos.save(pedido)

      return right({ pedido })
    } catch (err) {
      console.error('[ConfirmarPedidoUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
