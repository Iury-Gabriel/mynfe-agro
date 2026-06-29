import type { TenantSummary } from '@/domain/application/repositories/tenant-repository'
import type { Tenant } from '@/domain/enterprise/entities/tenant'

export interface TenantPresenterOutput {
  id: string
  nome: string
  status: string
  createdAt: Date
}

export interface TenantSummaryPresenterOutput extends TenantPresenterOutput {
  empresasCount: number
  usuariosCount: number
}

export class TenantPresenter {
  static toHTTP(tenant: Tenant): TenantPresenterOutput {
    return {
      id: tenant.id.toString(),
      nome: tenant.nome,
      status: tenant.status,
      createdAt: tenant.createdAt,
    }
  }

  static summaryToHTTP(summary: TenantSummary): TenantSummaryPresenterOutput {
    return {
      ...TenantPresenter.toHTTP(summary.tenant),
      empresasCount: summary.empresasCount,
      usuariosCount: summary.usuariosCount,
    }
  }
}
