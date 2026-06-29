import { Prisma, type Produto as PrismaProduto } from '@prisma/client'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Produto, type ProdutoStatus, type ProdutoTipo } from '@/domain/enterprise/entities/produto'

function decimalToNumber(raw: Prisma.Decimal | null): number | null {
  return raw === null ? null : raw.toNumber()
}

function toDomainAliquotas(raw: Prisma.JsonValue): Record<string, unknown> | null {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null
  return raw
}

function toPrismaAliquotas(
  aliquotas: Record<string, unknown> | null,
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return aliquotas === null ? Prisma.JsonNull : (aliquotas as Prisma.InputJsonValue)
}

export class PrismaProdutoMapper {
  static toDomain(raw: PrismaProduto): Produto {
    return Produto.create(
      {
        tenantId: raw.tenantId,
        empresaId: raw.empresaId,
        descricao: raw.descricao,
        tipo: raw.tipo as ProdutoTipo,
        unidadeMedida: raw.unidadeMedida,
        precoPadrao: decimalToNumber(raw.precoPadrao),
        ncm: raw.ncm,
        cest: raw.cest,
        cfopPadrao: raw.cfopPadrao,
        origemMercadoria: raw.origemMercadoria,
        cstCsosn: raw.cstCsosn,
        aliquotas: toDomainAliquotas(raw.aliquotas),
        status: raw.status as ProdutoStatus,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        deletedAt: raw.deletedAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrismaCreate(produto: Produto): Prisma.ProdutoUncheckedCreateInput {
    return {
      id: produto.id.toString(),
      tenantId: produto.tenantId,
      empresaId: produto.empresaId,
      descricao: produto.descricao,
      tipo: produto.tipo,
      unidadeMedida: produto.unidadeMedida,
      precoPadrao: produto.precoPadrao,
      ncm: produto.ncm,
      cest: produto.cest,
      cfopPadrao: produto.cfopPadrao,
      origemMercadoria: produto.origemMercadoria,
      cstCsosn: produto.cstCsosn,
      aliquotas: toPrismaAliquotas(produto.aliquotas),
      status: produto.status,
      createdAt: produto.createdAt,
      updatedAt: produto.updatedAt,
      deletedAt: produto.deletedAt,
    }
  }

  static toPrismaUpdate(produto: Produto): Prisma.ProdutoUncheckedUpdateInput {
    return {
      descricao: produto.descricao,
      tipo: produto.tipo,
      unidadeMedida: produto.unidadeMedida,
      precoPadrao: produto.precoPadrao,
      ncm: produto.ncm,
      cest: produto.cest,
      cfopPadrao: produto.cfopPadrao,
      origemMercadoria: produto.origemMercadoria,
      cstCsosn: produto.cstCsosn,
      aliquotas: toPrismaAliquotas(produto.aliquotas),
      status: produto.status,
      updatedAt: produto.updatedAt,
      deletedAt: produto.deletedAt,
    }
  }
}
