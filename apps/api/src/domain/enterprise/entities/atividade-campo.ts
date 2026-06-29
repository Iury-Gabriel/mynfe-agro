import type { UniqueEntityID } from '@/core/entities/unique-entity-id'

import { AggregateRoot } from '@/core/entities/aggregate-root'

export const ATIVIDADE_CAMPO_TIPOS = [
  'plantio',
  'irrigacao',
  'pulverizacao',
  'adubacao',
  'outro',
] as const

export type AtividadeCampoTipo = (typeof ATIVIDADE_CAMPO_TIPOS)[number]

export interface AtividadeCampoProps {
  tenantId: string
  safraId: string | null
  areaId: string | null
  tipo: AtividadeCampoTipo
  data: Date
  responsavelUsuarioId: string | null
  observacoes: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface UpdateAtividadeCampoCadastro {
  safraId?: string | null
  areaId?: string | null
  tipo?: AtividadeCampoTipo
  data?: Date
  responsavelUsuarioId?: string | null
  observacoes?: string | null
}

export class AtividadeCampo extends AggregateRoot<AtividadeCampoProps> {
  get tenantId() {
    return this.props.tenantId
  }

  get safraId() {
    return this.props.safraId
  }

  get areaId() {
    return this.props.areaId
  }

  get tipo() {
    return this.props.tipo
  }

  get data() {
    return this.props.data
  }

  get responsavelUsuarioId() {
    return this.props.responsavelUsuarioId
  }

  get observacoes() {
    return this.props.observacoes
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

  updateCadastro(input: UpdateAtividadeCampoCadastro): void {
    if (input.safraId !== undefined) this.props.safraId = input.safraId
    if (input.areaId !== undefined) this.props.areaId = input.areaId
    if (input.tipo !== undefined) this.props.tipo = input.tipo
    if (input.data !== undefined) this.props.data = input.data
    if (input.responsavelUsuarioId !== undefined)
      this.props.responsavelUsuarioId = input.responsavelUsuarioId
    if (input.observacoes !== undefined) this.props.observacoes = input.observacoes
    this.touch()
  }

  softDelete(): void {
    this.props.deletedAt = new Date()
    this.touch()
  }

  static create(
    props: Omit<
      AtividadeCampoProps,
      'safraId' | 'areaId' | 'responsavelUsuarioId' | 'observacoes' | 'deletedAt'
    > & {
      safraId?: string | null
      areaId?: string | null
      responsavelUsuarioId?: string | null
      observacoes?: string | null
      deletedAt?: Date | null
    },
    id?: UniqueEntityID,
  ): AtividadeCampo {
    return new AtividadeCampo(
      {
        ...props,
        safraId: props.safraId ?? null,
        areaId: props.areaId ?? null,
        responsavelUsuarioId: props.responsavelUsuarioId ?? null,
        observacoes: props.observacoes ?? null,
        deletedAt: props.deletedAt ?? null,
      },
      id,
    )
  }
}
