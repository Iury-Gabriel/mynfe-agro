import { Module } from '@nestjs/common'
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis'

import { AreasController } from './controllers/admin/areas.controller'
import { AtividadesCampoController } from './controllers/admin/atividades-campo.controller'
import { AuditoriaController } from './controllers/admin/auditoria.controller'
import { ColheitasController } from './controllers/admin/colheitas.controller'
import { ConsolidacaoController } from './controllers/admin/consolidacao.controller'
import { CustosProducaoController } from './controllers/admin/custos-producao.controller'
import { DashboardController } from './controllers/admin/dashboard.controller'
import { EmbalagensController } from './controllers/admin/embalagens.controller'
import { EmpresasController } from './controllers/admin/empresas.controller'
import { EstoqueController } from './controllers/admin/estoque.controller'
import { FazendasController } from './controllers/admin/fazendas.controller'
import { FilaFaturamentoController } from './controllers/admin/fila-faturamento.controller'
import { LotesController } from './controllers/admin/lotes.controller'
import { NotasFiscaisController } from './controllers/admin/notas-fiscais.controller'
import { PedidosController } from './controllers/admin/pedidos.controller'
import { ProdutosController } from './controllers/admin/produtos.controller'
import { RemessasController } from './controllers/admin/remessas.controller'
import { RolesController } from './controllers/admin/roles.controller'
import { SafrasController } from './controllers/admin/safras.controller'
import { TabelaPrecosController } from './controllers/admin/tabela-precos.controller'
import { TenantConfigController } from './controllers/admin/tenant-config.controller'
import { UsersController } from './controllers/admin/users.controller'
import { ClientesController } from './controllers/cliente/clientes.controller'
import { HealthController } from './controllers/health.controller'
import { AuthGuard } from './guards/auth.guard'
import { EmpresaAccessGuard } from './guards/empresa-access.guard'
import { PermissionGuard } from './guards/permission.guard'
import { SecurityAuditInterceptor } from './interceptors/security-audit.interceptor'
import { identityTracker, ipTracker } from './throttler/throttler-trackers'

