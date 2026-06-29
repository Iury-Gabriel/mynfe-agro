import { PrismaPedidoItemMapper } from './prisma-pedido-item-mapper'

import type {
  Prisma,
  Pedido as PrismaPedido,
  PedidoItem as PrismaPedidoItem,
} from '@prisma/client'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Pedido, type PedidoStatus, type PedidoTipo } from '@/domain/enterprise/entities/pedido'

type PrismaPedidoWithItens = PrismaPedido & { itens: PrismaPedidoItem[] }

export class PrismaPedidoMapper {
  static toDomain(raw: PrismaPedidoWithItens): Pedido {
    return Pedido.create(
      {
        tenantId: raw.tenantId,
        empresaFaturadoraId: raw.empresaFaturadoraId,
        clienteId: raw.clienteId,
        numero: raw.numero,
        tipo: raw.tipo as PedidoTipo,
        status: raw.status as PedidoStatus,
        valorTotal: raw.valorTotal.toNumber(),
        periodoConsolidacao: raw.periodoConsolidacao,
        data: raw.data,
        observacoes: raw.observacoes,
        itens: raw.itens.map((item) => PrismaPedidoItemMapper.toDomain(item)),
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        deletedAt: raw.deletedAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrismaCreate(pedido: Pedido): Prisma.PedidoUncheckedCreateInput {
    return {
      id: pedido.id.toString(),
      tenantId: pedido.tenantId,
      empresaFaturadoraId: pedido.empresaFaturadoraId,
      clienteId: pedido.clienteId,
      numero: pedido.numero,
      tipo: pedido.tipo,
      status: pedido.status,
      valorTotal: pedido.valorTotal,
      periodoConsolidacao: pedido.periodoConsolidacao,
      data: pedido.data,
      observacoes: pedido.observacoes,
      createdAt: pedido.createdAt,
      updatedAt: pedido.updatedAt,
      deletedAt: pedido.deletedAt,
      itens: {
        create: pedido.itens.map((item) => PrismaPedidoItemMapper.toPrismaCreateNested(item)),
      },
    }
  }

  static toPrismaUpdate(pedido: Pedido): Prisma.PedidoUncheckedUpdateInput {
    return {
      status: pedido.status,
      tipo: pedido.tipo,
      valorTotal: pedido.valorTotal,
      periodoConsolidacao: pedido.periodoConsolidacao,
      observacoes: pedido.observacoes,
      updatedAt: pedido.updatedAt,
      deletedAt: pedido.deletedAt,
    }
  }
}
