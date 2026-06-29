import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { z } from 'zod'

import type { UseCaseError } from '@/core/errors/use-case-error'

import { EstoqueInsuficienteError } from '@/domain/application/use-cases/errors/estoque-insuficiente-error'
import { PedidoNotFoundError } from '@/domain/application/use-cases/errors/pedido-not-found-error'
import { TransicaoInvalidaError } from '@/domain/application/use-cases/errors/transicao-invalida-error'
import { CancelarPedidoUseCase } from '@/domain/application/use-cases/vendas/cancelar-pedido-use-case'
import { ConfirmarPedidoUseCase } from '@/domain/application/use-cases/vendas/confirmar-pedido-use-case'
import { CriarPedidoUseCase } from '@/domain/application/use-cases/vendas/criar-pedido-use-case'
import { GetPedidoUseCase } from '@/domain/application/use-cases/vendas/get-pedido-use-case'
import { ListPedidosUseCase } from '@/domain/application/use-cases/vendas/list-pedidos-use-case'
import { PEDIDO_STATUSES } from '@/domain/enterprise/entities/pedido'
import { CurrentUser, type SessionUser } from '@/infra/http/decorators/current-user.decorator'
import { RequiresPermission } from '@/infra/http/decorators/requires-permission.decorator'
import { CustomHttpException } from '@/infra/http/exceptions/custom-http.exception'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation.pipe'
import { PedidoPresenter } from '@/infra/http/presenters/admin/pedido-presenter'

function translateVendaError(err: UseCaseError): CustomHttpException {
  if (err instanceof PedidoNotFoundError) {
    return new CustomHttpException(err.kind, err.message, 404)
  }
  if (err instanceof EstoqueInsuficienteError) {
    return new CustomHttpException(err.kind, err.message, 400)
  }
  if (err instanceof TransicaoInvalidaError) {
    return new CustomHttpException(err.kind, err.message, 409)
  }
  return CustomHttpException.fromUseCaseError(err)
}

const listPedidosQuerySchema = z
  .object({
    empresaId: z.string().min(1),
    status: z.enum(PEDIDO_STATUSES).optional(),
    clienteId: z.string().min(1).optional(),
    periodoInicio: z.coerce.date().optional(),
    periodoFim: z.coerce.date().optional(),
    page: z.coerce.number().int().min(1).default(1),
    perPage: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()

const criarPedidoItemSchema = z
  .object({
    produtoId: z.string().min(1),
    loteId: z.string().min(1).nullish(),
    quantidade: z.number().positive(),
    precoUnitario: z.number().nonnegative().nullish(),
  })
  .strict()

const criarPedidoBodySchema = z
  .object({
    empresaId: z.string().min(1),
    clienteId: z.string().min(1),
    data: z.coerce.date(),
    confirmar: z.boolean().optional(),
    observacoes: z.string().max(2000).nullish(),
    itens: z.array(criarPedidoItemSchema).min(1),
  })
  .strict()

const empresaBodySchema = z.object({ empresaId: z.string().min(1) }).strict()
const empresaQuerySchema = z.object({ empresaId: z.string().min(1) }).strict()

@Controller('pedidos')
export class PedidosController {
  constructor(
    private readonly criarPedido: CriarPedidoUseCase,
    private readonly confirmarPedido: ConfirmarPedidoUseCase,
    private readonly cancelarPedido: CancelarPedidoUseCase,
    private readonly listPedidos: ListPedidosUseCase,
    private readonly getPedido: GetPedidoUseCase,
  ) {}

  private requireTenant(user: SessionUser): string {
    if (!user.tenantId) throw CustomHttpException.forbidden()
    return user.tenantId
  }

  @Post()
  @RequiresPermission('pedido:create')
  async criar(
    @Body(new ZodValidationPipe(criarPedidoBodySchema))
    body: z.infer<typeof criarPedidoBodySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.criarPedido.execute({
      tenantId,
      empresaFaturadoraId: body.empresaId,
      clienteId: body.clienteId,
      data: body.data,
      confirmar: body.confirmar,
      observacoes: body.observacoes,
      itens: body.itens.map((item) => ({
        produtoId: item.produtoId,
        loteId: item.loteId,
        quantidade: item.quantidade,
        precoUnitario: item.precoUnitario,
      })),
    })
    if (result.isLeft()) throw translateVendaError(result.value)

    return { pedido: PedidoPresenter.toHTTP(result.value.pedido) }
  }

  @Post(':id/confirmar')
  @RequiresPermission('pedido:confirm')
  async confirmar(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(empresaBodySchema)) body: z.infer<typeof empresaBodySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.confirmarPedido.execute({
      tenantId,
      empresaFaturadoraId: body.empresaId,
      pedidoId: id,
      usuarioId: user.id,
    })
    if (result.isLeft()) throw translateVendaError(result.value)

    return { pedido: PedidoPresenter.toHTTP(result.value.pedido) }
  }

  @Post(':id/cancelar')
  @RequiresPermission('pedido:cancel')
  async cancelar(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(empresaBodySchema)) body: z.infer<typeof empresaBodySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.cancelarPedido.execute({
      tenantId,
      empresaFaturadoraId: body.empresaId,
      pedidoId: id,
    })
    if (result.isLeft()) throw translateVendaError(result.value)

    return { pedido: PedidoPresenter.toHTTP(result.value.pedido) }
  }

  @Get()
  @RequiresPermission('pedido:read')
  async list(
    @Query(new ZodValidationPipe(listPedidosQuerySchema))
    query: z.infer<typeof listPedidosQuerySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.listPedidos.execute({
      tenantId,
      empresaFaturadoraId: query.empresaId,
      filtros: {
        status: query.status,
        clienteId: query.clienteId,
        periodoInicio: query.periodoInicio,
        periodoFim: query.periodoFim,
      },
      page: query.page,
      perPage: query.perPage,
    })
    if (result.isLeft()) throw translateVendaError(result.value)

    const { items, total, page, perPage, totalPages } = result.value
    return {
      pedidos: items.map((pedido) => PedidoPresenter.toHTTP(pedido)),
      total,
      page,
      perPage,
      totalPages,
    }
  }

  @Get(':id')
  @RequiresPermission('pedido:read')
  async get(
    @Param('id') id: string,
    @Query(new ZodValidationPipe(empresaQuerySchema)) query: z.infer<typeof empresaQuerySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.getPedido.execute({
      tenantId,
      empresaFaturadoraId: query.empresaId,
      pedidoId: id,
    })
    if (result.isLeft()) throw translateVendaError(result.value)

    return {
      pedido: PedidoPresenter.toHTTP(result.value.pedido, result.value.remessas),
    }
  }
}
