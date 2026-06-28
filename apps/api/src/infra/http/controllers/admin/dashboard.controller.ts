import { Controller, Get, Query } from '@nestjs/common'
import { z } from 'zod'

import { GetDashboardResumoUseCase } from '@/domain/application/use-cases/dashboard/get-dashboard-resumo-use-case'
import { CurrentUser, type SessionUser } from '@/infra/http/decorators/current-user.decorator'
import { RequiresPermission } from '@/infra/http/decorators/requires-permission.decorator'
import { CustomHttpException } from '@/infra/http/exceptions/custom-http.exception'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation.pipe'
import { DashboardResumoPresenter } from '@/infra/http/presenters/admin/dashboard-resumo-presenter'

const resumoQuerySchema = z
  .object({
    empresaId: z.string().min(1),
    periodoInicio: z.coerce.date(),
    periodoFim: z.coerce.date(),
  })
  .strict()
  .refine((data) => data.periodoFim >= data.periodoInicio, {
    message: 'periodoFim deve ser maior ou igual a periodoInicio.',
    path: ['periodoFim'],
  })

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly getResumo: GetDashboardResumoUseCase) {}

  private requireTenant(user: SessionUser): string {
    if (!user.tenantId) throw CustomHttpException.forbidden()
    return user.tenantId
  }

  @Get('resumo')
  @RequiresPermission('view:dashboard')
  async resumo(
    @Query(new ZodValidationPipe(resumoQuerySchema)) query: z.infer<typeof resumoQuerySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.getResumo.execute({
      tenantId,
      empresaId: query.empresaId,
      periodoInicio: query.periodoInicio,
      periodoFim: query.periodoFim,
    })
    if (result.isLeft()) throw CustomHttpException.fromUseCaseError(result.value)

    return { resumo: DashboardResumoPresenter.toHTTP(result.value.resumo) }
  }
}
