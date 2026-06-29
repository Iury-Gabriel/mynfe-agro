import type { AuditoriaAcao } from '@/domain/enterprise/entities/auditoria-log'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { AuditoriaLog } from '@/domain/enterprise/entities/auditoria-log'

export interface MakeAuditoriaLogOverrides {
  id?: string
  tenantId?: string
  usuarioId?: string | null
  entidade?: string
  entidadeId?: string
  acao?: AuditoriaAcao
  dadosAntes?: Record<string, unknown> | null
  dadosDepois?: Record<string, unknown> | null
  data?: Date
}

export function makeAuditoriaLog(overrides: MakeAuditoriaLogOverrides = {}): AuditoriaLog {
  return AuditoriaLog.create(
    {
      tenantId: overrides.tenantId ?? 'tenant-1',
      usuarioId: 'usuarioId' in overrides ? (overrides.usuarioId ?? null) : 'user-1',
      entidade: overrides.entidade ?? 'tenant',
      entidadeId: overrides.entidadeId ?? 'tenant-1',
      acao: overrides.acao ?? 'editar',
      dadosAntes: overrides.dadosAntes ?? null,
      dadosDepois: overrides.dadosDepois ?? null,
      data: overrides.data ?? new Date('2024-01-01'),
    },
    new UniqueEntityID(overrides.id ?? 'log-1'),
  )
}
