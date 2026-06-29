import { Injectable } from '@nestjs/common'

import type { AtividadeCampo } from '@/domain/enterprise/entities/atividade-campo'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { AtividadeCampoRepository } from '@/domain/application/repositories/atividade-campo-repository'
import { AtividadeCampoNotFoundError } from '@/domain/application/use-cases/errors/atividade-campo-not-found-error'

export interface DeleteAtividadeCampoInput {
  tenantId: string
  atividadeId: string
}

export interface DeleteAtividadeCampoOutput {
  atividade: AtividadeCampo
}

type DeleteAtividadeCampoResult = Either<
  AtividadeCampoNotFoundError | UnexpectedError,
  DeleteAtividadeCampoOutput
>

@Injectable()
export class DeleteAtividadeCampoUseCase {
  constructor(private readonly atividades: AtividadeCampoRepository) {}

  async execute(input: DeleteAtividadeCampoInput): Promise<DeleteAtividadeCampoResult> {
    const atividade = await this.atividades.findById(input.atividadeId, input.tenantId)
    if (!atividade) return left(new AtividadeCampoNotFoundError())

    atividade.softDelete()

    try {
      await this.atividades.save(atividade)
    } catch (err) {
      console.error('[DeleteAtividadeCampoUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }

    return right({ atividade })
  }
}
