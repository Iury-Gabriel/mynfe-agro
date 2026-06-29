import type { Prisma, Safra as PrismaSafra } from '@prisma/client'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Safra, type SafraStatus } from '@/domain/enterprise/entities/safra'

function decimalToNumber(raw: Prisma.Decimal | null): number | null {
  return raw === null ? null : raw.toNumber()
}

export class PrismaSafraMapper {
  static toDomain(raw: PrismaSafra): Safra {
    return Safra.create(
      {
        tenantId: raw.tenantId,
        areaId: raw.areaId,
        cultura: raw.cultura,
        variedade: raw.variedade,
        dataPlantio: raw.dataPlantio,
        dataColheitaPrevista: raw.dataColheitaPrevista,
        dataColheitaRealizada: raw.dataColheitaRealizada,
        estimativaProducao: decimalToNumber(raw.estimativaProducao),
        status: raw.status as SafraStatus,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        deletedAt: raw.deletedAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrismaCreate(safra: Safra): Prisma.SafraUncheckedCreateInput {
    return {
      id: safra.id.toString(),
      tenantId: safra.tenantId,
      areaId: safra.areaId,
      cultura: safra.cultura,
      variedade: safra.variedade,
      dataPlantio: safra.dataPlantio,
      dataColheitaPrevista: safra.dataColheitaPrevista,
      dataColheitaRealizada: safra.dataColheitaRealizada,
      estimativaProducao: safra.estimativaProducao,
      status: safra.status,
      createdAt: safra.createdAt,
      updatedAt: safra.updatedAt,
      deletedAt: safra.deletedAt,
    }
  }

  static toPrismaUpdate(safra: Safra): Prisma.SafraUncheckedUpdateInput {
    return {
      areaId: safra.areaId,
      cultura: safra.cultura,
      variedade: safra.variedade,
      dataPlantio: safra.dataPlantio,
      dataColheitaPrevista: safra.dataColheitaPrevista,
      dataColheitaRealizada: safra.dataColheitaRealizada,
      estimativaProducao: safra.estimativaProducao,
      status: safra.status,
      updatedAt: safra.updatedAt,
      deletedAt: safra.deletedAt,
    }
  }
}
