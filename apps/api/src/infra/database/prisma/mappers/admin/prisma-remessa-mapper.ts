import { PrismaRemessaItemMapper } from './prisma-remessa-item-mapper'

import type {
  Prisma,
  Remessa as PrismaRemessa,
  RemessaItem as PrismaRemessaItem,
} from '@prisma/client'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Remessa, type RemessaStatus } from '@/domain/enterprise/entities/remessa'

type PrismaRemessaWithItens = PrismaRemessa & { itens: PrismaRemessaItem[] }

export class PrismaRemessaMapper {
  static toDomain(raw: PrismaRemessaWithItens): Remessa {
    return Remessa.create(
      {
        tenantId: raw.tenantId,
        empresaFaturadoraId: raw.empresaFaturadoraId,
        clienteId: raw.clienteId,
        numero: raw.numero,
        status: raw.status as RemessaStatus,
        pedidoConsolidadoId: raw.pedidoConsolidadoId,
        valorEstimado: raw.valorEstimado.toNumber(),
        data: raw.data,
        observacoes: raw.observacoes,
        itens: raw.itens.map((item) => PrismaRemessaItemMapper.toDomain(item)),
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        deletedAt: raw.deletedAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrismaCreate(remessa: Remessa): Prisma.RemessaUncheckedCreateInput {
    return {
      id: remessa.id.toString(),
      tenantId: remessa.tenantId,
      empresaFaturadoraId: remessa.empresaFaturadoraId,
      clienteId: remessa.clienteId,
      numero: remessa.numero,
      status: remessa.status,
      pedidoConsolidadoId: remessa.pedidoConsolidadoId,
      valorEstimado: remessa.valorEstimado,
      data: remessa.data,
      observacoes: remessa.observacoes,
      createdAt: remessa.createdAt,
      updatedAt: remessa.updatedAt,
      deletedAt: remessa.deletedAt,
      itens: {
        create: remessa.itens.map((item) => PrismaRemessaItemMapper.toPrismaCreateNested(item)),
      },
    }
  }

  static toPrismaUpdate(remessa: Remessa): Prisma.RemessaUncheckedUpdateInput {
    return {
      status: remessa.status,
      pedidoConsolidadoId: remessa.pedidoConsolidadoId,
      valorEstimado: remessa.valorEstimado,
      observacoes: remessa.observacoes,
      updatedAt: remessa.updatedAt,
      deletedAt: remessa.deletedAt,
    }
  }
}
