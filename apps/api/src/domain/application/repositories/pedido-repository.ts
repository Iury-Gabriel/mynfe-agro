import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { Pedido, PedidoStatus } from '@/domain/enterprise/entities/pedido'

export interface PedidoFiltros {
  status?: PedidoStatus
  clienteId?: string
  periodoInicio?: Date
  periodoFim?: Date
}

export interface PedidoItemConsumo {
  itemId: string
  pedidoId: string
  numero: string
  clienteId: string
  clienteNome: string
  quantidade: number
  data: Date
  status: PedidoStatus
}

export abstract class PedidoRepository {
  abstract findById(id: string, tenantId: string): Promise<Pedido | null>
  abstract findItensByLote(tenantId: string, loteId: string): Promise<PedidoItemConsumo[]>
  abstract findManyByEmpresa(
    tenantId: string,
    empresaFaturadoraId: string,
    filtros: PedidoFiltros,
    params: PaginationParams,
  ): Promise<Pedido[]>
  abstract count(
    tenantId: string,
    empresaFaturadoraId: string,
    filtros: PedidoFiltros,
  ): Promise<number>
  abstract nextNumero(tenantId: string, empresaFaturadoraId: string): Promise<string>
  abstract create(pedido: Pedido): Promise<void>
  abstract save(pedido: Pedido): Promise<void>
}
