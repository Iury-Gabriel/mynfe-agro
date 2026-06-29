import type { PaginationParams } from '@/core/repositories/pagination-params'
import type {
  RemessaFiltros,
  RemessaItemConsumo,
} from '@/domain/application/repositories/remessa-repository'
import type { Remessa } from '@/domain/enterprise/entities/remessa'

import { normalizePagination } from '@/core/repositories/pagination-params'
import { RemessaRepository } from '@/domain/application/repositories/remessa-repository'

function matchesFiltros(remessa: Remessa, filtros: RemessaFiltros): boolean {
  if (filtros.status !== undefined && remessa.status !== filtros.status) return false
  if (filtros.clienteId !== undefined && remessa.clienteId !== filtros.clienteId) return false
  if (
    filtros.periodoInicio !== undefined &&
    remessa.data.getTime() < filtros.periodoInicio.getTime()
  ) {
    return false
  }
  if (filtros.periodoFim !== undefined && remessa.data.getTime() > filtros.periodoFim.getTime()) {
    return false
  }
  return true
}

export class InMemoryRemessaRepository extends RemessaRepository {
  remessas: Remessa[] = []
  clienteNomes: Record<string, string> = {}
  shouldFailOnCreate = false
  shouldFailOnSave = false

  async findById(id: string, tenantId: string): Promise<Remessa | null> {
    return this.remessas.find((r) => r.id.toString() === id && r.tenantId === tenantId) ?? null
  }

  async findItensByLote(tenantId: string, loteId: string): Promise<RemessaItemConsumo[]> {
    const consumo: RemessaItemConsumo[] = []
    for (const remessa of this.remessas) {
      if (remessa.tenantId !== tenantId || remessa.deletedAt !== null) continue
      for (const item of remessa.itens) {
        if (item.loteId !== loteId || item.deletedAt !== null) continue
        consumo.push({
          itemId: item.id.toString(),
          remessaId: remessa.id.toString(),
          numero: remessa.numero,
          clienteId: remessa.clienteId,
          clienteNome: this.clienteNomes[remessa.clienteId] ?? remessa.clienteId,
          quantidade: item.quantidade,
          data: remessa.data,
          status: remessa.status,
        })
      }
    }
    return consumo.sort((a, b) => b.numero.localeCompare(a.numero))
  }

  async findManyByEmpresa(
    tenantId: string,
    empresaFaturadoraId: string,
    filtros: RemessaFiltros,
    params: PaginationParams,
  ): Promise<Remessa[]> {
    const { page, perPage } = normalizePagination(params)
    const ordered = this.remessas
      .filter(
        (r) =>
          r.tenantId === tenantId &&
          r.empresaFaturadoraId === empresaFaturadoraId &&
          matchesFiltros(r, filtros),
      )
      .sort((a, b) => a.id.toString().localeCompare(b.id.toString()))
    const start = (page - 1) * perPage
    return ordered.slice(start, start + perPage)
  }

  async count(
    tenantId: string,
    empresaFaturadoraId: string,
    filtros: RemessaFiltros,
  ): Promise<number> {
    return this.remessas.filter(
      (r) =>
        r.tenantId === tenantId &&
        r.empresaFaturadoraId === empresaFaturadoraId &&
        matchesFiltros(r, filtros),
    ).length
  }

  async findNaoConsolidadasByClientePeriodo(
    tenantId: string,
    empresaFaturadoraId: string,
    clienteId: string,
    periodoInicio: Date,
    periodoFim: Date,
  ): Promise<Remessa[]> {
    return this.remessas.filter(
      (r) =>
        r.tenantId === tenantId &&
        r.empresaFaturadoraId === empresaFaturadoraId &&
        r.clienteId === clienteId &&
        (r.status === 'aberta' || r.status === 'entregue') &&
        r.data.getTime() >= periodoInicio.getTime() &&
        r.data.getTime() <= periodoFim.getTime(),
    )
  }

  async findByPedidoConsolidado(tenantId: string, pedidoId: string): Promise<Remessa[]> {
    return this.remessas.filter(
      (r) => r.tenantId === tenantId && r.pedidoConsolidadoId === pedidoId,
    )
  }

  async nextNumero(tenantId: string, empresaFaturadoraId: string): Promise<string> {
    const total = this.remessas.filter(
      (r) => r.tenantId === tenantId && r.empresaFaturadoraId === empresaFaturadoraId,
    ).length
    return String(total + 1).padStart(6, '0')
  }

  async create(remessa: Remessa): Promise<void> {
    if (this.shouldFailOnCreate) throw new Error('create failed')
    this.remessas.push(remessa)
  }

  async save(remessa: Remessa): Promise<void> {
    if (this.shouldFailOnSave) throw new Error('save failed')
    const idx = this.remessas.findIndex((r) => r.id.equals(remessa.id))
    if (idx >= 0) this.remessas[idx] = remessa
    else this.remessas.push(remessa)
  }
}
