import type { PaginationParams } from '@/core/repositories/pagination-params'
import type {
  PedidoFiltros,
  PedidoItemConsumo,
} from '@/domain/application/repositories/pedido-repository'
import type { Pedido } from '@/domain/enterprise/entities/pedido'

import { normalizePagination } from '@/core/repositories/pagination-params'
import { PedidoRepository } from '@/domain/application/repositories/pedido-repository'

function matchesFiltros(pedido: Pedido, filtros: PedidoFiltros): boolean {
  if (filtros.status !== undefined && pedido.status !== filtros.status) return false
  if (filtros.clienteId !== undefined && pedido.clienteId !== filtros.clienteId) return false
  if (filtros.periodoInicio !== undefined && pedido.data.getTime() < filtros.periodoInicio.getTime()) {
    return false
  }
  if (filtros.periodoFim !== undefined && pedido.data.getTime() > filtros.periodoFim.getTime()) {
    return false
  }
  return true
}

export class InMemoryPedidoRepository extends PedidoRepository {
  pedidos: Pedido[] = []
  clienteNomes: Record<string, string> = {}
  shouldFailOnCreate = false
  shouldFailOnSave = false

  async findById(id: string, tenantId: string): Promise<Pedido | null> {
    return this.pedidos.find((p) => p.id.toString() === id && p.tenantId === tenantId) ?? null
  }

  async findItensByLote(tenantId: string, loteId: string): Promise<PedidoItemConsumo[]> {
    const consumo: PedidoItemConsumo[] = []
    for (const pedido of this.pedidos) {
      if (pedido.tenantId !== tenantId || pedido.deletedAt !== null) continue
      for (const item of pedido.itens) {
        if (item.loteId !== loteId || item.deletedAt !== null) continue
        consumo.push({
          itemId: item.id.toString(),
          pedidoId: pedido.id.toString(),
          numero: pedido.numero,
          clienteId: pedido.clienteId,
          clienteNome: this.clienteNomes[pedido.clienteId] ?? pedido.clienteId,
          quantidade: item.quantidade,
          data: pedido.data,
          status: pedido.status,
        })
      }
    }
    return consumo.sort((a, b) => b.numero.localeCompare(a.numero))
  }

  async findManyByEmpresa(
    tenantId: string,
    empresaFaturadoraId: string,
    filtros: PedidoFiltros,
    params: PaginationParams,
  ): Promise<Pedido[]> {
    const { page, perPage } = normalizePagination(params)
    const ordered = this.pedidos
      .filter(
        (p) =>
          p.tenantId === tenantId &&
          p.empresaFaturadoraId === empresaFaturadoraId &&
          matchesFiltros(p, filtros),
      )
      .sort((a, b) => a.id.toString().localeCompare(b.id.toString()))
    const start = (page - 1) * perPage
    return ordered.slice(start, start + perPage)
  }

  async count(
    tenantId: string,
    empresaFaturadoraId: string,
    filtros: PedidoFiltros,
  ): Promise<number> {
    return this.pedidos.filter(
      (p) =>
        p.tenantId === tenantId &&
        p.empresaFaturadoraId === empresaFaturadoraId &&
        matchesFiltros(p, filtros),
    ).length
  }

  async nextNumero(tenantId: string, empresaFaturadoraId: string): Promise<string> {
    const total = this.pedidos.filter(
      (p) => p.tenantId === tenantId && p.empresaFaturadoraId === empresaFaturadoraId,
    ).length
    return String(total + 1).padStart(6, '0')
  }

  async create(pedido: Pedido): Promise<void> {
    if (this.shouldFailOnCreate) throw new Error('create failed')
    this.pedidos.push(pedido)
  }

  async save(pedido: Pedido): Promise<void> {
    if (this.shouldFailOnSave) throw new Error('save failed')
    const idx = this.pedidos.findIndex((p) => p.id.equals(pedido.id))
    if (idx >= 0) this.pedidos[idx] = pedido
    else this.pedidos.push(pedido)
  }
}
