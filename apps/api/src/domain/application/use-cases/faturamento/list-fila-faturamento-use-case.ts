import { Injectable } from '@nestjs/common'

import type { PaginatedResult } from '@/core/repositories/pagination-params'
import type { Pedido } from '@/domain/enterprise/entities/pedido'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { buildPaginatedResult, normalizePagination } from '@/core/repositories/pagination-params'
import { NotaFiscalRepository } from '@/domain/application/repositories/nota-fiscal-repository'
import { PedidoRepository } from '@/domain/application/repositories/pedido-repository'

export interface ListFilaFaturamentoInput {
  tenantId: string
  empresaEmitenteId: string
  clienteId?: string
  page: number
  perPage?: number
}

export type ListFilaFaturamentoOutput = PaginatedResult<Pedido>

type ListFilaFaturamentoResult = Either<UnexpectedError, ListFilaFaturamentoOutput>

const STATUSES_BLOQUEIO = new Set(['autorizada', 'emitindo'])

@Injectable()
export class ListFilaFaturamentoUseCase {
  constructor(
    private readonly pedidos: PedidoRepository,
    private readonly notas: NotaFiscalRepository,
  ) {}

  async execute(input: ListFilaFaturamentoInput): Promise<ListFilaFaturamentoResult> {
    try {
      const candidatos = await this.pedidos.findManyByEmpresa(
        input.tenantId,
        input.empresaEmitenteId,
        { status: 'confirmado', clienteId: input.clienteId },
        { page: 1, perPage: 100 },
      )

      const aptos: Pedido[] = []
      for (const pedido of candidatos) {
        const notas = await this.notas.findAtivasByPedido(input.tenantId, pedido.id.toString())
        if (!notas.some((nota) => STATUSES_BLOQUEIO.has(nota.status))) {
          aptos.push(pedido)
        }
      }

      const params = normalizePagination({ page: input.page, perPage: input.perPage })
      const start = (params.page - 1) * params.perPage
      const items = aptos.slice(start, start + params.perPage)

      return right(buildPaginatedResult(items, aptos.length, params))
    } catch (err) {
      console.error('[ListFilaFaturamentoUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
