import { Injectable } from '@nestjs/common'

import { PrismaTenantMapper } from '../mappers/admin/prisma-tenant-mapper'
import { PrismaService } from '../prisma.service'

import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { TenantSummary } from '@/domain/application/repositories/tenant-repository'
import type { Tenant, TenantStatus } from '@/domain/enterprise/entities/tenant'

import { normalizePagination } from '@/core/repositories/pagination-params'
import { TenantRepository } from '@/domain/application/repositories/tenant-repository'

@Injectable()
export class PrismaTenantRepository extends TenantRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findById(id: string): Promise<Tenant | null> {
    const raw = await this.prisma.tenant.findFirst({
      where: { id, deletedAt: null },
    })
    return raw ? PrismaTenantMapper.toDomain(raw) : null
  }

  async create(tenant: Tenant): Promise<void> {
    await this.prisma.tenant.create({
      data: PrismaTenantMapper.toPrismaCreate(tenant),
    })
  }

  async save(tenant: Tenant): Promise<void> {
    await this.prisma.tenant.update({
      where: { id: tenant.id.toString() },
      data: PrismaTenantMapper.toPrismaUpdate(tenant),
    })
  }

  async findManyPaginated(params: PaginationParams): Promise<TenantSummary[]> {
    const { page, perPage } = normalizePagination(params)
    const raws = await this.prisma.tenant.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: perPage,
      skip: (page - 1) * perPage,
      include: {
        _count: { select: { empresas: true, usuarios: true } },
      },
    })

    return raws.map((raw) => ({
      tenant: PrismaTenantMapper.toDomain(raw),
      empresasCount: raw._count.empresas,
      usuariosCount: raw._count.usuarios,
    }))
  }

  async count(): Promise<number> {
    return this.prisma.tenant.count({ where: { deletedAt: null } })
  }

  async updateStatus(id: string, status: TenantStatus): Promise<void> {
    await this.prisma.tenant.update({
      where: { id },
      data: { status, updatedAt: new Date() },
    })
  }
}
