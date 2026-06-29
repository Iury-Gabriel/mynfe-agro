import type { SafraStatus } from '@/domain/enterprise/entities/safra'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Safra } from '@/domain/enterprise/entities/safra'

export interface MakeSafraOverrides {
  id?: string
  tenantId?: string
  areaId?: string
  cultura?: string
  variedade?: string | null
  dataPlantio?: Date | null
  dataColheitaPrevista?: Date | null
  dataColheitaRealizada?: Date | null
  estimativaProducao?: number | null
  status?: SafraStatus
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}

export function makeSafra(overrides: MakeSafraOverrides = {}): Safra {
  return Safra.create(
    {
      tenantId: overrides.tenantId ?? 'tenant-1',
      areaId: overrides.areaId ?? 'area-1',
      cultura: overrides.cultura ?? 'Soja',
      variedade: overrides.variedade ?? null,
      dataPlantio: overrides.dataPlantio ?? null,
      dataColheitaPrevista: overrides.dataColheitaPrevista ?? null,
      dataColheitaRealizada: overrides.dataColheitaRealizada ?? null,
      estimativaProducao: overrides.estimativaProducao ?? null,
      status: overrides.status ?? 'planejado',
      createdAt: overrides.createdAt ?? new Date('2024-01-01'),
      updatedAt: overrides.updatedAt ?? new Date('2024-01-01'),
      deletedAt: overrides.deletedAt ?? null,
    },
    new UniqueEntityID(overrides.id ?? 'safra-1'),
  )
}
