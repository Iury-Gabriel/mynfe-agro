import { Injectable } from '@nestjs/common'

import { PrismaProdutoMapper } from '../mappers/admin/prisma-produto-mapper'
import { PrismaService } from '../prisma.service'

import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { Produto } from '@/domain/enterprise/entities/produto'

import { normalizePagination } from '@/core/repositories/pagination-params'
import { ProdutoRepository } from '@/domain/application/repositories/produto-repository'

@Injectable()
export class PrismaProdutoRepository extends ProdutoRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findById(id: string, tenantId: string): Promise<Produto | null> {
    const raw = await this.prisma.produto.findFirst({
      where: { id, tenantId, deletedAt: null },
    })
    return raw ? PrismaProdutoMapper.toDomain(raw) : null
  }

  async findManyByTenant(tenantId: string, params: PaginationParams): Promise<Produto[]> {
    const { page, perPage } = normalizePagination(params)

    const raws = await this.prisma.produto.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { id: 'desc' },
      take: perPage,
      skip: (page - 1) * perPage,
    })

    return raws.map((raw) => PrismaProdutoMapper.toDomain(raw))
  }

  async count(tenantId: string): Promise<number> {
    return this.prisma.produto.count({ where: { tenantId, deletedAt: null } })
  }

  async create(produto: Produto): Promise<void> {
    await this.prisma.produto.create({
      data: PrismaProdutoMapper.toPrismaCreate(produto),
    })
  }

  async save(produto: Produto): Promise<void> {
    await this.prisma.produto.update({
      where: { id: produto.id.toString() },
      data: PrismaProdutoMapper.toPrismaUpdate(produto),
    })
  }
}
