import { Eye, Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { Column, PillTone, Row } from '@/features/agroflow/ui'
import type { VendaFormPayload } from '@/features/vendas/components/venda-form-dialog'
import type { ReactElement } from 'react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ActionButton, DataTable, PageHeader, Panel, StatusPill } from '@/features/agroflow/ui'
import { AjusteEmpresaGate } from '@/features/estoque/components/empresa-gate'
import {
  useCancelarRemessa,
  useCriarRemessa,
  useMarcarRemessaEntregue,
  useRemessas,
  type Remessa,
  type RemessasFiltros,
  type RemessaStatus,
} from '@/features/vendas/api/remessas-api'
import { ConfirmActionDialog } from '@/features/vendas/components/confirm-action-dialog'
import { RemessaDetalheDialog } from '@/features/vendas/components/remessa-detalhe-dialog'
import { VendaFormDialog } from '@/features/vendas/components/venda-form-dialog'
import { formatCurrency, formatDate } from '@/features/vendas/lib/format'
import { hasAnyPermission } from '@/lib/permissions'
import { useAuth } from '@/providers/auth-context'
import { useActiveEmpresaStore } from '@/stores/active-empresa-store'

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

const STATUS_FILTER_OPTIONS: { value: RemessaStatus | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'aberta', label: 'Aberta' },
  { value: 'entregue', label: 'Entregue' },
  { value: 'consolidada', label: 'Consolidada' },
  { value: 'cancelada', label: 'Cancelada' },
]

const columns: Column[] = [
  { key: 'numero', label: 'Número' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'empresa', label: 'Empresa' },
  { key: 'data', label: 'Data' },
  { key: 'valor', label: 'Valor estimado', align: 'right' },
  { key: 'status', label: 'Status' },
  { key: 'acoes', label: '', align: 'right' },
]

interface PendingAction {
  remessa: Remessa
  kind: 'entregue' | 'cancelar'
}

