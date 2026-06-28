import type { UniqueEntityID } from '@/core/entities/unique-entity-id'

import { AggregateRoot } from '@/core/entities/aggregate-root'

export const SAFRA_STATUSES = ['planejado', 'em_andamento', 'colhido'] as const

export type SafraStatus = (typeof SAFRA_STATUSES)[number]

export interface SafraProps {
  tenantId: string
  areaId: string
  cultura: string
  variedade: string | null
  dataPlantio: Date | null
  dataColheitaPrevista: Date | null
  dataColheitaRealizada: Date | null
  estimativaProducao: number | null
  status: SafraStatus
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface UpdateSafraCadastro {
  cultura?: string
  variedade?: string | null
  dataPlantio?: Date | null
  dataColheitaPrevista?: Date | null
  dataColheitaRealizada?: Date | null
  estimativaProducao?: number | null
  status?: SafraStatus
}

export class Safra extends AggregateRoot<SafraProps> {
  get tenantId() {
    return this.props.tenantId
  }

  get areaId() {
    return this.props.areaId
  }

  get cultura() {
    return this.props.cultura
  }

  get variedade() {
    return this.props.variedade
  }

  get dataPlantio() {
    return this.props.dataPlantio
  }

  get dataColheitaPrevista() {
    return this.props.dataColheitaPrevista
  }

  get dataColheitaRealizada() {
    return this.props.dataColheitaRealizada
  }

  get estimativaProducao() {
    return this.props.estimativaProducao
  }

  get status() {
    return this.props.status
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

  updateCadastro(input: UpdateSafraCadastro): void {
    if (input.cultura !== undefined) this.props.cultura = input.cultura
    if (input.variedade !== undefined) this.props.variedade = input.variedade
    if (input.dataPlantio !== undefined) this.props.dataPlantio = input.dataPlantio
    if (input.dataColheitaPrevista !== undefined) this.props.dataColheitaPrevista = input.dataColheitaPrevista
    if (input.dataColheitaRealizada !== undefined)
      this.props.dataColheitaRealizada = input.dataColheitaRealizada
    if (input.estimativaProducao !== undefined) this.props.estimativaProducao = input.estimativaProducao
    if (input.status !== undefined) this.props.status = input.status
    this.touch()
  }

  softDelete(): void {
    this.props.deletedAt = new Date()
    this.touch()
  }

  static create(
    props: Omit<
      SafraProps,
      | 'variedade'
      | 'dataPlantio'
      | 'dataColheitaPrevista'
      | 'dataColheitaRealizada'
      | 'estimativaProducao'
      | 'status'
      | 'deletedAt'
    > & {
      variedade?: string | null
      dataPlantio?: Date | null
      dataColheitaPrevista?: Date | null
      dataColheitaRealizada?: Date | null
      estimativaProducao?: number | null
      status?: SafraStatus
      deletedAt?: Date | null
    },
    id?: UniqueEntityID,
  ): Safra {
    return new Safra(
      {
        ...props,
        variedade: props.variedade ?? null,
        dataPlantio: props.dataPlantio ?? null,
        dataColheitaPrevista: props.dataColheitaPrevista ?? null,
        dataColheitaRealizada: props.dataColheitaRealizada ?? null,
        estimativaProducao: props.estimativaProducao ?? null,
        status: props.status ?? 'planejado',
        deletedAt: props.deletedAt ?? null,
      },
      id,
    )
  }
}
