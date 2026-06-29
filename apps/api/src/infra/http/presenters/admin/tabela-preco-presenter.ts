import type { TabelaPrecoCliente } from '@/domain/enterprise/entities/tabela-preco-cliente'

export interface TabelaPrecoPresenterOutput {
  id: string
  tenantId: string
  clienteId: string
  produtoId: string
  preco: number
  vigenciaInicio: Date | null
  vigenciaFim: Date | null
  createdAt: Date
  updatedAt: Date
}

export class TabelaPrecoPresenter {
  static toHTTP(tabelaPreco: TabelaPrecoCliente): TabelaPrecoPresenterOutput {
    return {
      id: tabelaPreco.id.toString(),
      tenantId: tabelaPreco.tenantId,
      clienteId: tabelaPreco.clienteId,
      produtoId: tabelaPreco.produtoId,
      preco: tabelaPreco.preco,
      vigenciaInicio: tabelaPreco.vigenciaInicio,
      vigenciaFim: tabelaPreco.vigenciaFim,
      createdAt: tabelaPreco.createdAt,
      updatedAt: tabelaPreco.updatedAt,
    }
  }
}
