import type {
  EstoqueMovimentoOrigem,
  EstoqueMovimentoTipo,
} from '@/domain/enterprise/entities/estoque-movimento'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { EstoqueMovimento } from '@/domain/enterprise/entities/estoque-movimento'

export interface MakeEstoqueMovimentoOverrides {
  id?: string
  tenantId?: string
  empresaId?: string
  produtoId?: string
  loteId?: string | null
  tipo?: EstoqueMovimentoTipo
  origem?: EstoqueMovimentoOrigem
  referenciaId?: string | null
  quantidade?: number
  data?: Date
  usuarioId?: string | null
  motivo?: string | null
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}

export function makeEstoqueMovimento(
  overrides: MakeEstoqueMovimentoOverrides = {},
): EstoqueMovimento {
  return EstoqueMovimento.create(
    {
      tenantId: overrides.tenantId ?? 'tenant-1',
      empresaId: overrides.empresaId ?? 'empresa-1',
      produtoId: overrides.produtoId ?? 'produto-1',
      loteId: overrides.loteId ?? null,
      tipo: overrides.tipo ?? 'entrada',
      origem: overrides.origem ?? 'colheita',
      referenciaId: overrides.referenciaId ?? null,
      quantidade: overrides.quantidade ?? 1000,
      data: overrides.data ?? new Date('2024-10-01'),
      usuarioId: overrides.usuarioId ?? null,
      motivo: overrides.motivo ?? null,
      createdAt: overrides.createdAt ?? new Date('2024-01-01'),
      updatedAt: overrides.updatedAt ?? new Date('2024-01-01'),
      deletedAt: overrides.deletedAt ?? null,
    },
    new UniqueEntityID(overrides.id ?? 'movimento-1'),
  )
}
