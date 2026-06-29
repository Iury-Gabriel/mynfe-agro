import type { Prisma, Lote as PrismaLote } from '@prisma/client'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Lote, type LoteOrigemTipo } from '@/domain/enterprise/entities/lote'

export class PrismaLoteMapper {
  static toDomain(raw: PrismaLote): Lote {
    return Lote.create(
      {
        tenantId: raw.tenantId,
        empresaId: raw.empresaId,
        produtoId: raw.produtoId,
        codigoLote: raw.codigoLote,
        origemTipo: raw.origemTipo as LoteOrigemTipo | null,
        colheitaId: raw.colheitaId,
        areaId: raw.areaId,
        quantidadeInicial: raw.quantidadeInicial.toNumber(),
        quantidadeAtual: raw.quantidadeAtual.toNumber(),
        validade: raw.validade,
        dataEntrada: raw.dataEntrada,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        deletedAt: raw.deletedAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrismaCreate(lote: Lote): Prisma.LoteUncheckedCreateInput {
    return {
      id: lote.id.toString(),
      tenantId: lote.tenantId,
      empresaId: lote.empresaId,
      produtoId: lote.produtoId,
      codigoLote: lote.codigoLote,
      origemTipo: lote.origemTipo,
      colheitaId: lote.colheitaId,
      areaId: lote.areaId,
      quantidadeInicial: lote.quantidadeInicial,
      quantidadeAtual: lote.quantidadeAtual,
      validade: lote.validade,
      dataEntrada: lote.dataEntrada,
      createdAt: lote.createdAt,
      updatedAt: lote.updatedAt,
      deletedAt: lote.deletedAt,
    }
  }

  static toPrismaUpdate(lote: Lote): Prisma.LoteUncheckedUpdateInput {
    return {
      codigoLote: lote.codigoLote,
      origemTipo: lote.origemTipo,
      colheitaId: lote.colheitaId,
      areaId: lote.areaId,
      quantidadeInicial: lote.quantidadeInicial,
      quantidadeAtual: lote.quantidadeAtual,
      validade: lote.validade,
      dataEntrada: lote.dataEntrada,
      updatedAt: lote.updatedAt,
      deletedAt: lote.deletedAt,
    }
  }
}
