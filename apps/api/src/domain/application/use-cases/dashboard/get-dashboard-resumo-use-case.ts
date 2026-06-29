import { Injectable } from '@nestjs/common'

import type { DashboardResumo } from '@/domain/application/repositories/dashboard-repository'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { DashboardRepository } from '@/domain/application/repositories/dashboard-repository'

export interface GetDashboardResumoInput {
  tenantId: string
  empresaId: string
  periodoInicio: Date
  periodoFim: Date
}

export interface GetDashboardResumoOutput {
  resumo: DashboardResumo
}

type GetDashboardResumoResult = Either<UnexpectedError, GetDashboardResumoOutput>

@Injectable()
export class GetDashboardResumoUseCase {
  constructor(private readonly dashboard: DashboardRepository) {}

  async execute(input: GetDashboardResumoInput): Promise<GetDashboardResumoResult> {
    try {
      const resumo = await this.dashboard.resumo(input.tenantId, input.empresaId, {
        periodoInicio: input.periodoInicio,
        periodoFim: input.periodoFim,
      })

      return right({ resumo })
    } catch (err) {
      console.error('[GetDashboardResumoUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
