import type { Prisma, TabelaPrecoCliente as PrismaTabelaPrecoCliente } from '@prisma/client'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { TabelaPrecoCliente } from '@/domain/enterprise/entities/tabela-preco-cliente'

export class PrismaTabelaPrecoClienteMapper {
  static toDomain(raw: PrismaTabelaPrecoCliente): TabelaPrecoCliente {
    return TabelaPrecoCliente.create(
      {
        tenantId: raw.tenantId,
        clienteId: raw.clienteId,
        produtoId: raw.produtoId,
        preco: raw.preco.toNumber(),
        vigenciaInicio: raw.vigenciaInicio,
        vigenciaFim: raw.vigenciaFim,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        deletedAt: raw.deletedAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrismaCreate(
    tabelaPreco: TabelaPrecoCliente,
  ): Prisma.TabelaPrecoClienteUncheckedCreateInput {
    return {
      id: tabelaPreco.id.toString(),
      tenantId: tabelaPreco.tenantId,
      clienteId: tabelaPreco.clienteId,
      produtoId: tabelaPreco.produtoId,
      preco: tabelaPreco.preco,
      vigenciaInicio: tabelaPreco.vigenciaInicio,
      vigenciaFim: tabelaPreco.vigenciaFim,
      createdAt: tabelaPreco.createdAt,
      updatedAt: tabelaPreco.updatedAt,
      deletedAt: tabelaPreco.deletedAt,
    }
  }

  static toPrismaUpdate(
    tabelaPreco: TabelaPrecoCliente,
  ): Prisma.TabelaPrecoClienteUncheckedUpdateInput {
    return {
      preco: tabelaPreco.preco,
      vigenciaInicio: tabelaPreco.vigenciaInicio,
      vigenciaFim: tabelaPreco.vigenciaFim,
      updatedAt: tabelaPreco.updatedAt,
      deletedAt: tabelaPreco.deletedAt,
    }
  }
}
