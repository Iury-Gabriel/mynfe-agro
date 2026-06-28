import type { Tenant } from '@/domain/enterprise/entities/tenant'

export interface TenantConfigPresenterOutput {
  id: string
  nome: string
  status: string
  labelArea: string
  diaCorteConsolidacao: number | null
  createdAt: Date
  updatedAt: Date
}

export class TenantConfigPresenter {
  static toHTTP(tenant: Tenant): TenantConfigPresenterOutput {
    return {
      id: tenant.id.toString(),
      nome: tenant.nome,
      status: tenant.status,
      labelArea: tenant.labelArea,
      diaCorteConsolidacao: tenant.diaCorteConsolidacao,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    }
  }
}
