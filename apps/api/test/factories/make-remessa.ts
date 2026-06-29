import type { RemessaItem } from '@/domain/enterprise/entities/remessa-item'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Remessa, type RemessaStatus } from '@/domain/enterprise/entities/remessa'

export interface MakeRemessaOverrides {
  id?: string
  tenantId?: string
  empresaFaturadoraId?: string
  clienteId?: string
  numero?: string
  status?: RemessaStatus
  pedidoConsolidadoId?: string | null
  valorEstimado?: number
  data?: Date
  observacoes?: string | null
  itens?: RemessaItem[]
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}

export function makeRemessa(overrides: MakeRemessaOverrides = {}): Remessa {
  return Remessa.create(
    {
      tenantId: overrides.tenantId ?? 'tenant-1',
      empresaFaturadoraId: overrides.empresaFaturadoraId ?? 'empresa-1',
      clienteId: overrides.clienteId ?? 'cliente-1',
      numero: overrides.numero ?? '000001',
      status: overrides.status ?? 'aberta',
      pedidoConsolidadoId: overrides.pedidoConsolidadoId ?? null,
      valorEstimado: overrides.valorEstimado ?? 0,
      data: overrides.data ?? new Date('2024-10-01'),
      observacoes: overrides.observacoes ?? null,
      itens: overrides.itens ?? [],
      createdAt: overrides.createdAt ?? new Date('2024-01-01'),
      updatedAt: overrides.updatedAt ?? new Date('2024-01-01'),
      deletedAt: overrides.deletedAt ?? null,
    },
    new UniqueEntityID(overrides.id ?? 'remessa-1'),
  )
}
