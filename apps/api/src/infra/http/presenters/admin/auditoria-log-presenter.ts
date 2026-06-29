import type { AuditoriaLog } from '@/domain/enterprise/entities/auditoria-log'

export interface AuditoriaLogPresenterOutput {
  id: string
  tenantId: string
  usuarioId: string | null
  entidade: string
  entidadeId: string
  acao: string
  dadosAntes: Record<string, unknown> | null
  dadosDepois: Record<string, unknown> | null
  data: Date
}

export class AuditoriaLogPresenter {
  static toHTTP(log: AuditoriaLog): AuditoriaLogPresenterOutput {
    return {
      id: log.id.toString(),
      tenantId: log.tenantId,
      usuarioId: log.usuarioId,
      entidade: log.entidade,
      entidadeId: log.entidadeId,
      acao: log.acao,
      dadosAntes: log.dadosAntes,
      dadosDepois: log.dadosDepois,
      data: log.data,
    }
  }
}
