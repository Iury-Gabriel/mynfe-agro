import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { z } from 'zod'

import type { UseCaseError } from '@/core/errors/use-case-error'

import { EstoqueInsuficienteError } from '@/domain/application/use-cases/errors/estoque-insuficiente-error'
import { RemessaNotFoundError } from '@/domain/application/use-cases/errors/remessa-not-found-error'
import { TransicaoInvalidaError } from '@/domain/application/use-cases/errors/transicao-invalida-error'
import { CancelarRemessaUseCase } from '@/domain/application/use-cases/vendas/cancelar-remessa-use-case'
import { CriarRemessaUseCase } from '@/domain/application/use-cases/vendas/criar-remessa-use-case'
import { GetRemessaUseCase } from '@/domain/application/use-cases/vendas/get-remessa-use-case'
import { ListRemessasUseCase } from '@/domain/application/use-cases/vendas/list-remessas-use-case'
import { MarcarRemessaEntregueUseCase } from '@/domain/application/use-cases/vendas/marcar-remessa-entregue-use-case'
import { REMESSA_STATUSES } from '@/domain/enterprise/entities/remessa'
import { CurrentUser, type SessionUser } from '@/infra/http/decorators/current-user.decorator'
import { RequiresPermission } from '@/infra/http/decorators/requires-permission.decorator'
import { CustomHttpException } from '@/infra/http/exceptions/custom-http.exception'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation.pipe'
import { RemessaPresenter } from '@/infra/http/presenters/admin/remessa-presenter'

function translateRemessaError(err: UseCaseError): CustomHttpException {
  if (err instanceof RemessaNotFoundError) {
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

const listRemessasQuerySchema = z
  .object({
    empresaId: z.string().min(1),
    status: z.enum(REMESSA_STATUSES).optional(),
    clienteId: z.string().min(1).optional(),
    periodoInicio: z.coerce.date().optional(),
    periodoFim: z.coerce.date().optional(),
    page: z.coerce.number().int().min(1).default(1),
    perPage: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()

const criarRemessaItemSchema = z
  .object({
    produtoId: z.string().min(1),
    loteId: z.string().min(1).nullish(),
    quantidade: z.number().positive(),
    precoUnitario: z.number().nonnegative().nullish(),
  })
  .strict()

const criarRemessaBodySchema = z
  .object({
    empresaId: z.string().min(1),
    clienteId: z.string().min(1),
    data: z.coerce.date(),
    observacoes: z.string().max(2000).nullish(),
    itens: z.array(criarRemessaItemSchema).min(1),
  })
  .strict()

const empresaBodySchema = z.object({ empresaId: z.string().min(1) }).strict()
const empresaQuerySchema = z.object({ empresaId: z.string().min(1) }).strict()

@Controller('remessas')
export class RemessasController {
  constructor(
    private readonly criarRemessa: CriarRemessaUseCase,
    private readonly marcarEntregue: MarcarRemessaEntregueUseCase,
    private readonly cancelarRemessa: CancelarRemessaUseCase,
    private readonly listRemessas: ListRemessasUseCase,
    private readonly getRemessa: GetRemessaUseCase,
  ) {}

  private requireTenant(user: SessionUser): string {
    if (!user.tenantId) throw CustomHttpException.forbidden()
    return user.tenantId
  }

  @Post()
  @RequiresPermission('remessa:create')
  async criar(
    @Body(new ZodValidationPipe(criarRemessaBodySchema))
    body: z.infer<typeof criarRemessaBodySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.criarRemessa.execute({
      tenantId,
      empresaFaturadoraId: body.empresaId,
      clienteId: body.clienteId,
      data: body.data,
      observacoes: body.observacoes,
      usuarioId: user.id,
      itens: body.itens.map((item) => ({
        produtoId: item.produtoId,
        loteId: item.loteId,
        quantidade: item.quantidade,
        precoUnitario: item.precoUnitario,
      })),
    })
    if (result.isLeft()) throw translateRemessaError(result.value)

    return { remessa: RemessaPresenter.toHTTP(result.value.remessa) }
  }

  @Post(':id/entregue')
  @RequiresPermission('remessa:update')
  async entregue(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(empresaBodySchema)) body: z.infer<typeof empresaBodySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.marcarEntregue.execute({
      tenantId,
      empresaFaturadoraId: body.empresaId,
      remessaId: id,
    })
    if (result.isLeft()) throw translateRemessaError(result.value)

    return { remessa: RemessaPresenter.toHTTP(result.value.remessa) }
  }

  @Post(':id/cancelar')
  @RequiresPermission('remessa:cancel')
  async cancelar(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(empresaBodySchema)) body: z.infer<typeof empresaBodySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.cancelarRemessa.execute({
      tenantId,
      empresaFaturadoraId: body.empresaId,
      remessaId: id,
    })
    if (result.isLeft()) throw translateRemessaError(result.value)

    return { remessa: RemessaPresenter.toHTTP(result.value.remessa) }
  }

  @Get()
  @RequiresPermission('remessa:read')
  async list(
    @Query(new ZodValidationPipe(listRemessasQuerySchema))
    query: z.infer<typeof listRemessasQuerySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.listRemessas.execute({
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
    if (result.isLeft()) throw translateRemessaError(result.value)

    const { items, total, page, perPage, totalPages } = result.value
    return {
      remessas: items.map((remessa) => RemessaPresenter.toHTTP(remessa)),
      total,
      page,
      perPage,
      totalPages,
    }
  }

  @Get(':id')
  @RequiresPermission('remessa:read')
  async get(
    @Param('id') id: string,
    @Query(new ZodValidationPipe(empresaQuerySchema)) query: z.infer<typeof empresaQuerySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.getRemessa.execute({
      tenantId,
      empresaFaturadoraId: query.empresaId,
      remessaId: id,
    })
    if (result.isLeft()) throw translateRemessaError(result.value)

    return {
      remessa: RemessaPresenter.toHTTP(result.value.remessa, result.value.lotes),
    }
  }
}
