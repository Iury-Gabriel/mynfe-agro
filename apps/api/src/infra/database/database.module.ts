import { Global, Module } from '@nestjs/common'

import { PrismaService } from './prisma/prisma.service'
import { PrismaEmpresaRepository } from './prisma/repositories/prisma-empresa-repository'
import { PrismaRoleRepository } from './prisma/repositories/prisma-role-repository'
import { PrismaTenantRepository } from './prisma/repositories/prisma-tenant-repository'
import { PrismaUserRepository } from './prisma/repositories/prisma-user-repository'
import { PrismaUserRoleAssignmentRepository } from './prisma/repositories/prisma-user-role-assignment-repository'

import { EmpresaRepository } from '@/domain/application/repositories/empresa-repository'
import { RoleRepository } from '@/domain/application/repositories/role-repository'
import { TenantRepository } from '@/domain/application/repositories/tenant-repository'
import { UserRepository } from '@/domain/application/repositories/user-repository'
import { UserRoleAssignmentRepository } from '@/domain/application/repositories/user-role-assignment-repository'

@Global()
@Module({
  providers: [
    PrismaService,
    { provide: RoleRepository, useClass: PrismaRoleRepository },
    { provide: UserRoleAssignmentRepository, useClass: PrismaUserRoleAssignmentRepository },
    { provide: UserRepository, useClass: PrismaUserRepository },
    { provide: EmpresaRepository, useClass: PrismaEmpresaRepository },
    { provide: TenantRepository, useClass: PrismaTenantRepository },
  ],
  exports: [
    PrismaService,
    RoleRepository,
    UserRoleAssignmentRepository,
    UserRepository,
    EmpresaRepository,
    TenantRepository,
  ],
})
export class DatabaseModule {}
