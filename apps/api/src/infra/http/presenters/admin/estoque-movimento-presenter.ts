import type {
  EstoqueMovimento,
  EstoqueMovimentoOrigem,
  EstoqueMovimentoTipo,
} from '@/domain/enterprise/entities/estoque-movimento'

export interface EstoqueMovimentoPresenterOutput {
  id: string
  tenantId: string
  empresaId: string
  produtoId: string
  loteId: string | null
  tipo: EstoqueMovimentoTipo
  origem: EstoqueMovimentoOrigem
  referenciaId: string | null
  quantidade: number
  data: Date
  usuarioId: string | null
  motivo: string | null
  createdAt: Date
  updatedAt: Date
}

export class EstoqueMovimentoPresenter {
  static toHTTP(movimento: EstoqueMovimento): EstoqueMovimentoPresenterOutput {
    return {
      id: movimento.id.toString(),
      tenantId: movimento.tenantId,
      empresaId: movimento.empresaId,
      produtoId: movimento.produtoId,
      loteId: movimento.loteId,
      tipo: movimento.tipo,
      origem: movimento.origem,
      referenciaId: movimento.referenciaId,
      quantidade: movimento.quantidade,
      data: movimento.data,
      usuarioId: movimento.usuarioId,
      motivo: movimento.motivo,
      createdAt: movimento.createdAt,
      updatedAt: movimento.updatedAt,
    }
  }
}
