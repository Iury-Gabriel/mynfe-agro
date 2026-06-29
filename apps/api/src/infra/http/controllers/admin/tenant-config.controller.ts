import { Body, Controller, Get, Patch } from '@nestjs/common'
import { z } from 'zod'

import { TenantNotFoundError } from '@/domain/application/use-cases/errors/tenant-not-found-error'
import { GetTenantConfigUseCase } from '@/domain/application/use-cases/tenant-config/get-tenant-config-use-case'
import { UpdateTenantConfigUseCase } from '@/domain/application/use-cases/tenant-config/update-tenant-config-use-case'
import { CurrentUser, type SessionUser } from '@/infra/http/decorators/current-user.decorator'
import { RequiresPermission } from '@/infra/http/decorators/requires-permission.decorator'
import { CustomHttpException } from '@/infra/http/exceptions/custom-http.exception'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation.pipe'
import { TenantConfigPresenter } from '@/infra/http/presenters/admin/tenant-config-presenter'

const updateTenantConfigBodySchema = z
  .object({
    nome: z.string().min(1).max(200).optional(),
    labelArea: z.string().min(1).max(60).optional(),
    diaCorteConsolidacao: z.number().int().min(1).max(31).nullish(),
  })
  .strict()

@Controller('tenant/config')
export class TenantConfigController {
  constructor(
    private readonly getTenantConfig: GetTenantConfigUseCase,
    private readonly updateTenantConfig: UpdateTenantConfigUseCase,
  ) {}

  private requireTenant(user: SessionUser): string {
    if (!user.tenantId) throw CustomHttpException.forbidden()
    return user.tenantId
  }

  @Get()
  @RequiresPermission('view:settings')
  async get(@CurrentUser() user: SessionUser) {
    const tenantId = this.requireTenant(user)
    const result = await this.getTenantConfig.execute({ tenantId })
    if (result.isLeft()) {
      if (result.value instanceof TenantNotFoundError) {
        throw new CustomHttpException('TenantNotFound', result.value.message, 404)
      }
      throw CustomHttpException.fromUseCaseError(result.value)
    }

    return { tenant: TenantConfigPresenter.toHTTP(result.value.tenant) }
  }

  @Patch()
  @RequiresPermission('manage:settings')
  async update(
    @Body(new ZodValidationPipe(updateTenantConfigBodySchema))
    body: z.infer<typeof updateTenantConfigBodySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.updateTenantConfig.execute({
      tenantId,
      usuarioId: user.id,
      nome: body.nome,
      labelArea: body.labelArea,
      diaCorteConsolidacao: body.diaCorteConsolidacao,
    })
    if (result.isLeft()) {
      if (result.value instanceof TenantNotFoundError) {
        throw new CustomHttpException('TenantNotFound', result.value.message, 404)
      }
      throw CustomHttpException.fromUseCaseError(result.value)
    }

    return { tenant: TenantConfigPresenter.toHTTP(result.value.tenant) }
  }
}
