import { Global, Module } from '@nestjs/common'

import { PrismaService } from './prisma/prisma.service'
import { PrismaAreaRepository } from './prisma/repositories/prisma-area-repository'
import { PrismaAtividadeCampoRepository } from './prisma/repositories/prisma-atividade-campo-repository'
import { PrismaAuditoriaLogRepository } from './prisma/repositories/prisma-auditoria-log-repository'
import { PrismaClienteRepository } from './prisma/repositories/prisma-cliente-repository'
import { PrismaColheitaRepository } from './prisma/repositories/prisma-colheita-repository'
import { PrismaCustoProducaoRepository } from './prisma/repositories/prisma-custo-producao-repository'
import { PrismaDashboardRepository } from './prisma/repositories/prisma-dashboard-repository'
import { PrismaEmpresaRepository } from './prisma/repositories/prisma-empresa-repository'
import { PrismaEstoqueMovimentoRepository } from './prisma/repositories/prisma-estoque-movimento-repository'
import { PrismaEstoqueSaldoRepository } from './prisma/repositories/prisma-estoque-saldo-repository'
import { PrismaEstoqueWriteRepository } from './prisma/repositories/prisma-estoque-write-repository'
import { PrismaFazendaRepository } from './prisma/repositories/prisma-fazenda-repository'
import { PrismaLoteRepository } from './prisma/repositories/prisma-lote-repository'
import { PrismaNotaFiscalRepository } from './prisma/repositories/prisma-nota-fiscal-repository'
import { PrismaPedidoRepository } from './prisma/repositories/prisma-pedido-repository'
import { PrismaProdutoFichaTecnicaRepository } from './prisma/repositories/prisma-produto-ficha-tecnica-repository'
import { PrismaProdutoRepository } from './prisma/repositories/prisma-produto-repository'
import { PrismaRemessaRepository } from './prisma/repositories/prisma-remessa-repository'
import { PrismaRoleRepository } from './prisma/repositories/prisma-role-repository'
import { PrismaSafraRepository } from './prisma/repositories/prisma-safra-repository'
import { PrismaTabelaPrecoClienteRepository } from './prisma/repositories/prisma-tabela-preco-cliente-repository'
import { PrismaTenantOnboardingWriteRepository } from './prisma/repositories/prisma-tenant-onboarding-write-repository'
import { PrismaTenantRepository } from './prisma/repositories/prisma-tenant-repository'
import { PrismaUserRepository } from './prisma/repositories/prisma-user-repository'
import { PrismaUserRoleAssignmentRepository } from './prisma/repositories/prisma-user-role-assignment-repository'
import { PrismaVendaWriteRepository } from './prisma/repositories/prisma-venda-write-repository'

import { AreaRepository } from '@/domain/application/repositories/area-repository'
import { AtividadeCampoRepository } from '@/domain/application/repositories/atividade-campo-repository'
import { AuditoriaLogRepository } from '@/domain/application/repositories/auditoria-log-repository'
import { ClienteRepository } from '@/domain/application/repositories/cliente-repository'
import { ColheitaRepository } from '@/domain/application/repositories/colheita-repository'
import { CustoProducaoRepository } from '@/domain/application/repositories/custo-producao-repository'
import { DashboardRepository } from '@/domain/application/repositories/dashboard-repository'
import { EmpresaRepository } from '@/domain/application/repositories/empresa-repository'
import { EstoqueMovimentoRepository } from '@/domain/application/repositories/estoque-movimento-repository'
import { EstoqueSaldoRepository } from '@/domain/application/repositories/estoque-saldo-repository'
import { EstoqueWriteRepository } from '@/domain/application/repositories/estoque-write-repository'
import { FazendaRepository } from '@/domain/application/repositories/fazenda-repository'
import { LoteRepository } from '@/domain/application/repositories/lote-repository'
import { NotaFiscalRepository } from '@/domain/application/repositories/nota-fiscal-repository'
import { PedidoRepository } from '@/domain/application/repositories/pedido-repository'
import { ProdutoFichaTecnicaRepository } from '@/domain/application/repositories/produto-ficha-tecnica-repository'
import { ProdutoRepository } from '@/domain/application/repositories/produto-repository'
import { RemessaRepository } from '@/domain/application/repositories/remessa-repository'
import { RoleRepository } from '@/domain/application/repositories/role-repository'
import { SafraRepository } from '@/domain/application/repositories/safra-repository'
import { TabelaPrecoClienteRepository } from '@/domain/application/repositories/tabela-preco-cliente-repository'
import { TenantOnboardingWriteRepository } from '@/domain/application/repositories/tenant-onboarding-write-repository'
import { TenantRepository } from '@/domain/application/repositories/tenant-repository'
import { UserRepository } from '@/domain/application/repositories/user-repository'
import { UserRoleAssignmentRepository } from '@/domain/application/repositories/user-role-assignment-repository'
import { VendaWriteRepository } from '@/domain/application/repositories/venda-write-repository'

