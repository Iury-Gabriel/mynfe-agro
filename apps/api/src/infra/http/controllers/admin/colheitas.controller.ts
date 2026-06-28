import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import { z } from 'zod'

import { ListColheitasUseCase } from '@/domain/application/use-cases/estoque/list-colheitas-use-case'
import { RegistrarColheitaUseCase } from '@/domain/application/use-cases/estoque/registrar-colheita-use-case'
import { CurrentUser, type SessionUser } from '@/infra/http/decorators/current-user.decorator'
import { RequiresPermission } from '@/infra/http/decorators/requires-permission.decorator'
import { CustomHttpException } from '@/infra/http/exceptions/custom-http.exception'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation.pipe'
import { ColheitaPresenter } from '@/infra/http/presenters/admin/colheita-presenter'
import { LotePresenter } from '@/infra/http/presenters/admin/lote-presenter'

const listColheitasQuerySchema = z
  .object({
    empresaId: z.string().min(1),
    page: z.coerce.number().int().min(1).default(1),
    perPage: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()

const registrarColheitaBodySchema = z
  .object({
    empresaId: z.string().min(1),
    produtoId: z.string().min(1),
    safraId: z.string().min(1).nullish(),
    areaId: z.string().min(1).nullish(),
    quantidade: z.number().positive(),
    data: z.coerce.date(),
    codigoLote: z.string().min(1).max(120).nullish(),
    validade: z.coerce.date().nullish(),
  })
  .strict()

@Controller('colheitas')
export class ColheitasController {
  constructor(
    private readonly listColheitas: ListColheitasUseCase,
    private readonly registrarColheita: RegistrarColheitaUseCase,
  ) {}

  private requireTenant(user: SessionUser): string {
    if (!user.tenantId) throw CustomHttpException.forbidden()
    return user.tenantId
  }

  @Get()
  @RequiresPermission('colheita:read')
  async list(
    @Query(new ZodValidationPipe(listColheitasQuerySchema))
    query: z.infer<typeof listColheitasQuerySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.listColheitas.execute({
      tenantId,
      empresaId: query.empresaId,
      page: query.page,
      perPage: query.perPage,
    })
    if (result.isLeft()) throw CustomHttpException.fromUseCaseError(result.value)

    const { items, total, page, perPage, totalPages } = result.value
    return {
      colheitas: items.map((colheita) => ColheitaPresenter.toHTTP(colheita)),
      total,
      page,
      perPage,
      totalPages,
    }
  }

  @Post()
  @RequiresPermission('colheita:create')
  async registrar(
    @Body(new ZodValidationPipe(registrarColheitaBodySchema))
    body: z.infer<typeof registrarColheitaBodySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.registrarColheita.execute({
      tenantId,
      empresaId: body.empresaId,
      produtoId: body.produtoId,
      safraId: body.safraId,
      areaId: body.areaId,
      quantidade: body.quantidade,
      data: body.data,
      responsavelUsuarioId: user.id,
      codigoLote: body.codigoLote,
      validade: body.validade,
    })
    if (result.isLeft()) throw CustomHttpException.fromUseCaseError(result.value)

    return {
      colheita: ColheitaPresenter.toHTTP(result.value.colheita),
      lote: LotePresenter.toHTTP(result.value.lote),
    }
  }
}
