import type { CustoProducao, CustoProducaoTipo } from '@/domain/enterprise/entities/custo-producao'

export interface CustoProducaoPresenterOutput {
  id: string
  tenantId: string
  safraId: string | null
  areaId: string | null
  tipo: CustoProducaoTipo
  descricao: string
  valor: number
  data: Date
  createdAt: Date
  updatedAt: Date
}

export class CustoProducaoPresenter {
  static toHTTP(custo: CustoProducao): CustoProducaoPresenterOutput {
    return {
      id: custo.id.toString(),
      tenantId: custo.tenantId,
      safraId: custo.safraId,
      areaId: custo.areaId,
      tipo: custo.tipo,
      descricao: custo.descricao,
      valor: custo.valor,
      data: custo.data,
      createdAt: custo.createdAt,
      updatedAt: custo.updatedAt,
    }
  }
}
