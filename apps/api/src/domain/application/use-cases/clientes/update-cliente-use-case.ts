import { Injectable } from '@nestjs/common'

import type { Cliente, IndicadorIe, TipoPessoaCliente } from '@/domain/enterprise/entities/cliente'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { ClienteRepository } from '@/domain/application/repositories/cliente-repository'
import { ClienteNotFoundError } from '@/domain/application/use-cases/errors/cliente-not-found-error'
import { InvalidCnpjCpfError } from '@/domain/application/use-cases/errors/invalid-cnpj-cpf-error'
import { CnpjCpf } from '@/domain/enterprise/entities/value-objects/cnpj-cpf'

export interface UpdateClienteInput {
  tenantId: string
  clienteId: string
  tipoPessoa?: TipoPessoaCliente
  razaoSocialNome?: string
  cnpjCpf?: string
  inscricaoEstadual?: string | null
  indicadorIe?: IndicadorIe
  contribuinteIcms?: boolean
  enderecoLogradouro?: string | null
  enderecoNumero?: string | null
  enderecoBairro?: string | null
  enderecoCep?: string | null
  municipio?: string | null
  codMunicipioIbge?: string | null
  uf?: string | null
  email?: string | null
  telefone?: string | null
  vendedorUsuarioId?: string | null
}

export interface UpdateClienteOutput {
  cliente: Cliente
}

type UpdateClienteResult = Either<
  ClienteNotFoundError | InvalidCnpjCpfError | UnexpectedError,
  UpdateClienteOutput
>

@Injectable()
export class UpdateClienteUseCase {
  constructor(private readonly clientes: ClienteRepository) {}

  async execute(input: UpdateClienteInput): Promise<UpdateClienteResult> {
    const cliente = await this.clientes.findById(input.clienteId, input.tenantId)
    if (!cliente) return left(new ClienteNotFoundError())

    let cnpjCpf: CnpjCpf | undefined
    if (input.cnpjCpf !== undefined) {
      const cnpjCpfResult = CnpjCpf.create(input.cnpjCpf)
      if (cnpjCpfResult.isLeft()) return left(cnpjCpfResult.value)
      cnpjCpf = cnpjCpfResult.value
    }

    cliente.updateCadastro({
      tipoPessoa: input.tipoPessoa,
      razaoSocialNome: input.razaoSocialNome,
      cnpjCpf,
      inscricaoEstadual: input.inscricaoEstadual,
      indicadorIe: input.indicadorIe,
      contribuinteIcms: input.contribuinteIcms,
      enderecoLogradouro: input.enderecoLogradouro,
      enderecoNumero: input.enderecoNumero,
      enderecoBairro: input.enderecoBairro,
      enderecoCep: input.enderecoCep,
      municipio: input.municipio,
      codMunicipioIbge: input.codMunicipioIbge,
      uf: input.uf,
      email: input.email,
      telefone: input.telefone,
      vendedorUsuarioId: input.vendedorUsuarioId,
    })

    try {
      await this.clientes.save(cliente)
    } catch (err) {
      console.error('[UpdateClienteUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }

    return right({ cliente })
  }
}
