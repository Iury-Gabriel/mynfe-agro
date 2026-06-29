import { randomUUID } from 'node:crypto'

import { Injectable } from '@nestjs/common'

import { PrismaEmpresaMapper } from '../mappers/admin/prisma-empresa-mapper'
import { PrismaTenantMapper } from '../mappers/admin/prisma-tenant-mapper'
import { PrismaService } from '../prisma.service'

import type { ProvisionTenantArgs } from '@/domain/application/repositories/tenant-onboarding-write-repository'

import { TenantOnboardingWriteRepository } from '@/domain/application/repositories/tenant-onboarding-write-repository'

@Injectable()
export class PrismaTenantOnboardingWriteRepository extends TenantOnboardingWriteRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async provision(args: ProvisionTenantArgs): Promise<void> {
    const tenantId = args.tenant.id.toString()
    const roleId = randomUUID()
    const now = new Date()

    await this.prisma.$transaction(async (tx) => {
      await tx.tenant.create({ data: PrismaTenantMapper.toPrismaCreate(args.tenant) })

      await tx.user.update({
        where: { id: args.userId },
        data: { tenantId, isActive: true, emailVerified: true },
      })

      await tx.role.create({
        data: {
          id: roleId,
          name: args.roleName,
          isSystem: true,
          tenantId,
          createdAt: now,
          updatedAt: now,
        },
      })

      await tx.rolePermission.createMany({
        data: args.permissions.map((permission) => ({ roleId, permission })),
      })

      await tx.userRoleAssignment.create({
        data: { userId: args.userId, roleId },
      })

      await tx.empresa.create({ data: PrismaEmpresaMapper.toPrismaCreate(args.empresa) })

      await tx.usuarioEmpresa.create({
        data: { userId: args.userId, empresaId: args.empresa.id.toString() },
      })
    })
  }
}
