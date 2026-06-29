import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Colheita } from '@/domain/enterprise/entities/colheita'

export interface MakeColheitaOverrides {
  id?: string
  tenantId?: string
  empresaId?: string
  produtoId?: string
  safraId?: string | null
  areaId?: string | null
  quantidade?: number
  data?: Date
  responsavelUsuarioId?: string | null
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}

export function makeColheita(overrides: MakeColheitaOverrides = {}): Colheita {
  return Colheita.create(
    {
      tenantId: overrides.tenantId ?? 'tenant-1',
      empresaId: overrides.empresaId ?? 'empresa-1',
      produtoId: overrides.produtoId ?? 'produto-1',
      safraId: overrides.safraId ?? null,
      areaId: overrides.areaId ?? null,
      quantidade: overrides.quantidade ?? 1000,
      data: overrides.data ?? new Date('2024-10-01'),
      responsavelUsuarioId: overrides.responsavelUsuarioId ?? null,
      createdAt: overrides.createdAt ?? new Date('2024-01-01'),
      updatedAt: overrides.updatedAt ?? new Date('2024-01-01'),
      deletedAt: overrides.deletedAt ?? null,
    },
    new UniqueEntityID(overrides.id ?? 'colheita-1'),
  )
}
