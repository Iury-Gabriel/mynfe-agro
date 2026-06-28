import { Injectable } from '@nestjs/common'

import type { AmbienteFiscal, Empresa, EmpresaEndereco } from '@/domain/enterprise/entities/empresa'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { EmpresaRepository } from '@/domain/application/repositories/empresa-repository'
import { RegistrarAuditoriaUseCase } from '@/domain/application/use-cases/auditoria/registrar-auditoria-use-case'
import { EmpresaNotFoundError } from '@/domain/application/use-cases/errors/empresa-not-found-error'
import { InvalidCnpjCpfError } from '@/domain/application/use-cases/errors/invalid-cnpj-cpf-error'
import { CnpjCpf } from '@/domain/enterprise/entities/value-objects/cnpj-cpf'

export interface UpdateEmpresaInput {
  tenantId: string
  empresaId: string
  razaoSocial?: string
  nomeFantasia?: string | null
  cnpjCpf?: string
  inscricaoEstadual?: string | null
  ieProdutorRural?: string | null
  regimeTributario?: string
  crt?: string
  ambienteFiscal?: AmbienteFiscal
  serieNfe?: number | null
  endereco?: Partial<EmpresaEndereco>
}

export interface UpdateEmpresaOutput {
  empresa: Empresa
}

type UpdateEmpresaResult = Either<
  EmpresaNotFoundError | InvalidCnpjCpfError | UnexpectedError,
  UpdateEmpresaOutput
>

@Injectable()
export class UpdateEmpresaUseCase {
  constructor(
    private readonly empresas: EmpresaRepository,
    private readonly registrarAuditoria: RegistrarAuditoriaUseCase,
  ) {}

  async execute(input: UpdateEmpresaInput): Promise<UpdateEmpresaResult> {
    const empresa = await this.empresas.findById(input.empresaId, input.tenantId)
    if (!empresa) return left(new EmpresaNotFoundError())

    let cnpjCpf: CnpjCpf | undefined
    if (input.cnpjCpf !== undefined) {
      const cnpjCpfResult = CnpjCpf.create(input.cnpjCpf)
      if (cnpjCpfResult.isLeft()) return left(cnpjCpfResult.value)
      cnpjCpf = cnpjCpfResult.value
    }

    const dadosAntes = { razaoSocial: empresa.razaoSocial, status: empresa.status }

    empresa.updateCadastro({
      razaoSocial: input.razaoSocial,
      nomeFantasia: input.nomeFantasia,
      cnpjCpf,
      inscricaoEstadual: input.inscricaoEstadual,
      ieProdutorRural: input.ieProdutorRural,
      regimeTributario: input.regimeTributario,
      crt: input.crt,
      ambienteFiscal: input.ambienteFiscal,
      serieNfe: input.serieNfe,
      endereco: input.endereco,
    })

    try {
      await this.empresas.save(empresa)
    } catch (err) {
      console.error('[UpdateEmpresaUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }

    await this.registrarAuditoria.execute({
      tenantId: input.tenantId,
      entidade: 'empresa',
      entidadeId: empresa.id.toString(),
      acao: 'editar',
      dadosAntes,
      dadosDepois: { razaoSocial: empresa.razaoSocial, status: empresa.status },
    })

    return right({ empresa })
  }
}
