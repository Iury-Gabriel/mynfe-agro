import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { z } from 'zod'

import { EmpresaRepository } from '@/domain/application/repositories/empresa-repository'
import { ActivateEmpresaUseCase } from '@/domain/application/use-cases/empresas/activate-empresa-use-case'
import { CreateEmpresaUseCase } from '@/domain/application/use-cases/empresas/create-empresa-use-case'
import { DeactivateEmpresaUseCase } from '@/domain/application/use-cases/empresas/deactivate-empresa-use-case'
import { ListEmpresasUseCase } from '@/domain/application/use-cases/empresas/list-empresas-use-case'
import { UpdateEmpresaUseCase } from '@/domain/application/use-cases/empresas/update-empresa-use-case'
import { EmpresaNotFoundError } from '@/domain/application/use-cases/errors/empresa-not-found-error'
import { InvalidCnpjCpfError } from '@/domain/application/use-cases/errors/invalid-cnpj-cpf-error'
import { AMBIENTES_FISCAIS, TIPOS_PESSOA } from '@/domain/enterprise/entities/empresa'
import { CurrentUser, type SessionUser } from '@/infra/http/decorators/current-user.decorator'
import { RequiresPermission } from '@/infra/http/decorators/requires-permission.decorator'
import { CustomHttpException } from '@/infra/http/exceptions/custom-http.exception'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation.pipe'
import { EmpresaPresenter } from '@/infra/http/presenters/admin/empresa-presenter'

const enderecoSchema = z
  .object({
    logradouro: z.string().max(200).nullish(),
    numero: z.string().max(20).nullish(),
    complemento: z.string().max(100).nullish(),
    bairro: z.string().max(100).nullish(),
    municipio: z.string().max(100).nullish(),
    uf: z.string().length(2).nullish(),
    cep: z.string().max(9).nullish(),
  })
  .strict()

const listEmpresasQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
})

const createEmpresaBodySchema = z
  .object({
    tipoPessoa: z.enum(TIPOS_PESSOA),
    razaoSocial: z.string().min(1).max(200),
    nomeFantasia: z.string().max(200).nullish(),
    cnpjCpf: z.string().min(11).max(18),
    inscricaoEstadual: z.string().max(30).nullish(),
    ieProdutorRural: z.string().max(30).nullish(),
    regimeTributario: z.string().min(1).max(50),
    crt: z.string().min(1).max(10),
    ambienteFiscal: z.enum(AMBIENTES_FISCAIS),
    serieNfe: z.number().int().min(0).nullish(),
    endereco: enderecoSchema.optional(),
  })
  .strict()

const updateEmpresaBodySchema = z
  .object({
    razaoSocial: z.string().min(1).max(200).optional(),
    nomeFantasia: z.string().max(200).nullish(),
    cnpjCpf: z.string().min(11).max(18).optional(),
    inscricaoEstadual: z.string().max(30).nullish(),
    ieProdutorRural: z.string().max(30).nullish(),
    regimeTributario: z.string().min(1).max(50).optional(),
    crt: z.string().min(1).max(10).optional(),
    ambienteFiscal: z.enum(AMBIENTES_FISCAIS).optional(),
    serieNfe: z.number().int().min(0).nullish(),
    endereco: enderecoSchema.partial().optional(),
  })
  .strict()

const activeEmpresaBodySchema = z
  .object({
    empresaId: z.string().min(1),
  })
  .strict()

@Controller('empresas')
export class EmpresasController {
  constructor(
    private readonly listEmpresas: ListEmpresasUseCase,
    private readonly createEmpresa: CreateEmpresaUseCase,
    private readonly updateEmpresa: UpdateEmpresaUseCase,
    private readonly activateEmpresa: ActivateEmpresaUseCase,
    private readonly deactivateEmpresa: DeactivateEmpresaUseCase,
    private readonly empresas: EmpresaRepository,
  ) {}

  private requireTenant(user: SessionUser): string {
    if (!user.tenantId) throw CustomHttpException.forbidden()
    return user.tenantId
  }

  @Get()
  @RequiresPermission('empresa:read')
  async list(
    @Query(new ZodValidationPipe(listEmpresasQuerySchema)) query: z.infer<typeof listEmpresasQuerySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.listEmpresas.execute({
      tenantId,
      page: query.page,
      perPage: query.perPage,
    })
    if (result.isLeft()) throw CustomHttpException.fromUseCaseError(result.value)

    const { items, total, page, perPage, totalPages } = result.value
    return {
      empresas: items.map((empresa) => EmpresaPresenter.toHTTP(empresa)),
      total,
      page,
      perPage,
      totalPages,
    }
  }

