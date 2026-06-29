import { Controller, Get, Query } from '@nestjs/common'
import { z } from 'zod'

import { ListAuditoriaLogsUseCase } from '@/domain/application/use-cases/auditoria/list-auditoria-logs-use-case'
import { AUDITORIA_ACOES } from '@/domain/enterprise/entities/auditoria-log'
import { CurrentUser, type SessionUser } from '@/infra/http/decorators/current-user.decorator'
import { RequiresPermission } from '@/infra/http/decorators/requires-permission.decorator'
import { CustomHttpException } from '@/infra/http/exceptions/custom-http.exception'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation.pipe'
import { AuditoriaLogPresenter } from '@/infra/http/presenters/admin/auditoria-log-presenter'

const listAuditoriaQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    perPage: z.coerce.number().int().min(1).max(100).default(20),
    entidade: z.string().min(1).max(60).optional(),
    acao: z.enum(AUDITORIA_ACOES).optional(),
    usuarioId: z.string().min(1).max(60).optional(),
  })
  .strict()

@Controller('auditoria')
export class AuditoriaController {
  constructor(private readonly listAuditoria: ListAuditoriaLogsUseCase) {}

  private requireTenant(user: SessionUser): string {
    if (!user.tenantId) throw CustomHttpException.forbidden()
    return user.tenantId
  }

  @Get()
  @RequiresPermission('auditoria:read')
  async list(
    @Query(new ZodValidationPipe(listAuditoriaQuerySchema))
    query: z.infer<typeof listAuditoriaQuerySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.listAuditoria.execute({
      tenantId,
      page: query.page,
      perPage: query.perPage,
      entidade: query.entidade,
      acao: query.acao,
      usuarioId: query.usuarioId,
    })
    if (result.isLeft()) throw CustomHttpException.fromUseCaseError(result.value)

    const { items, total, page, perPage, totalPages } = result.value
    return {
      logs: items.map((log) => AuditoriaLogPresenter.toHTTP(log)),
      total,
      page,
      perPage,
      totalPages,
    }
  }
}
