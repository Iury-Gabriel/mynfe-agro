import type { PillTone } from '@/features/agroflow/ui'
import type { Pedido, PedidoStatus, PedidoTipo } from '@/features/vendas/api/pedidos-api'
import type { ReactElement, ReactNode } from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { StatusPill } from '@/features/agroflow/ui'
import { useNotasFiscais } from '@/features/fiscal/api/notas-fiscais-api'
import { FiscalStatusPill } from '@/features/fiscal/components/fiscal-status-pill'
import { usePedido } from '@/features/vendas/api/pedidos-api'
import { formatCurrency, formatDate, formatQty } from '@/features/vendas/lib/format'

const STATUS_TONE: Record<PedidoStatus, PillTone> = {
  rascunho: 'neutral',
  confirmado: 'warning',
  faturado: 'success',
  cancelado: 'danger',
}

const STATUS_LABEL: Record<PedidoStatus, string> = {
  rascunho: 'Rascunho',
  confirmado: 'Confirmado',
  faturado: 'Faturado',
  cancelado: 'Cancelado',
}

const TIPO_TONE: Record<PedidoTipo, PillTone> = {
  avulso: 'neutral',
  consolidado: 'info',
}

const TIPO_LABEL: Record<PedidoTipo, string> = {
  avulso: 'Avulso',
  consolidado: 'Consolidado',
}

const REMESSA_TONE: Record<string, PillTone> = {
  aberta: 'warning',
  entregue: 'info',
  consolidada: 'success',
  cancelada: 'danger',
}

interface PedidoDetalheDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  empresaId: string | null
  pedido: Pedido
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

export function PedidoDetalheDialog({
  open,
  onOpenChange,
  empresaId,
  pedido: fallback,
}: PedidoDetalheDialogProps): ReactElement {
  const { data, isLoading, isError } = usePedido({
    empresaId,
    pedidoId: open ? fallback.id : null,
  })

  const pedido = data ?? fallback

  const notas = useNotasFiscais({
    empresaId: open ? empresaId : null,
    filtros: { pedidoId: fallback.id },
    perPage: 100,
  })
  const nota = notas.data?.notas[0]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pedido {pedido.numero}</DialogTitle>
          <DialogDescription>
            Detalhes do pedido, itens, vínculos de remessa e situação fiscal.
          </DialogDescription>
        </DialogHeader>

        {isError && !data ? (
          <p className="py-6 text-center text-sm text-destructive">
            Erro ao carregar os detalhes do pedido.
          </p>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Field label="Cliente">{pedido.clienteId}</Field>
              <Field label="Empresa faturadora">{pedido.empresaFaturadoraId}</Field>
              <Field label="Data">{formatDate(pedido.data)}</Field>
              <Field label="Tipo">
                <StatusPill tone={TIPO_TONE[pedido.tipo]}>{TIPO_LABEL[pedido.tipo]}</StatusPill>
              </Field>
              <Field label="Status">
                <StatusPill tone={STATUS_TONE[pedido.status]}>
                  {STATUS_LABEL[pedido.status]}
                </StatusPill>
              </Field>
              <Field label="Valor total">
                <span className="font-semibold">{formatCurrency(pedido.valorTotal)}</span>
              </Field>
            </div>

            {pedido.observacoes && (
              <Field label="Observações">
                <p className="whitespace-pre-wrap text-muted-foreground">{pedido.observacoes}</p>
              </Field>
            )}

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Itens</h3>
              {pedido.itens.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum item neste pedido.</p>
              ) : (
                <ul className="space-y-2">
                  {pedido.itens.map((item) => (
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
                            Lote: {item.loteId ?? '—'}
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
                  ))}
                </ul>
              )}
            </section>

            {pedido.tipo === 'consolidado' && (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Remessas consolidadas</h3>
                {isLoading && !data ? (
                  <p className="text-sm text-muted-foreground">Carregando remessas…</p>
                ) : pedido.remessas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma remessa vinculada a este pedido.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {pedido.remessas.map((remessa) => (
                      <li
                        key={remessa.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/40 p-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {remessa.numero}
                          </span>
                          <StatusPill tone={REMESSA_TONE[remessa.status] ?? 'neutral'}>
                            {remessa.status}
                          </StatusPill>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(remessa.valorEstimado)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Situação fiscal (DANFE)</h3>
              {notas.isLoading ? (
                <p className="text-sm text-muted-foreground">Carregando situação fiscal…</p>
              ) : notas.isError ? (
                <p className="text-sm text-destructive">Erro ao carregar a situação fiscal.</p>
              ) : !nota ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma DANFE emitida para este pedido.
                </p>
              ) : (
                <div className="space-y-3 rounded-xl border border-border/60 bg-background/40 p-3">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <Field label="Status">
                      <FiscalStatusPill status={nota.status} />
                    </Field>
                    <Field label="Número">{nota.numero ?? '—'}</Field>
                    <Field label="Série">{nota.serie ?? '—'}</Field>
                  </div>
                  <Field label="Chave de acesso">
                    <span className="break-all font-mono text-xs">{nota.chaveAcesso ?? '—'}</span>
                  </Field>
                  {(nota.danfeUrl ?? nota.xmlUrl) != null && (
                    <div className="flex flex-wrap gap-4 text-sm">
                      {nota.danfeUrl && (
                        <a
                          href={nota.danfeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-emerald-300 underline-offset-2 hover:underline"
                        >
                          DANFE (PDF)
                        </a>
                      )}
                      {nota.xmlUrl && (
                        <a
                          href={nota.xmlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-emerald-300 underline-offset-2 hover:underline"
                        >
                          XML
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
