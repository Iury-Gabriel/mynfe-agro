import { Download, FileText } from 'lucide-react'

import type { Column, Row } from '@/features/agroflow/ui'
import type { NotaFiscal } from '@/features/fiscal/api/notas-fiscais-api'
import type { ReactElement, ReactNode } from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ActionButton, DataTable } from '@/features/agroflow/ui'
import { FiscalStatusPill } from '@/features/fiscal/components/fiscal-status-pill'
import { formatCurrency, formatDate, formatQty } from '@/features/vendas/lib/format'

const itensColumns: Column[] = [
  { key: 'descricao', label: 'Produto' },
  { key: 'ncm', label: 'NCM' },
  { key: 'cfop', label: 'CFOP' },
  { key: 'cst', label: 'CST/CSOSN' },
  { key: 'qtd', label: 'Qtd', align: 'right' },
  { key: 'valor', label: 'Valor', align: 'right' },
]

function DetailField({ label, value }: { label: string; value: ReactNode }): ReactElement {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="break-all text-sm font-medium text-foreground">{value}</span>
    </div>
  )
}

interface NotaDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  nota: NotaFiscal | undefined
  isLoading: boolean
}

export function NotaDetailDialog({
  open,
  onOpenChange,
  nota,
  isLoading,
}: NotaDetailDialogProps): ReactElement {
  const itensRows: Row[] = (nota?.itens ?? []).map((item) => ({
    id: item.id,
    descricao: <span className="font-medium text-foreground">{item.descricao}</span>,
    ncm: item.ncm ?? '—',
    cfop: item.cfop ?? '—',
    cst: item.cstCsosn ?? '—',
    qtd: formatQty(item.quantidade),
    valor: formatCurrency(item.valorTotal),
  }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-full max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {nota?.numero ? `NF-e ${nota.numero} / Série ${nota.serie ?? '—'}` : 'Detalhe da nota'}
          </DialogTitle>
          <DialogDescription>
            Itens fiscais, eventos, chave de acesso e protocolo de autorização.
          </DialogDescription>
        </DialogHeader>

        {isLoading || !nota ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Carregando nota…</p>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <DetailField label="Status" value={<FiscalStatusPill status={nota.status} />} />
              <DetailField label="Emitente" value={nota.empresaEmitenteId} />
              <DetailField label="Destinatário" value={nota.clienteId} />
              <DetailField label="Valor total" value={formatCurrency(nota.valorTotal)} />
              <DetailField label="Natureza da operação" value={nota.naturezaOperacao ?? '—'} />
              <DetailField label="Ambiente" value={nota.ambiente} />
              <DetailField label="Emissão" value={formatDate(nota.dataEmissao)} />
              <DetailField label="Chave de acesso" value={nota.chaveAcesso ?? '—'} />
              <DetailField label="Protocolo" value={nota.protocolo ?? '—'} />
            </div>

            {nota.mensagemRetorno && (
              <p className="rounded-xl border border-border/60 bg-background/40 px-4 py-3 text-sm text-muted-foreground">
                {nota.mensagemRetorno}
              </p>
            )}

            {(nota.danfeUrl !== null || nota.xmlUrl !== null) && (
              <div className="flex flex-wrap gap-2">
                {nota.danfeUrl && (
                  <a href={nota.danfeUrl} target="_blank" rel="noopener noreferrer">
                    <ActionButton variant="ghost" size="sm">
                      <FileText /> DANFE
                    </ActionButton>
                  </a>
                )}
                {nota.xmlUrl && (
                  <a href={nota.xmlUrl} target="_blank" rel="noopener noreferrer">
                    <ActionButton variant="ghost" size="sm">
                      <Download /> XML
                    </ActionButton>
                  </a>
                )}
              </div>
            )}

            <div>
              <h3 className="mb-3 text-sm font-bold text-foreground">Itens</h3>
              <DataTable columns={itensColumns} rows={itensRows} minWidth={640} />
            </div>

            <div>
              <h3 className="mb-3 text-sm font-bold text-foreground">Eventos</h3>
              {nota.eventos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum evento registrado.</p>
              ) : (
                <ul className="space-y-2">
                  {nota.eventos.map((evento) => (
                    <li
                      key={evento.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/30 px-4 py-2.5 text-sm"
                    >
                      <span className="font-medium text-foreground">{evento.tipo}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(evento.data)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
