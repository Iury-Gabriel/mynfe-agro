import { Injectable } from '@nestjs/common'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { PedidoRepository } from '@/domain/application/repositories/pedido-repository'
import { RemessaRepository } from '@/domain/application/repositories/remessa-repository'
import { PedidoNotFoundError } from '@/domain/application/use-cases/errors/pedido-not-found-error'
import { Pedido } from '@/domain/enterprise/entities/pedido'
import { Remessa } from '@/domain/enterprise/entities/remessa'

export interface GetPedidoInput {
  tenantId: string
  empresaFaturadoraId: string
  pedidoId: string
}

export interface GetPedidoOutput {
  pedido: Pedido
  remessas: Remessa[]
}

type GetPedidoResult = Either<PedidoNotFoundError | UnexpectedError, GetPedidoOutput>

@Injectable()
export class GetPedidoUseCase {
  constructor(
    private readonly pedidos: PedidoRepository,
    private readonly remessas: RemessaRepository,
  ) {}

  async execute(input: GetPedidoInput): Promise<GetPedidoResult> {
    try {
      const pedido = await this.pedidos.findById(input.pedidoId, input.tenantId)

      if (pedido?.empresaFaturadoraId !== input.empresaFaturadoraId) {
        return left(new PedidoNotFoundError())
      }

      const remessas = await this.remessas.findByPedidoConsolidado(
        input.tenantId,
        pedido.id.toString(),
      )

      return right({ pedido, remessas })
    } catch (err) {
      console.error('[GetPedidoUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
