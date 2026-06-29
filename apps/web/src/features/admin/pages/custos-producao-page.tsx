import { Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import type {
  CreateCustoProducaoInput,
  CustoProducao,
  CustoProducaoTipo,
} from '@/features/admin/api/custos-producao-api'
import type { ReactElement } from 'react'

import {
  useCreateCustoProducao,
  useCustosProducao,
  useDeleteCustoProducao,
} from '@/features/admin/api/custos-producao-api'
import { CustoProducaoDeleteDialog } from '@/features/admin/components/custos-producao/custo-producao-delete-dialog'
import { CustoProducaoFormDialog } from '@/features/admin/components/custos-producao/custo-producao-form-dialog'
import {
  ActionButton,
  DataTable,
  PageHeader,
  Panel,
  type Column,
  type Row,
} from '@/features/agroflow/ui'
import { ApiError } from '@/lib/api-error'
import { hasAnyPermission } from '@/lib/permissions'
import { useAuth } from '@/providers/auth-context'

const COLUMNS: Column[] = [
  { key: 'descricao', label: 'Descrição' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'data', label: 'Data' },
  { key: 'valor', label: 'Valor', align: 'right' },
  { key: 'acoes', label: 'Ações', align: 'right' },
]

const TIPO_LABELS: Record<CustoProducaoTipo, string> = {
  insumo: 'Insumo',
  mao_de_obra: 'Mão de obra',
  maquinario: 'Maquinário',
  outro: 'Outro',
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('pt-BR')
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function CustosProducaoPage(): ReactElement {
  const { user } = useAuth()
  const canCreate = hasAnyPermission(user?.permissions, ['custo:create'])
  const canDelete = hasAnyPermission(user?.permissions, ['custo:delete'])

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selected, setSelected] = useState<CustoProducao | null>(null)

  const { data, isLoading, isError, refetch } = useCustosProducao({ page })
  const createCusto = useCreateCustoProducao()
  const deleteCusto = useDeleteCustoProducao()

  const custos = useMemo(() => data?.custos ?? [], [data])
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return custos
    return custos.filter(
      (c) =>
        c.descricao.toLowerCase().includes(term) ||
        TIPO_LABELS[c.tipo].toLowerCase().includes(term),
    )
  }, [custos, search])

  const totalPages = data?.totalPages ?? 1

  function openCreate() {
    setFormOpen(true)
  }

  function openDelete(custo: CustoProducao) {
    setSelected(custo)
    setDeleteOpen(true)
  }

  function handleSubmit(payload: CreateCustoProducaoInput) {
    createCusto.mutate(payload, {
      onSuccess: () => {
        setFormOpen(false)
        toast.success('Custo criado com sucesso.')
      },
      onError: () => toast.error('Não foi possível salvar o custo.'),
    })
  }

  function handleDelete(target: CustoProducao) {
    deleteCusto.mutate(target.id, {
      onSuccess: () => {
        setDeleteOpen(false)
        setSelected(null)
        toast.success('Custo excluído.')
      },
      onError: (err) => {
        const message =
          err instanceof ApiError && err.isConflict
            ? 'Custo possui registros vinculados.'
            : 'Não foi possível excluir o custo.'
        toast.error(message)
      },
    })
  }

  const rows: Row[] = filtered.map((custo) => ({
    id: custo.id,
    descricao: <span className="font-medium text-foreground">{custo.descricao}</span>,
    tipo: TIPO_LABELS[custo.tipo],
    data: formatDate(custo.data),
    valor: formatCurrency(custo.valor),
    acoes: (
      <div className="flex flex-wrap justify-end gap-2">
        {canDelete && (
          <ActionButton variant="subtle" size="sm" onClick={() => openDelete(custo)}>
            <Trash2 /> Excluir
          </ActionButton>
        )}
      </div>
    ),
  }))

  return (
    <div className="agroflow agroflow-glow min-h-screen p-4 text-foreground sm:p-6">
      <PageHeader
        title="Custos de produção"
        subtitle="Despesas de produção por safra ou área."
        actions={
          canCreate && (
            <ActionButton variant="primary" onClick={openCreate}>
              <Plus /> Novo custo
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
                aria-label="Buscar custos"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por descrição ou tipo…"
                className="h-10 w-full rounded-xl border border-border/70 bg-background/50 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
            </div>
          </div>

          {isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Carregando custos…</p>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <p className="text-sm text-destructive">Erro ao carregar custos.</p>
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
                Página {data?.page ?? page} de {totalPages} · {data?.total ?? 0} custos
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
        <CustoProducaoFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={handleSubmit}
          isPending={createCusto.isPending}
        />
      )}

      {deleteOpen && selected && (
        <CustoProducaoDeleteDialog
          custo={selected}
          open={deleteOpen}
          onOpenChange={() => {
            setDeleteOpen(false)
            setSelected(null)
          }}
          onConfirm={() => handleDelete(selected)}
          isPending={deleteCusto.isPending}
        />
      )}
    </div>
  )
}
