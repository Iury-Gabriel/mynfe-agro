import { Injectable } from '@nestjs/common'

import { PrismaSafraMapper } from '../mappers/admin/prisma-safra-mapper'
import { PrismaService } from '../prisma.service'

import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { Safra } from '@/domain/enterprise/entities/safra'

import { normalizePagination } from '@/core/repositories/pagination-params'
import { SafraRepository } from '@/domain/application/repositories/safra-repository'

@Injectable()
export class PrismaSafraRepository extends SafraRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findById(id: string, tenantId: string): Promise<Safra | null> {
    const raw = await this.prisma.safra.findFirst({
      where: { id, tenantId, deletedAt: null },
    })
    return raw ? PrismaSafraMapper.toDomain(raw) : null
  }

  async findManyByTenant(tenantId: string, params: PaginationParams): Promise<Safra[]> {
    const { page, perPage } = normalizePagination(params)

    const raws = await this.prisma.safra.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { id: 'desc' },
      take: perPage,
      skip: (page - 1) * perPage,
    })

    return raws.map((raw) => PrismaSafraMapper.toDomain(raw))
  }

  async count(tenantId: string): Promise<number> {
    return this.prisma.safra.count({ where: { tenantId, deletedAt: null } })
  }

  async create(safra: Safra): Promise<void> {
    await this.prisma.safra.create({
      data: PrismaSafraMapper.toPrismaCreate(safra),
    })
  }

  async save(safra: Safra): Promise<void> {
    await this.prisma.safra.update({
      where: { id: safra.id.toString() },
      data: PrismaSafraMapper.toPrismaUpdate(safra),
    })
  }
}
