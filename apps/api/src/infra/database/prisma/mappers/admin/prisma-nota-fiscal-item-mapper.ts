import type { Prisma, NotaFiscalItem as PrismaNotaFiscalItem } from '@prisma/client'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { NotaFiscalItem } from '@/domain/enterprise/entities/nota-fiscal-item'

function toDomainJson(raw: Prisma.JsonValue): Record<string, unknown> {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return {}
  return raw
}

export class PrismaNotaFiscalItemMapper {
  static toDomain(raw: PrismaNotaFiscalItem): NotaFiscalItem {
    return NotaFiscalItem.create(
      {
        tenantId: raw.tenantId,
        notaFiscalId: raw.notaFiscalId,
        produtoId: raw.produtoId,
        descricao: raw.descricao,
        ncm: raw.ncm,
        cfop: raw.cfop,
        cstCsosn: raw.cstCsosn,
        quantidade: raw.quantidade.toNumber(),
        valorUnitario: raw.valorUnitario.toNumber(),
        valorTotal: raw.valorTotal.toNumber(),
        impostos: toDomainJson(raw.impostos),
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrismaCreate(item: NotaFiscalItem): Prisma.NotaFiscalItemUncheckedCreateInput {
    return {
      id: item.id.toString(),
      tenantId: item.tenantId,
      notaFiscalId: item.notaFiscalId,
      produtoId: item.produtoId,
      descricao: item.descricao,
      ncm: item.ncm,
      cfop: item.cfop,
      cstCsosn: item.cstCsosn,
      quantidade: item.quantidade,
      valorUnitario: item.valorUnitario,
      valorTotal: item.valorTotal,
      impostos: item.impostos as Prisma.InputJsonValue,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }
  }

  static toPrismaCreateNested(
    item: NotaFiscalItem,
  ): Prisma.NotaFiscalItemUncheckedCreateWithoutNotaFiscalInput {
    return {
      id: item.id.toString(),
      tenantId: item.tenantId,
      produtoId: item.produtoId,
      descricao: item.descricao,
      ncm: item.ncm,
      cfop: item.cfop,
      cstCsosn: item.cstCsosn,
      quantidade: item.quantidade,
      valorUnitario: item.valorUnitario,
      valorTotal: item.valorTotal,
      impostos: item.impostos as Prisma.InputJsonValue,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }
  }
}
