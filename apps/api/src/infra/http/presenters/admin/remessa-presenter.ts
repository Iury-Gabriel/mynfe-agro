import { LotePresenter, type LotePresenterOutput } from './lote-presenter'

import type { Lote } from '@/domain/enterprise/entities/lote'
import type { Remessa, RemessaStatus } from '@/domain/enterprise/entities/remessa'
import type { RemessaItem } from '@/domain/enterprise/entities/remessa-item'

export interface RemessaItemPresenterOutput {
  id: string
  produtoId: string
  loteId: string | null
  quantidade: number
  precoUnitario: number
  valorTotal: number
}

export interface RemessaPresenterOutput {
  id: string
  tenantId: string
  empresaFaturadoraId: string
  clienteId: string
  numero: string
  status: RemessaStatus
  pedidoConsolidadoId: string | null
  valorEstimado: number
  data: Date
  observacoes: string | null
  itens: RemessaItemPresenterOutput[]
  lotes: LotePresenterOutput[]
  createdAt: Date
  updatedAt: Date
}

function itemToHTTP(item: RemessaItem): RemessaItemPresenterOutput {
  return {
    id: item.id.toString(),
    produtoId: item.produtoId,
    loteId: item.loteId,
    quantidade: item.quantidade,
    precoUnitario: item.precoUnitario,
    valorTotal: item.valorTotal,
  }
}

export class RemessaPresenter {
  static toHTTP(remessa: Remessa, lotes: Lote[] = []): RemessaPresenterOutput {
    return {
      id: remessa.id.toString(),
      tenantId: remessa.tenantId,
      empresaFaturadoraId: remessa.empresaFaturadoraId,
      clienteId: remessa.clienteId,
      numero: remessa.numero,
      status: remessa.status,
      pedidoConsolidadoId: remessa.pedidoConsolidadoId,
      valorEstimado: remessa.valorEstimado,
      data: remessa.data,
      observacoes: remessa.observacoes,
      itens: remessa.itens.map((item) => itemToHTTP(item)),
      lotes: lotes.map((lote) => LotePresenter.toHTTP(lote)),
      createdAt: remessa.createdAt,
      updatedAt: remessa.updatedAt,
    }
  }
}
