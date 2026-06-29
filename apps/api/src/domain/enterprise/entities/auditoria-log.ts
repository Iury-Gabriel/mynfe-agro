import type { UniqueEntityID } from '@/core/entities/unique-entity-id'

import { Entity } from '@/core/entities/entity'

export const AUDITORIA_ACOES = ['criar', 'editar', 'excluir', 'emitir', 'ajustar'] as const

export type AuditoriaAcao = (typeof AUDITORIA_ACOES)[number]

export interface AuditoriaLogProps {
  tenantId: string
  usuarioId: string | null
  entidade: string
  entidadeId: string
  acao: AuditoriaAcao
  dadosAntes: Record<string, unknown> | null
  dadosDepois: Record<string, unknown> | null
  data: Date
}

export class AuditoriaLog extends Entity<AuditoriaLogProps> {
  get tenantId() {
    return this.props.tenantId
  }

  get usuarioId() {
    return this.props.usuarioId
  }

  get entidade() {
    return this.props.entidade
  }

  get entidadeId() {
    return this.props.entidadeId
  }

  get acao() {
    return this.props.acao
  }

  get dadosAntes() {
    return this.props.dadosAntes
  }

  get dadosDepois() {
    return this.props.dadosDepois
  }

  get data() {
    return this.props.data
  }

  static create(
    props: Omit<AuditoriaLogProps, 'usuarioId' | 'dadosAntes' | 'dadosDepois' | 'data'> & {
      usuarioId?: string | null
      dadosAntes?: Record<string, unknown> | null
      dadosDepois?: Record<string, unknown> | null
      data?: Date
    },
    id?: UniqueEntityID,
  ): AuditoriaLog {
    return new AuditoriaLog(
      {
        ...props,
        usuarioId: props.usuarioId ?? null,
        dadosAntes: props.dadosAntes ?? null,
        dadosDepois: props.dadosDepois ?? null,
        data: props.data ?? new Date(),
      },
      id,
    )
  }
}
