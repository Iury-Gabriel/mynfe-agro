import type { UniqueEntityID } from '@/core/entities/unique-entity-id'
import type { CnpjCpf } from '@/domain/enterprise/entities/value-objects/cnpj-cpf'

import { AggregateRoot } from '@/core/entities/aggregate-root'

export const TIPOS_PESSOA = ['PJ', 'PF'] as const

export type TipoPessoa = (typeof TIPOS_PESSOA)[number]

export const AMBIENTES_FISCAIS = ['homologacao', 'producao'] as const

export type AmbienteFiscal = (typeof AMBIENTES_FISCAIS)[number]

export const EMPRESA_STATUSES = ['ativo', 'inativo'] as const

export type EmpresaStatus = (typeof EMPRESA_STATUSES)[number]

export interface EmpresaEndereco {
  logradouro: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  municipio: string | null
  uf: string | null
  cep: string | null
}

export interface EmpresaProps {
  tenantId: string
  tipoPessoa: TipoPessoa
  razaoSocial: string
  nomeFantasia: string | null
  cnpjCpf: CnpjCpf
  inscricaoEstadual: string | null
  ieProdutorRural: string | null
  regimeTributario: string
  crt: string
  ambienteFiscal: AmbienteFiscal
  serieNfe: number | null
  proximaNumeracaoNfe: number
  plugnotasConfig: Record<string, unknown> | null
  status: EmpresaStatus
  endereco: EmpresaEndereco
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface UpdateEmpresaCadastro {
  razaoSocial?: string
  nomeFantasia?: string | null
  cnpjCpf?: CnpjCpf
  inscricaoEstadual?: string | null
  ieProdutorRural?: string | null
  regimeTributario?: string
  crt?: string
  ambienteFiscal?: AmbienteFiscal
  serieNfe?: number | null
  endereco?: Partial<EmpresaEndereco>
}

const EMPTY_ENDERECO: EmpresaEndereco = {
  logradouro: null,
  numero: null,
  complemento: null,
  bairro: null,
  municipio: null,
  uf: null,
  cep: null,
}

export class Empresa extends AggregateRoot<EmpresaProps> {
  get tenantId() {
    return this.props.tenantId
  }

  get tipoPessoa() {
    return this.props.tipoPessoa
  }

  get razaoSocial() {
    return this.props.razaoSocial
  }

  get nomeFantasia() {
    return this.props.nomeFantasia
  }

  get cnpjCpf() {
    return this.props.cnpjCpf
  }

  get inscricaoEstadual() {
    return this.props.inscricaoEstadual
  }

  get ieProdutorRural() {
    return this.props.ieProdutorRural
  }

  get regimeTributario() {
    return this.props.regimeTributario
  }

  get crt() {
    return this.props.crt
  }

  get ambienteFiscal() {
    return this.props.ambienteFiscal
  }

  get serieNfe() {
    return this.props.serieNfe
  }

  get proximaNumeracaoNfe() {
    return this.props.proximaNumeracaoNfe
  }

  get plugnotasConfig(): Readonly<Record<string, unknown>> | null {
    return this.props.plugnotasConfig
  }

  get status() {
    return this.props.status
  }

  get endereco(): Readonly<EmpresaEndereco> {
    return this.props.endereco
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

  activate(): void {
    this.props.status = 'ativo'
    this.touch()
  }

  deactivate(): void {
    this.props.status = 'inativo'
    this.touch()
  }

  reservarNumeracaoNfe(): number {
    const numero = this.props.proximaNumeracaoNfe
    this.props.proximaNumeracaoNfe = numero + 1
    this.touch()
    return numero
  }

  updateCadastro(input: UpdateEmpresaCadastro): void {
    if (input.razaoSocial !== undefined) this.props.razaoSocial = input.razaoSocial
    if (input.nomeFantasia !== undefined) this.props.nomeFantasia = input.nomeFantasia
    if (input.cnpjCpf !== undefined) this.props.cnpjCpf = input.cnpjCpf
    if (input.inscricaoEstadual !== undefined) this.props.inscricaoEstadual = input.inscricaoEstadual
    if (input.ieProdutorRural !== undefined) this.props.ieProdutorRural = input.ieProdutorRural
    if (input.regimeTributario !== undefined) this.props.regimeTributario = input.regimeTributario
    if (input.crt !== undefined) this.props.crt = input.crt
    if (input.ambienteFiscal !== undefined) this.props.ambienteFiscal = input.ambienteFiscal
    if (input.serieNfe !== undefined) this.props.serieNfe = input.serieNfe
    if (input.endereco !== undefined) {
      this.props.endereco = { ...this.props.endereco, ...input.endereco }
    }
    this.touch()
  }

  static create(
    props: Omit<
      EmpresaProps,
      | 'nomeFantasia'
      | 'inscricaoEstadual'
      | 'ieProdutorRural'
      | 'serieNfe'
      | 'proximaNumeracaoNfe'
      | 'plugnotasConfig'
      | 'status'
      | 'endereco'
      | 'deletedAt'
    > & {
      nomeFantasia?: string | null
      inscricaoEstadual?: string | null
      ieProdutorRural?: string | null
      serieNfe?: number | null
      proximaNumeracaoNfe?: number
      plugnotasConfig?: Record<string, unknown> | null
      status?: EmpresaStatus
      endereco?: Partial<EmpresaEndereco>
      deletedAt?: Date | null
    },
    id?: UniqueEntityID,
  ): Empresa {
    return new Empresa(
      {
        ...props,
        nomeFantasia: props.nomeFantasia ?? null,
        inscricaoEstadual: props.inscricaoEstadual ?? null,
        ieProdutorRural: props.ieProdutorRural ?? null,
        serieNfe: props.serieNfe ?? null,
        proximaNumeracaoNfe: props.proximaNumeracaoNfe ?? 1,
        plugnotasConfig: props.plugnotasConfig ?? null,
        status: props.status ?? 'ativo',
        endereco: { ...EMPTY_ENDERECO, ...props.endereco },
        deletedAt: props.deletedAt ?? null,
      },
      id,
    )
  }
}
