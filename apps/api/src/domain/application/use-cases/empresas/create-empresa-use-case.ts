import { Injectable } from '@nestjs/common'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { EmpresaRepository } from '@/domain/application/repositories/empresa-repository'
import { RegistrarAuditoriaUseCase } from '@/domain/application/use-cases/auditoria/registrar-auditoria-use-case'
import { InvalidCnpjCpfError } from '@/domain/application/use-cases/errors/invalid-cnpj-cpf-error'
import {
  Empresa,
  type AmbienteFiscal,
  type EmpresaEndereco,
  type TipoPessoa,
} from '@/domain/enterprise/entities/empresa'
import { CnpjCpf } from '@/domain/enterprise/entities/value-objects/cnpj-cpf'

export interface CreateEmpresaInput {
  tenantId: string
  tipoPessoa: TipoPessoa
  razaoSocial: string
  nomeFantasia?: string | null
  cnpjCpf: string
  inscricaoEstadual?: string | null
  ieProdutorRural?: string | null
  regimeTributario: string
  crt: string
  ambienteFiscal: AmbienteFiscal
  serieNfe?: number | null
  endereco?: Partial<EmpresaEndereco>
}

export interface CreateEmpresaOutput {
  empresa: Empresa
}

type CreateEmpresaResult = Either<InvalidCnpjCpfError | UnexpectedError, CreateEmpresaOutput>

@Injectable()
export class CreateEmpresaUseCase {
  constructor(
    private readonly empresas: EmpresaRepository,
    private readonly registrarAuditoria: RegistrarAuditoriaUseCase,
  ) {}

  async execute(input: CreateEmpresaInput): Promise<CreateEmpresaResult> {
    const cnpjCpfResult = CnpjCpf.create(input.cnpjCpf)
    if (cnpjCpfResult.isLeft()) return left(cnpjCpfResult.value)

    try {
      const empresa = Empresa.create({
        tenantId: input.tenantId,
        tipoPessoa: input.tipoPessoa,
        razaoSocial: input.razaoSocial,
        nomeFantasia: input.nomeFantasia ?? null,
        cnpjCpf: cnpjCpfResult.value,
        inscricaoEstadual: input.inscricaoEstadual ?? null,
        ieProdutorRural: input.ieProdutorRural ?? null,
        regimeTributario: input.regimeTributario,
        crt: input.crt,
        ambienteFiscal: input.ambienteFiscal,
        serieNfe: input.serieNfe ?? null,
        endereco: input.endereco,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await this.empresas.create(empresa)

      await this.registrarAuditoria.execute({
        tenantId: input.tenantId,
        entidade: 'empresa',
        entidadeId: empresa.id.toString(),
        acao: 'criar',
        dadosDepois: { razaoSocial: empresa.razaoSocial, status: empresa.status },
      })

      return right({ empresa })
    } catch (err) {
      console.error('[CreateEmpresaUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
