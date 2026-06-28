import type { Prisma, ProdutoFichaTecnica as PrismaProdutoFichaTecnica } from '@prisma/client'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ProdutoFichaTecnica } from '@/domain/enterprise/entities/produto-ficha-tecnica'

function decimalToNumber(raw: Prisma.Decimal | null): number | null {
  return raw === null ? null : raw.toNumber()
}

export class PrismaProdutoFichaTecnicaMapper {
  static toDomain(raw: PrismaProdutoFichaTecnica): ProdutoFichaTecnica {
    return ProdutoFichaTecnica.create(
      {
        tenantId: raw.tenantId,
        produtoId: raw.produtoId,
        descricaoComponente: raw.descricaoComponente,
        quantidadeReferencia: decimalToNumber(raw.quantidadeReferencia),
        observacoes: raw.observacoes,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        deletedAt: raw.deletedAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrismaCreate(
    fichaTecnica: ProdutoFichaTecnica,
  ): Prisma.ProdutoFichaTecnicaUncheckedCreateInput {
    return {
      id: fichaTecnica.id.toString(),
      tenantId: fichaTecnica.tenantId,
      produtoId: fichaTecnica.produtoId,
      descricaoComponente: fichaTecnica.descricaoComponente,
      quantidadeReferencia: fichaTecnica.quantidadeReferencia,
      observacoes: fichaTecnica.observacoes,
      createdAt: fichaTecnica.createdAt,
      updatedAt: fichaTecnica.updatedAt,
      deletedAt: fichaTecnica.deletedAt,
    }
  }

  static toPrismaUpdate(
    fichaTecnica: ProdutoFichaTecnica,
  ): Prisma.ProdutoFichaTecnicaUncheckedUpdateInput {
    return {
      descricaoComponente: fichaTecnica.descricaoComponente,
      quantidadeReferencia: fichaTecnica.quantidadeReferencia,
      observacoes: fichaTecnica.observacoes,
      updatedAt: fichaTecnica.updatedAt,
      deletedAt: fichaTecnica.deletedAt,
    }
  }
}
