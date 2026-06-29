import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { z } from 'zod'

import { EmailAlreadyInUseError } from '@/domain/application/use-cases/errors/email-already-in-use-error'
import { InvalidCnpjCpfError } from '@/domain/application/use-cases/errors/invalid-cnpj-cpf-error'
import { TenantNotFoundError } from '@/domain/application/use-cases/errors/tenant-not-found-error'
import { CreateTenantUseCase } from '@/domain/application/use-cases/tenants/create-tenant-use-case'
import { ListTenantsUseCase } from '@/domain/application/use-cases/tenants/list-tenants-use-case'
import { SetTenantStatusUseCase } from '@/domain/application/use-cases/tenants/set-tenant-status-use-case'
import { AMBIENTES_FISCAIS, TIPOS_PESSOA } from '@/domain/enterprise/entities/empresa'
import { RequiresSuperAdmin } from '@/infra/http/decorators/requires-super-admin.decorator'
import { CustomHttpException } from '@/infra/http/exceptions/custom-http.exception'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation.pipe'
import { TenantPresenter } from '@/infra/http/presenters/platform/tenant-presenter'

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
})

const empresaSchema = z
  .object({
    razaoSocial: z.string().min(1).max(200),
    cnpjCpf: z.string().min(11).max(18),
    tipoPessoa: z.enum(TIPOS_PESSOA),
    regimeTributario: z.string().min(1).max(50),
    crt: z.string().min(1).max(10),
    ambienteFiscal: z.enum(AMBIENTES_FISCAIS).optional(),
  })
  .strict()

const createBodySchema = z
  .object({
    name: z.string().min(1).max(200),
    email: z.string().email().max(200),
    password: z.string().min(12).max(128),
    tenantNome: z.string().min(1).max(200),
    empresa: empresaSchema,
  })
  .strict()

const setStatusBodySchema = z
  .object({
    status: z.enum(['ativo', 'suspenso']),
  })
  .strict()

@Controller('platform/tenants')
@RequiresSuperAdmin()
export class TenantsController {
  constructor(
    private readonly listTenants: ListTenantsUseCase,
    private readonly createTenant: CreateTenantUseCase,
    private readonly setTenantStatus: SetTenantStatusUseCase,
  ) {}

  @Get()
  async list(
    @Query(new ZodValidationPipe(listQuerySchema)) query: z.infer<typeof listQuerySchema>,
  ) {
    const result = await this.listTenants.execute({ page: query.page, perPage: query.perPage })
    if (result.isLeft()) throw CustomHttpException.fromUseCaseError(result.value)

    const { items, total, page, perPage, totalPages } = result.value
    return {
      tenants: items.map((summary) => TenantPresenter.summaryToHTTP(summary)),
      total,
      page,
      perPage,
      totalPages,
    }
  }

  @Post()
  async create(
    @Body(new ZodValidationPipe(createBodySchema)) body: z.infer<typeof createBodySchema>,
  ) {
    const result = await this.createTenant.execute({
      name: body.name,
      email: body.email,
      password: body.password,
      tenantNome: body.tenantNome,
      empresa: {
        razaoSocial: body.empresa.razaoSocial,
        cnpjCpf: body.empresa.cnpjCpf,
        tipoPessoa: body.empresa.tipoPessoa,
        regimeTributario: body.empresa.regimeTributario,
        crt: body.empresa.crt,
        ambienteFiscal: body.empresa.ambienteFiscal,
      },
    })

    if (result.isLeft()) {
      if (result.value instanceof EmailAlreadyInUseError) {
        throw new CustomHttpException('EmailAlreadyInUse', result.value.message, 409)
      }
      if (result.value instanceof InvalidCnpjCpfError) {
        throw new CustomHttpException('InvalidCnpjCpf', result.value.message, 400)
      }
      throw CustomHttpException.fromUseCaseError(result.value)
    }

    return { tenant: TenantPresenter.toHTTP(result.value.tenant) }
  }

  @Patch(':id/status')
  async setStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(setStatusBodySchema)) body: z.infer<typeof setStatusBodySchema>,
  ) {
    const result = await this.setTenantStatus.execute({ tenantId: id, status: body.status })

    if (result.isLeft()) {
      if (result.value instanceof TenantNotFoundError) {
        throw new CustomHttpException('TenantNotFound', result.value.message, 404)
      }
      throw CustomHttpException.fromUseCaseError(result.value)
    }

    return { tenant: TenantPresenter.toHTTP(result.value.tenant) }
  }
}
