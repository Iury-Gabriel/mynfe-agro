import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { z } from 'zod'

import { ProdutoNotFoundError } from '@/domain/application/use-cases/errors/produto-not-found-error'
import { ActivateProdutoUseCase } from '@/domain/application/use-cases/produtos/activate-produto-use-case'
import { CreateProdutoUseCase } from '@/domain/application/use-cases/produtos/create-produto-use-case'
import { DeactivateProdutoUseCase } from '@/domain/application/use-cases/produtos/deactivate-produto-use-case'
import { ListProdutosUseCase } from '@/domain/application/use-cases/produtos/list-produtos-use-case'
import { UpdateProdutoUseCase } from '@/domain/application/use-cases/produtos/update-produto-use-case'
import { PRODUTO_TIPOS } from '@/domain/enterprise/entities/produto'
import { CurrentUser, type SessionUser } from '@/infra/http/decorators/current-user.decorator'
import { RequiresPermission } from '@/infra/http/decorators/requires-permission.decorator'
import { CustomHttpException } from '@/infra/http/exceptions/custom-http.exception'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation.pipe'
import { ProdutoPresenter } from '@/infra/http/presenters/admin/produto-presenter'

const aliquotasSchema = z.record(z.string(), z.unknown())

const listProdutosQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
})

const createProdutoBodySchema = z
  .object({
    empresaId: z.string().min(1),
    descricao: z.string().min(1).max(200),
    tipo: z.enum(PRODUTO_TIPOS),
    unidadeMedida: z.string().min(1).max(10),
    precoPadrao: z.number().nonnegative().nullish(),
    ncm: z.string().max(20).nullish(),
    cest: z.string().max(20).nullish(),
    cfopPadrao: z.string().max(10).nullish(),
    origemMercadoria: z.string().max(5).nullish(),
    cstCsosn: z.string().max(5).nullish(),
    aliquotas: aliquotasSchema.nullish(),
  })
  .strict()

const updateProdutoBodySchema = z
  .object({
    descricao: z.string().min(1).max(200).optional(),
    tipo: z.enum(PRODUTO_TIPOS).optional(),
    unidadeMedida: z.string().min(1).max(10).optional(),
    precoPadrao: z.number().nonnegative().nullish(),
    ncm: z.string().max(20).nullish(),
    cest: z.string().max(20).nullish(),
    cfopPadrao: z.string().max(10).nullish(),
    origemMercadoria: z.string().max(5).nullish(),
    cstCsosn: z.string().max(5).nullish(),
    aliquotas: aliquotasSchema.nullish(),
  })
  .strict()

@Controller('produtos')
export class ProdutosController {
  constructor(
    private readonly listProdutos: ListProdutosUseCase,
    private readonly createProduto: CreateProdutoUseCase,
    private readonly updateProduto: UpdateProdutoUseCase,
    private readonly activateProduto: ActivateProdutoUseCase,
    private readonly deactivateProduto: DeactivateProdutoUseCase,
  ) {}

  private requireTenant(user: SessionUser): string {
    if (!user.tenantId) throw CustomHttpException.forbidden()
    return user.tenantId
  }

  @Get()
  @RequiresPermission('produto:read')
  async list(
    @Query(new ZodValidationPipe(listProdutosQuerySchema)) query: z.infer<typeof listProdutosQuerySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.listProdutos.execute({
      tenantId,
      page: query.page,
      perPage: query.perPage,
    })
    if (result.isLeft()) throw CustomHttpException.fromUseCaseError(result.value)

    const { items, total, page, perPage, totalPages } = result.value
    return {
      produtos: items.map((produto) => ProdutoPresenter.toHTTP(produto)),
      total,
      page,
      perPage,
      totalPages,
    }
  }

  @Post()
  @RequiresPermission('produto:create')
  async create(
    @Body(new ZodValidationPipe(createProdutoBodySchema)) body: z.infer<typeof createProdutoBodySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.createProduto.execute({
      tenantId,
      empresaId: body.empresaId,
      descricao: body.descricao,
      tipo: body.tipo,
      unidadeMedida: body.unidadeMedida,
      precoPadrao: body.precoPadrao,
      ncm: body.ncm,
      cest: body.cest,
      cfopPadrao: body.cfopPadrao,
      origemMercadoria: body.origemMercadoria,
      cstCsosn: body.cstCsosn,
      aliquotas: body.aliquotas,
    })
    if (result.isLeft()) throw CustomHttpException.fromUseCaseError(result.value)
    return { produto: ProdutoPresenter.toHTTP(result.value.produto) }
  }

  @Patch(':id')
  @RequiresPermission('produto:update')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateProdutoBodySchema)) body: z.infer<typeof updateProdutoBodySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.updateProduto.execute({
      tenantId,
      produtoId: id,
      descricao: body.descricao,
      tipo: body.tipo,
      unidadeMedida: body.unidadeMedida,
      precoPadrao: body.precoPadrao,
      ncm: body.ncm,
      cest: body.cest,
      cfopPadrao: body.cfopPadrao,
      origemMercadoria: body.origemMercadoria,
      cstCsosn: body.cstCsosn,
      aliquotas: body.aliquotas,
    })
    if (result.isLeft()) {
      if (result.value instanceof ProdutoNotFoundError) {
        throw new CustomHttpException('ProdutoNotFound', result.value.message, 404)
      }
      throw CustomHttpException.fromUseCaseError(result.value)
    }
    return { produto: ProdutoPresenter.toHTTP(result.value.produto) }
  }

  @Patch(':id/activate')
  @RequiresPermission('produto:status')
  async activate(@Param('id') id: string, @CurrentUser() user: SessionUser) {
    const tenantId = this.requireTenant(user)
    const result = await this.activateProduto.execute({ tenantId, produtoId: id })
    if (result.isLeft()) {
      if (result.value instanceof ProdutoNotFoundError) {
        throw new CustomHttpException('ProdutoNotFound', result.value.message, 404)
      }
      throw CustomHttpException.fromUseCaseError(result.value)
    }
    return { produto: ProdutoPresenter.toHTTP(result.value.produto) }
  }

  @Patch(':id/deactivate')
  @RequiresPermission('produto:status')
  async deactivate(@Param('id') id: string, @CurrentUser() user: SessionUser) {
    const tenantId = this.requireTenant(user)
    const result = await this.deactivateProduto.execute({ tenantId, produtoId: id })
    if (result.isLeft()) {
      if (result.value instanceof ProdutoNotFoundError) {
        throw new CustomHttpException('ProdutoNotFound', result.value.message, 404)
      }
      throw CustomHttpException.fromUseCaseError(result.value)
    }
    return { produto: ProdutoPresenter.toHTTP(result.value.produto) }
  }
}
