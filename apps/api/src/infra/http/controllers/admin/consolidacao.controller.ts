import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import { z } from 'zod'

import type { UseCaseError } from '@/core/errors/use-case-error'

import { TransicaoInvalidaError } from '@/domain/application/use-cases/errors/transicao-invalida-error'
import { ConsolidarRemessasUseCase } from '@/domain/application/use-cases/vendas/consolidar-remessas-use-case'
import { PreviewConsolidacaoUseCase } from '@/domain/application/use-cases/vendas/preview-consolidacao-use-case'
import { CurrentUser, type SessionUser } from '@/infra/http/decorators/current-user.decorator'
import { RequiresPermission } from '@/infra/http/decorators/requires-permission.decorator'
import { CustomHttpException } from '@/infra/http/exceptions/custom-http.exception'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation.pipe'
import { PedidoPresenter } from '@/infra/http/presenters/admin/pedido-presenter'
import { RemessaPresenter } from '@/infra/http/presenters/admin/remessa-presenter'

function translateConsolidacaoError(err: UseCaseError): CustomHttpException {
  if (err instanceof TransicaoInvalidaError) {
    return new CustomHttpException(err.kind, err.message, 409)
  }
  return CustomHttpException.fromUseCaseError(err)
}

const previewQuerySchema = z
  .object({
    empresaId: z.string().min(1),
    clienteId: z.string().min(1),
    periodoInicio: z.coerce.date(),
    periodoFim: z.coerce.date(),
  })
  .strict()

const consolidarBodySchema = z
  .object({
    empresaId: z.string().min(1),
    clienteId: z.string().min(1),
    periodoInicio: z.coerce.date(),
    periodoFim: z.coerce.date(),
    observacoes: z.string().max(2000).nullish(),
  })
  .strict()

@Controller('consolidacao')
export class ConsolidacaoController {
  constructor(
    private readonly previewConsolidacao: PreviewConsolidacaoUseCase,
    private readonly consolidarRemessas: ConsolidarRemessasUseCase,
  ) {}

  private requireTenant(user: SessionUser): string {
    if (!user.tenantId) throw CustomHttpException.forbidden()
    return user.tenantId
  }

  @Get('preview')
  @RequiresPermission('consolidacao:create')
  async preview(
    @Query(new ZodValidationPipe(previewQuerySchema)) query: z.infer<typeof previewQuerySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.previewConsolidacao.execute({
      tenantId,
      empresaFaturadoraId: query.empresaId,
      clienteId: query.clienteId,
      periodoInicio: query.periodoInicio,
      periodoFim: query.periodoFim,
    })
    if (result.isLeft()) throw translateConsolidacaoError(result.value)

    return {
      remessas: result.value.remessas.map((remessa) => RemessaPresenter.toHTTP(remessa)),
      itens: result.value.itens,
      valorTotal: result.value.valorTotal,
    }
  }

  @Post()
  @RequiresPermission('consolidacao:create')
  async consolidar(
    @Body(new ZodValidationPipe(consolidarBodySchema))
    body: z.infer<typeof consolidarBodySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.consolidarRemessas.execute({
      tenantId,
      empresaFaturadoraId: body.empresaId,
      clienteId: body.clienteId,
      periodoInicio: body.periodoInicio,
      periodoFim: body.periodoFim,
      observacoes: body.observacoes,
    })
    if (result.isLeft()) throw translateConsolidacaoError(result.value)

    return {
      pedido: PedidoPresenter.toHTTP(result.value.pedido, result.value.remessas),
      remessas: result.value.remessas.map((remessa) => RemessaPresenter.toHTTP(remessa)),
    }
  }
}
