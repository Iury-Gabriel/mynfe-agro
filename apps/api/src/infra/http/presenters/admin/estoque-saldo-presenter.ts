import type { EstoqueSaldo } from '@/domain/enterprise/entities/estoque-saldo'

export interface EstoqueSaldoPresenterOutput {
  id: string
  tenantId: string
  empresaId: string
  produtoId: string
  loteId: string | null
  quantidadeDisponivel: number
  quantidadeReservada: number
  createdAt: Date
  updatedAt: Date
}

export class EstoqueSaldoPresenter {
  static toHTTP(saldo: EstoqueSaldo): EstoqueSaldoPresenterOutput {
    return {
      id: saldo.id.toString(),
      tenantId: saldo.tenantId,
      empresaId: saldo.empresaId,
      produtoId: saldo.produtoId,
      loteId: saldo.loteId,
      quantidadeDisponivel: saldo.quantidadeDisponivel,
      quantidadeReservada: saldo.quantidadeReservada,
      createdAt: saldo.createdAt,
      updatedAt: saldo.updatedAt,
    }
  }
}
