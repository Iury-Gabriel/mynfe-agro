import { Injectable } from '@nestjs/common'

import type { Empresa } from '@/domain/enterprise/entities/empresa'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { EmpresaRepository } from '@/domain/application/repositories/empresa-repository'
import { EmpresaNotFoundError } from '@/domain/application/use-cases/errors/empresa-not-found-error'

export interface ActivateEmpresaInput {
  tenantId: string
  empresaId: string
}

export interface ActivateEmpresaOutput {
  empresa: Empresa
}

type ActivateEmpresaResult = Either<EmpresaNotFoundError | UnexpectedError, ActivateEmpresaOutput>

@Injectable()
export class ActivateEmpresaUseCase {
  constructor(private readonly empresas: EmpresaRepository) {}

  async execute(input: ActivateEmpresaInput): Promise<ActivateEmpresaResult> {
    const empresa = await this.empresas.findById(input.empresaId, input.tenantId)
    if (!empresa) return left(new EmpresaNotFoundError())

    empresa.activate()

    try {
      await this.empresas.save(empresa)
    } catch (err) {
      console.error('[ActivateEmpresaUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }

    return right({ empresa })
  }
}
