import type { PillTone } from '@/features/agroflow/ui'
import type { Remessa, RemessaStatus } from '@/features/vendas/api/remessas-api'
import type { ReactElement, ReactNode } from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { StatusPill } from '@/features/agroflow/ui'
import { useRemessa } from '@/features/vendas/api/remessas-api'
import { formatCurrency, formatDate, formatQty } from '@/features/vendas/lib/format'

const STATUS_TONE: Record<RemessaStatus, PillTone> = {
  aberta: 'warning',
  entregue: 'info',
  consolidada: 'success',
  cancelada: 'danger',
}

const STATUS_LABEL: Record<RemessaStatus, string> = {
  aberta: 'Aberta',
  entregue: 'Entregue',
  consolidada: 'Consolidada',
  cancelada: 'Cancelada',
}

interface RemessaDetalheDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  empresaId: string | null
  remessa: Remessa
}

function Field({ label, children }: { label: string; children: ReactNode }): ReactElement {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-0.5 text-sm text-foreground">{children}</div>
    </div>
  )
}

export function RemessaDetalheDialog({
  open,
  onOpenChange,
  empresaId,
  remessa: fallback,
}: RemessaDetalheDialogProps): ReactElement {
  const { data, isLoading, isError } = useRemessa({
    empresaId,
    remessaId: open ? fallback.id : null,
  })

  const remessa = data ?? fallback
  const loteByLoteId = new Map(remessa.lotes.map((lote) => [lote.id, lote]))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Remessa {remessa.numero}</DialogTitle>
          <DialogDescription>
            Detalhes da remessa, itens com lotes consumidos e consolidação.
          </DialogDescription>
        </DialogHeader>

        {isError && !data ? (
          <p className="py-6 text-center text-sm text-destructive">
            Erro ao carregar os detalhes da remessa.
          </p>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Field label="Cliente">{remessa.clienteId}</Field>
              <Field label="Empresa faturadora">{remessa.empresaFaturadoraId}</Field>
              <Field label="Data">{formatDate(remessa.data)}</Field>
              <Field label="Status">
                <StatusPill tone={STATUS_TONE[remessa.status]}>
                  {STATUS_LABEL[remessa.status]}
                </StatusPill>
              </Field>
              <Field label="Valor estimado">
                <span className="font-semibold">{formatCurrency(remessa.valorEstimado)}</span>
              </Field>
            </div>

            {remessa.observacoes && (
              <Field label="Observações">
                <p className="whitespace-pre-wrap text-muted-foreground">{remessa.observacoes}</p>
              </Field>
            )}

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Itens e lotes consumidos</h3>
              {remessa.itens.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum item nesta remessa.</p>
              ) : (
                <ul className="space-y-2">
                  {remessa.itens.map((item) => {
                    const lote = item.loteId ? loteByLoteId.get(item.loteId) : undefined
                    return (
                      <li
                        key={item.id}
                        className="rounded-xl border border-border/60 bg-background/40 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {item.produtoId}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Lote: {lote?.codigoLote ?? item.loteId ?? '—'}
                            </p>
                          </div>
                          <p className="shrink-0 text-sm font-semibold text-foreground">
                            {formatCurrency(item.valorTotal)}
                          </p>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>Qtd: {formatQty(item.quantidade)}</span>
                          <span>Preço unit.: {formatCurrency(item.precoUnitario)}</span>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
              {isLoading && !data && remessa.itens.length > 0 && (
                <p className="text-xs text-muted-foreground">Carregando rastreabilidade de lotes…</p>
              )}
            </section>

            <section className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">Pedido de consolidação</h3>
              {remessa.pedidoConsolidadoId ? (
                <p className="text-sm text-foreground">
                  Consolidada no pedido{' '}
                  <span className="font-medium">{remessa.pedidoConsolidadoId}</span>.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Ainda não consolidada em um pedido mensal.
                </p>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
