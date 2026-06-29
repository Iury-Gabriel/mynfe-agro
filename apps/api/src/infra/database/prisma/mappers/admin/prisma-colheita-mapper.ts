import type { Prisma, Colheita as PrismaColheita } from '@prisma/client'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Colheita } from '@/domain/enterprise/entities/colheita'

export class PrismaColheitaMapper {
  static toDomain(raw: PrismaColheita): Colheita {
    return Colheita.create(
      {
        tenantId: raw.tenantId,
        empresaId: raw.empresaId,
        produtoId: raw.produtoId,
        safraId: raw.safraId,
        areaId: raw.areaId,
        quantidade: raw.quantidade.toNumber(),
        data: raw.data,
        responsavelUsuarioId: raw.responsavelUsuarioId,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        deletedAt: raw.deletedAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrismaCreate(colheita: Colheita): Prisma.ColheitaUncheckedCreateInput {
    return {
      id: colheita.id.toString(),
      tenantId: colheita.tenantId,
      empresaId: colheita.empresaId,
      produtoId: colheita.produtoId,
      safraId: colheita.safraId,
      areaId: colheita.areaId,
      quantidade: colheita.quantidade,
      data: colheita.data,
      responsavelUsuarioId: colheita.responsavelUsuarioId,
      createdAt: colheita.createdAt,
      updatedAt: colheita.updatedAt,
      deletedAt: colheita.deletedAt,
    }
  }
}
