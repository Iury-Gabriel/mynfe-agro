import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common'
import { z } from 'zod'

import { ClienteNotFoundError } from '@/domain/application/use-cases/errors/cliente-not-found-error'
import { ProdutoNotFoundError } from '@/domain/application/use-cases/errors/produto-not-found-error'
import { TabelaPrecoNotFoundError } from '@/domain/application/use-cases/errors/tabela-preco-not-found-error'
import { CreateTabelaPrecoUseCase } from '@/domain/application/use-cases/precos/create-tabela-preco-use-case'
import { DeleteTabelaPrecoUseCase } from '@/domain/application/use-cases/precos/delete-tabela-preco-use-case'
import { ListTabelaPrecosUseCase } from '@/domain/application/use-cases/precos/list-tabela-precos-use-case'
import { CurrentUser, type SessionUser } from '@/infra/http/decorators/current-user.decorator'
import { RequiresPermission } from '@/infra/http/decorators/requires-permission.decorator'
import { CustomHttpException } from '@/infra/http/exceptions/custom-http.exception'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation.pipe'
import { TabelaPrecoPresenter } from '@/infra/http/presenters/admin/tabela-preco-presenter'

const listTabelaPrecosQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
})

const createTabelaPrecoBodySchema = z
  .object({
    clienteId: z.string().min(1),
    produtoId: z.string().min(1),
    preco: z.number().nonnegative(),
    vigenciaInicio: z.coerce.date().nullish(),
    vigenciaFim: z.coerce.date().nullish(),
  })
  .strict()

@Controller('tabela-precos')
export class TabelaPrecosController {
  constructor(
    private readonly listTabelaPrecos: ListTabelaPrecosUseCase,
    private readonly createTabelaPreco: CreateTabelaPrecoUseCase,
    private readonly deleteTabelaPreco: DeleteTabelaPrecoUseCase,
  ) {}

  private requireTenant(user: SessionUser): string {
    if (!user.tenantId) throw CustomHttpException.forbidden()
    return user.tenantId
  }

  @Get()
  @RequiresPermission('preco:read')
  async list(
    @Query(new ZodValidationPipe(listTabelaPrecosQuerySchema)) query: z.infer<typeof listTabelaPrecosQuerySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.listTabelaPrecos.execute({
      tenantId,
      page: query.page,
      perPage: query.perPage,
    })
    if (result.isLeft()) throw CustomHttpException.fromUseCaseError(result.value)

    const { items, total, page, perPage, totalPages } = result.value
    return {
      tabelaPrecos: items.map((tabelaPreco) => TabelaPrecoPresenter.toHTTP(tabelaPreco)),
      total,
      page,
      perPage,
      totalPages,
    }
  }

  @Post()
  @RequiresPermission('preco:create')
  async create(
    @Body(new ZodValidationPipe(createTabelaPrecoBodySchema)) body: z.infer<typeof createTabelaPrecoBodySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.createTabelaPreco.execute({
      tenantId,
      clienteId: body.clienteId,
      produtoId: body.produtoId,
      preco: body.preco,
      vigenciaInicio: body.vigenciaInicio,
      vigenciaFim: body.vigenciaFim,
    })
    if (result.isLeft()) {
      if (
        result.value instanceof ClienteNotFoundError ||
        result.value instanceof ProdutoNotFoundError
      ) {
        throw new CustomHttpException(result.value.kind, result.value.message, 404)
      }
      throw CustomHttpException.fromUseCaseError(result.value)
    }
    return { tabelaPreco: TabelaPrecoPresenter.toHTTP(result.value.tabelaPreco) }
  }

  @Delete(':id')
  @RequiresPermission('preco:delete')
  async delete(@Param('id') id: string, @CurrentUser() user: SessionUser) {
    const tenantId = this.requireTenant(user)
    const result = await this.deleteTabelaPreco.execute({ tenantId, tabelaPrecoId: id })
    if (result.isLeft()) {
      if (result.value instanceof TabelaPrecoNotFoundError) {
        throw new CustomHttpException('TabelaPrecoNotFound', result.value.message, 404)
      }
      throw CustomHttpException.fromUseCaseError(result.value)
    }
    return { success: true }
  }
}
