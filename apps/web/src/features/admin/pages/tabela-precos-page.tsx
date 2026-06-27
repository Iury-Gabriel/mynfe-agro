import { Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import type { TabelaPreco } from '@/features/admin/api/tabela-precos-api'
import type { PrecoFormValues } from '@/features/admin/components/precos/preco-form-dialog'
import type { ReactElement } from 'react'

import {
  useCreateTabelaPreco,
  useDeleteTabelaPreco,
  useTabelaPrecos,
} from '@/features/admin/api/tabela-precos-api'
import { PrecoDeleteDialog } from '@/features/admin/components/precos/preco-delete-dialog'
import {
  PrecoFormDialog,
  toCreatePayload,
} from '@/features/admin/components/precos/preco-form-dialog'
import {
  ActionButton,
  DataTable,
  PageHeader,
  Panel,
  type Column,
  type Row,
} from '@/features/agroflow/ui'
import { hasAnyPermission } from '@/lib/permissions'
import { useAuth } from '@/providers/auth-context'

const COLUMNS: Column[] = [
  { key: 'cliente', label: 'Cliente' },
  { key: 'produto', label: 'Produto' },
  { key: 'preco', label: 'Preço', align: 'right' },
  { key: 'vigencia', label: 'Vigência' },
  { key: 'acoes', label: 'Ações', align: 'right' },
]

const PRECO_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(date)
}

function formatVigencia(preco: TabelaPreco): string {
  const inicio = formatDate(preco.vigenciaInicio)
  const fim = formatDate(preco.vigenciaFim)
  if (preco.vigenciaInicio === null && preco.vigenciaFim === null) return 'Sem vigência'
  return `${inicio} → ${fim}`
}

export function TabelaPrecosPage(): ReactElement {
  const { user } = useAuth()
  const canCreate = hasAnyPermission(user?.permissions, ['preco:create'])
  const canDelete = hasAnyPermission(user?.permissions, ['preco:delete'])

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selected, setSelected] = useState<TabelaPreco | null>(null)

  const { data, isLoading, isError, refetch } = useTabelaPrecos({ page })
  const createPreco = useCreateTabelaPreco()
  const deletePreco = useDeleteTabelaPreco()

  const precos = useMemo(() => data?.tabelaPrecos ?? [], [data])
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return precos
    return precos.filter(
      (p) =>
        p.clienteId.toLowerCase().includes(term) || p.produtoId.toLowerCase().includes(term),
    )
  }, [precos, search])

  const totalPages = data?.totalPages ?? 1

  function openCreate() {
    setFormOpen(true)
  }

  function openDelete(preco: TabelaPreco) {
    setSelected(preco)
    setDeleteOpen(true)
  }

  function handleSubmit(values: PrecoFormValues) {
    createPreco.mutate(toCreatePayload(values), {
      onSuccess: () => {
        setFormOpen(false)
        toast.success('Preço criado com sucesso.')
      },
      onError: () => toast.error('Não foi possível salvar o preço.'),
    })
  }

  function handleDeleteConfirm() {
    if (!selected) return
    deletePreco.mutate(selected.id, {
      onSuccess: () => {
        setDeleteOpen(false)
        setSelected(null)
        toast.success('Preço excluído.')
      },
      onError: () => toast.error('Não foi possível excluir o preço.'),
    })
  }

  const rows: Row[] = filtered.map((preco) => ({
    id: preco.id,
    cliente: <span className="font-medium text-foreground">{preco.clienteId}</span>,
    produto: preco.produtoId,
    preco: PRECO_FORMATTER.format(preco.preco),
    vigencia: formatVigencia(preco),
    acoes: (
      <div className="flex flex-wrap justify-end gap-2">
        {canDelete && (
          <ActionButton variant="subtle" size="sm" onClick={() => openDelete(preco)}>
            <Trash2 /> Excluir
          </ActionButton>
        )}
      </div>
    ),
  }))

  return (
    <div className="agroflow agroflow-glow min-h-screen p-4 text-foreground sm:p-6">
      <PageHeader
        title="Tabela de preços"
        subtitle="Preços por cliente e produto, com vigência."
        actions={
          canCreate && (
            <ActionButton variant="primary" onClick={openCreate}>
              <Plus /> Novo preço
            </ActionButton>
          )
        }
      />

      <div className="mt-6">
        <Panel>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <input
                type="search"
                aria-label="Buscar preços"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por cliente ou produto…"
                className="h-10 w-full rounded-xl border border-border/70 bg-background/50 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
            </div>
          </div>

          {isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Carregando preços…</p>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <p className="text-sm text-destructive">Erro ao carregar preços.</p>
              <ActionButton variant="ghost" size="sm" onClick={() => void refetch()}>
                Tentar novamente
              </ActionButton>
            </div>
          ) : (
            <DataTable columns={COLUMNS} rows={rows} minWidth={760} />
          )}

          {!isLoading && !isError && (
            <div className="mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-xs text-muted-foreground">
                Página {data?.page ?? page} de {totalPages} · {data?.total ?? 0} preços
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
          )}
        </Panel>
      </div>

      {formOpen && (
        <PrecoFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={handleSubmit}
          isPending={createPreco.isPending}
        />
      )}

      {deleteOpen && selected && (
        <PrecoDeleteDialog
          preco={selected}
          open={deleteOpen}
          onOpenChange={(open) => {
            setDeleteOpen(open)
            if (!open) setSelected(null)
          }}
          onConfirm={handleDeleteConfirm}
          isPending={deletePreco.isPending}
        />
      )}
    </div>
  )
}