import { FiscalProvider } from '@/domain/application/ports/fiscal-provider'
import { SetPasswordPort } from '@/domain/application/ports/set-password-port'
import { CreateAreaUseCase } from '@/domain/application/use-cases/areas/create-area-use-case'
import { DeleteAreaUseCase } from '@/domain/application/use-cases/areas/delete-area-use-case'
import { ListAreasUseCase } from '@/domain/application/use-cases/areas/list-areas-use-case'
import { UpdateAreaUseCase } from '@/domain/application/use-cases/areas/update-area-use-case'
import { CreateAtividadeCampoUseCase } from '@/domain/application/use-cases/atividades-campo/create-atividade-campo-use-case'
import { DeleteAtividadeCampoUseCase } from '@/domain/application/use-cases/atividades-campo/delete-atividade-campo-use-case'
import { ListAtividadesCampoUseCase } from '@/domain/application/use-cases/atividades-campo/list-atividades-campo-use-case'
import { ListAuditoriaLogsUseCase } from '@/domain/application/use-cases/auditoria/list-auditoria-logs-use-case'
import { RegistrarAuditoriaUseCase } from '@/domain/application/use-cases/auditoria/registrar-auditoria-use-case'
import { CreateClienteUseCase } from '@/domain/application/use-cases/clientes/create-cliente-use-case'
import { DeleteClienteUseCase } from '@/domain/application/use-cases/clientes/delete-cliente-use-case'
import { ListClientesUseCase } from '@/domain/application/use-cases/clientes/list-clientes-use-case'
import { UpdateClienteUseCase } from '@/domain/application/use-cases/clientes/update-cliente-use-case'
import { CreateCustoProducaoUseCase } from '@/domain/application/use-cases/custos-producao/create-custo-producao-use-case'
import { DeleteCustoProducaoUseCase } from '@/domain/application/use-cases/custos-producao/delete-custo-producao-use-case'
import { ListCustosProducaoUseCase } from '@/domain/application/use-cases/custos-producao/list-custos-producao-use-case'
import { GetDashboardResumoUseCase } from '@/domain/application/use-cases/dashboard/get-dashboard-resumo-use-case'
import { ActivateEmpresaUseCase } from '@/domain/application/use-cases/empresas/activate-empresa-use-case'
import { CreateEmpresaUseCase } from '@/domain/application/use-cases/empresas/create-empresa-use-case'
import { DeactivateEmpresaUseCase } from '@/domain/application/use-cases/empresas/deactivate-empresa-use-case'
import { ListEmpresasUseCase } from '@/domain/application/use-cases/empresas/list-empresas-use-case'
import { UpdateEmpresaUseCase } from '@/domain/application/use-cases/empresas/update-empresa-use-case'
import { AjustarEstoqueUseCase } from '@/domain/application/use-cases/estoque/ajustar-estoque-use-case'
import { GetLoteRastreabilidadeUseCase } from '@/domain/application/use-cases/estoque/get-lote-rastreabilidade-use-case'
import { GetPosicaoEstoqueUseCase } from '@/domain/application/use-cases/estoque/get-posicao-estoque-use-case'
import { ListColheitasUseCase } from '@/domain/application/use-cases/estoque/list-colheitas-use-case'
import { ListLotesUseCase } from '@/domain/application/use-cases/estoque/list-lotes-use-case'
import { ListMovimentacoesUseCase } from '@/domain/application/use-cases/estoque/list-movimentacoes-use-case'
import { RegistrarColheitaUseCase } from '@/domain/application/use-cases/estoque/registrar-colheita-use-case'
import { RegistrarEmbalagemUseCase } from '@/domain/application/use-cases/estoque/registrar-embalagem-use-case'
import { AtualizarStatusNotaFiscalUseCase } from '@/domain/application/use-cases/faturamento/atualizar-status-nota-fiscal-use-case'
import { CancelarNotaFiscalUseCase } from '@/domain/application/use-cases/faturamento/cancelar-nota-fiscal-use-case'
import { EmitirNotaFiscalUseCase } from '@/domain/application/use-cases/faturamento/emitir-nota-fiscal-use-case'
import { GetNotaFiscalUseCase } from '@/domain/application/use-cases/faturamento/get-nota-fiscal-use-case'
import { ListFilaFaturamentoUseCase } from '@/domain/application/use-cases/faturamento/list-fila-faturamento-use-case'
import { ListNotasFiscaisUseCase } from '@/domain/application/use-cases/faturamento/list-notas-fiscais-use-case'
import { CreateFazendaUseCase } from '@/domain/application/use-cases/fazendas/create-fazenda-use-case'
import { DeleteFazendaUseCase } from '@/domain/application/use-cases/fazendas/delete-fazenda-use-case'
import { ListFazendasUseCase } from '@/domain/application/use-cases/fazendas/list-fazendas-use-case'
import { UpdateFazendaUseCase } from '@/domain/application/use-cases/fazendas/update-fazenda-use-case'
import { CreateTabelaPrecoUseCase } from '@/domain/application/use-cases/precos/create-tabela-preco-use-case'
import { DeleteTabelaPrecoUseCase } from '@/domain/application/use-cases/precos/delete-tabela-preco-use-case'
import { ListTabelaPrecosUseCase } from '@/domain/application/use-cases/precos/list-tabela-precos-use-case'
import { ActivateProdutoUseCase } from '@/domain/application/use-cases/produtos/activate-produto-use-case'
import { CreateProdutoUseCase } from '@/domain/application/use-cases/produtos/create-produto-use-case'
import { DeactivateProdutoUseCase } from '@/domain/application/use-cases/produtos/deactivate-produto-use-case'
import { ListProdutosUseCase } from '@/domain/application/use-cases/produtos/list-produtos-use-case'
import { UpdateProdutoUseCase } from '@/domain/application/use-cases/produtos/update-produto-use-case'
import { CreateRoleUseCase } from '@/domain/application/use-cases/roles/create-role-use-case'
import { DeleteRoleUseCase } from '@/domain/application/use-cases/roles/delete-role-use-case'
import { ListRolesUseCase } from '@/domain/application/use-cases/roles/list-roles-use-case'
import { UpdateRoleUseCase } from '@/domain/application/use-cases/roles/update-role-use-case'
import { CreateSafraUseCase } from '@/domain/application/use-cases/safras/create-safra-use-case'
import { DeleteSafraUseCase } from '@/domain/application/use-cases/safras/delete-safra-use-case'
import { ListSafrasUseCase } from '@/domain/application/use-cases/safras/list-safras-use-case'
import { UpdateSafraUseCase } from '@/domain/application/use-cases/safras/update-safra-use-case'
import { GetTenantConfigUseCase } from '@/domain/application/use-cases/tenant-config/get-tenant-config-use-case'
import { UpdateTenantConfigUseCase } from '@/domain/application/use-cases/tenant-config/update-tenant-config-use-case'
import { CreateAdminUserUseCase } from '@/domain/application/use-cases/users/create-admin-user-use-case'
import { DeactivateUserUseCase } from '@/domain/application/use-cases/users/deactivate-user-use-case'
import { DeleteUserUseCase } from '@/domain/application/use-cases/users/delete-user-use-case'
import { ListUsersUseCase } from '@/domain/application/use-cases/users/list-users-use-case'
import { ReactivateUserUseCase } from '@/domain/application/use-cases/users/reactivate-user-use-case'
import { SetUserPasswordUseCase } from '@/domain/application/use-cases/users/set-user-password-use-case'
import { UpdateUserUseCase } from '@/domain/application/use-cases/users/update-user-use-case'
import { CancelarPedidoUseCase } from '@/domain/application/use-cases/vendas/cancelar-pedido-use-case'
import { CancelarRemessaUseCase } from '@/domain/application/use-cases/vendas/cancelar-remessa-use-case'
import { ConfirmarPedidoUseCase } from '@/domain/application/use-cases/vendas/confirmar-pedido-use-case'
import { ConsolidarRemessasUseCase } from '@/domain/application/use-cases/vendas/consolidar-remessas-use-case'
import { CriarPedidoUseCase } from '@/domain/application/use-cases/vendas/criar-pedido-use-case'
import { CriarRemessaUseCase } from '@/domain/application/use-cases/vendas/criar-remessa-use-case'
import { GetPedidoUseCase } from '@/domain/application/use-cases/vendas/get-pedido-use-case'
import { GetRemessaUseCase } from '@/domain/application/use-cases/vendas/get-remessa-use-case'
import { ListPedidosUseCase } from '@/domain/application/use-cases/vendas/list-pedidos-use-case'
import { ListRemessasUseCase } from '@/domain/application/use-cases/vendas/list-remessas-use-case'
import { MarcarRemessaEntregueUseCase } from '@/domain/application/use-cases/vendas/marcar-remessa-entregue-use-case'
import { PreviewConsolidacaoUseCase } from '@/domain/application/use-cases/vendas/preview-consolidacao-use-case'
import { BetterAuthSetPasswordAdapter } from '@/infra/auth/better-auth-set-password.adapter'
import { RedisService } from '@/infra/cache/redis/redis.service'
import { CryptographyModule } from '@/infra/cryptography/cryptography.module'
import { EnvService } from '@/infra/env/env.service'
import { PlugNotasFiscalProvider } from '@/infra/fiscal/plugnotas-fiscal-provider'

