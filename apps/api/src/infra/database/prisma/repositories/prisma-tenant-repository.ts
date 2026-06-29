import { Injectable } from '@nestjs/common'

import { PrismaTenantMapper } from '../mappers/admin/prisma-tenant-mapper'
import { PrismaService } from '../prisma.service'

import type { Tenant } from '@/domain/enterprise/entities/tenant'

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
}
