import type { UniqueEntityID } from '@/core/entities/unique-entity-id'

import { AggregateRoot } from '@/core/entities/aggregate-root'

export interface AreaProps {
  tenantId: string
  fazendaId: string
  identificacao: string
  tamanho: number | null
  unidadeTamanho: string | null
  rotulo: string | null
  geometria: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface UpdateAreaCadastro {
  identificacao?: string
  tamanho?: number | null
  unidadeTamanho?: string | null
  rotulo?: string | null
  geometria?: Record<string, unknown> | null
}

export class Area extends AggregateRoot<AreaProps> {
  get tenantId() {
    return this.props.tenantId
  }

  get fazendaId() {
    return this.props.fazendaId
  }

  get identificacao() {
    return this.props.identificacao
  }

  get tamanho() {
    return this.props.tamanho
  }

  get unidadeTamanho() {
    return this.props.unidadeTamanho
  }

  get rotulo() {
    return this.props.rotulo
  }

  get geometria() {
    return this.props.geometria
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

  updateCadastro(input: UpdateAreaCadastro): void {
    if (input.identificacao !== undefined) this.props.identificacao = input.identificacao
    if (input.tamanho !== undefined) this.props.tamanho = input.tamanho
    if (input.unidadeTamanho !== undefined) this.props.unidadeTamanho = input.unidadeTamanho
    if (input.rotulo !== undefined) this.props.rotulo = input.rotulo
    if (input.geometria !== undefined) this.props.geometria = input.geometria
    this.touch()
  }

  softDelete(): void {
    this.props.deletedAt = new Date()
    this.touch()
  }

  static create(
    props: Omit<
      AreaProps,
      'tamanho' | 'unidadeTamanho' | 'rotulo' | 'geometria' | 'deletedAt'
    > & {
      tamanho?: number | null
      unidadeTamanho?: string | null
      rotulo?: string | null
      geometria?: Record<string, unknown> | null
      deletedAt?: Date | null
    },
    id?: UniqueEntityID,
  ): Area {
    return new Area(
      {
        ...props,
        tamanho: props.tamanho ?? null,
        unidadeTamanho: props.unidadeTamanho ?? null,
        rotulo: props.rotulo ?? null,
        geometria: props.geometria ?? null,
        deletedAt: props.deletedAt ?? null,
      },
      id,
    )
  }
}
