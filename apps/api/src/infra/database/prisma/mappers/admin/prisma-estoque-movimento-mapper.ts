import type { Prisma, EstoqueMovimento as PrismaEstoqueMovimento } from '@prisma/client'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  EstoqueMovimento,
  type EstoqueMovimentoOrigem,
  type EstoqueMovimentoTipo,
} from '@/domain/enterprise/entities/estoque-movimento'

export class PrismaEstoqueMovimentoMapper {
  static toDomain(raw: PrismaEstoqueMovimento): EstoqueMovimento {
    return EstoqueMovimento.create(
      {
        tenantId: raw.tenantId,
        empresaId: raw.empresaId,
        produtoId: raw.produtoId,
        loteId: raw.loteId,
        tipo: raw.tipo as EstoqueMovimentoTipo,
        origem: raw.origem as EstoqueMovimentoOrigem,
        referenciaId: raw.referenciaId,
        quantidade: raw.quantidade.toNumber(),
        data: raw.data,
        usuarioId: raw.usuarioId,
        motivo: raw.motivo,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        deletedAt: raw.deletedAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrismaCreate(
    movimento: EstoqueMovimento,
  ): Prisma.EstoqueMovimentoUncheckedCreateInput {
    return {
      id: movimento.id.toString(),
      tenantId: movimento.tenantId,
      empresaId: movimento.empresaId,
      produtoId: movimento.produtoId,
      loteId: movimento.loteId,
      tipo: movimento.tipo,
      origem: movimento.origem,
      referenciaId: movimento.referenciaId,
      quantidade: movimento.quantidade,
      data: movimento.data,
      usuarioId: movimento.usuarioId,
      motivo: movimento.motivo,
      createdAt: movimento.createdAt,
      updatedAt: movimento.updatedAt,
      deletedAt: movimento.deletedAt,
    }
  }
}
