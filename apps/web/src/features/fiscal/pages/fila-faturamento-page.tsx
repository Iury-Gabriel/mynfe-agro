import { FileText } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { Column, PillTone, Row } from '@/features/agroflow/ui'
import type { FilaPedido, FilaPedidoTipo } from '@/features/fiscal/api/fila-faturamento-api'
import type { NotaFiscal } from '@/features/fiscal/api/notas-fiscais-api'
import type { ReactElement } from 'react'

import { ActionButton, DataTable, PageHeader, Panel, StatusPill } from '@/features/agroflow/ui'
import { AjusteEmpresaGate } from '@/features/estoque/components/empresa-gate'
import { useFilaFaturamento } from '@/features/fiscal/api/fila-faturamento-api'
import { useEmitirNota } from '@/features/fiscal/api/notas-fiscais-api'
import { EmitirDanfeDialog } from '@/features/fiscal/components/emitir-danfe-dialog'
import { FISCAL_STATUS_LABEL } from '@/features/fiscal/lib/status'
import { formatCurrency } from '@/features/vendas/lib/format'
import { hasAnyPermission } from '@/lib/permissions'
import { useAuth } from '@/providers/auth-context'
import { useActiveEmpresaStore } from '@/stores/active-empresa-store'

const TIPO_TONE: Record<FilaPedidoTipo, PillTone> = {
  avulso: 'neutral',
  consolidado: 'info',
}

const TIPO_LABEL: Record<FilaPedidoTipo, string> = {
  avulso: 'Avulso',
  consolidado: 'Consolidado',
}

const columns: Column[] = [
  { key: 'numero', label: 'Pedido' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'empresa', label: 'Empresa emitente' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'valor', label: 'Valor', align: 'right' },
  { key: 'acoes', label: '', align: 'right' },
]

export function FilaFaturamentoPage(): ReactElement {
  const { user } = useAuth()
  const empresaId = useActiveEmpresaStore((s) => s.activeEmpresaId)

  const canEmitir = hasAnyPermission(user?.permissions, ['nota:emitir'])

  const [page, setPage] = useState(1)
  const [reviewPedido, setReviewPedido] = useState<FilaPedido | null>(null)
  const [emittedNota, setEmittedNota] = useState<NotaFiscal | null>(null)

  const { data, isLoading, isError, refetch } = useFilaFaturamento({ empresaId, page })
  const emitir = useEmitirNota()

  const totalPages = data?.totalPages ?? 1

  function openReview(pedido: FilaPedido): void {
    setEmittedNota(null)
    setReviewPedido(pedido)
  }

  function closeReview(): void {
    setReviewPedido(null)
    setEmittedNota(null)
  }

  function handleConfirmEmissao(reviewEmpresaId: string, target: FilaPedido): void {
    emitir.mutate(
      { empresaId: reviewEmpresaId, pedidoId: target.id },
      {
        onSuccess: (nota) => {
          setEmittedNota(nota)
          toast.success(
            `DANFE do pedido ${target.numero}: ${FISCAL_STATUS_LABEL[nota.status]}.`,
          )
        },
        onError: () => toast.error('Não foi possível emitir a DANFE.'),
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
    acoes: (
      <div className="flex justify-end">
        {canEmitir && (
          <ActionButton variant="primary" size="sm" onClick={() => openReview(pedido)}>
            <FileText /> Revisar DANFE
          </ActionButton>
        )}
      </div>
    ),
  }))

  return (
    <div className="agroflow agroflow-glow min-h-screen p-4 text-foreground sm:p-6">
      <PageHeader
        title="Fila de faturamento"
        subtitle="Pedidos aptos a faturar pela empresa ativa — emissão de DANFE / NF-e."
      />

      <div className="mt-6">
        <Panel title="Pedidos aptos">
          <AjusteEmpresaGate empresaId={empresaId}>
            {isLoading ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Carregando fila…
              </p>
            ) : isError ? (
              <div className="flex flex-col items-center gap-3 py-10">
                <p className="text-sm text-destructive">Erro ao carregar a fila.</p>
                <ActionButton variant="ghost" size="sm" onClick={() => void refetch()}>
                  Tentar novamente
                </ActionButton>
              </div>
            ) : (
              <>
                <DataTable columns={columns} rows={rows} minWidth={900} />
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

      {reviewPedido && empresaId && (
        <EmitirDanfeDialog
          open={reviewPedido !== null}
          onOpenChange={closeReview}
          pedido={reviewPedido}
          empresaId={empresaId}
          nota={emittedNota}
          isEmitting={emitir.isPending}
          onConfirm={() => handleConfirmEmissao(empresaId, reviewPedido)}
        />
      )}
    </div>
  )
}