  @Post()
  @RequiresPermission('empresa:create')
  async create(
    @Body(new ZodValidationPipe(createEmpresaBodySchema)) body: z.infer<typeof createEmpresaBodySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.createEmpresa.execute({
      tenantId,
      tipoPessoa: body.tipoPessoa,
      razaoSocial: body.razaoSocial,
      nomeFantasia: body.nomeFantasia,
      cnpjCpf: body.cnpjCpf,
      inscricaoEstadual: body.inscricaoEstadual,
      ieProdutorRural: body.ieProdutorRural,
      regimeTributario: body.regimeTributario,
      crt: body.crt,
      ambienteFiscal: body.ambienteFiscal,
      serieNfe: body.serieNfe,
      endereco: body.endereco,
    })
    if (result.isLeft()) {
      if (result.value instanceof InvalidCnpjCpfError) {
        throw new CustomHttpException('InvalidCnpjCpf', result.value.message, 400)
      }
      throw CustomHttpException.fromUseCaseError(result.value)
    }
    return { empresa: EmpresaPresenter.toHTTP(result.value.empresa) }
  }

  @Patch(':id')
  @RequiresPermission('empresa:update')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateEmpresaBodySchema)) body: z.infer<typeof updateEmpresaBodySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.updateEmpresa.execute({
      tenantId,
      empresaId: id,
      razaoSocial: body.razaoSocial,
      nomeFantasia: body.nomeFantasia,
      cnpjCpf: body.cnpjCpf,
      inscricaoEstadual: body.inscricaoEstadual,
      ieProdutorRural: body.ieProdutorRural,
      regimeTributario: body.regimeTributario,
      crt: body.crt,
      ambienteFiscal: body.ambienteFiscal,
      serieNfe: body.serieNfe,
      endereco: body.endereco,
    })
    if (result.isLeft()) {
      if (result.value instanceof EmpresaNotFoundError) {
        throw new CustomHttpException('EmpresaNotFound', result.value.message, 404)
      }
      if (result.value instanceof InvalidCnpjCpfError) {
        throw new CustomHttpException('InvalidCnpjCpf', result.value.message, 400)
      }
      throw CustomHttpException.fromUseCaseError(result.value)
    }
    return { empresa: EmpresaPresenter.toHTTP(result.value.empresa) }
  }

  @Patch(':id/activate')
  @RequiresPermission('empresa:status')
  async activate(@Param('id') id: string, @CurrentUser() user: SessionUser) {
    const tenantId = this.requireTenant(user)
    const result = await this.activateEmpresa.execute({ tenantId, empresaId: id })
    if (result.isLeft()) {
      if (result.value instanceof EmpresaNotFoundError) {
        throw new CustomHttpException('EmpresaNotFound', result.value.message, 404)
      }
      throw CustomHttpException.fromUseCaseError(result.value)
    }
    return { empresa: EmpresaPresenter.toHTTP(result.value.empresa) }
  }

  @Patch(':id/deactivate')
  @RequiresPermission('empresa:status')
  async deactivate(@Param('id') id: string, @CurrentUser() user: SessionUser) {
    const tenantId = this.requireTenant(user)
    const result = await this.deactivateEmpresa.execute({ tenantId, empresaId: id })
    if (result.isLeft()) {
      if (result.value instanceof EmpresaNotFoundError) {
        throw new CustomHttpException('EmpresaNotFound', result.value.message, 404)
      }
      throw CustomHttpException.fromUseCaseError(result.value)
    }
    return { empresa: EmpresaPresenter.toHTTP(result.value.empresa) }
  }

  @Post('active')
  @RequiresPermission('empresa:read')
  async setActive(
    @Body(new ZodValidationPipe(activeEmpresaBodySchema)) body: z.infer<typeof activeEmpresaBodySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)

    const allowed = user.empresaIds ?? []
    if (!allowed.includes(body.empresaId)) throw CustomHttpException.forbidden()

    const empresa = await this.empresas.findById(body.empresaId, tenantId)
    if (!empresa) {
      throw new CustomHttpException('EmpresaNotFound', 'Empresa não encontrada.', 404)
    }

    return { empresa: EmpresaPresenter.toHTTP(empresa) }
  }
}
