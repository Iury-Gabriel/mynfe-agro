import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common'
import { z } from 'zod'

import { CreateAtividadeCampoUseCase } from '@/domain/application/use-cases/atividades-campo/create-atividade-campo-use-case'
import { DeleteAtividadeCampoUseCase } from '@/domain/application/use-cases/atividades-campo/delete-atividade-campo-use-case'
import { ListAtividadesCampoUseCase } from '@/domain/application/use-cases/atividades-campo/list-atividades-campo-use-case'
import { AtividadeCampoNotFoundError } from '@/domain/application/use-cases/errors/atividade-campo-not-found-error'
import { ATIVIDADE_CAMPO_TIPOS } from '@/domain/enterprise/entities/atividade-campo'
import { CurrentUser, type SessionUser } from '@/infra/http/decorators/current-user.decorator'
import { RequiresPermission } from '@/infra/http/decorators/requires-permission.decorator'
import { CustomHttpException } from '@/infra/http/exceptions/custom-http.exception'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation.pipe'
import { AtividadeCampoPresenter } from '@/infra/http/presenters/admin/atividade-campo-presenter'

const listAtividadesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
})

const createAtividadeBodySchema = z
  .object({
    safraId: z.string().min(1).nullish(),
    areaId: z.string().min(1).nullish(),
    tipo: z.enum(ATIVIDADE_CAMPO_TIPOS),
    data: z.coerce.date(),
    responsavelUsuarioId: z.string().min(1).nullish(),
    observacoes: z.string().max(1000).nullish(),
  })
  .strict()

@Controller('atividades-campo')
export class AtividadesCampoController {
  constructor(
    private readonly listAtividades: ListAtividadesCampoUseCase,
    private readonly createAtividade: CreateAtividadeCampoUseCase,
    private readonly deleteAtividade: DeleteAtividadeCampoUseCase,
  ) {}

  private requireTenant(user: SessionUser): string {
    if (!user.tenantId) throw CustomHttpException.forbidden()
    return user.tenantId
  }

  @Get()
  @RequiresPermission('atividade:read')
  async list(
    @Query(new ZodValidationPipe(listAtividadesQuerySchema))
    query: z.infer<typeof listAtividadesQuerySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.listAtividades.execute({
      tenantId,
      page: query.page,
      perPage: query.perPage,
    })
    if (result.isLeft()) throw CustomHttpException.fromUseCaseError(result.value)

    const { items, total, page, perPage, totalPages } = result.value
    return {
      atividades: items.map((atividade) => AtividadeCampoPresenter.toHTTP(atividade)),
      total,
      page,
      perPage,
      totalPages,
    }
  }

  @Post()
  @RequiresPermission('atividade:create')
  async create(
    @Body(new ZodValidationPipe(createAtividadeBodySchema))
    body: z.infer<typeof createAtividadeBodySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.createAtividade.execute({
      tenantId,
      safraId: body.safraId,
      areaId: body.areaId,
      tipo: body.tipo,
      data: body.data,
      responsavelUsuarioId: body.responsavelUsuarioId,
      observacoes: body.observacoes,
    })
    if (result.isLeft()) throw CustomHttpException.fromUseCaseError(result.value)
    return { atividade: AtividadeCampoPresenter.toHTTP(result.value.atividade) }
  }

  @Delete(':id')
  @RequiresPermission('atividade:delete')
  async remove(@Param('id') id: string, @CurrentUser() user: SessionUser) {
    const tenantId = this.requireTenant(user)
    const result = await this.deleteAtividade.execute({ tenantId, atividadeId: id })
    if (result.isLeft()) {
      if (result.value instanceof AtividadeCampoNotFoundError) {
        throw new CustomHttpException('AtividadeCampoNotFound', result.value.message, 404)
      }
      throw CustomHttpException.fromUseCaseError(result.value)
    }
    return { atividade: AtividadeCampoPresenter.toHTTP(result.value.atividade) }
  }
}
