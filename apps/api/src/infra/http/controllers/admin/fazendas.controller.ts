import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { z } from 'zod'

import { FazendaNotFoundError } from '@/domain/application/use-cases/errors/fazenda-not-found-error'
import { CreateFazendaUseCase } from '@/domain/application/use-cases/fazendas/create-fazenda-use-case'
import { DeleteFazendaUseCase } from '@/domain/application/use-cases/fazendas/delete-fazenda-use-case'
import { ListFazendasUseCase } from '@/domain/application/use-cases/fazendas/list-fazendas-use-case'
import { UpdateFazendaUseCase } from '@/domain/application/use-cases/fazendas/update-fazenda-use-case'
import { CurrentUser, type SessionUser } from '@/infra/http/decorators/current-user.decorator'
import { RequiresPermission } from '@/infra/http/decorators/requires-permission.decorator'
import { CustomHttpException } from '@/infra/http/exceptions/custom-http.exception'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation.pipe'
import { FazendaPresenter } from '@/infra/http/presenters/admin/fazenda-presenter'

const listFazendasQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
})

const createFazendaBodySchema = z
  .object({
    empresaId: z.string().min(1),
    nome: z.string().min(1).max(200),
    enderecoLogradouro: z.string().max(200).nullish(),
    enderecoNumero: z.string().max(20).nullish(),
    enderecoBairro: z.string().max(100).nullish(),
    enderecoCep: z.string().max(9).nullish(),
    municipio: z.string().max(100).nullish(),
    uf: z.string().length(2).nullish(),
    latitude: z.number().nullish(),
    longitude: z.number().nullish(),
    car: z.string().max(100).nullish(),
    nirfIncra: z.string().max(50).nullish(),
    areaTotalHa: z.number().nonnegative().nullish(),
  })
  .strict()

const updateFazendaBodySchema = z
  .object({
    nome: z.string().min(1).max(200).optional(),
    enderecoLogradouro: z.string().max(200).nullish(),
    enderecoNumero: z.string().max(20).nullish(),
    enderecoBairro: z.string().max(100).nullish(),
    enderecoCep: z.string().max(9).nullish(),
    municipio: z.string().max(100).nullish(),
    uf: z.string().length(2).nullish(),
    latitude: z.number().nullish(),
    longitude: z.number().nullish(),
    car: z.string().max(100).nullish(),
    nirfIncra: z.string().max(50).nullish(),
    areaTotalHa: z.number().nonnegative().nullish(),
  })
  .strict()

@Controller('fazendas')
export class FazendasController {
  constructor(
    private readonly listFazendas: ListFazendasUseCase,
    private readonly createFazenda: CreateFazendaUseCase,
    private readonly updateFazenda: UpdateFazendaUseCase,
    private readonly deleteFazenda: DeleteFazendaUseCase,
  ) {}

  private requireTenant(user: SessionUser): string {
    if (!user.tenantId) throw CustomHttpException.forbidden()
    return user.tenantId
  }

  @Get()
  @RequiresPermission('fazenda:read')
  async list(
    @Query(new ZodValidationPipe(listFazendasQuerySchema)) query: z.infer<typeof listFazendasQuerySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.listFazendas.execute({
      tenantId,
      page: query.page,
      perPage: query.perPage,
    })
    if (result.isLeft()) throw CustomHttpException.fromUseCaseError(result.value)

    const { items, total, page, perPage, totalPages } = result.value
    return {
      fazendas: items.map((fazenda) => FazendaPresenter.toHTTP(fazenda)),
      total,
      page,
      perPage,
      totalPages,
    }
  }

  @Post()
  @RequiresPermission('fazenda:create')
  async create(
    @Body(new ZodValidationPipe(createFazendaBodySchema)) body: z.infer<typeof createFazendaBodySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.createFazenda.execute({
      tenantId,
      empresaId: body.empresaId,
      nome: body.nome,
      enderecoLogradouro: body.enderecoLogradouro,
      enderecoNumero: body.enderecoNumero,
      enderecoBairro: body.enderecoBairro,
      enderecoCep: body.enderecoCep,
      municipio: body.municipio,
      uf: body.uf,
      latitude: body.latitude,
      longitude: body.longitude,
      car: body.car,
      nirfIncra: body.nirfIncra,
      areaTotalHa: body.areaTotalHa,
    })
    if (result.isLeft()) throw CustomHttpException.fromUseCaseError(result.value)
    return { fazenda: FazendaPresenter.toHTTP(result.value.fazenda) }
  }

  @Patch(':id')
  @RequiresPermission('fazenda:update')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateFazendaBodySchema)) body: z.infer<typeof updateFazendaBodySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.updateFazenda.execute({
      tenantId,
      fazendaId: id,
      nome: body.nome,
      enderecoLogradouro: body.enderecoLogradouro,
      enderecoNumero: body.enderecoNumero,
      enderecoBairro: body.enderecoBairro,
      enderecoCep: body.enderecoCep,
      municipio: body.municipio,
      uf: body.uf,
      latitude: body.latitude,
      longitude: body.longitude,
      car: body.car,
      nirfIncra: body.nirfIncra,
      areaTotalHa: body.areaTotalHa,
    })
    if (result.isLeft()) {
      if (result.value instanceof FazendaNotFoundError) {
        throw new CustomHttpException('FazendaNotFound', result.value.message, 404)
      }
      throw CustomHttpException.fromUseCaseError(result.value)
    }
    return { fazenda: FazendaPresenter.toHTTP(result.value.fazenda) }
  }

  @Delete(':id')
  @RequiresPermission('fazenda:delete')
  async remove(@Param('id') id: string, @CurrentUser() user: SessionUser) {
    const tenantId = this.requireTenant(user)
    const result = await this.deleteFazenda.execute({ tenantId, fazendaId: id })
    if (result.isLeft()) {
      if (result.value instanceof FazendaNotFoundError) {
        throw new CustomHttpException('FazendaNotFound', result.value.message, 404)
      }
      throw CustomHttpException.fromUseCaseError(result.value)
    }
    return { fazenda: FazendaPresenter.toHTTP(result.value.fazenda) }
  }
}