@Module({
  imports: [
    CryptographyModule,
    ThrottlerModule.forRootAsync({
      inject: [EnvService, RedisService],
      useFactory: (env: EnvService, redis: RedisService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: env.get('THROTTLE_TTL_SECONDS') * 1000,
            limit: env.get('THROTTLE_LIMIT'),
            getTracker: (req: Record<string, unknown>) => identityTracker(req),
          },
          {
            name: 'ip',
            ttl: env.get('THROTTLE_TTL_SECONDS') * 1000,
            limit: env.get('THROTTLE_IP_LIMIT'),
            getTracker: (req: Record<string, unknown>) => ipTracker(req),
          },
        ],
        storage: new ThrottlerStorageRedisService(redis),
      }),
    }),
  ],
  controllers: [
    HealthController,
    RolesController,
    UsersController,
    EmpresasController,
    FazendasController,
    AreasController,
    ClientesController,
    ProdutosController,
    TabelaPrecosController,
    SafrasController,
    AtividadesCampoController,
    CustosProducaoController,
    ColheitasController,
    DashboardController,
    EmbalagensController,
    LotesController,
    EstoqueController,
    PedidosController,
    RemessasController,
    ConsolidacaoController,
    NotasFiscaisController,
    FilaFaturamentoController,
    TenantConfigController,
    AuditoriaController,
  ],
  providers: [
    // Ordem dos APP_GUARD importa: Throttler → Auth → Permission → EmpresaAccess.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: PermissionGuard },
    { provide: APP_GUARD, useClass: EmpresaAccessGuard },
    { provide: APP_INTERCEPTOR, useClass: SecurityAuditInterceptor },
    ListEmpresasUseCase,
    CreateEmpresaUseCase,
    UpdateEmpresaUseCase,
    ActivateEmpresaUseCase,
    DeactivateEmpresaUseCase,
    ListFazendasUseCase,
    CreateFazendaUseCase,
    UpdateFazendaUseCase,
    DeleteFazendaUseCase,
    ListAreasUseCase,
    CreateAreaUseCase,
    UpdateAreaUseCase,
    DeleteAreaUseCase,
    ListClientesUseCase,
    CreateClienteUseCase,
    UpdateClienteUseCase,
    DeleteClienteUseCase,
    ListProdutosUseCase,
    CreateProdutoUseCase,
    UpdateProdutoUseCase,
    ActivateProdutoUseCase,
    DeactivateProdutoUseCase,
    ListTabelaPrecosUseCase,
    CreateTabelaPrecoUseCase,
    DeleteTabelaPrecoUseCase,
    ListSafrasUseCase,
    CreateSafraUseCase,
    UpdateSafraUseCase,
    DeleteSafraUseCase,
    ListAtividadesCampoUseCase,
    CreateAtividadeCampoUseCase,
    DeleteAtividadeCampoUseCase,
    ListCustosProducaoUseCase,
    CreateCustoProducaoUseCase,
    DeleteCustoProducaoUseCase,
    ListColheitasUseCase,
    GetDashboardResumoUseCase,
    RegistrarColheitaUseCase,
    RegistrarEmbalagemUseCase,
    ListLotesUseCase,
    GetLoteRastreabilidadeUseCase,
    GetPosicaoEstoqueUseCase,
    ListMovimentacoesUseCase,
    AjustarEstoqueUseCase,
    CriarPedidoUseCase,
    ConfirmarPedidoUseCase,
    CancelarPedidoUseCase,
    ListPedidosUseCase,
    GetPedidoUseCase,
    CriarRemessaUseCase,
    MarcarRemessaEntregueUseCase,
    CancelarRemessaUseCase,
    ListRemessasUseCase,
    GetRemessaUseCase,
    PreviewConsolidacaoUseCase,
    ConsolidarRemessasUseCase,
    EmitirNotaFiscalUseCase,
    ListNotasFiscaisUseCase,
    GetNotaFiscalUseCase,
    ListFilaFaturamentoUseCase,
    CancelarNotaFiscalUseCase,
    AtualizarStatusNotaFiscalUseCase,
    { provide: FiscalProvider, useClass: PlugNotasFiscalProvider },
    CreateRoleUseCase,
    UpdateRoleUseCase,
    DeleteRoleUseCase,
    ListRolesUseCase,
    ListUsersUseCase,
    CreateAdminUserUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    DeactivateUserUseCase,
    ReactivateUserUseCase,
    SetUserPasswordUseCase,
    BetterAuthSetPasswordAdapter,
    { provide: SetPasswordPort, useExisting: BetterAuthSetPasswordAdapter },
    GetTenantConfigUseCase,
    UpdateTenantConfigUseCase,
    ListAuditoriaLogsUseCase,
    RegistrarAuditoriaUseCase,
  ],
})
export class HttpModule {}
