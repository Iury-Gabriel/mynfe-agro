import type { Prisma, RemessaItem as PrismaRemessaItem } from '@prisma/client'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { RemessaItem } from '@/domain/enterprise/entities/remessa-item'

export class PrismaRemessaItemMapper {
  static toDomain(raw: PrismaRemessaItem): RemessaItem {
    return RemessaItem.create(
      {
        tenantId: raw.tenantId,
        remessaId: raw.remessaId,
        produtoId: raw.produtoId,
        loteId: raw.loteId,
        quantidade: raw.quantidade.toNumber(),
        precoUnitario: raw.precoUnitario.toNumber(),
        valorTotal: raw.valorTotal.toNumber(),
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        deletedAt: raw.deletedAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrismaCreate(item: RemessaItem): Prisma.RemessaItemUncheckedCreateInput {
    return {
      id: item.id.toString(),
      tenantId: item.tenantId,
      remessaId: item.remessaId,
      produtoId: item.produtoId,
      loteId: item.loteId,
      quantidade: item.quantidade,
      precoUnitario: item.precoUnitario,
      valorTotal: item.valorTotal,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      deletedAt: item.deletedAt,
    }
  }

  static toPrismaCreateNested(item: RemessaItem): Prisma.RemessaItemUncheckedCreateWithoutRemessaInput {
    return {
      id: item.id.toString(),
      tenantId: item.tenantId,
      produtoId: item.produtoId,
      loteId: item.loteId,
      quantidade: item.quantidade,
      precoUnitario: item.precoUnitario,
      valorTotal: item.valorTotal,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      deletedAt: item.deletedAt,
    }
  }
}
