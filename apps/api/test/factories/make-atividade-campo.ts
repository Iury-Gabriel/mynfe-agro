import type { AtividadeCampoTipo } from '@/domain/enterprise/entities/atividade-campo'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { AtividadeCampo } from '@/domain/enterprise/entities/atividade-campo'

export interface MakeAtividadeCampoOverrides {
  id?: string
  tenantId?: string
  safraId?: string | null
  areaId?: string | null
  tipo?: AtividadeCampoTipo
  data?: Date
  responsavelUsuarioId?: string | null
  observacoes?: string | null
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}

export function makeAtividadeCampo(overrides: MakeAtividadeCampoOverrides = {}): AtividadeCampo {
  return AtividadeCampo.create(
    {
      tenantId: overrides.tenantId ?? 'tenant-1',
      safraId: overrides.safraId ?? null,
      areaId: overrides.areaId ?? null,
      tipo: overrides.tipo ?? 'plantio',
      data: overrides.data ?? new Date('2024-10-01'),
      responsavelUsuarioId: overrides.responsavelUsuarioId ?? null,
      observacoes: overrides.observacoes ?? null,
      createdAt: overrides.createdAt ?? new Date('2024-01-01'),
      updatedAt: overrides.updatedAt ?? new Date('2024-01-01'),
      deletedAt: overrides.deletedAt ?? null,
    },
    new UniqueEntityID(overrides.id ?? 'atividade-1'),
  )
}
