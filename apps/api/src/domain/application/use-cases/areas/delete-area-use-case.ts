import { Injectable } from '@nestjs/common'

import type { Area } from '@/domain/enterprise/entities/area'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { AreaRepository } from '@/domain/application/repositories/area-repository'
import { RegistrarAuditoriaUseCase } from '@/domain/application/use-cases/auditoria/registrar-auditoria-use-case'
import { AreaNotFoundError } from '@/domain/application/use-cases/errors/area-not-found-error'

export interface DeleteAreaInput {
  tenantId: string
  areaId: string
}

export interface DeleteAreaOutput {
  area: Area
}

type DeleteAreaResult = Either<AreaNotFoundError | UnexpectedError, DeleteAreaOutput>

@Injectable()
export class DeleteAreaUseCase {
  constructor(
    private readonly areas: AreaRepository,
    private readonly registrarAuditoria: RegistrarAuditoriaUseCase,
  ) {}

  async execute(input: DeleteAreaInput): Promise<DeleteAreaResult> {
    const area = await this.areas.findById(input.areaId, input.tenantId)
    if (!area) return left(new AreaNotFoundError())

    const dadosAntes = { identificacao: area.identificacao, deletedAt: area.deletedAt }

    area.softDelete()

    try {
      await this.areas.save(area)
    } catch (err) {
      console.error('[DeleteAreaUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }

    await this.registrarAuditoria.execute({
      tenantId: input.tenantId,
      entidade: 'area',
      entidadeId: area.id.toString(),
      acao: 'excluir',
      dadosAntes,
      dadosDepois: { deletedAt: area.deletedAt },
    })

    return right({ area })
  }
}
