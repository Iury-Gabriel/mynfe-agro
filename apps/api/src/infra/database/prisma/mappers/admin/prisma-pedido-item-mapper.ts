import type { Prisma, PedidoItem as PrismaPedidoItem } from '@prisma/client'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { PedidoItem } from '@/domain/enterprise/entities/pedido-item'

export class PrismaPedidoItemMapper {
  static toDomain(raw: PrismaPedidoItem): PedidoItem {
    return PedidoItem.create(
      {
        tenantId: raw.tenantId,
        pedidoId: raw.pedidoId,
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

  static toPrismaCreate(item: PedidoItem): Prisma.PedidoItemUncheckedCreateInput {
    return {
      id: item.id.toString(),
      tenantId: item.tenantId,
      pedidoId: item.pedidoId,
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

  static toPrismaCreateNested(item: PedidoItem): Prisma.PedidoItemUncheckedCreateWithoutPedidoInput {
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
