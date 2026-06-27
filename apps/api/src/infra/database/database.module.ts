import { Global, Module } from '@nestjs/common'

import { PrismaService } from './prisma/prisma.service'
import { PrismaAreaRepository } from './prisma/repositories/prisma-area-repository'
import { PrismaClienteRepository } from './prisma/repositories/prisma-cliente-repository'
import { PrismaEmpresaRepository } from './prisma/repositories/prisma-empresa-repository'
import { PrismaFazendaRepository } from './prisma/repositories/prisma-fazenda-repository'
import { PrismaProdutoRepository } from './prisma/repositories/prisma-produto-repository'
import { PrismaRoleRepository } from './prisma/repositories/prisma-role-repository'
import { PrismaTabelaPrecoClienteRepository } from './prisma/repositories/prisma-tabela-preco-cliente-repository'
import { PrismaTenantRepository } from './prisma/repositories/prisma-tenant-repository'
import { PrismaUserRepository } from './prisma/repositories/prisma-user-repository'
import { PrismaUserRoleAssignmentRepository } from './prisma/repositories/prisma-user-role-assignment-repository'

import { AreaRepository } from '@/domain/application/repositories/area-repository'
import { ClienteRepository } from '@/domain/application/repositories/cliente-repository'
import { EmpresaRepository } from '@/domain/application/repositories/empresa-repository'
import { FazendaRepository } from '@/domain/application/repositories/fazenda-repository'
import { ProdutoRepository } from '@/domain/application/repositories/produto-repository'
import { RoleRepository } from '@/domain/application/repositories/role-repository'
import { TabelaPrecoClienteRepository } from '@/domain/application/repositories/tabela-preco-cliente-repository'
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
    { provide: FazendaRepository, useClass: PrismaFazendaRepository },
    { provide: AreaRepository, useClass: PrismaAreaRepository },
    { provide: ClienteRepository, useClass: PrismaClienteRepository },
    { provide: ProdutoRepository, useClass: PrismaProdutoRepository },
    { provide: TabelaPrecoClienteRepository, useClass: PrismaTabelaPrecoClienteRepository },
  ],
  exports: [
    PrismaService,
    RoleRepository,
    UserRoleAssignmentRepository,
    UserRepository,
    EmpresaRepository,
    TenantRepository,
    FazendaRepository,
    AreaRepository,
    ClienteRepository,
    ProdutoRepository,
    TabelaPrecoClienteRepository,
  ],
})
export class DatabaseModule {}
