import type { Area } from '@/domain/enterprise/entities/area'

export interface AreaPresenterOutput {
  id: string
  tenantId: string
  fazendaId: string
  identificacao: string
  tamanho: number | null
  unidadeTamanho: string | null
  rotulo: string | null
  geometria: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
}

export class AreaPresenter {
  static toHTTP(area: Area): AreaPresenterOutput {
    return {
      id: area.id.toString(),
      tenantId: area.tenantId,
      fazendaId: area.fazendaId,
      identificacao: area.identificacao,
      tamanho: area.tamanho,
      unidadeTamanho: area.unidadeTamanho,
      rotulo: area.rotulo,
      geometria: area.geometria === null ? null : { ...area.geometria },
      createdAt: area.createdAt,
      updatedAt: area.updatedAt,
    }
  }
}
