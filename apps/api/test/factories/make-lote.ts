import type { LoteOrigemTipo } from '@/domain/enterprise/entities/lote'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Lote } from '@/domain/enterprise/entities/lote'

export interface MakeLoteOverrides {
  id?: string
  tenantId?: string
  empresaId?: string
  produtoId?: string
  codigoLote?: string
  origemTipo?: LoteOrigemTipo | null
  colheitaId?: string | null
  areaId?: string | null
  quantidadeInicial?: number
  quantidadeAtual?: number
  validade?: Date | null
  dataEntrada?: Date
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}

export function makeLote(overrides: MakeLoteOverrides = {}): Lote {
  return Lote.create(
    {
      tenantId: overrides.tenantId ?? 'tenant-1',
      empresaId: overrides.empresaId ?? 'empresa-1',
      produtoId: overrides.produtoId ?? 'produto-1',
      codigoLote: overrides.codigoLote ?? 'LOTE-001',
      origemTipo: overrides.origemTipo ?? 'colheita',
      colheitaId: overrides.colheitaId ?? null,
      areaId: overrides.areaId ?? null,
      quantidadeInicial: overrides.quantidadeInicial ?? 1000,
      quantidadeAtual: overrides.quantidadeAtual ?? 1000,
      validade: overrides.validade ?? null,
      dataEntrada: overrides.dataEntrada ?? new Date('2024-10-01'),
      createdAt: overrides.createdAt ?? new Date('2024-01-01'),
      updatedAt: overrides.updatedAt ?? new Date('2024-01-01'),
      deletedAt: overrides.deletedAt ?? null,
    },
    new UniqueEntityID(overrides.id ?? 'lote-1'),
  )
}
