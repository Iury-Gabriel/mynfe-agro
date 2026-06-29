import type { NotaFiscalEventoTipo } from '@/domain/enterprise/entities/nota-fiscal-evento'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { NotaFiscalEvento } from '@/domain/enterprise/entities/nota-fiscal-evento'

export interface MakeNotaFiscalEventoOverrides {
  id?: string
  tenantId?: string
  notaFiscalId?: string
  tipo?: NotaFiscalEventoTipo
  payload?: Record<string, unknown>
  data?: Date
  createdAt?: Date
}

export function makeNotaFiscalEvento(
  overrides: MakeNotaFiscalEventoOverrides = {},
): NotaFiscalEvento {
  const data = overrides.data ?? new Date('2024-01-01')

  return NotaFiscalEvento.create(
    {
      tenantId: overrides.tenantId ?? 'tenant-1',
      notaFiscalId: overrides.notaFiscalId ?? 'nota-1',
      tipo: overrides.tipo ?? 'emissao',
      payload: overrides.payload ?? {},
      data,
      createdAt: overrides.createdAt ?? data,
    },
    new UniqueEntityID(overrides.id ?? 'nota-evento-1'),
  )
}
