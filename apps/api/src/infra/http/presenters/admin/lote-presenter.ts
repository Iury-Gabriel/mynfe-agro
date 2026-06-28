import type { Lote, LoteOrigemTipo } from '@/domain/enterprise/entities/lote'

export interface LotePresenterOutput {
  id: string
  tenantId: string
  empresaId: string
  produtoId: string
  codigoLote: string
  origemTipo: LoteOrigemTipo | null
  colheitaId: string | null
  areaId: string | null
  quantidadeInicial: number
  quantidadeAtual: number
  validade: Date | null
  dataEntrada: Date
  createdAt: Date
  updatedAt: Date
}

export class LotePresenter {
  static toHTTP(lote: Lote): LotePresenterOutput {
    return {
      id: lote.id.toString(),
      tenantId: lote.tenantId,
      empresaId: lote.empresaId,
      produtoId: lote.produtoId,
      codigoLote: lote.codigoLote,
      origemTipo: lote.origemTipo,
      colheitaId: lote.colheitaId,
      areaId: lote.areaId,
      quantidadeInicial: lote.quantidadeInicial,
      quantidadeAtual: lote.quantidadeAtual,
      validade: lote.validade,
      dataEntrada: lote.dataEntrada,
      createdAt: lote.createdAt,
      updatedAt: lote.updatedAt,
    }
  }
}
