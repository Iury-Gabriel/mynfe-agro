import { Controller, Get, Param, Query } from '@nestjs/common'
import { z } from 'zod'

import { LoteNotFoundError } from '@/domain/application/use-cases/errors/lote-not-found-error'
import { GetLoteRastreabilidadeUseCase } from '@/domain/application/use-cases/estoque/get-lote-rastreabilidade-use-case'
import { ListLotesUseCase } from '@/domain/application/use-cases/estoque/list-lotes-use-case'
import { CurrentUser, type SessionUser } from '@/infra/http/decorators/current-user.decorator'
import { RequiresPermission } from '@/infra/http/decorators/requires-permission.decorator'
import { CustomHttpException } from '@/infra/http/exceptions/custom-http.exception'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation.pipe'
import { ColheitaPresenter } from '@/infra/http/presenters/admin/colheita-presenter'
import { LotePresenter } from '@/infra/http/presenters/admin/lote-presenter'
import { LoteRastreabilidadeJusantePresenter } from '@/infra/http/presenters/admin/lote-rastreabilidade-presenter'

const listLotesQuerySchema = z
  .object({
    empresaId: z.string().min(1),
    page: z.coerce.number().int().min(1).default(1),
    perPage: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()

@Controller('lotes')
export class LotesController {
  constructor(
    private readonly listLotes: ListLotesUseCase,
    private readonly getRastreabilidade: GetLoteRastreabilidadeUseCase,
  ) {}

  private requireTenant(user: SessionUser): string {
    if (!user.tenantId) throw CustomHttpException.forbidden()
    return user.tenantId
  }

  @Get()
  @RequiresPermission('lote:read')
  async list(
    @Query(new ZodValidationPipe(listLotesQuerySchema)) query: z.infer<typeof listLotesQuerySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.listLotes.execute({
      tenantId,
      empresaId: query.empresaId,
      page: query.page,
      perPage: query.perPage,
    })
    if (result.isLeft()) throw CustomHttpException.fromUseCaseError(result.value)

    const { items, total, page, perPage, totalPages } = result.value
    return {
      lotes: items.map((lote) => LotePresenter.toHTTP(lote)),
      total,
      page,
      perPage,
      totalPages,
    }
  }

  @Get(':id/rastreabilidade')
  @RequiresPermission('lote:read')
  async rastreabilidade(@Param('id') id: string, @CurrentUser() user: SessionUser) {
    const tenantId = this.requireTenant(user)
    const result = await this.getRastreabilidade.execute({ tenantId, loteId: id })
    if (result.isLeft()) {
      if (result.value instanceof LoteNotFoundError) {
        throw new CustomHttpException('LoteNotFound', result.value.message, 404)
      }
      throw CustomHttpException.fromUseCaseError(result.value)
    }

    const { lote, montante, jusante } = result.value
    return {
      lote: LotePresenter.toHTTP(lote),
      montante: {
        colheita: montante.colheita ? ColheitaPresenter.toHTTP(montante.colheita) : null,
        safraId: montante.safraId,
        areaId: montante.areaId,
      },
      jusante: {
        pedidoItens: jusante.pedidoItens.map((item) =>
          LoteRastreabilidadeJusantePresenter.pedidoItemToHTTP(item),
        ),
        remessaItens: jusante.remessaItens.map((item) =>
          LoteRastreabilidadeJusantePresenter.remessaItemToHTTP(item),
        ),
      },
    }
  }
}
