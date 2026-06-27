import type { TenantStatus } from '@/domain/enterprise/entities/tenant'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Tenant } from '@/domain/enterprise/entities/tenant'

export interface MakeTenantOverrides {
  id?: string
  nome?: string
  status?: TenantStatus
  labelArea?: string
  diaCorteConsolidacao?: number | null
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}

export function makeTenant(overrides: MakeTenantOverrides = {}): Tenant {
  return Tenant.create(
    {
      nome: overrides.nome ?? 'Fazenda Teste',
      status: overrides.status ?? 'ativo',
      labelArea: overrides.labelArea ?? 'Talhão',
      diaCorteConsolidacao: overrides.diaCorteConsolidacao ?? null,
      createdAt: overrides.createdAt ?? new Date('2024-01-01'),
      updatedAt: overrides.updatedAt ?? new Date('2024-01-01'),
      deletedAt: overrides.deletedAt ?? null,
    },
    new UniqueEntityID(overrides.id ?? 'tenant-1'),
  )
}
