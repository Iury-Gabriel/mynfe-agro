import type { Colheita } from '@/domain/enterprise/entities/colheita'

export interface ColheitaPresenterOutput {
  id: string
  tenantId: string
  empresaId: string
  produtoId: string
  safraId: string | null
  areaId: string | null
  quantidade: number
  data: Date
  responsavelUsuarioId: string | null
  createdAt: Date
  updatedAt: Date
}

export class ColheitaPresenter {
  static toHTTP(colheita: Colheita): ColheitaPresenterOutput {
    return {
      id: colheita.id.toString(),
      tenantId: colheita.tenantId,
      empresaId: colheita.empresaId,
      produtoId: colheita.produtoId,
      safraId: colheita.safraId,
      areaId: colheita.areaId,
      quantidade: colheita.quantidade,
      data: colheita.data,
      responsavelUsuarioId: colheita.responsavelUsuarioId,
      createdAt: colheita.createdAt,
      updatedAt: colheita.updatedAt,
    }
  }
}
