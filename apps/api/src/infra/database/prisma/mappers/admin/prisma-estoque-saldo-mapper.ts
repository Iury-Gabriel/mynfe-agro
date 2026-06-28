import type { Prisma, EstoqueSaldo as PrismaEstoqueSaldo } from '@prisma/client'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { EstoqueSaldo } from '@/domain/enterprise/entities/estoque-saldo'

export class PrismaEstoqueSaldoMapper {
  static toDomain(raw: PrismaEstoqueSaldo): EstoqueSaldo {
    return EstoqueSaldo.create(
      {
        tenantId: raw.tenantId,
        empresaId: raw.empresaId,
        produtoId: raw.produtoId,
        loteId: raw.loteId,
        quantidadeDisponivel: raw.quantidadeDisponivel.toNumber(),
        quantidadeReservada: raw.quantidadeReservada.toNumber(),
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrismaCreate(saldo: EstoqueSaldo): Prisma.EstoqueSaldoUncheckedCreateInput {
    return {
      id: saldo.id.toString(),
      tenantId: saldo.tenantId,
      empresaId: saldo.empresaId,
      produtoId: saldo.produtoId,
      loteId: saldo.loteId,
      quantidadeDisponivel: saldo.quantidadeDisponivel,
      quantidadeReservada: saldo.quantidadeReservada,
      createdAt: saldo.createdAt,
      updatedAt: saldo.updatedAt,
    }
  }

  static toPrismaUpdate(saldo: EstoqueSaldo): Prisma.EstoqueSaldoUncheckedUpdateInput {
    return {
      quantidadeDisponivel: saldo.quantidadeDisponivel,
      quantidadeReservada: saldo.quantidadeReservada,
      updatedAt: saldo.updatedAt,
    }
  }
}
