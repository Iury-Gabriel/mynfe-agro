import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { Empresa } from '@/domain/enterprise/entities/empresa'
import type { NotaFiscal, NotaFiscalStatus } from '@/domain/enterprise/entities/nota-fiscal'
import type { NotaFiscalEvento } from '@/domain/enterprise/entities/nota-fiscal-evento'

export interface NotaFiscalFiltros {
  status?: NotaFiscalStatus
  clienteId?: string
  pedidoId?: string
}

export interface CriarEmissaoArgs {
  nota: NotaFiscal
  empresa: Empresa
}

export interface AtualizarStatusComEventoArgs {
  nota: NotaFiscal
  evento: NotaFiscalEvento
}

export abstract class NotaFiscalRepository {
  abstract findById(id: string, tenantId: string): Promise<NotaFiscal | null>
  abstract findByPlugnotasId(plugnotasId: string, tenantId: string): Promise<NotaFiscal | null>
  abstract findManyByEmpresa(
    tenantId: string,
    empresaEmitenteId: string,
    filtros: NotaFiscalFiltros,
    params: PaginationParams,
  ): Promise<NotaFiscal[]>
  abstract count(
    tenantId: string,
    empresaEmitenteId: string,
    filtros: NotaFiscalFiltros,
  ): Promise<number>
  abstract findAtivasByPedido(tenantId: string, pedidoId: string): Promise<NotaFiscal[]>
  abstract save(nota: NotaFiscal): Promise<void>
  abstract criarEmissao(args: CriarEmissaoArgs): Promise<void>
  abstract atualizarStatusComEvento(args: AtualizarStatusComEventoArgs): Promise<void>
}
