import type { Safra, SafraStatus } from '@/domain/enterprise/entities/safra'

export interface SafraPresenterOutput {
  id: string
  tenantId: string
  areaId: string
  cultura: string
  variedade: string | null
  dataPlantio: Date | null
  dataColheitaPrevista: Date | null
  dataColheitaRealizada: Date | null
  estimativaProducao: number | null
  status: SafraStatus
  createdAt: Date
  updatedAt: Date
}

export class SafraPresenter {
  static toHTTP(safra: Safra): SafraPresenterOutput {
    return {
      id: safra.id.toString(),
      tenantId: safra.tenantId,
      areaId: safra.areaId,
      cultura: safra.cultura,
      variedade: safra.variedade,
      dataPlantio: safra.dataPlantio,
      dataColheitaPrevista: safra.dataColheitaPrevista,
      dataColheitaRealizada: safra.dataColheitaRealizada,
      estimativaProducao: safra.estimativaProducao,
      status: safra.status,
      createdAt: safra.createdAt,
      updatedAt: safra.updatedAt,
    }
  }
}