export function RemessasPage(): ReactElement {
  const { user } = useAuth()
  const empresaId = useActiveEmpresaStore((s) => s.activeEmpresaId)

  const canCreate = hasAnyPermission(user?.permissions, ['remessa:create'])
  const canUpdate = hasAnyPermission(user?.permissions, ['remessa:update'])
  const canCancel = hasAnyPermission(user?.permissions, ['remessa:cancel'])

  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<RemessaStatus | 'todos'>('todos')
  const [formOpen, setFormOpen] = useState(false)
  const [pending, setPending] = useState<PendingAction | null>(null)
  const [detalhe, setDetalhe] = useState<Remessa | null>(null)

  const filtros: RemessasFiltros = statusFilter === 'todos' ? {} : { status: statusFilter }

  const { data, isLoading, isError, refetch } = useRemessas({ empresaId, filtros, page })
  const criar = useCriarRemessa()
  const marcarEntregue = useMarcarRemessaEntregue()
  const cancelar = useCancelarRemessa()

  const totalPages = data?.totalPages ?? 1

  function handleCreate(payload: VendaFormPayload, empresaId: string): void {
    criar.mutate(
      {
        empresaId,
        clienteId: payload.clienteId,
        data: payload.data,
        observacoes: payload.observacoes,
        itens: payload.itens,
      },
      {
        onSuccess: () => {
          setFormOpen(false)
          toast.success('Remessa criada com sucesso.')
        },
        onError: () => toast.error('Não foi possível criar a remessa.'),
      },
    )
  }

  function handleConfirmAction(): void {
    if (!pending || !empresaId) return
    const mutation = pending.kind === 'entregue' ? marcarEntregue : cancelar
    mutation.mutate(
      { remessaId: pending.remessa.id, empresaId },
      {
        onSuccess: () => {
          toast.success(
            pending.kind === 'entregue' ? 'Remessa marcada como entregue.' : 'Remessa cancelada.',
          )
          setPending(null)
        },
        onError: () => toast.error('Não foi possível concluir a ação.'),
      },
    )
  }

  const rows: Row[] = (data?.remessas ?? []).map((remessa) => ({
    id: remessa.id,
    numero: <span className="font-medium text-foreground">{remessa.numero}</span>,
    cliente: remessa.clienteId,
    empresa: remessa.empresaFaturadoraId,
    data: formatDate(remessa.data),
    valor: formatCurrency(remessa.valorEstimado),
    status: (
      <StatusPill tone={STATUS_TONE[remessa.status]}>{STATUS_LABEL[remessa.status]}</StatusPill>
    ),
    acoes: (
      <div className="flex justify-end gap-2">
        <ActionButton
          variant="ghost"
          size="sm"
          aria-label={`Ver detalhes da remessa ${remessa.numero}`}
          onClick={() => setDetalhe(remessa)}
        >
          <Eye />
        </ActionButton>
        {canUpdate && remessa.status === 'aberta' && (
          <ActionButton
            variant="subtle"
            size="sm"
            onClick={() => setPending({ remessa, kind: 'entregue' })}
          >
            Entregue
          </ActionButton>
        )}
        {canCancel && (remessa.status === 'aberta' || remessa.status === 'entregue') && (
          <ActionButton
            variant="ghost"
            size="sm"
            onClick={() => setPending({ remessa, kind: 'cancelar' })}
          >
            Cancelar
          </ActionButton>
        )}
      </div>
    ),
  }))

  return (
    <div className="agroflow agroflow-glow min-h-screen p-4 text-foreground sm:p-6">
      <PageHeader
        title="Remessas"
        subtitle="Entregas parciais que serão consolidadas em um pedido mensal."
      />

      <div className="mt-6">
        <Panel
          title="Remessas"
          action={
            canCreate && (
              <ActionButton
                variant="primary"
                size="sm"
                disabled={!empresaId}
                onClick={() => setFormOpen(true)}
              >
                <Plus /> Nova remessa
              </ActionButton>
            )
          }
        >
          <AjusteEmpresaGate empresaId={empresaId}>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="w-full sm:max-w-xs">
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value as RemessaStatus | 'todos')
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
              <p className="py-10 text-center text-sm text-muted-foreground">Carregando remessas…</p>
            ) : isError ? (
              <div className="flex flex-col items-center gap-3 py-10">
                <p className="text-sm text-destructive">Erro ao carregar remessas.</p>
                <ActionButton variant="ghost" size="sm" onClick={() => void refetch()}>
                  Tentar novamente
                </ActionButton>
              </div>
            ) : (
              <>
                <DataTable columns={columns} rows={rows} minWidth={860} />
                <div className="mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row">
                  <p className="text-xs text-muted-foreground">
                    Página {data?.page ?? page} de {totalPages} · {data?.total ?? 0} remessas
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

      {formOpen && empresaId && (
        <VendaFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          empresaId={empresaId}
          title="Nova remessa"
          description="Cliente e itens da entrega. A empresa ativa é a faturadora."
          submitLabel="Criar remessa"
          onSubmit={(payload) => handleCreate(payload, empresaId)}
          isPending={criar.isPending}
        />
      )}

      {detalhe && (
        <RemessaDetalheDialog
          open={!!detalhe}
          onOpenChange={() => setDetalhe(null)}
          empresaId={empresaId}
          remessa={detalhe}
        />
      )}

      {pending && (
        <ConfirmActionDialog
          open={!!pending}
          onOpenChange={() => setPending(null)}
          title={pending.kind === 'entregue' ? 'Marcar como entregue' : 'Cancelar remessa'}
          description={
            pending.kind === 'entregue'
              ? `Marcar a remessa ${pending.remessa.numero} como entregue?`
              : `Cancelar a remessa ${pending.remessa.numero}? Esta ação não pode ser desfeita.`
          }
          confirmLabel={pending.kind === 'entregue' ? 'Marcar entregue' : 'Cancelar remessa'}
          destructive={pending.kind === 'cancelar'}
          onConfirm={handleConfirmAction}
          isPending={marcarEntregue.isPending || cancelar.isPending}
        />
      )}
    </div>
  )
}
