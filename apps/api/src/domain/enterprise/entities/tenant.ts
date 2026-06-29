import type { UniqueEntityID } from '@/core/entities/unique-entity-id'

import { AggregateRoot } from '@/core/entities/aggregate-root'

export const TENANT_STATUSES = ['ativo', 'inativo', 'suspenso'] as const

export type TenantStatus = (typeof TENANT_STATUSES)[number]

export interface TenantProps {
  nome: string
  status: TenantStatus
  labelArea: string
  diaCorteConsolidacao: number | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export class Tenant extends AggregateRoot<TenantProps> {
  get nome() {
    return this.props.nome
  }

  get status() {
    return this.props.status
  }

  get labelArea() {
    return this.props.labelArea
  }

  get diaCorteConsolidacao() {
    return this.props.diaCorteConsolidacao
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

  rename(nome: string): void {
    this.props.nome = nome
    this.touch()
  }

  setLabelArea(labelArea: string): void {
    this.props.labelArea = labelArea
    this.touch()
  }

  setDiaCorteConsolidacao(diaCorteConsolidacao: number | null): void {
    this.props.diaCorteConsolidacao = diaCorteConsolidacao
    this.touch()
  }

  suspend(): void {
    this.props.status = 'suspenso'
    this.touch()
  }

  activate(): void {
    this.props.status = 'ativo'
    this.touch()
  }

  deactivate(): void {
    this.props.status = 'inativo'
    this.touch()
  }

  static create(
    props: Omit<TenantProps, 'status' | 'diaCorteConsolidacao' | 'deletedAt'> & {
      status?: TenantStatus
      diaCorteConsolidacao?: number | null
      deletedAt?: Date | null
    },
    id?: UniqueEntityID,
  ): Tenant {
    return new Tenant(
      {
        ...props,
        status: props.status ?? 'ativo',
        diaCorteConsolidacao: props.diaCorteConsolidacao ?? null,
        deletedAt: props.deletedAt ?? null,
      },
      id,
    )
  }
}
