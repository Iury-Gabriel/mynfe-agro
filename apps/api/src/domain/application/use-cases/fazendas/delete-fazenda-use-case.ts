import { Injectable } from '@nestjs/common'

import type { Fazenda } from '@/domain/enterprise/entities/fazenda'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { FazendaRepository } from '@/domain/application/repositories/fazenda-repository'
import { RegistrarAuditoriaUseCase } from '@/domain/application/use-cases/auditoria/registrar-auditoria-use-case'
import { FazendaNotFoundError } from '@/domain/application/use-cases/errors/fazenda-not-found-error'

export interface DeleteFazendaInput {
  tenantId: string
  fazendaId: string
}

export interface DeleteFazendaOutput {
  fazenda: Fazenda
}

type DeleteFazendaResult = Either<FazendaNotFoundError | UnexpectedError, DeleteFazendaOutput>

@Injectable()
export class DeleteFazendaUseCase {
  constructor(
    private readonly fazendas: FazendaRepository,
    private readonly registrarAuditoria: RegistrarAuditoriaUseCase,
  ) {}

  async execute(input: DeleteFazendaInput): Promise<DeleteFazendaResult> {
    const fazenda = await this.fazendas.findById(input.fazendaId, input.tenantId)
    if (!fazenda) return left(new FazendaNotFoundError())

    const dadosAntes = { nome: fazenda.nome, deletedAt: fazenda.deletedAt }

    fazenda.softDelete()

    try {
      await this.fazendas.save(fazenda)
    } catch (err) {
      console.error('[DeleteFazendaUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }

    await this.registrarAuditoria.execute({
      tenantId: input.tenantId,
      entidade: 'fazenda',
      entidadeId: fazenda.id.toString(),
      acao: 'excluir',
      dadosAntes,
      dadosDepois: { deletedAt: fazenda.deletedAt },
    })

    return right({ fazenda })
  }
}
