import { Injectable } from '@nestjs/common'

import type { Empresa } from '@/domain/enterprise/entities/empresa'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { EmpresaRepository } from '@/domain/application/repositories/empresa-repository'
import { RegistrarAuditoriaUseCase } from '@/domain/application/use-cases/auditoria/registrar-auditoria-use-case'
import { EmpresaNotFoundError } from '@/domain/application/use-cases/errors/empresa-not-found-error'

export interface DeactivateEmpresaInput {
  tenantId: string
  empresaId: string
}

export interface DeactivateEmpresaOutput {
  empresa: Empresa
}

type DeactivateEmpresaResult = Either<EmpresaNotFoundError | UnexpectedError, DeactivateEmpresaOutput>

@Injectable()
export class DeactivateEmpresaUseCase {
  constructor(
    private readonly empresas: EmpresaRepository,
    private readonly registrarAuditoria: RegistrarAuditoriaUseCase,
  ) {}

  async execute(input: DeactivateEmpresaInput): Promise<DeactivateEmpresaResult> {
    const empresa = await this.empresas.findById(input.empresaId, input.tenantId)
    if (!empresa) return left(new EmpresaNotFoundError())

    const statusAntes = empresa.status

    empresa.deactivate()

    try {
      await this.empresas.save(empresa)
    } catch (err) {
      console.error('[DeactivateEmpresaUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }

    await this.registrarAuditoria.execute({
      tenantId: input.tenantId,
      entidade: 'empresa',
      entidadeId: empresa.id.toString(),
      acao: 'editar',
      dadosAntes: { status: statusAntes },
      dadosDepois: { status: empresa.status },
    })

    return right({ empresa })
  }
}
