import { Global, Module } from '@nestjs/common'

import { PrismaService } from './prisma/prisma.service'
import { PrismaAreaRepository } from './prisma/repositories/prisma-area-repository'
import { PrismaAtividadeCampoRepository } from './prisma/repositories/prisma-atividade-campo-repository'
import { PrismaClienteRepository } from './prisma/repositories/prisma-cliente-repository'
import { PrismaCustoProducaoRepository } from './prisma/repositories/prisma-custo-producao-repository'
import { PrismaEmpresaRepository } from './prisma/repositories/prisma-empresa-repository'
import { PrismaFazendaRepository } from './prisma/repositories/prisma-fazenda-repository'
import { PrismaProdutoRepository } from './prisma/repositories/prisma-produto-repository'
import { PrismaRoleRepository } from './prisma/repositories/prisma-role-repository'
import { PrismaSafraRepository } from './prisma/repositories/prisma-safra-repository'
import { PrismaTabelaPrecoClienteRepository } from './prisma/repositories/prisma-tabela-preco-cliente-repository'
import { PrismaTenantRepository } from './prisma/repositories/prisma-tenant-repository'
import { PrismaUserRepository } from './prisma/repositories/prisma-user-repository'
import { PrismaUserRoleAssignmentRepository } from './prisma/repositories/prisma-user-role-assignment-repository'

import { AreaRepository } from '@/domain/application/repositories/area-repository'
import { AtividadeCampoRepository } from '@/domain/application/repositories/atividade-campo-repository'
import { ClienteRepository } from '@/domain/application/repositories/cliente-repository'
import { CustoProducaoRepository } from '@/domain/application/repositories/custo-producao-repository'
import { EmpresaRepository } from '@/domain/application/repositories/empresa-repository'
import { FazendaRepository } from '@/domain/application/repositories/fazenda-repository'
import { ProdutoRepository } from '@/domain/application/repositories/produto-repository'
import { RoleRepository } from '@/domain/application/repositories/role-repository'
import { SafraRepository } from '@/domain/application/repositories/safra-repository'
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
    { provide: SafraRepository, useClass: PrismaSafraRepository },
    { provide: AtividadeCampoRepository, useClass: PrismaAtividadeCampoRepository },
    { provide: CustoProducaoRepository, useClass: PrismaCustoProducaoRepository },
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
    SafraRepository,
    AtividadeCampoRepository,
    CustoProducaoRepository,
  ],
})
export class DatabaseModule {}
