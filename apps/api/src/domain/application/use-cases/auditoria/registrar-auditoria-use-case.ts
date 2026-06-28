import { Injectable } from '@nestjs/common'

import type { AuditoriaAcao } from '@/domain/enterprise/entities/auditoria-log'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { AuditoriaLogRepository } from '@/domain/application/repositories/auditoria-log-repository'
import { AuditoriaLog } from '@/domain/enterprise/entities/auditoria-log'

export interface RegistrarAuditoriaInput {
  tenantId: string
  usuarioId?: string | null
  entidade: string
  entidadeId: string
  acao: AuditoriaAcao
  dadosAntes?: Record<string, unknown> | null
  dadosDepois?: Record<string, unknown> | null
}

export interface RegistrarAuditoriaOutput {
  log: AuditoriaLog
}

type RegistrarAuditoriaResult = Either<UnexpectedError, RegistrarAuditoriaOutput>

@Injectable()
export class RegistrarAuditoriaUseCase {
  constructor(private readonly logs: AuditoriaLogRepository) {}

  async execute(input: RegistrarAuditoriaInput): Promise<RegistrarAuditoriaResult> {
    const log = AuditoriaLog.create({
      tenantId: input.tenantId,
      usuarioId: input.usuarioId ?? null,
      entidade: input.entidade,
      entidadeId: input.entidadeId,
      acao: input.acao,
      dadosAntes: input.dadosAntes ?? null,
      dadosDepois: input.dadosDepois ?? null,
    })

    try {
      await this.logs.create(log)
    } catch (err) {
      console.error('[RegistrarAuditoriaUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }

    return right({ log })
  }
}
