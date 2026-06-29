import { Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { Column, PillTone, Row } from '@/features/agroflow/ui'
import type { AjustarEstoqueInput, EstoqueMovimento } from '@/features/estoque/api/estoque-api'
import type { ReactElement } from 'react'

import {
  ActionButton,
  DataTable,
  PageHeader,
  Panel,
  StatusPill,
  Tabs,
} from '@/features/agroflow/ui'
import {
  useAjustarEstoque,
  useMovimentacoes,
  usePosicaoEstoque,
} from '@/features/estoque/api/estoque-api'
import { AjusteEstoqueDialog } from '@/features/estoque/components/ajuste-estoque-dialog'
import { AjusteEmpresaGate } from '@/features/estoque/components/empresa-gate'
import { formatDate, formatQty } from '@/features/estoque/lib/format'
import { hasAnyPermission } from '@/lib/permissions'
import { useAuth } from '@/providers/auth-context'
import { useActiveEmpresaStore } from '@/stores/active-empresa-store'

const TIPO_TONE: Record<string, PillTone> = {
  entrada: 'success',
  saida: 'danger',
  ajuste: 'warning',
  estorno: 'neutral',
  reserva: 'info',
}

const posicaoColumns: Column[] = [
  { key: 'produto', label: 'Produto' },
  { key: 'lote', label: 'Lote' },
  { key: 'disponivel', label: 'Disponível', align: 'right' },
  { key: 'reservado', label: 'Reservado', align: 'right' },
]

const movimentoColumns: Column[] = [
  { key: 'data', label: 'Data' },
  { key: 'produto', label: 'Produto' },
  { key: 'lote', label: 'Lote' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'origem', label: 'Origem' },
  { key: 'quantidade', label: 'Quantidade', align: 'right' },
  { key: 'motivo', label: 'Motivo' },
]

function PaginationBar({
  page,
  totalPages,
  total,
  label,
  onPrev,
  onNext,
}: {
  page: number
  totalPages: number
  total: number
  label: string
  onPrev: () => void
  onNext: () => void
}): ReactElement {
  return (
    <div className="mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-xs text-muted-foreground">
        Página {page} de {totalPages} · {total} {label}
      </p>
      <div className="flex gap-2">
        <ActionButton variant="ghost" size="sm" disabled={page <= 1} onClick={onPrev}>
          Anterior
        </ActionButton>
        <ActionButton variant="ghost" size="sm" disabled={page >= totalPages} onClick={onNext}>
          Próxima
        </ActionButton>
      </div>
    </div>
  )
}

function PosicaoTab({ empresaId }: { empresaId: string | null }): ReactElement {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, refetch } = usePosicaoEstoque({ empresaId, page })
  const totalPages = data?.totalPages ?? 1

  const rows: Row[] = (data?.saldos ?? []).map((s) => ({
    id: s.id,
    produto: <span className="font-medium text-foreground">{s.produtoId}</span>,
    lote: s.loteId ?? '—',
    disponivel: formatQty(s.quantidadeDisponivel),
    reservado: formatQty(s.quantidadeReservada),
  }))

  return (
    <Panel title="Posição de estoque">
      <AjusteEmpresaGate empresaId={empresaId}>
        {isLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Carregando posição…</p>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-10">
            <p className="text-sm text-destructive">Erro ao carregar posição de estoque.</p>
            <ActionButton variant="ghost" size="sm" onClick={() => void refetch()}>
              Tentar novamente
            </ActionButton>
          </div>
        ) : (
          <>
            <DataTable columns={posicaoColumns} rows={rows} minWidth={680} />
            <PaginationBar
              page={data?.page ?? page}
              totalPages={totalPages}
              total={data?.total ?? 0}
              label="saldos"
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => p + 1)}
            />
          </>
        )}
      </AjusteEmpresaGate>
    </Panel>
  )
}

const TIPO_LABEL: Record<string, string> = {
  entrada: 'Entrada',
  saida: 'Saída',
  ajuste: 'Ajuste',
  estorno: 'Estorno',
  reserva: 'Reserva',
}

