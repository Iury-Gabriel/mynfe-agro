import { Injectable } from '@nestjs/common'

import type { PaginatedResult } from '@/core/repositories/pagination-params'
import type { PedidoFiltros } from '@/domain/application/repositories/pedido-repository'
import type { Pedido } from '@/domain/enterprise/entities/pedido'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { buildPaginatedResult, normalizePagination } from '@/core/repositories/pagination-params'
import { PedidoRepository } from '@/domain/application/repositories/pedido-repository'

export interface ListPedidosInput {
  tenantId: string
  empresaFaturadoraId: string
  filtros?: PedidoFiltros
  page: number
  perPage?: number
}

export type ListPedidosOutput = PaginatedResult<Pedido>

type ListPedidosResult = Either<UnexpectedError, ListPedidosOutput>

@Injectable()
export class ListPedidosUseCase {
  constructor(private readonly pedidos: PedidoRepository) {}

  async execute(input: ListPedidosInput): Promise<ListPedidosResult> {
    try {
      const params = normalizePagination({ page: input.page, perPage: input.perPage })
      const filtros = input.filtros ?? {}
      const [items, total] = await Promise.all([
        this.pedidos.findManyByEmpresa(
          input.tenantId,
          input.empresaFaturadoraId,
          filtros,
          params,
        ),
        this.pedidos.count(input.tenantId, input.empresaFaturadoraId, filtros),
      ])

      return right(buildPaginatedResult(items, total, params))
    } catch (err) {
      console.error('[ListPedidosUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
