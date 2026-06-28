import type { UniqueEntityID } from '@/core/entities/unique-entity-id'

import { AggregateRoot } from '@/core/entities/aggregate-root'

export interface ColheitaProps {
  tenantId: string
  empresaId: string
  produtoId: string
  safraId: string | null
  areaId: string | null
  quantidade: number
  data: Date
  responsavelUsuarioId: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export class Colheita extends AggregateRoot<ColheitaProps> {
  get tenantId() {
    return this.props.tenantId
  }

  get empresaId() {
    return this.props.empresaId
  }

  get produtoId() {
    return this.props.produtoId
  }

  get safraId() {
    return this.props.safraId
  }

  get areaId() {
    return this.props.areaId
  }

  get quantidade() {
    return this.props.quantidade
  }

  get data() {
    return this.props.data
  }

  get responsavelUsuarioId() {
    return this.props.responsavelUsuarioId
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

  static create(
    props: Omit<ColheitaProps, 'safraId' | 'areaId' | 'responsavelUsuarioId' | 'deletedAt'> & {
      safraId?: string | null
      areaId?: string | null
      responsavelUsuarioId?: string | null
      deletedAt?: Date | null
    },
    id?: UniqueEntityID,
  ): Colheita {
    return new Colheita(
      {
        ...props,
        safraId: props.safraId ?? null,
        areaId: props.areaId ?? null,
        responsavelUsuarioId: props.responsavelUsuarioId ?? null,
        deletedAt: props.deletedAt ?? null,
      },
      id,
    )
  }
}
