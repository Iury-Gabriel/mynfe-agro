import type { UniqueEntityID } from '@/core/entities/unique-entity-id'
import type { ClienteEnderecoEntrega } from '@/domain/enterprise/entities/cliente-endereco-entrega'
import type { CnpjCpf } from '@/domain/enterprise/entities/value-objects/cnpj-cpf'

import { AggregateRoot } from '@/core/entities/aggregate-root'

export const TIPOS_PESSOA_CLIENTE = ['PJ', 'PF'] as const

export type TipoPessoaCliente = (typeof TIPOS_PESSOA_CLIENTE)[number]

export const INDICADORES_IE = ['1', '2', '9'] as const

export type IndicadorIe = (typeof INDICADORES_IE)[number]

export interface ClienteProps {
  tenantId: string
  tipoPessoa: TipoPessoaCliente
  razaoSocialNome: string
  cnpjCpf: CnpjCpf
  inscricaoEstadual: string | null
  indicadorIe: IndicadorIe
  contribuinteIcms: boolean
  enderecoLogradouro: string | null
  enderecoNumero: string | null
  enderecoBairro: string | null
  enderecoCep: string | null
  municipio: string | null
  codMunicipioIbge: string | null
  uf: string | null
  email: string | null
  telefone: string | null
  vendedorUsuarioId: string | null
  enderecosEntrega: ClienteEnderecoEntrega[]
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface UpdateClienteCadastro {
  tipoPessoa?: TipoPessoaCliente
  razaoSocialNome?: string
  cnpjCpf?: CnpjCpf
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

export class Cliente extends AggregateRoot<ClienteProps> {
  get tenantId() {
    return this.props.tenantId
  }

  get tipoPessoa() {
    return this.props.tipoPessoa
  }

  get razaoSocialNome() {
    return this.props.razaoSocialNome
  }

  get cnpjCpf() {
    return this.props.cnpjCpf
  }

  get inscricaoEstadual() {
    return this.props.inscricaoEstadual
  }

  get indicadorIe() {
    return this.props.indicadorIe
  }

  get contribuinteIcms() {
    return this.props.contribuinteIcms
  }

  get enderecoLogradouro() {
    return this.props.enderecoLogradouro
  }

  get enderecoNumero() {
    return this.props.enderecoNumero
  }

  get enderecoBairro() {
    return this.props.enderecoBairro
  }

  get enderecoCep() {
    return this.props.enderecoCep
  }

  get municipio() {
    return this.props.municipio
  }

  get codMunicipioIbge() {
    return this.props.codMunicipioIbge
  }

  get uf() {
    return this.props.uf
  }

  get email() {
    return this.props.email
  }

  get telefone() {
    return this.props.telefone
  }

  get vendedorUsuarioId() {
    return this.props.vendedorUsuarioId
  }

  get enderecosEntrega(): readonly ClienteEnderecoEntrega[] {
    return this.props.enderecosEntrega
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }

  get deletedAt() {
    return this.props.deletedAt
  }

  private touch(): void {
    this.props.updatedAt = new Date()
  }

  delete(): void {
    this.props.deletedAt = new Date()
    this.touch()
  }

  addEnderecoEntrega(endereco: ClienteEnderecoEntrega): void {
    this.props.enderecosEntrega.push(endereco)
    this.touch()
  }

  updateCadastro(input: UpdateClienteCadastro): void {
    if (input.tipoPessoa !== undefined) this.props.tipoPessoa = input.tipoPessoa
    if (input.razaoSocialNome !== undefined) this.props.razaoSocialNome = input.razaoSocialNome
    if (input.cnpjCpf !== undefined) this.props.cnpjCpf = input.cnpjCpf
    if (input.inscricaoEstadual !== undefined) this.props.inscricaoEstadual = input.inscricaoEstadual
    if (input.indicadorIe !== undefined) this.props.indicadorIe = input.indicadorIe
    if (input.contribuinteIcms !== undefined) this.props.contribuinteIcms = input.contribuinteIcms
    if (input.enderecoLogradouro !== undefined) this.props.enderecoLogradouro = input.enderecoLogradouro
    if (input.enderecoNumero !== undefined) this.props.enderecoNumero = input.enderecoNumero
    if (input.enderecoBairro !== undefined) this.props.enderecoBairro = input.enderecoBairro
    if (input.enderecoCep !== undefined) this.props.enderecoCep = input.enderecoCep
    if (input.municipio !== undefined) this.props.municipio = input.municipio
    if (input.codMunicipioIbge !== undefined) this.props.codMunicipioIbge = input.codMunicipioIbge
    if (input.uf !== undefined) this.props.uf = input.uf
    if (input.email !== undefined) this.props.email = input.email
    if (input.telefone !== undefined) this.props.telefone = input.telefone
    if (input.vendedorUsuarioId !== undefined) this.props.vendedorUsuarioId = input.vendedorUsuarioId
    this.touch()
  }

  static create(
    props: Omit<
      ClienteProps,
      | 'inscricaoEstadual'
      | 'enderecoLogradouro'
      | 'enderecoNumero'
      | 'enderecoBairro'
      | 'enderecoCep'
      | 'municipio'
      | 'codMunicipioIbge'
      | 'uf'
      | 'email'
      | 'telefone'
      | 'vendedorUsuarioId'
      | 'enderecosEntrega'
      | 'deletedAt'
    > & {
      inscricaoEstadual?: string | null
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
      enderecosEntrega?: ClienteEnderecoEntrega[]
      deletedAt?: Date | null
    },
    id?: UniqueEntityID,
  ): Cliente {
    return new Cliente(
      {
        ...props,
        inscricaoEstadual: props.inscricaoEstadual ?? null,
        enderecoLogradouro: props.enderecoLogradouro ?? null,
        enderecoNumero: props.enderecoNumero ?? null,
        enderecoBairro: props.enderecoBairro ?? null,
        enderecoCep: props.enderecoCep ?? null,
        municipio: props.municipio ?? null,
        codMunicipioIbge: props.codMunicipioIbge ?? null,
        uf: props.uf ?? null,
        email: props.email ?? null,
        telefone: props.telefone ?? null,
        vendedorUsuarioId: props.vendedorUsuarioId ?? null,
        enderecosEntrega: props.enderecosEntrega ?? [],
        deletedAt: props.deletedAt ?? null,
      },
      id,
    )
  }
}
