import type { PaginationParams } from '@/core/repositories/pagination-params'
import type {
  AtualizarStatusComEventoArgs,
  CriarEmissaoArgs,
  NotaFiscalFiltros,
} from '@/domain/application/repositories/nota-fiscal-repository'
import type { Empresa } from '@/domain/enterprise/entities/empresa'
import type { NotaFiscal } from '@/domain/enterprise/entities/nota-fiscal'

import { normalizePagination } from '@/core/repositories/pagination-params'
import { NotaFiscalRepository } from '@/domain/application/repositories/nota-fiscal-repository'

function matchesFiltros(nota: NotaFiscal, filtros: NotaFiscalFiltros): boolean {
  if (filtros.status !== undefined && nota.status !== filtros.status) return false
  if (filtros.clienteId !== undefined && nota.clienteId !== filtros.clienteId) return false
  return true
}

export class InMemoryNotaFiscalRepository extends NotaFiscalRepository {
  notas: NotaFiscal[] = []
  empresas: Empresa[] = []
  shouldFailOnCriarEmissao = false
  shouldFailOnAtualizarStatus = false

  async findById(id: string, tenantId: string): Promise<NotaFiscal | null> {
    return this.notas.find((n) => n.id.toString() === id && n.tenantId === tenantId) ?? null
  }

  async findByPlugnotasId(plugnotasId: string, tenantId: string): Promise<NotaFiscal | null> {
    return (
      this.notas.find((n) => n.plugnotasId === plugnotasId && n.tenantId === tenantId) ?? null
    )
  }

  async findManyByEmpresa(
    tenantId: string,
    empresaEmitenteId: string,
    filtros: NotaFiscalFiltros,
    params: PaginationParams,
  ): Promise<NotaFiscal[]> {
    const { page, perPage } = normalizePagination(params)
    const ordered = this.notas
      .filter(
        (n) =>
          n.tenantId === tenantId &&
          n.empresaEmitenteId === empresaEmitenteId &&
          matchesFiltros(n, filtros),
      )
      .sort((a, b) => a.id.toString().localeCompare(b.id.toString()))
    const start = (page - 1) * perPage
    return ordered.slice(start, start + perPage)
  }

  async count(
    tenantId: string,
    empresaEmitenteId: string,
    filtros: NotaFiscalFiltros,
  ): Promise<number> {
    return this.notas.filter(
      (n) =>
        n.tenantId === tenantId &&
        n.empresaEmitenteId === empresaEmitenteId &&
        matchesFiltros(n, filtros),
    ).length
  }

  async findAtivasByPedido(tenantId: string, pedidoId: string): Promise<NotaFiscal[]> {
    return this.notas.filter(
      (n) => n.tenantId === tenantId && n.pedidoId === pedidoId && n.deletedAt === null,
    )
  }

  async save(nota: NotaFiscal): Promise<void> {
    const idx = this.notas.findIndex((n) => n.id.equals(nota.id))
    if (idx >= 0) this.notas[idx] = nota
    else this.notas.push(nota)
  }

  async criarEmissao(args: CriarEmissaoArgs): Promise<void> {
    if (this.shouldFailOnCriarEmissao) throw new Error('criarEmissao failed')
    await this.save(args.nota)
    const idx = this.empresas.findIndex((e) => e.id.equals(args.empresa.id))
    if (idx >= 0) this.empresas[idx] = args.empresa
    else this.empresas.push(args.empresa)
  }

  async atualizarStatusComEvento(args: AtualizarStatusComEventoArgs): Promise<void> {
    if (this.shouldFailOnAtualizarStatus) throw new Error('atualizarStatusComEvento failed')
    args.nota.addEvento(args.evento)
    await this.save(args.nota)
  }
}
