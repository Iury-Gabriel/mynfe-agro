import { Prisma, type Area as PrismaArea } from '@prisma/client'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Area } from '@/domain/enterprise/entities/area'

function decimalToNumber(raw: Prisma.Decimal | null): number | null {
  return raw === null ? null : raw.toNumber()
}

function toDomainGeometria(raw: Prisma.JsonValue): Record<string, unknown> | null {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null
  return raw
}

function toPrismaGeometria(
  geometria: Record<string, unknown> | null,
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return geometria === null ? Prisma.JsonNull : (geometria as Prisma.InputJsonValue)
}

export class PrismaAreaMapper {
  static toDomain(raw: PrismaArea): Area {
    return Area.create(
      {
        tenantId: raw.tenantId,
        fazendaId: raw.fazendaId,
        identificacao: raw.identificacao,
        tamanho: decimalToNumber(raw.tamanho),
        unidadeTamanho: raw.unidadeTamanho,
        rotulo: raw.rotulo,
        geometria: toDomainGeometria(raw.geometria),
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        deletedAt: raw.deletedAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrismaCreate(area: Area): Prisma.AreaUncheckedCreateInput {
    return {
      id: area.id.toString(),
      tenantId: area.tenantId,
      fazendaId: area.fazendaId,
      identificacao: area.identificacao,
      tamanho: area.tamanho,
      unidadeTamanho: area.unidadeTamanho,
      rotulo: area.rotulo,
      geometria: toPrismaGeometria(area.geometria),
      createdAt: area.createdAt,
      updatedAt: area.updatedAt,
      deletedAt: area.deletedAt,
    }
  }

  static toPrismaUpdate(area: Area): Prisma.AreaUncheckedUpdateInput {
    return {
      identificacao: area.identificacao,
      tamanho: area.tamanho,
      unidadeTamanho: area.unidadeTamanho,
      rotulo: area.rotulo,
      geometria: toPrismaGeometria(area.geometria),
      updatedAt: area.updatedAt,
      deletedAt: area.deletedAt,
    }
  }
}