@Global()
@Module({
  providers: [
    PrismaService,
    { provide: RoleRepository, useClass: PrismaRoleRepository },
    { provide: UserRoleAssignmentRepository, useClass: PrismaUserRoleAssignmentRepository },
    { provide: UserRepository, useClass: PrismaUserRepository },
    { provide: EmpresaRepository, useClass: PrismaEmpresaRepository },
    { provide: TenantRepository, useClass: PrismaTenantRepository },
    {
      provide: TenantOnboardingWriteRepository,
      useClass: PrismaTenantOnboardingWriteRepository,
    },
    { provide: FazendaRepository, useClass: PrismaFazendaRepository },
    { provide: AreaRepository, useClass: PrismaAreaRepository },
    { provide: ClienteRepository, useClass: PrismaClienteRepository },
    { provide: ProdutoRepository, useClass: PrismaProdutoRepository },
    {
      provide: ProdutoFichaTecnicaRepository,
      useClass: PrismaProdutoFichaTecnicaRepository,
    },
    { provide: TabelaPrecoClienteRepository, useClass: PrismaTabelaPrecoClienteRepository },
    { provide: SafraRepository, useClass: PrismaSafraRepository },
    { provide: AtividadeCampoRepository, useClass: PrismaAtividadeCampoRepository },
    { provide: CustoProducaoRepository, useClass: PrismaCustoProducaoRepository },
    { provide: ColheitaRepository, useClass: PrismaColheitaRepository },
    { provide: LoteRepository, useClass: PrismaLoteRepository },
    { provide: EstoqueMovimentoRepository, useClass: PrismaEstoqueMovimentoRepository },
    { provide: EstoqueSaldoRepository, useClass: PrismaEstoqueSaldoRepository },
    { provide: EstoqueWriteRepository, useClass: PrismaEstoqueWriteRepository },
    { provide: PedidoRepository, useClass: PrismaPedidoRepository },
    { provide: RemessaRepository, useClass: PrismaRemessaRepository },
    { provide: VendaWriteRepository, useClass: PrismaVendaWriteRepository },
    { provide: NotaFiscalRepository, useClass: PrismaNotaFiscalRepository },
    { provide: DashboardRepository, useClass: PrismaDashboardRepository },
    { provide: AuditoriaLogRepository, useClass: PrismaAuditoriaLogRepository },
  ],
  exports: [
    PrismaService,
    RoleRepository,
    UserRoleAssignmentRepository,
    UserRepository,
    EmpresaRepository,
    TenantRepository,
    TenantOnboardingWriteRepository,
    FazendaRepository,
    AreaRepository,
    ClienteRepository,
    ProdutoRepository,
    ProdutoFichaTecnicaRepository,
    TabelaPrecoClienteRepository,
    SafraRepository,
    AtividadeCampoRepository,
    CustoProducaoRepository,
    ColheitaRepository,
    LoteRepository,
    EstoqueMovimentoRepository,
    EstoqueSaldoRepository,
    EstoqueWriteRepository,
    PedidoRepository,
    RemessaRepository,
    VendaWriteRepository,
    NotaFiscalRepository,
    DashboardRepository,
    AuditoriaLogRepository,
  ],
})
export class DatabaseModule {}
