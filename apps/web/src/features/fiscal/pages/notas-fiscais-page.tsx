import { useState } from 'react'
import { toast } from 'sonner'

import type { Column, Row } from '@/features/agroflow/ui'
import type { NotaFiscal, NotaFiscalStatus, NotasFiltros } from '@/features/fiscal/api/notas-fiscais-api'
import type { ReactElement } from 'react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ActionButton, DataTable, PageHeader, Panel } from '@/features/agroflow/ui'
import { AjusteEmpresaGate } from '@/features/estoque/components/empresa-gate'
import {
  useCancelarNota,
  useNotaFiscal,
  useNotasFiscais,
} from '@/features/fiscal/api/notas-fiscais-api'
import { CancelarNotaDialog } from '@/features/fiscal/components/cancelar-nota-dialog'
import { FiscalStatusPill } from '@/features/fiscal/components/fiscal-status-pill'
import { NotaDetailDialog } from '@/features/fiscal/components/nota-detail-dialog'
import { formatCurrency, formatDate } from '@/features/vendas/lib/format'
import { hasAnyPermission } from '@/lib/permissions'
import { useAuth } from '@/providers/auth-context'
import { useActiveEmpresaStore } from '@/stores/active-empresa-store'

const STATUS_FILTER_OPTIONS: { value: NotaFiscalStatus | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'emitindo', label: 'Emitindo' },
  { value: 'autorizada', label: 'Autorizada' },
  { value: 'rejeitada', label: 'Rejeitada' },
  { value: 'cancelada', label: 'Cancelada' },
]

const columns: Column[] = [
  { key: 'numeroSerie', label: 'Número / Série' },
  { key: 'emitente', label: 'Emitente' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'valor', label: 'Valor', align: 'right' },
  { key: 'status', label: 'Status' },
  { key: 'emissao', label: 'Emissão' },
  { key: 'acoes', label: '', align: 'right' },
]

export function NotasFiscaisPage(): ReactElement {
  const { user } = useAuth()
  const empresaId = useActiveEmpresaStore((s) => s.activeEmpresaId)

  const canCancelar = hasAnyPermission(user?.permissions, ['nota:cancelar'])

  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<NotaFiscalStatus | 'todos'>('todos')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [cancelTarget, setCancelTarget] = useState<NotaFiscal | null>(null)

  const filtros: NotasFiltros = statusFilter === 'todos' ? {} : { status: statusFilter }

  const { data, isLoading, isError, refetch } = useNotasFiscais({ empresaId, filtros, page })
  const detail = useNotaFiscal({ empresaId, notaId: detailId })
  const cancelar = useCancelarNota()

  const totalPages = data?.totalPages ?? 1

  function handleCancelar(motivo: string | null): void {
    if (!cancelTarget || !empresaId) return
    cancelar.mutate(
      { notaId: cancelTarget.id, empresaId, motivo },
      {
        onSuccess: () => {
          toast.success('Nota cancelada.')
          setCancelTarget(null)
        },
        onError: () => toast.error('Não foi possível cancelar a nota.'),
      },
    )
  }

  const rows: Row[] = (data?.notas ?? []).map((nota) => ({
    id: nota.id,
    numeroSerie: (
      <span className="font-medium text-foreground">
        {nota.numero ?? '—'} / {nota.serie ?? '—'}
      </span>
    ),
    emitente: nota.empresaEmitenteId,
    cliente: nota.clienteId,
    valor: formatCurrency(nota.valorTotal),
    status: <FiscalStatusPill status={nota.status} />,
    emissao: formatDate(nota.dataEmissao),
    acoes: (
      <div className="flex justify-end gap-2">
        <ActionButton variant="subtle" size="sm" onClick={() => setDetailId(nota.id)}>
          Detalhe
        </ActionButton>
        {canCancelar && nota.status === 'autorizada' && (
          <ActionButton variant="ghost" size="sm" onClick={() => setCancelTarget(nota)}>
            Cancelar
          </ActionButton>
        )}
      </div>
    ),
  }))

  return (
    <div className="agroflow agroflow-glow min-h-screen p-4 text-foreground sm:p-6">
      <PageHeader
        title="Notas fiscais"
        subtitle="Documentos emitidos pela empresa ativa — chave de acesso, protocolo e DANFE / XML."
      />

      <div className="mt-6">
        <Panel title="Notas fiscais">
          <AjusteEmpresaGate empresaId={empresaId}>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="w-full sm:max-w-xs">
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value as NotaFiscalStatus | 'todos')
                    setPage(1)
                  }}
                >
                  <SelectTrigger aria-label="Filtrar por status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_FILTER_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Carregando notas…
              </p>
            ) : isError ? (
              <div className="flex flex-col items-center gap-3 py-10">
                <p className="text-sm text-destructive">Erro ao carregar notas.</p>
                <ActionButton variant="ghost" size="sm" onClick={() => void refetch()}>
                  Tentar novamente
                </ActionButton>
              </div>
            ) : (
              <>
                <DataTable columns={columns} rows={rows} minWidth={920} />
                <div className="mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row">
                  <p className="text-xs text-muted-foreground">
                    Página {data?.page ?? page} de {totalPages} · {data?.total ?? 0} notas
                  </p>
                  <div className="flex gap-2">
                    <ActionButton
                      variant="ghost"
                      size="sm"
                      disabled={(data?.page ?? page) <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Anterior
                    </ActionButton>
                    <ActionButton
                      variant="ghost"
                      size="sm"
                      disabled={(data?.page ?? page) >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Próxima
                    </ActionButton>
                  </div>
                </div>
              </>
            )}
          </AjusteEmpresaGate>
        </Panel>
      </div>

      {detailId && (
        <NotaDetailDialog
          open={!!detailId}
          onOpenChange={(open) => {
            if (!open) setDetailId(null)
          }}
          nota={detail.data}
          isLoading={detail.isLoading}
        />
      )}

      {cancelTarget && (
        <CancelarNotaDialog
          open={!!cancelTarget}
          onOpenChange={(open) => {
            if (!open) setCancelTarget(null)
          }}
          numero={cancelTarget.numero}
          onConfirm={handleCancelar}
          isPending={cancelar.isPending}
        />
      )}
    </div>
  )
}
