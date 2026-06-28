import { Injectable } from '@nestjs/common'

import { PrismaProdutoFichaTecnicaMapper } from '../mappers/admin/prisma-produto-ficha-tecnica-mapper'
import { PrismaService } from '../prisma.service'

import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { ProdutoFichaTecnica } from '@/domain/enterprise/entities/produto-ficha-tecnica'

import { normalizePagination } from '@/core/repositories/pagination-params'
import { ProdutoFichaTecnicaRepository } from '@/domain/application/repositories/produto-ficha-tecnica-repository'

@Injectable()
export class PrismaProdutoFichaTecnicaRepository extends ProdutoFichaTecnicaRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findById(id: string, tenantId: string): Promise<ProdutoFichaTecnica | null> {
    const raw = await this.prisma.produtoFichaTecnica.findFirst({
      where: { id, tenantId, deletedAt: null },
    })
    return raw ? PrismaProdutoFichaTecnicaMapper.toDomain(raw) : null
  }

  async findManyByProduto(
    tenantId: string,
    produtoId: string,
    params: PaginationParams,
  ): Promise<ProdutoFichaTecnica[]> {
    const { page, perPage } = normalizePagination(params)

    const raws = await this.prisma.produtoFichaTecnica.findMany({
      where: { tenantId, produtoId, deletedAt: null },
      orderBy: { id: 'desc' },
      take: perPage,
      skip: (page - 1) * perPage,
    })

    return raws.map((raw) => PrismaProdutoFichaTecnicaMapper.toDomain(raw))
  }

  async countByProduto(tenantId: string, produtoId: string): Promise<number> {
    return this.prisma.produtoFichaTecnica.count({
      where: { tenantId, produtoId, deletedAt: null },
    })
  }

  async create(fichaTecnica: ProdutoFichaTecnica): Promise<void> {
    await this.prisma.produtoFichaTecnica.create({
      data: PrismaProdutoFichaTecnicaMapper.toPrismaCreate(fichaTecnica),
    })
  }

  async save(fichaTecnica: ProdutoFichaTecnica): Promise<void> {
    await this.prisma.produtoFichaTecnica.update({
      where: { id: fichaTecnica.id.toString() },
      data: PrismaProdutoFichaTecnicaMapper.toPrismaUpdate(fichaTecnica),
    })
  }
}
