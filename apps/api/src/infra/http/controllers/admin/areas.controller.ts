import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { z } from 'zod'

import { CreateAreaUseCase } from '@/domain/application/use-cases/areas/create-area-use-case'
import { DeleteAreaUseCase } from '@/domain/application/use-cases/areas/delete-area-use-case'
import { ListAreasUseCase } from '@/domain/application/use-cases/areas/list-areas-use-case'
import { UpdateAreaUseCase } from '@/domain/application/use-cases/areas/update-area-use-case'
import { AreaNotFoundError } from '@/domain/application/use-cases/errors/area-not-found-error'
import { CurrentUser, type SessionUser } from '@/infra/http/decorators/current-user.decorator'
import { RequiresPermission } from '@/infra/http/decorators/requires-permission.decorator'
import { CustomHttpException } from '@/infra/http/exceptions/custom-http.exception'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation.pipe'
import { AreaPresenter } from '@/infra/http/presenters/admin/area-presenter'

const listAreasQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
})

const geometriaSchema = z.record(z.string(), z.unknown())

const createAreaBodySchema = z
  .object({
    fazendaId: z.string().min(1),
    identificacao: z.string().min(1).max(200),
    tamanho: z.number().nonnegative().nullish(),
    unidadeTamanho: z.string().max(20).nullish(),
    rotulo: z.string().max(100).nullish(),
    geometria: geometriaSchema.nullish(),
  })
  .strict()

const updateAreaBodySchema = z
  .object({
    identificacao: z.string().min(1).max(200).optional(),
    tamanho: z.number().nonnegative().nullish(),
    unidadeTamanho: z.string().max(20).nullish(),
    rotulo: z.string().max(100).nullish(),
    geometria: geometriaSchema.nullish(),
  })
  .strict()

@Controller('areas')
export class AreasController {
  constructor(
    private readonly listAreas: ListAreasUseCase,
    private readonly createArea: CreateAreaUseCase,
    private readonly updateArea: UpdateAreaUseCase,
    private readonly deleteArea: DeleteAreaUseCase,
  ) {}

  private requireTenant(user: SessionUser): string {
    if (!user.tenantId) throw CustomHttpException.forbidden()
    return user.tenantId
  }

  @Get()
  @RequiresPermission('area:read')
  async list(
    @Query(new ZodValidationPipe(listAreasQuerySchema)) query: z.infer<typeof listAreasQuerySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.listAreas.execute({
      tenantId,
      page: query.page,
      perPage: query.perPage,
    })
    if (result.isLeft()) throw CustomHttpException.fromUseCaseError(result.value)

    const { items, total, page, perPage, totalPages } = result.value
    return {
      areas: items.map((area) => AreaPresenter.toHTTP(area)),
      total,
      page,
      perPage,
      totalPages,
    }
  }

  @Post()
  @RequiresPermission('area:create')
  async create(
    @Body(new ZodValidationPipe(createAreaBodySchema)) body: z.infer<typeof createAreaBodySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.createArea.execute({
      tenantId,
      fazendaId: body.fazendaId,
      identificacao: body.identificacao,
      tamanho: body.tamanho,
      unidadeTamanho: body.unidadeTamanho,
      rotulo: body.rotulo,
      geometria: body.geometria,
    })
    if (result.isLeft()) throw CustomHttpException.fromUseCaseError(result.value)
    return { area: AreaPresenter.toHTTP(result.value.area) }
  }

  @Patch(':id')
  @RequiresPermission('area:update')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateAreaBodySchema)) body: z.infer<typeof updateAreaBodySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.updateArea.execute({
      tenantId,
      areaId: id,
      identificacao: body.identificacao,
      tamanho: body.tamanho,
      unidadeTamanho: body.unidadeTamanho,
      rotulo: body.rotulo,
      geometria: body.geometria,
    })
    if (result.isLeft()) {
      if (result.value instanceof AreaNotFoundError) {
        throw new CustomHttpException('AreaNotFound', result.value.message, 404)
      }
      throw CustomHttpException.fromUseCaseError(result.value)
    }
    return { area: AreaPresenter.toHTTP(result.value.area) }
  }

  @Delete(':id')
  @RequiresPermission('area:delete')
  async remove(@Param('id') id: string, @CurrentUser() user: SessionUser) {
    const tenantId = this.requireTenant(user)
    const result = await this.deleteArea.execute({ tenantId, areaId: id })
    if (result.isLeft()) {
      if (result.value instanceof AreaNotFoundError) {
        throw new CustomHttpException('AreaNotFound', result.value.message, 404)
      }
      throw CustomHttpException.fromUseCaseError(result.value)
    }
    return { area: AreaPresenter.toHTTP(result.value.area) }
  }
}
