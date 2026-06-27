import type { Prisma, Tenant as PrismaTenant } from '@prisma/client'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Tenant, type TenantStatus } from '@/domain/enterprise/entities/tenant'

export class PrismaTenantMapper {
  static toDomain(raw: PrismaTenant): Tenant {
    return Tenant.create(
      {
        nome: raw.nome,
        status: raw.status as TenantStatus,
        labelArea: raw.labelArea,
        diaCorteConsolidacao: raw.diaCorteConsolidacao,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        deletedAt: raw.deletedAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrismaCreate(tenant: Tenant): Prisma.TenantUncheckedCreateInput {
    return {
      id: tenant.id.toString(),
      nome: tenant.nome,
      status: tenant.status,
      labelArea: tenant.labelArea,
      diaCorteConsolidacao: tenant.diaCorteConsolidacao,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
      deletedAt: tenant.deletedAt,
    }
  }

  static toPrismaUpdate(tenant: Tenant): Prisma.TenantUncheckedUpdateInput {
    return {
      nome: tenant.nome,
      status: tenant.status,
      labelArea: tenant.labelArea,
      diaCorteConsolidacao: tenant.diaCorteConsolidacao,
      updatedAt: tenant.updatedAt,
      deletedAt: tenant.deletedAt,
    }
  }
}
