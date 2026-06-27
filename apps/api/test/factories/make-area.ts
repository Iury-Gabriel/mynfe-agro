import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Area } from '@/domain/enterprise/entities/area'

export interface MakeAreaOverrides {
  id?: string
  tenantId?: string
  fazendaId?: string
  identificacao?: string
  tamanho?: number | null
  unidadeTamanho?: string | null
  rotulo?: string | null
  geometria?: Record<string, unknown> | null
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}

export function makeArea(overrides: MakeAreaOverrides = {}): Area {
  return Area.create(
    {
      tenantId: overrides.tenantId ?? 'tenant-1',
      fazendaId: overrides.fazendaId ?? 'fazenda-1',
      identificacao: overrides.identificacao ?? 'Talhão 01',
      tamanho: overrides.tamanho ?? null,
      unidadeTamanho: overrides.unidadeTamanho ?? null,
      rotulo: overrides.rotulo ?? null,
      geometria: overrides.geometria ?? null,
      createdAt: overrides.createdAt ?? new Date('2024-01-01'),
      updatedAt: overrides.updatedAt ?? new Date('2024-01-01'),
      deletedAt: overrides.deletedAt ?? null,
    },
    new UniqueEntityID(overrides.id ?? 'area-1'),
  )
}
