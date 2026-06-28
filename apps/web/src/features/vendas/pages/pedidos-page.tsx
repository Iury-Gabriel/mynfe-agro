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
  useCancelarPedido,
  useConfirmarPedido,
  useCriarPedido,
  usePedidos,
  type Pedido,
  type PedidosFiltros,
  type PedidoStatus,
  type PedidoTipo,
} from '@/features/vendas/api/pedidos-api'
import { ConfirmActionDialog } from '@/features/vendas/components/confirm-action-dialog'
import { PedidoDetalheDialog } from '@/features/vendas/components/pedido-detalhe-dialog'
import { VendaFormDialog } from '@/features/vendas/components/venda-form-dialog'
import { formatCurrency } from '@/features/vendas/lib/format'
import { hasAnyPermission } from '@/lib/permissions'
import { useAuth } from '@/providers/auth-context'
import { useActiveEmpresaStore } from '@/stores/active-empresa-store'

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

const STATUS_FILTER_OPTIONS: { value: PedidoStatus | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'faturado', label: 'Faturado' },
  { value: 'cancelado', label: 'Cancelado' },
]

const columns: Column[] = [
  { key: 'numero', label: 'Número' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'empresa', label: 'Empresa' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'valor', label: 'Valor', align: 'right' },
  { key: 'status', label: 'Status' },
  { key: 'fiscal', label: 'Fiscal' },
  { key: 'acoes', label: '', align: 'right' },
]

interface PendingAction {
  pedido: Pedido
  kind: 'confirmar' | 'cancelar'
}

export function PedidosPage(): ReactElement {
  const { user } = useAuth()
  const empresaId = useActiveEmpresaStore((s) => s.activeEmpresaId)

  const canCreate = hasAnyPermission(user?.permissions, ['pedido:create'])
  const canConfirm = hasAnyPermission(user?.permissions, ['pedido:confirm'])
  const canCancel = hasAnyPermission(user?.permissions, ['pedido:cancel'])

  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<PedidoStatus | 'todos'>('todos')
  const [formOpen, setFormOpen] = useState(false)
  const [pending, setPending] = useState<PendingAction | null>(null)
  const [detalhe, setDetalhe] = useState<Pedido | null>(null)

  const filtros: PedidosFiltros =
    statusFilter === 'todos' ? {} : { status: statusFilter }

  const { data, isLoading, isError, refetch } = usePedidos({ empresaId, filtros, page })
  const criar = useCriarPedido()
  const confirmar = useConfirmarPedido()
  const cancelar = useCancelarPedido()

  const totalPages = data?.totalPages ?? 1

  function handleCreate(payload: VendaFormPayload): void {
    if (!empresaId) return
    criar.mutate(
      {
        empresaId,
        clienteId: payload.clienteId,
        data: payload.data,
        confirmar: payload.confirmar,
        observacoes: payload.observacoes,
        itens: payload.itens,
      },
      {
        onSuccess: () => {
          setFormOpen(false)
          toast.success('Pedido criado com sucesso.')
        },
        onError: () => toast.error('Não foi possível criar o pedido.'),
      },
    )
  }

  function handleConfirmAction(): void {
    if (!pending || !empresaId) return
    const mutation = pending.kind === 'confirmar' ? confirmar : cancelar
    mutation.mutate(
      { pedidoId: pending.pedido.id, empresaId },
      {
        onSuccess: () => {
          toast.success(
            pending.kind === 'confirmar' ? 'Pedido confirmado.' : 'Pedido cancelado.',
          )
          setPending(null)
        },
        onError: () => toast.error('Não foi possível concluir a ação.'),
      },
    )
  }

  const rows: Row[] = (data?.pedidos ?? []).map((pedido) => ({
    id: pedido.id,
    numero: <span className="font-medium text-foreground">{pedido.numero}</span>,
    cliente: pedido.clienteId,
    empresa: pedido.empresaFaturadoraId,
    tipo: <StatusPill tone={TIPO_TONE[pedido.tipo]}>{TIPO_LABEL[pedido.tipo]}</StatusPill>,
    valor: formatCurrency(pedido.valorTotal),
    status: <StatusPill tone={STATUS_TONE[pedido.status]}>{STATUS_LABEL[pedido.status]}</StatusPill>,
    fiscal: <StatusPill tone="neutral">—</StatusPill>,
    acoes: (
      <div className="flex justify-end gap-2">
        <ActionButton
          variant="ghost"
          size="sm"
          aria-label={`Ver detalhes do pedido ${pedido.numero}`}
          onClick={() => setDetalhe(pedido)}
        >
          <Eye />
        </ActionButton>
        {canConfirm && pedido.status === 'rascunho' && (
          <ActionButton
            variant="subtle"
            size="sm"
            onClick={() => setPending({ pedido, kind: 'confirmar' })}
          >
            Confirmar
          </ActionButton>
        )}
        {canCancel && pedido.status !== 'cancelado' && pedido.status !== 'faturado' && (
          <ActionButton
            variant="ghost"
            size="sm"
            onClick={() => setPending({ pedido, kind: 'cancelar' })}
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
        title="Pedidos"
        subtitle="Pedidos avulsos e consolidados faturados pela empresa ativa."
      />

      <div className="mt-6">
        <Panel
          title="Pedidos"
          action={
            canCreate && (
              <ActionButton
                variant="primary"
                size="sm"
                disabled={!empresaId}
                onClick={() => setFormOpen(true)}
              >
                <Plus /> Novo pedido
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
                    setStatusFilter(value as PedidoStatus | 'todos')
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
              <p className="py-10 text-center text-sm text-muted-foreground">Carregando pedidos…</p>
            ) : isError ? (
              <div className="flex flex-col items-center gap-3 py-10">
                <p className="text-sm text-destructive">Erro ao carregar pedidos.</p>
                <ActionButton variant="ghost" size="sm" onClick={() => void refetch()}>
                  Tentar novamente
                </ActionButton>
              </div>
            ) : (
              <>
                <DataTable columns={columns} rows={rows} minWidth={920} />
                <div className="mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row">
                  <p className="text-xs text-muted-foreground">
                    Página {data?.page ?? page} de {totalPages} · {data?.total ?? 0} pedidos
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
          title="Novo pedido"
          description="Cliente, itens e preço (resolvido automaticamente se vazio). A empresa ativa é a faturadora."
          submitLabel="Criar pedido"
          showConfirmar
          onSubmit={handleCreate}
          isPending={criar.isPending}
        />
      )}

      {detalhe && (
        <PedidoDetalheDialog
          open={!!detalhe}
          onOpenChange={(open) => {
            if (!open) setDetalhe(null)
          }}
          empresaId={empresaId}
          pedido={detalhe}
        />
      )}

      {pending && (
        <ConfirmActionDialog
          open={!!pending}
          onOpenChange={(open) => {
            if (!open) setPending(null)
          }}
          title={pending.kind === 'confirmar' ? 'Confirmar pedido' : 'Cancelar pedido'}
          description={
            pending.kind === 'confirmar'
              ? `Confirmar o pedido ${pending.pedido.numero}? O estoque será baixado.`
              : `Cancelar o pedido ${pending.pedido.numero}? Esta ação não pode ser desfeita.`
          }
          confirmLabel={pending.kind === 'confirmar' ? 'Confirmar pedido' : 'Cancelar pedido'}
          destructive={pending.kind === 'cancelar'}
          onConfirm={handleConfirmAction}
          isPending={confirmar.isPending || cancelar.isPending}
        />
      )}
    </div>
  )
}
