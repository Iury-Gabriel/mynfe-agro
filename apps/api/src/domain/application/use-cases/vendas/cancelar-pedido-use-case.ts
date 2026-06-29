import { Injectable } from '@nestjs/common'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { PedidoRepository } from '@/domain/application/repositories/pedido-repository'
import { PedidoNotFoundError } from '@/domain/application/use-cases/errors/pedido-not-found-error'
import { TransicaoInvalidaError } from '@/domain/application/use-cases/errors/transicao-invalida-error'
import { Pedido } from '@/domain/enterprise/entities/pedido'

export interface CancelarPedidoInput {
  tenantId: string
  empresaFaturadoraId: string
  pedidoId: string
}

export interface CancelarPedidoOutput {
  pedido: Pedido
}

type CancelarPedidoResult = Either<
  PedidoNotFoundError | TransicaoInvalidaError | UnexpectedError,
  CancelarPedidoOutput
>

@Injectable()
export class CancelarPedidoUseCase {
  constructor(private readonly pedidos: PedidoRepository) {}

  async execute(input: CancelarPedidoInput): Promise<CancelarPedidoResult> {
    try {
      const pedido = await this.pedidos.findById(input.pedidoId, input.tenantId)

      if (pedido?.empresaFaturadoraId !== input.empresaFaturadoraId) {
        return left(new PedidoNotFoundError())
      }

      const transicaoResult = pedido.cancelar()
      if (transicaoResult.isLeft()) {
        return left(transicaoResult.value)
      }

      await this.pedidos.save(pedido)

      return right({ pedido })
    } catch (err) {
      console.error('[CancelarPedidoUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
