import type { Prisma, CustoProducao as PrismaCustoProducao } from '@prisma/client'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { CustoProducao, type CustoProducaoTipo } from '@/domain/enterprise/entities/custo-producao'

export class PrismaCustoProducaoMapper {
  static toDomain(raw: PrismaCustoProducao): CustoProducao {
    return CustoProducao.create(
      {
        tenantId: raw.tenantId,
        safraId: raw.safraId,
        areaId: raw.areaId,
        tipo: raw.tipo as CustoProducaoTipo,
        descricao: raw.descricao,
        valor: raw.valor.toNumber(),
        data: raw.data,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        deletedAt: raw.deletedAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrismaCreate(custo: CustoProducao): Prisma.CustoProducaoUncheckedCreateInput {
    return {
      id: custo.id.toString(),
      tenantId: custo.tenantId,
      safraId: custo.safraId,
      areaId: custo.areaId,
      tipo: custo.tipo,
      descricao: custo.descricao,
      valor: custo.valor,
      data: custo.data,
      createdAt: custo.createdAt,
      updatedAt: custo.updatedAt,
      deletedAt: custo.deletedAt,
    }
  }

  static toPrismaUpdate(custo: CustoProducao): Prisma.CustoProducaoUncheckedUpdateInput {
    return {
      safraId: custo.safraId,
      areaId: custo.areaId,
      tipo: custo.tipo,
      descricao: custo.descricao,
      valor: custo.valor,
      data: custo.data,
      updatedAt: custo.updatedAt,
      deletedAt: custo.deletedAt,
    }
  }
}
