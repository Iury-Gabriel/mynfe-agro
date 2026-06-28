import type { Prisma, NotaFiscalEvento as PrismaNotaFiscalEvento } from '@prisma/client'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  NotaFiscalEvento,
  type NotaFiscalEventoTipo,
} from '@/domain/enterprise/entities/nota-fiscal-evento'

function toDomainJson(raw: Prisma.JsonValue): Record<string, unknown> {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return {}
  return raw
}

export class PrismaNotaFiscalEventoMapper {
  static toDomain(raw: PrismaNotaFiscalEvento): NotaFiscalEvento {
    return NotaFiscalEvento.create(
      {
        tenantId: raw.tenantId,
        notaFiscalId: raw.notaFiscalId,
        tipo: raw.tipo as NotaFiscalEventoTipo,
        payload: toDomainJson(raw.payload),
        data: raw.data,
        createdAt: raw.createdAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrismaCreate(evento: NotaFiscalEvento): Prisma.NotaFiscalEventoUncheckedCreateInput {
    return {
      id: evento.id.toString(),
      tenantId: evento.tenantId,
      notaFiscalId: evento.notaFiscalId,
      tipo: evento.tipo,
      payload: evento.payload as Prisma.InputJsonValue,
      data: evento.data,
      createdAt: evento.createdAt,
    }
  }

  static toPrismaCreateNested(
    evento: NotaFiscalEvento,
  ): Prisma.NotaFiscalEventoUncheckedCreateWithoutNotaFiscalInput {
    return {
      id: evento.id.toString(),
      tenantId: evento.tenantId,
      tipo: evento.tipo,
      payload: evento.payload as Prisma.InputJsonValue,
      data: evento.data,
      createdAt: evento.createdAt,
    }
  }
}
