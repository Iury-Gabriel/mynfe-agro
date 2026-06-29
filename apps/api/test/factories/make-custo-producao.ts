import type { CustoProducaoTipo } from '@/domain/enterprise/entities/custo-producao'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { CustoProducao } from '@/domain/enterprise/entities/custo-producao'

export interface MakeCustoProducaoOverrides {
  id?: string
  tenantId?: string
  safraId?: string | null
  areaId?: string | null
  tipo?: CustoProducaoTipo
  descricao?: string
  valor?: number
  data?: Date
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}

export function makeCustoProducao(overrides: MakeCustoProducaoOverrides = {}): CustoProducao {
  return CustoProducao.create(
    {
      tenantId: overrides.tenantId ?? 'tenant-1',
      safraId: overrides.safraId ?? null,
      areaId: overrides.areaId ?? null,
      tipo: overrides.tipo ?? 'insumo',
      descricao: overrides.descricao ?? 'Adubo NPK',
      valor: overrides.valor ?? 5000,
      data: overrides.data ?? new Date('2024-10-01'),
      createdAt: overrides.createdAt ?? new Date('2024-01-01'),
      updatedAt: overrides.updatedAt ?? new Date('2024-01-01'),
      deletedAt: overrides.deletedAt ?? null,
    },
    new UniqueEntityID(overrides.id ?? 'custo-1'),
  )
}
