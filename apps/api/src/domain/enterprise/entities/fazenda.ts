import type { UniqueEntityID } from '@/core/entities/unique-entity-id'

import { AggregateRoot } from '@/core/entities/aggregate-root'

export interface FazendaProps {
  tenantId: string
  empresaId: string
  nome: string
  enderecoLogradouro: string | null
  enderecoNumero: string | null
  enderecoBairro: string | null
  enderecoCep: string | null
  municipio: string | null
  uf: string | null
  latitude: number | null
  longitude: number | null
  car: string | null
  nirfIncra: string | null
  areaTotalHa: number | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface UpdateFazendaCadastro {
  nome?: string
  enderecoLogradouro?: string | null
  enderecoNumero?: string | null
  enderecoBairro?: string | null
  enderecoCep?: string | null
  municipio?: string | null
  uf?: string | null
  latitude?: number | null
  longitude?: number | null
  car?: string | null
  nirfIncra?: string | null
  areaTotalHa?: number | null
}

export class Fazenda extends AggregateRoot<FazendaProps> {
  get tenantId() {
    return this.props.tenantId
  }

  get empresaId() {
    return this.props.empresaId
  }

  get nome() {
    return this.props.nome
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

  get latitude() {
    return this.props.latitude
  }

  get longitude() {
    return this.props.longitude
  }

  get car() {
    return this.props.car
  }

  get nirfIncra() {
    return this.props.nirfIncra
  }

  get areaTotalHa() {
    return this.props.areaTotalHa
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

  updateCadastro(input: UpdateFazendaCadastro): void {
    if (input.nome !== undefined) this.props.nome = input.nome
    if (input.enderecoLogradouro !== undefined) this.props.enderecoLogradouro = input.enderecoLogradouro
    if (input.enderecoNumero !== undefined) this.props.enderecoNumero = input.enderecoNumero
    if (input.enderecoBairro !== undefined) this.props.enderecoBairro = input.enderecoBairro
    if (input.enderecoCep !== undefined) this.props.enderecoCep = input.enderecoCep
    if (input.municipio !== undefined) this.props.municipio = input.municipio
    if (input.uf !== undefined) this.props.uf = input.uf
    if (input.latitude !== undefined) this.props.latitude = input.latitude
    if (input.longitude !== undefined) this.props.longitude = input.longitude
    if (input.car !== undefined) this.props.car = input.car
    if (input.nirfIncra !== undefined) this.props.nirfIncra = input.nirfIncra
    if (input.areaTotalHa !== undefined) this.props.areaTotalHa = input.areaTotalHa
    this.touch()
  }

  softDelete(): void {
    this.props.deletedAt = new Date()
    this.touch()
  }

  static create(
    props: Omit<
      FazendaProps,
      | 'enderecoLogradouro'
      | 'enderecoNumero'
      | 'enderecoBairro'
      | 'enderecoCep'
      | 'municipio'
      | 'uf'
      | 'latitude'
      | 'longitude'
      | 'car'
      | 'nirfIncra'
      | 'areaTotalHa'
      | 'deletedAt'
    > & {
      enderecoLogradouro?: string | null
      enderecoNumero?: string | null
      enderecoBairro?: string | null
      enderecoCep?: string | null
      municipio?: string | null
      uf?: string | null
      latitude?: number | null
      longitude?: number | null
      car?: string | null
      nirfIncra?: string | null
      areaTotalHa?: number | null
      deletedAt?: Date | null
    },
    id?: UniqueEntityID,
  ): Fazenda {
    return new Fazenda(
      {
        ...props,
        enderecoLogradouro: props.enderecoLogradouro ?? null,
        enderecoNumero: props.enderecoNumero ?? null,
        enderecoBairro: props.enderecoBairro ?? null,
        enderecoCep: props.enderecoCep ?? null,
        municipio: props.municipio ?? null,
        uf: props.uf ?? null,
        latitude: props.latitude ?? null,
        longitude: props.longitude ?? null,
        car: props.car ?? null,
        nirfIncra: props.nirfIncra ?? null,
        areaTotalHa: props.areaTotalHa ?? null,
        deletedAt: props.deletedAt ?? null,
      },
      id,
    )
  }
}
