import type { AtividadeCampo, AtividadeCampoTipo } from '@/domain/enterprise/entities/atividade-campo'

export interface AtividadeCampoPresenterOutput {
  id: string
  tenantId: string
  safraId: string | null
  areaId: string | null
  tipo: AtividadeCampoTipo
  data: Date
  responsavelUsuarioId: string | null
  observacoes: string | null
  createdAt: Date
  updatedAt: Date
}

export class AtividadeCampoPresenter {
  static toHTTP(atividade: AtividadeCampo): AtividadeCampoPresenterOutput {
    return {
      id: atividade.id.toString(),
      tenantId: atividade.tenantId,
      safraId: atividade.safraId,
      areaId: atividade.areaId,
      tipo: atividade.tipo,
      data: atividade.data,
      responsavelUsuarioId: atividade.responsavelUsuarioId,
      observacoes: atividade.observacoes,
      createdAt: atividade.createdAt,
      updatedAt: atividade.updatedAt,
    }
  }
}
