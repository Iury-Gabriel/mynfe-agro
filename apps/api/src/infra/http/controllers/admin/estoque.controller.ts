import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import { z } from 'zod'

import { LoteNotFoundError } from '@/domain/application/use-cases/errors/lote-not-found-error'
import { AjustarEstoqueUseCase } from '@/domain/application/use-cases/estoque/ajustar-estoque-use-case'
import { GetPosicaoEstoqueUseCase } from '@/domain/application/use-cases/estoque/get-posicao-estoque-use-case'
import { ListMovimentacoesUseCase } from '@/domain/application/use-cases/estoque/list-movimentacoes-use-case'
import {
  ESTOQUE_MOVIMENTO_ORIGENS,
  ESTOQUE_MOVIMENTO_TIPOS,
} from '@/domain/enterprise/entities/estoque-movimento'
import { CurrentUser, type SessionUser } from '@/infra/http/decorators/current-user.decorator'
import { RequiresPermission } from '@/infra/http/decorators/requires-permission.decorator'
import { CustomHttpException } from '@/infra/http/exceptions/custom-http.exception'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation.pipe'
import { EstoqueMovimentoPresenter } from '@/infra/http/presenters/admin/estoque-movimento-presenter'
import { EstoqueSaldoPresenter } from '@/infra/http/presenters/admin/estoque-saldo-presenter'

const posicaoQuerySchema = z
  .object({
    empresaId: z.string().min(1),
    page: z.coerce.number().int().min(1).default(1),
    perPage: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()

const movimentosQuerySchema = z
  .object({
    empresaId: z.string().min(1),
    produtoId: z.string().min(1).optional(),
    loteId: z.string().min(1).optional(),
    tipo: z.enum(ESTOQUE_MOVIMENTO_TIPOS).optional(),
    origem: z.enum(ESTOQUE_MOVIMENTO_ORIGENS).optional(),
    page: z.coerce.number().int().min(1).default(1),
    perPage: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()

const ajusteBodySchema = z
  .object({
    empresaId: z.string().min(1),
    produtoId: z.string().min(1),
    loteId: z.string().min(1).nullish(),
    delta: z.number(),
    motivo: z.string().min(1).max(500),
    data: z.coerce.date(),
  })
  .strict()

@Controller('estoque')
export class EstoqueController {
  constructor(
    private readonly getPosicao: GetPosicaoEstoqueUseCase,
    private readonly listMovimentacoes: ListMovimentacoesUseCase,
    private readonly ajustarEstoque: AjustarEstoqueUseCase,
  ) {}

  private requireTenant(user: SessionUser): string {
    if (!user.tenantId) throw CustomHttpException.forbidden()
    return user.tenantId
  }

  @Get('posicao')
  @RequiresPermission('estoque:read')
  async posicao(
    @Query(new ZodValidationPipe(posicaoQuerySchema)) query: z.infer<typeof posicaoQuerySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.getPosicao.execute({
      tenantId,
      empresaId: query.empresaId,
      page: query.page,
      perPage: query.perPage,
    })
    if (result.isLeft()) throw CustomHttpException.fromUseCaseError(result.value)

    const { items, total, page, perPage, totalPages } = result.value
    return {
      saldos: items.map((saldo) => EstoqueSaldoPresenter.toHTTP(saldo)),
      total,
      page,
      perPage,
      totalPages,
    }
  }

  @Get('movimentos')
  @RequiresPermission('estoque:read')
  async movimentos(
    @Query(new ZodValidationPipe(movimentosQuerySchema))
    query: z.infer<typeof movimentosQuerySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.listMovimentacoes.execute({
      tenantId,
      empresaId: query.empresaId,
      filtros: {
        produtoId: query.produtoId,
        loteId: query.loteId,
        tipo: query.tipo,
        origem: query.origem,
      },
      page: query.page,
      perPage: query.perPage,
    })
    if (result.isLeft()) throw CustomHttpException.fromUseCaseError(result.value)

    const { items, total, page, perPage, totalPages } = result.value
    return {
      movimentos: items.map((movimento) => EstoqueMovimentoPresenter.toHTTP(movimento)),
      total,
      page,
      perPage,
      totalPages,
    }
  }

  @Post('ajustes')
  @RequiresPermission('estoque:ajuste')
  async ajustar(
    @Body(new ZodValidationPipe(ajusteBodySchema)) body: z.infer<typeof ajusteBodySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.ajustarEstoque.execute({
      tenantId,
      empresaId: body.empresaId,
      produtoId: body.produtoId,
      loteId: body.loteId,
      delta: body.delta,
      motivo: body.motivo,
      data: body.data,
      usuarioId: user.id,
    })
    if (result.isLeft()) {
      if (result.value instanceof LoteNotFoundError) {
        throw new CustomHttpException('LoteNotFound', result.value.message, 404)
      }
      throw CustomHttpException.fromUseCaseError(result.value)
    }

    return {
      movimento: EstoqueMovimentoPresenter.toHTTP(result.value.movimento),
      saldo: EstoqueSaldoPresenter.toHTTP(result.value.saldo),
    }
  }
}
