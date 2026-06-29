import { Body, Controller, Post } from '@nestjs/common'
import { z } from 'zod'

import { RegistrarEmbalagemUseCase } from '@/domain/application/use-cases/estoque/registrar-embalagem-use-case'
import { CurrentUser, type SessionUser } from '@/infra/http/decorators/current-user.decorator'
import { RequiresPermission } from '@/infra/http/decorators/requires-permission.decorator'
import { CustomHttpException } from '@/infra/http/exceptions/custom-http.exception'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation.pipe'
import { EstoqueMovimentoPresenter } from '@/infra/http/presenters/admin/estoque-movimento-presenter'
import { LotePresenter } from '@/infra/http/presenters/admin/lote-presenter'

const registrarEmbalagemBodySchema = z
  .object({
    empresaId: z.string().min(1),
    produtoId: z.string().min(1),
    quantidade: z.number().positive(),
    data: z.coerce.date(),
    codigoLote: z.string().min(1).max(120).nullish(),
    validade: z.coerce.date().nullish(),
  })
  .strict()

@Controller('embalagens')
export class EmbalagensController {
  constructor(private readonly registrarEmbalagem: RegistrarEmbalagemUseCase) {}

  private requireTenant(user: SessionUser): string {
    if (!user.tenantId) throw CustomHttpException.forbidden()
    return user.tenantId
  }

  @Post()
  @RequiresPermission('embalagem:create')
  async registrar(
    @Body(new ZodValidationPipe(registrarEmbalagemBodySchema))
    body: z.infer<typeof registrarEmbalagemBodySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.registrarEmbalagem.execute({
      tenantId,
      empresaId: body.empresaId,
      produtoId: body.produtoId,
      quantidade: body.quantidade,
      data: body.data,
      codigoLote: body.codigoLote,
      validade: body.validade,
      usuarioId: user.id,
    })
    if (result.isLeft()) throw CustomHttpException.fromUseCaseError(result.value)

    return {
      lote: LotePresenter.toHTTP(result.value.lote),
      movimento: EstoqueMovimentoPresenter.toHTTP(result.value.movimento),
    }
  }
}
