import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common'
import { z } from 'zod'

import { CreateCustoProducaoUseCase } from '@/domain/application/use-cases/custos-producao/create-custo-producao-use-case'
import { DeleteCustoProducaoUseCase } from '@/domain/application/use-cases/custos-producao/delete-custo-producao-use-case'
import { ListCustosProducaoUseCase } from '@/domain/application/use-cases/custos-producao/list-custos-producao-use-case'
import { CustoProducaoNotFoundError } from '@/domain/application/use-cases/errors/custo-producao-not-found-error'
import { CUSTO_PRODUCAO_TIPOS } from '@/domain/enterprise/entities/custo-producao'
import { CurrentUser, type SessionUser } from '@/infra/http/decorators/current-user.decorator'
import { RequiresPermission } from '@/infra/http/decorators/requires-permission.decorator'
import { CustomHttpException } from '@/infra/http/exceptions/custom-http.exception'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation.pipe'
import { CustoProducaoPresenter } from '@/infra/http/presenters/admin/custo-producao-presenter'

const listCustosQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
})

const createCustoBodySchema = z
  .object({
    safraId: z.string().min(1).nullish(),
    areaId: z.string().min(1).nullish(),
    tipo: z.enum(CUSTO_PRODUCAO_TIPOS),
    descricao: z.string().min(1).max(200),
    valor: z.number().nonnegative(),
    data: z.coerce.date(),
  })
  .strict()

@Controller('custos-producao')
export class CustosProducaoController {
  constructor(
    private readonly listCustos: ListCustosProducaoUseCase,
    private readonly createCusto: CreateCustoProducaoUseCase,
    private readonly deleteCusto: DeleteCustoProducaoUseCase,
  ) {}

  private requireTenant(user: SessionUser): string {
    if (!user.tenantId) throw CustomHttpException.forbidden()
    return user.tenantId
  }

  @Get()
  @RequiresPermission('custo:read')
  async list(
    @Query(new ZodValidationPipe(listCustosQuerySchema)) query: z.infer<typeof listCustosQuerySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.listCustos.execute({
      tenantId,
      page: query.page,
      perPage: query.perPage,
    })
    if (result.isLeft()) throw CustomHttpException.fromUseCaseError(result.value)

    const { items, total, page, perPage, totalPages } = result.value
    return {
      custos: items.map((custo) => CustoProducaoPresenter.toHTTP(custo)),
      total,
      page,
      perPage,
      totalPages,
    }
  }

  @Post()
  @RequiresPermission('custo:create')
  async create(
    @Body(new ZodValidationPipe(createCustoBodySchema)) body: z.infer<typeof createCustoBodySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.createCusto.execute({
      tenantId,
      safraId: body.safraId,
      areaId: body.areaId,
      tipo: body.tipo,
      descricao: body.descricao,
      valor: body.valor,
      data: body.data,
    })
    if (result.isLeft()) throw CustomHttpException.fromUseCaseError(result.value)
    return { custo: CustoProducaoPresenter.toHTTP(result.value.custo) }
  }

  @Delete(':id')
  @RequiresPermission('custo:delete')
  async remove(@Param('id') id: string, @CurrentUser() user: SessionUser) {
    const tenantId = this.requireTenant(user)
    const result = await this.deleteCusto.execute({ tenantId, custoId: id })
    if (result.isLeft()) {
      if (result.value instanceof CustoProducaoNotFoundError) {
        throw new CustomHttpException('CustoProducaoNotFound', result.value.message, 404)
      }
      throw CustomHttpException.fromUseCaseError(result.value)
    }
    return { custo: CustoProducaoPresenter.toHTTP(result.value.custo) }
  }
}
