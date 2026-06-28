import { Controller, Get, Query } from '@nestjs/common'
import { z } from 'zod'

import { ListFilaFaturamentoUseCase } from '@/domain/application/use-cases/faturamento/list-fila-faturamento-use-case'
import { CurrentUser, type SessionUser } from '@/infra/http/decorators/current-user.decorator'
import { RequiresPermission } from '@/infra/http/decorators/requires-permission.decorator'
import { CustomHttpException } from '@/infra/http/exceptions/custom-http.exception'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation.pipe'
import { PedidoPresenter } from '@/infra/http/presenters/admin/pedido-presenter'

const filaQuerySchema = z
  .object({
    empresaId: z.string().min(1),
    clienteId: z.string().min(1).optional(),
    page: z.coerce.number().int().min(1).default(1),
    perPage: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()

@Controller('fila-faturamento')
export class FilaFaturamentoController {
  constructor(private readonly listFila: ListFilaFaturamentoUseCase) {}

  private requireTenant(user: SessionUser): string {
    if (!user.tenantId) throw CustomHttpException.forbidden()
    return user.tenantId
  }

  @Get()
  @RequiresPermission('nota:read')
  async list(
    @Query(new ZodValidationPipe(filaQuerySchema)) query: z.infer<typeof filaQuerySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.listFila.execute({
      tenantId,
      empresaEmitenteId: query.empresaId,
      clienteId: query.clienteId,
      page: query.page,
      perPage: query.perPage,
    })
    if (result.isLeft()) throw CustomHttpException.fromUseCaseError(result.value)

    const { items, total, page, perPage, totalPages } = result.value
    return {
      pedidos: items.map((pedido) => PedidoPresenter.toHTTP(pedido)),
      total,
      page,
      perPage,
      totalPages,
    }
  }
}