function tipoLabel(tipo: string): string {
  return TIPO_LABEL[tipo] ?? tipo
}

function movimentoRow(m: EstoqueMovimento): Row {
  return {
    id: m.id,
    data: formatDate(m.data),
    produto: m.produtoId,
    lote: m.loteId ?? '—',
    tipo: <StatusPill tone={TIPO_TONE[m.tipo] ?? 'neutral'}>{tipoLabel(m.tipo)}</StatusPill>,
    origem: m.origem,
    quantidade: formatQty(m.quantidade),
    motivo: m.motivo ?? '—',
  }
}

function MovimentacoesTab({ empresaId }: { empresaId: string | null }): ReactElement {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, refetch } = useMovimentacoes({ empresaId, page })
  const totalPages = data?.totalPages ?? 1

  const rows: Row[] = (data?.movimentos ?? []).map(movimentoRow)

  return (
    <Panel title="Movimentações">
      <AjusteEmpresaGate empresaId={empresaId}>
        {isLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Carregando movimentações…</p>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-10">
            <p className="text-sm text-destructive">Erro ao carregar movimentações.</p>
            <ActionButton variant="ghost" size="sm" onClick={() => void refetch()}>
              Tentar novamente
            </ActionButton>
          </div>
        ) : (
          <>
            <DataTable columns={movimentoColumns} rows={rows} minWidth={880} />
            <PaginationBar
              page={data?.page ?? page}
              totalPages={totalPages}
              total={data?.total ?? 0}
              label="movimentos"
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => p + 1)}
            />
          </>
        )}
      </AjusteEmpresaGate>
    </Panel>
  )
}

function AjusteTab({
  empresaId,
  canAjustar,
}: {
  empresaId: string | null
  canAjustar: boolean
}): ReactElement {
  const [open, setOpen] = useState(false)
  const ajustar = useAjustarEstoque()

  function handleSubmit(payload: AjustarEstoqueInput) {
    ajustar.mutate(payload, {
      onSuccess: () => {
        setOpen(false)
        toast.success('Ajuste registrado com sucesso.')
      },
      onError: () => toast.error('Não foi possível registrar o ajuste.'),
    })
  }

  return (
    <Panel
      title="Ajuste manual de estoque"
      description="Corrige o saldo de um produto com motivo registrado."
      action={
        canAjustar && (
          <ActionButton
            variant="primary"
            size="sm"
            disabled={!empresaId}
            onClick={() => setOpen(true)}
          >
            <Plus /> Registrar ajuste
          </ActionButton>
        )
      }
    >
      <AjusteEmpresaGate empresaId={empresaId}>
        {!canAjustar ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Você não tem permissão para ajustar o estoque.
          </p>
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Use o botão “Registrar ajuste” para corrigir o saldo de um produto.
          </p>
        )}
      </AjusteEmpresaGate>

      {open && empresaId && (
        <AjusteEstoqueDialog
          open={open}
          onOpenChange={setOpen}
          empresaId={empresaId}
          onSubmit={handleSubmit}
          isPending={ajustar.isPending}
        />
      )}
    </Panel>
  )
}

export function EstoquePage(): ReactElement {
  const { user } = useAuth()
  const canAjustar = hasAnyPermission(user?.permissions, ['estoque:ajuste'])
  const empresaId = useActiveEmpresaStore((s) => s.activeEmpresaId)

  return (
    <div className="agroflow agroflow-glow min-h-screen p-4 text-foreground sm:p-6">
      <PageHeader
        title="Estoque"
        subtitle="Saldo por produto, extrato de movimentações e ajustes manuais."
      />

      <div className="mt-6">
        <Tabs
          items={[
            { id: 'posicao', label: 'Posição', content: <PosicaoTab empresaId={empresaId} /> },
            {
              id: 'movimentos',
              label: 'Movimentações',
              content: <MovimentacoesTab empresaId={empresaId} />,
            },
            {
              id: 'ajuste',
              label: 'Ajuste',
              content: <AjusteTab empresaId={empresaId} canAjustar={canAjustar} />,
            },
          ]}
        />
      </div>
    </div>
  )
}
