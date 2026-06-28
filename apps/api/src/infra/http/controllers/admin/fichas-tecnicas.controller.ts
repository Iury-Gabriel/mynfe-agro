import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { z } from 'zod'

import { FichaTecnicaNotFoundError } from '@/domain/application/use-cases/errors/ficha-tecnica-not-found-error'
import { ProdutoNotFoundError } from '@/domain/application/use-cases/errors/produto-not-found-error'
import { CreateFichaTecnicaUseCase } from '@/domain/application/use-cases/produtos-ficha-tecnica/create-ficha-tecnica-use-case'
import { DeleteFichaTecnicaUseCase } from '@/domain/application/use-cases/produtos-ficha-tecnica/delete-ficha-tecnica-use-case'
import { ListFichasTecnicasUseCase } from '@/domain/application/use-cases/produtos-ficha-tecnica/list-fichas-tecnicas-use-case'
import { UpdateFichaTecnicaUseCase } from '@/domain/application/use-cases/produtos-ficha-tecnica/update-ficha-tecnica-use-case'
import { CurrentUser, type SessionUser } from '@/infra/http/decorators/current-user.decorator'
import { RequiresPermission } from '@/infra/http/decorators/requires-permission.decorator'
import { CustomHttpException } from '@/infra/http/exceptions/custom-http.exception'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation.pipe'
import { FichaTecnicaPresenter } from '@/infra/http/presenters/admin/ficha-tecnica-presenter'

const listFichasTecnicasQuerySchema = z.object({
  produtoId: z.string().min(1),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
})

const createFichaTecnicaBodySchema = z
  .object({
    produtoId: z.string().min(1),
    descricaoComponente: z.string().min(1).max(200),
    quantidadeReferencia: z.number().nonnegative().nullish(),
    observacoes: z.string().max(500).nullish(),
  })
  .strict()

const updateFichaTecnicaBodySchema = z
  .object({
    descricaoComponente: z.string().min(1).max(200).optional(),
    quantidadeReferencia: z.number().nonnegative().nullish(),
    observacoes: z.string().max(500).nullish(),
  })
  .strict()

@Controller('fichas-tecnicas')
export class FichasTecnicasController {
  constructor(
    private readonly listFichasTecnicas: ListFichasTecnicasUseCase,
    private readonly createFichaTecnica: CreateFichaTecnicaUseCase,
    private readonly updateFichaTecnica: UpdateFichaTecnicaUseCase,
    private readonly deleteFichaTecnica: DeleteFichaTecnicaUseCase,
  ) {}

  private requireTenant(user: SessionUser): string {
    if (!user.tenantId) throw CustomHttpException.forbidden()
    return user.tenantId
  }

  @Get()
  @RequiresPermission('produto:read')
  async list(
    @Query(new ZodValidationPipe(listFichasTecnicasQuerySchema)) query: z.infer<typeof listFichasTecnicasQuerySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.listFichasTecnicas.execute({
      tenantId,
      produtoId: query.produtoId,
      page: query.page,
      perPage: query.perPage,
    })
    if (result.isLeft()) throw CustomHttpException.fromUseCaseError(result.value)

    const { items, total, page, perPage, totalPages } = result.value
    return {
      fichasTecnicas: items.map((ficha) => FichaTecnicaPresenter.toHTTP(ficha)),
      total,
      page,
      perPage,
      totalPages,
    }
  }

  @Post()
  @RequiresPermission('produto:update')
  async create(
    @Body(new ZodValidationPipe(createFichaTecnicaBodySchema)) body: z.infer<typeof createFichaTecnicaBodySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.createFichaTecnica.execute({
      tenantId,
      produtoId: body.produtoId,
      descricaoComponente: body.descricaoComponente,
      quantidadeReferencia: body.quantidadeReferencia,
      observacoes: body.observacoes,
    })
    if (result.isLeft()) {
      if (result.value instanceof ProdutoNotFoundError) {
        throw new CustomHttpException('ProdutoNotFound', result.value.message, 404)
      }
      throw CustomHttpException.fromUseCaseError(result.value)
    }
    return { fichaTecnica: FichaTecnicaPresenter.toHTTP(result.value.fichaTecnica) }
  }

  @Patch(':id')
  @RequiresPermission('produto:update')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateFichaTecnicaBodySchema)) body: z.infer<typeof updateFichaTecnicaBodySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.updateFichaTecnica.execute({
      tenantId,
      fichaTecnicaId: id,
      descricaoComponente: body.descricaoComponente,
      quantidadeReferencia: body.quantidadeReferencia,
      observacoes: body.observacoes,
    })
    if (result.isLeft()) {
      if (result.value instanceof FichaTecnicaNotFoundError) {
        throw new CustomHttpException('FichaTecnicaNotFound', result.value.message, 404)
      }
      throw CustomHttpException.fromUseCaseError(result.value)
    }
    return { fichaTecnica: FichaTecnicaPresenter.toHTTP(result.value.fichaTecnica) }
  }

  @Delete(':id')
  @RequiresPermission('produto:update')
  async delete(@Param('id') id: string, @CurrentUser() user: SessionUser) {
    const tenantId = this.requireTenant(user)
    const result = await this.deleteFichaTecnica.execute({ tenantId, fichaTecnicaId: id })
    if (result.isLeft()) {
      if (result.value instanceof FichaTecnicaNotFoundError) {
        throw new CustomHttpException('FichaTecnicaNotFound', result.value.message, 404)
      }
      throw CustomHttpException.fromUseCaseError(result.value)
    }
    return { success: true }
  }
}
