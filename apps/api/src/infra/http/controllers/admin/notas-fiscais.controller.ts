import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { z } from 'zod'

import type { UseCaseError } from '@/core/errors/use-case-error'

import { EmpresaNotFoundError } from '@/domain/application/use-cases/errors/empresa-not-found-error'
import { NotaFiscalNotFoundError } from '@/domain/application/use-cases/errors/nota-fiscal-not-found-error'
import { NotaJaEmitidaError } from '@/domain/application/use-cases/errors/nota-ja-emitida-error'
import { PedidoNaoFaturavelError } from '@/domain/application/use-cases/errors/pedido-nao-faturavel-error'
import { PedidoNotFoundError } from '@/domain/application/use-cases/errors/pedido-not-found-error'
import { TransicaoFiscalInvalidaError } from '@/domain/application/use-cases/errors/transicao-fiscal-invalida-error'
import { CancelarNotaFiscalUseCase } from '@/domain/application/use-cases/faturamento/cancelar-nota-fiscal-use-case'
import { EmitirNotaFiscalUseCase } from '@/domain/application/use-cases/faturamento/emitir-nota-fiscal-use-case'
import { GetNotaFiscalUseCase } from '@/domain/application/use-cases/faturamento/get-nota-fiscal-use-case'
import { ListNotasFiscaisUseCase } from '@/domain/application/use-cases/faturamento/list-notas-fiscais-use-case'
import { NOTA_FISCAL_STATUSES } from '@/domain/enterprise/entities/nota-fiscal'
import { CurrentUser, type SessionUser } from '@/infra/http/decorators/current-user.decorator'
import { RequiresPermission } from '@/infra/http/decorators/requires-permission.decorator'
import { CustomHttpException } from '@/infra/http/exceptions/custom-http.exception'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation.pipe'
import { NotaFiscalPresenter } from '@/infra/http/presenters/admin/nota-fiscal-presenter'

function translateFiscalError(err: UseCaseError): CustomHttpException {
  if (err instanceof NotaFiscalNotFoundError) {
    return new CustomHttpException(err.kind, err.message, 404)
  }
  if (err instanceof EmpresaNotFoundError || err instanceof PedidoNotFoundError) {
    return new CustomHttpException(err.kind, err.message, 404)
  }
  if (err instanceof PedidoNaoFaturavelError) {
    return new CustomHttpException(err.kind, err.message, 409)
  }
  if (err instanceof NotaJaEmitidaError) {
    return new CustomHttpException(err.kind, err.message, 409)
  }
  if (err instanceof TransicaoFiscalInvalidaError) {
    return new CustomHttpException(err.kind, err.message, 409)
  }
  return CustomHttpException.fromUseCaseError(err)
}

const emitirBodySchema = z
  .object({
    empresaId: z.string().min(1),
    pedidoId: z.string().min(1),
    naturezaOperacao: z.string().min(1).max(255).nullish(),
  })
  .strict()

const listNotasQuerySchema = z
  .object({
    empresaId: z.string().min(1),
    status: z.enum(NOTA_FISCAL_STATUSES).optional(),
    clienteId: z.string().min(1).optional(),
    page: z.coerce.number().int().min(1).default(1),
    perPage: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()

const empresaQuerySchema = z.object({ empresaId: z.string().min(1) }).strict()

const cancelarBodySchema = z
  .object({
    empresaId: z.string().min(1),
    motivo: z.string().min(1).max(255).nullish(),
  })
  .strict()

@Controller('notas-fiscais')
export class NotasFiscaisController {
  constructor(
    private readonly emitirNota: EmitirNotaFiscalUseCase,
    private readonly listNotas: ListNotasFiscaisUseCase,
    private readonly getNota: GetNotaFiscalUseCase,
    private readonly cancelarNota: CancelarNotaFiscalUseCase,
  ) {}

  private requireTenant(user: SessionUser): string {
    if (!user.tenantId) throw CustomHttpException.forbidden()
    return user.tenantId
  }

  @Post('emitir')
  @RequiresPermission('nota:emitir')
  async emitir(
    @Body(new ZodValidationPipe(emitirBodySchema)) body: z.infer<typeof emitirBodySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.emitirNota.execute({
      tenantId,
      empresaEmitenteId: body.empresaId,
      pedidoId: body.pedidoId,
      naturezaOperacao: body.naturezaOperacao,
    })
    if (result.isLeft()) throw translateFiscalError(result.value)

    return { nota: NotaFiscalPresenter.toHTTP(result.value.nota) }
  }

  @Get()
  @RequiresPermission('nota:read')
  async list(
    @Query(new ZodValidationPipe(listNotasQuerySchema))
    query: z.infer<typeof listNotasQuerySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.listNotas.execute({
      tenantId,
      empresaEmitenteId: query.empresaId,
      filtros: { status: query.status, clienteId: query.clienteId },
      page: query.page,
      perPage: query.perPage,
    })
    if (result.isLeft()) throw translateFiscalError(result.value)

    const { items, total, page, perPage, totalPages } = result.value
    return {
      notas: items.map((nota) => NotaFiscalPresenter.toHTTP(nota)),
      total,
      page,
      perPage,
      totalPages,
    }
  }

  @Get(':id')
  @RequiresPermission('nota:read')
  async get(
    @Param('id') id: string,
    @Query(new ZodValidationPipe(empresaQuerySchema)) query: z.infer<typeof empresaQuerySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.getNota.execute({
      tenantId,
      empresaEmitenteId: query.empresaId,
      notaFiscalId: id,
    })
    if (result.isLeft()) throw translateFiscalError(result.value)

    return { nota: NotaFiscalPresenter.toHTTP(result.value.nota) }
  }

  @Post(':id/cancelar')
  @RequiresPermission('nota:cancelar')
  async cancelar(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(cancelarBodySchema)) body: z.infer<typeof cancelarBodySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.cancelarNota.execute({
      tenantId,
      empresaEmitenteId: body.empresaId,
      notaFiscalId: id,
      motivo: body.motivo,
    })
    if (result.isLeft()) throw translateFiscalError(result.value)

    return { nota: NotaFiscalPresenter.toHTTP(result.value.nota) }
  }
}
