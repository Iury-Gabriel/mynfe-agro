import type { PillTone } from '@/features/agroflow/ui'
import type { NotaFiscalStatus } from '@/features/fiscal/api/notas-fiscais-api'

export const FISCAL_STATUS_TONE: Record<NotaFiscalStatus, PillTone> = {
  pendente: 'warning',
  emitindo: 'warning',
  autorizada: 'success',
  rejeitada: 'danger',
  cancelada: 'neutral',
}

export const FISCAL_STATUS_LABEL: Record<NotaFiscalStatus, string> = {
  pendente: 'Pendente',
  emitindo: 'Emitindo',
  autorizada: 'Autorizada',
  rejeitada: 'Rejeitada',
  cancelada: 'Cancelada',
}
