import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { Remessa, RemessaStatus } from '@/domain/enterprise/entities/remessa'

export interface RemessaFiltros {
  status?: RemessaStatus
  clienteId?: string
  periodoInicio?: Date
  periodoFim?: Date
}

export interface RemessaItemConsumo {
  itemId: string
  remessaId: string
  numero: string
  clienteId: string
  clienteNome: string
  quantidade: number
  data: Date
  status: RemessaStatus
}

export abstract class RemessaRepository {
  abstract findById(id: string, tenantId: string): Promise<Remessa | null>
  abstract findItensByLote(tenantId: string, loteId: string): Promise<RemessaItemConsumo[]>
  abstract findManyByEmpresa(
    tenantId: string,
    empresaFaturadoraId: string,
    filtros: RemessaFiltros,
    params: PaginationParams,
  ): Promise<Remessa[]>
  abstract count(
    tenantId: string,
    empresaFaturadoraId: string,
    filtros: RemessaFiltros,
  ): Promise<number>
  abstract findNaoConsolidadasByClientePeriodo(
    tenantId: string,
    empresaFaturadoraId: string,
    clienteId: string,
    periodoInicio: Date,
    periodoFim: Date,
  ): Promise<Remessa[]>
  abstract findByPedidoConsolidado(tenantId: string, pedidoId: string): Promise<Remessa[]>
  abstract nextNumero(tenantId: string, empresaFaturadoraId: string): Promise<string>
  abstract create(remessa: Remessa): Promise<void>
  abstract save(remessa: Remessa): Promise<void>
}
