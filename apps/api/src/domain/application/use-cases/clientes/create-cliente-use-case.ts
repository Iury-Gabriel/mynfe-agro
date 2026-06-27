import { Injectable } from '@nestjs/common'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { ClienteRepository } from '@/domain/application/repositories/cliente-repository'
import { InvalidCnpjCpfError } from '@/domain/application/use-cases/errors/invalid-cnpj-cpf-error'
import { Cliente, type IndicadorIe, type TipoPessoaCliente } from '@/domain/enterprise/entities/cliente'
import { ClienteEnderecoEntrega } from '@/domain/enterprise/entities/cliente-endereco-entrega'
import { CnpjCpf } from '@/domain/enterprise/entities/value-objects/cnpj-cpf'

export interface CreateClienteEnderecoEntregaInput {
  enderecoLogradouro?: string | null
  enderecoNumero?: string | null
  enderecoBairro?: string | null
  enderecoCep?: string | null
  municipio?: string | null
  uf?: string | null
  principal?: boolean
}

export interface CreateClienteInput {
  tenantId: string
  tipoPessoa: TipoPessoaCliente
  razaoSocialNome: string
  cnpjCpf: string
  inscricaoEstadual?: string | null
  indicadorIe: IndicadorIe
  contribuinteIcms: boolean
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
  enderecosEntrega?: CreateClienteEnderecoEntregaInput[]
}

export interface CreateClienteOutput {
  cliente: Cliente
}

type CreateClienteResult = Either<InvalidCnpjCpfError | UnexpectedError, CreateClienteOutput>

@Injectable()
export class CreateClienteUseCase {
  constructor(private readonly clientes: ClienteRepository) {}

  async execute(input: CreateClienteInput): Promise<CreateClienteResult> {
    const cnpjCpfResult = CnpjCpf.create(input.cnpjCpf)
    if (cnpjCpfResult.isLeft()) return left(cnpjCpfResult.value)

    try {
      const cliente = Cliente.create({
        tenantId: input.tenantId,
        tipoPessoa: input.tipoPessoa,
        razaoSocialNome: input.razaoSocialNome,
        cnpjCpf: cnpjCpfResult.value,
        inscricaoEstadual: input.inscricaoEstadual ?? null,
        indicadorIe: input.indicadorIe,
        contribuinteIcms: input.contribuinteIcms,
        enderecoLogradouro: input.enderecoLogradouro ?? null,
        enderecoNumero: input.enderecoNumero ?? null,
        enderecoBairro: input.enderecoBairro ?? null,
        enderecoCep: input.enderecoCep ?? null,
        municipio: input.municipio ?? null,
        codMunicipioIbge: input.codMunicipioIbge ?? null,
        uf: input.uf ?? null,
        email: input.email ?? null,
        telefone: input.telefone ?? null,
        vendedorUsuarioId: input.vendedorUsuarioId ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      for (const endereco of input.enderecosEntrega ?? []) {
        cliente.addEnderecoEntrega(
          ClienteEnderecoEntrega.create({
            tenantId: input.tenantId,
            clienteId: cliente.id.toString(),
            enderecoLogradouro: endereco.enderecoLogradouro ?? null,
            enderecoNumero: endereco.enderecoNumero ?? null,
            enderecoBairro: endereco.enderecoBairro ?? null,
            enderecoCep: endereco.enderecoCep ?? null,
            municipio: endereco.municipio ?? null,
            uf: endereco.uf ?? null,
            principal: endereco.principal ?? false,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        )
      }

      await this.clientes.create(cliente)

      return right({ cliente })
    } catch (err) {
      console.error('[CreateClienteUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
