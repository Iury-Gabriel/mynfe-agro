import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { z } from 'zod'

import { SafraNotFoundError } from '@/domain/application/use-cases/errors/safra-not-found-error'
import { CreateSafraUseCase } from '@/domain/application/use-cases/safras/create-safra-use-case'
import { DeleteSafraUseCase } from '@/domain/application/use-cases/safras/delete-safra-use-case'
import { ListSafrasUseCase } from '@/domain/application/use-cases/safras/list-safras-use-case'
import { UpdateSafraUseCase } from '@/domain/application/use-cases/safras/update-safra-use-case'
import { SAFRA_STATUSES } from '@/domain/enterprise/entities/safra'
import { CurrentUser, type SessionUser } from '@/infra/http/decorators/current-user.decorator'
import { RequiresPermission } from '@/infra/http/decorators/requires-permission.decorator'
import { CustomHttpException } from '@/infra/http/exceptions/custom-http.exception'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation.pipe'
import { SafraPresenter } from '@/infra/http/presenters/admin/safra-presenter'

const listSafrasQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
})

const createSafraBodySchema = z
  .object({
    areaId: z.string().min(1),
    cultura: z.string().min(1).max(120),
    variedade: z.string().max(120).nullish(),
    dataPlantio: z.coerce.date().nullish(),
    dataColheitaPrevista: z.coerce.date().nullish(),
    dataColheitaRealizada: z.coerce.date().nullish(),
    estimativaProducao: z.number().nonnegative().nullish(),
    status: z.enum(SAFRA_STATUSES).optional(),
  })
  .strict()

const updateSafraBodySchema = z
  .object({
    cultura: z.string().min(1).max(120).optional(),
    variedade: z.string().max(120).nullish(),
    dataPlantio: z.coerce.date().nullish(),
    dataColheitaPrevista: z.coerce.date().nullish(),
    dataColheitaRealizada: z.coerce.date().nullish(),
    estimativaProducao: z.number().nonnegative().nullish(),
    status: z.enum(SAFRA_STATUSES).optional(),
  })
  .strict()

@Controller('safras')
export class SafrasController {
  constructor(
    private readonly listSafras: ListSafrasUseCase,
    private readonly createSafra: CreateSafraUseCase,
    private readonly updateSafra: UpdateSafraUseCase,
    private readonly deleteSafra: DeleteSafraUseCase,
  ) {}

  private requireTenant(user: SessionUser): string {
    if (!user.tenantId) throw CustomHttpException.forbidden()
    return user.tenantId
  }

  @Get()
  @RequiresPermission('safra:read')
  async list(
    @Query(new ZodValidationPipe(listSafrasQuerySchema)) query: z.infer<typeof listSafrasQuerySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.listSafras.execute({
      tenantId,
      page: query.page,
      perPage: query.perPage,
    })
    if (result.isLeft()) throw CustomHttpException.fromUseCaseError(result.value)

    const { items, total, page, perPage, totalPages } = result.value
    return {
      safras: items.map((safra) => SafraPresenter.toHTTP(safra)),
      total,
      page,
      perPage,
      totalPages,
    }
  }

  @Post()
  @RequiresPermission('safra:create')
  async create(
    @Body(new ZodValidationPipe(createSafraBodySchema)) body: z.infer<typeof createSafraBodySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.createSafra.execute({
      tenantId,
      areaId: body.areaId,
      cultura: body.cultura,
      variedade: body.variedade,
      dataPlantio: body.dataPlantio,
      dataColheitaPrevista: body.dataColheitaPrevista,
      dataColheitaRealizada: body.dataColheitaRealizada,
      estimativaProducao: body.estimativaProducao,
      status: body.status,
    })
    if (result.isLeft()) throw CustomHttpException.fromUseCaseError(result.value)
    return { safra: SafraPresenter.toHTTP(result.value.safra) }
  }

  @Patch(':id')
  @RequiresPermission('safra:update')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateSafraBodySchema)) body: z.infer<typeof updateSafraBodySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.updateSafra.execute({
      tenantId,
      safraId: id,
      cultura: body.cultura,
      variedade: body.variedade,
      dataPlantio: body.dataPlantio,
      dataColheitaPrevista: body.dataColheitaPrevista,
      dataColheitaRealizada: body.dataColheitaRealizada,
      estimativaProducao: body.estimativaProducao,
      status: body.status,
    })
    if (result.isLeft()) {
      if (result.value instanceof SafraNotFoundError) {
        throw new CustomHttpException('SafraNotFound', result.value.message, 404)
      }
      throw CustomHttpException.fromUseCaseError(result.value)
    }
    return { safra: SafraPresenter.toHTTP(result.value.safra) }
  }

  @Delete(':id')
  @RequiresPermission('safra:delete')
  async remove(@Param('id') id: string, @CurrentUser() user: SessionUser) {
    const tenantId = this.requireTenant(user)
    const result = await this.deleteSafra.execute({ tenantId, safraId: id })
    if (result.isLeft()) {
      if (result.value instanceof SafraNotFoundError) {
        throw new CustomHttpException('SafraNotFound', result.value.message, 404)
      }
      throw CustomHttpException.fromUseCaseError(result.value)
    }
    return { safra: SafraPresenter.toHTTP(result.value.safra) }
  }
}
