import type { NotaFiscalStatus } from '@/features/fiscal/api/notas-fiscais-api'
import type { ReactElement } from 'react'

import { StatusPill } from '@/features/agroflow/ui'
import { FISCAL_STATUS_LABEL, FISCAL_STATUS_TONE } from '@/features/fiscal/lib/status'

export function FiscalStatusPill({ status }: { status: NotaFiscalStatus }): ReactElement {
  return <StatusPill tone={FISCAL_STATUS_TONE[status]}>{FISCAL_STATUS_LABEL[status]}</StatusPill>
}
