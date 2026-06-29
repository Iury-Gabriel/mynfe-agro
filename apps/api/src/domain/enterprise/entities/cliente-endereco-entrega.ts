import type { UniqueEntityID } from '@/core/entities/unique-entity-id'

import { Entity } from '@/core/entities/entity'

export interface ClienteEnderecoEntregaProps {
  tenantId: string
  clienteId: string
  enderecoLogradouro: string | null
  enderecoNumero: string | null
  enderecoBairro: string | null
  enderecoCep: string | null
  municipio: string | null
  uf: string | null
  principal: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface UpdateClienteEnderecoEntrega {
  enderecoLogradouro?: string | null
  enderecoNumero?: string | null
  enderecoBairro?: string | null
  enderecoCep?: string | null
  municipio?: string | null
  uf?: string | null
  principal?: boolean
}

export class ClienteEnderecoEntrega extends Entity<ClienteEnderecoEntregaProps> {
  get tenantId() {
    return this.props.tenantId
  }

  get clienteId() {
    return this.props.clienteId
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

  get uf() {
    return this.props.uf
  }

  get principal() {
    return this.props.principal
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

  update(input: UpdateClienteEnderecoEntrega): void {
    if (input.enderecoLogradouro !== undefined) this.props.enderecoLogradouro = input.enderecoLogradouro
    if (input.enderecoNumero !== undefined) this.props.enderecoNumero = input.enderecoNumero
    if (input.enderecoBairro !== undefined) this.props.enderecoBairro = input.enderecoBairro
    if (input.enderecoCep !== undefined) this.props.enderecoCep = input.enderecoCep
    if (input.municipio !== undefined) this.props.municipio = input.municipio
    if (input.uf !== undefined) this.props.uf = input.uf
    if (input.principal !== undefined) this.props.principal = input.principal
    this.touch()
  }

  static create(
    props: Omit<
      ClienteEnderecoEntregaProps,
      | 'enderecoLogradouro'
      | 'enderecoNumero'
      | 'enderecoBairro'
      | 'enderecoCep'
      | 'municipio'
      | 'uf'
      | 'principal'
      | 'deletedAt'
    > & {
      enderecoLogradouro?: string | null
      enderecoNumero?: string | null
      enderecoBairro?: string | null
      enderecoCep?: string | null
      municipio?: string | null
      uf?: string | null
      principal?: boolean
      deletedAt?: Date | null
    },
    id?: UniqueEntityID,
  ): ClienteEnderecoEntrega {
    return new ClienteEnderecoEntrega(
      {
        ...props,
        enderecoLogradouro: props.enderecoLogradouro ?? null,
        enderecoNumero: props.enderecoNumero ?? null,
        enderecoBairro: props.enderecoBairro ?? null,
        enderecoCep: props.enderecoCep ?? null,
        municipio: props.municipio ?? null,
        uf: props.uf ?? null,
        principal: props.principal ?? false,
        deletedAt: props.deletedAt ?? null,
      },
      id,
    )
  }
}
