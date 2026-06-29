import { Injectable } from '@nestjs/common'

import { PrismaEstoqueSaldoMapper } from '../mappers/admin/prisma-estoque-saldo-mapper'
import { PrismaService } from '../prisma.service'

import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { EstoqueSaldo } from '@/domain/enterprise/entities/estoque-saldo'

import { normalizePagination } from '@/core/repositories/pagination-params'
import { EstoqueSaldoRepository } from '@/domain/application/repositories/estoque-saldo-repository'

@Injectable()
export class PrismaEstoqueSaldoRepository extends EstoqueSaldoRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findByChave(
    tenantId: string,
    empresaId: string,
    produtoId: string,
    loteId: string | null,
  ): Promise<EstoqueSaldo | null> {
    const raw = await this.prisma.estoqueSaldo.findFirst({
      where: { tenantId, empresaId, produtoId, loteId },
    })
    return raw ? PrismaEstoqueSaldoMapper.toDomain(raw) : null
  }

  async findManyByEmpresa(
    tenantId: string,
    empresaId: string,
    params: PaginationParams,
  ): Promise<EstoqueSaldo[]> {
    const { page, perPage } = normalizePagination(params)

    const raws = await this.prisma.estoqueSaldo.findMany({
      where: { tenantId, empresaId },
      orderBy: { id: 'desc' },
      take: perPage,
      skip: (page - 1) * perPage,
    })

    return raws.map((raw) => PrismaEstoqueSaldoMapper.toDomain(raw))
  }

  async count(tenantId: string, empresaId: string): Promise<number> {
    return this.prisma.estoqueSaldo.count({ where: { tenantId, empresaId } })
  }
}
