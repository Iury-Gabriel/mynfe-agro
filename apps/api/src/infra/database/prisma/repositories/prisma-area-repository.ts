import { Injectable } from '@nestjs/common'

import { PrismaAreaMapper } from '../mappers/admin/prisma-area-mapper'
import { PrismaService } from '../prisma.service'

import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { Area } from '@/domain/enterprise/entities/area'

import { normalizePagination } from '@/core/repositories/pagination-params'
import { AreaRepository } from '@/domain/application/repositories/area-repository'

@Injectable()
export class PrismaAreaRepository extends AreaRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findById(id: string, tenantId: string): Promise<Area | null> {
    const raw = await this.prisma.area.findFirst({
      where: { id, tenantId, deletedAt: null },
    })
    return raw ? PrismaAreaMapper.toDomain(raw) : null
  }

  async findManyByTenant(tenantId: string, params: PaginationParams): Promise<Area[]> {
    const { page, perPage } = normalizePagination(params)

    const raws = await this.prisma.area.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { id: 'desc' },
      take: perPage,
      skip: (page - 1) * perPage,
    })

    return raws.map((raw) => PrismaAreaMapper.toDomain(raw))
  }

  async count(tenantId: string): Promise<number> {
    return this.prisma.area.count({ where: { tenantId, deletedAt: null } })
  }

  async create(area: Area): Promise<void> {
    await this.prisma.area.create({
      data: PrismaAreaMapper.toPrismaCreate(area),
    })
  }

  async save(area: Area): Promise<void> {
    await this.prisma.area.update({
      where: { id: area.id.toString() },
      data: PrismaAreaMapper.toPrismaUpdate(area),
    })
  }
}
