import { Prisma, type AuditoriaLog as PrismaAuditoriaLog } from '@prisma/client'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { AuditoriaLog, type AuditoriaAcao } from '@/domain/enterprise/entities/auditoria-log'

function toJsonRecord(value: Prisma.JsonValue | null): Record<string, unknown> | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return null
  return value
}

function toPrismaJson(
  value: Record<string, unknown> | null,
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return value === null ? Prisma.JsonNull : (value as Prisma.InputJsonValue)
}

export class PrismaAuditoriaLogMapper {
  static toDomain(raw: PrismaAuditoriaLog): AuditoriaLog {
    return AuditoriaLog.create(
      {
        tenantId: raw.tenantId,
        usuarioId: raw.usuarioId,
        entidade: raw.entidade,
        entidadeId: raw.entidadeId,
        acao: raw.acao as AuditoriaAcao,
        dadosAntes: toJsonRecord(raw.dadosAntes),
        dadosDepois: toJsonRecord(raw.dadosDepois),
        data: raw.data,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrismaCreate(log: AuditoriaLog): Prisma.AuditoriaLogUncheckedCreateInput {
    return {
      id: log.id.toString(),
      tenantId: log.tenantId,
      usuarioId: log.usuarioId,
      entidade: log.entidade,
      entidadeId: log.entidadeId,
      acao: log.acao,
      dadosAntes: toPrismaJson(log.dadosAntes),
      dadosDepois: toPrismaJson(log.dadosDepois),
      data: log.data,
    }
  }
}
