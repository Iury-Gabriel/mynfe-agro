import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import type { CreateSafraInput, Safra, SafraStatus } from '@/features/admin/api/safras-api'
import type { ReactElement } from 'react'

import {
  useCreateSafra,
  useDeleteSafra,
  useSafras,
  useUpdateSafra,
} from '@/features/admin/api/safras-api'
import { SafraDeleteDialog } from '@/features/admin/components/safras/safra-delete-dialog'
import { SafraFormDialog } from '@/features/admin/components/safras/safra-form-dialog'
import {
  ActionButton,
  DataTable,
  PageHeader,
  Panel,
  StatusPill,
  type Column,
  type PillTone,
  type Row,
} from '@/features/agroflow/ui'
import { ApiError } from '@/lib/api-error'
import { hasAnyPermission } from '@/lib/permissions'
import { useAuth } from '@/providers/auth-context'

const COLUMNS: Column[] = [
  { key: 'cultura', label: 'Cultura' },
  { key: 'variedade', label: 'Variedade' },
  { key: 'status', label: 'Status' },
  { key: 'plantio', label: 'Plantio' },
  { key: 'acoes', label: 'Ações', align: 'right' },
]

const STATUS_LABELS: Record<SafraStatus, string> = {
  planejado: 'Planejado',
  em_andamento: 'Em andamento',
  colhido: 'Colhido',
}

const STATUS_TONES: Record<SafraStatus, PillTone> = {
  planejado: 'neutral',
  em_andamento: 'info',
  colhido: 'success',
}

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString('pt-BR') : '—'
}

export function SafrasPage(): ReactElement {
  const { user } = useAuth()
  const canCreate = hasAnyPermission(user?.permissions, ['safra:create'])
  const canUpdate = hasAnyPermission(user?.permissions, ['safra:update'])
  const canDelete = hasAnyPermission(user?.permissions, ['safra:delete'])

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selected, setSelected] = useState<Safra | null>(null)

  const { data, isLoading, isError, refetch } = useSafras({ page })
  const createSafra = useCreateSafra()
  const updateSafra = useUpdateSafra()
  const deleteSafra = useDeleteSafra()

  const safras = useMemo(() => data?.safras ?? [], [data])
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return safras
    return safras.filter(
      (s) =>
        s.cultura.toLowerCase().includes(term) ||
        (s.variedade?.toLowerCase().includes(term) ?? false),
    )
  }, [safras, search])

  const totalPages = data?.totalPages ?? 1
  const isMutating = createSafra.isPending || updateSafra.isPending

  function openCreate() {
    setSelected(null)
    setFormOpen(true)
  }

  function openEdit(safra: Safra) {
    setSelected(safra)
    setFormOpen(true)
  }

  function openDelete(safra: Safra) {
    setSelected(safra)
    setDeleteOpen(true)
  }

  function handleSubmit(payload: CreateSafraInput) {
    if (selected) {
      const { areaId: _areaId, ...rest } = payload
      updateSafra.mutate(
        { id: selected.id, ...rest },
        {
          onSuccess: () => {
            setFormOpen(false)
            toast.success('Safra atualizada com sucesso.')
          },
          onError: () => toast.error('Não foi possível salvar a safra.'),
        },
      )
    } else {
      createSafra.mutate(payload, {
        onSuccess: () => {
          setFormOpen(false)
          toast.success('Safra criada com sucesso.')
        },
        onError: () => toast.error('Não foi possível salvar a safra.'),
      })
    }
  }

  function handleDelete(target: Safra) {
    deleteSafra.mutate(target.id, {
      onSuccess: () => {
        setDeleteOpen(false)
        setSelected(null)
        toast.success('Safra excluída.')
      },
      onError: (err) => {
        const message =
          err instanceof ApiError && err.isConflict
            ? 'Safra possui registros vinculados.'
            : 'Não foi possível excluir a safra.'
        toast.error(message)
      },
    })
  }

  const rows: Row[] = filtered.map((safra) => ({
    id: safra.id,
    cultura: <span className="font-medium text-foreground">{safra.cultura}</span>,
    variedade: safra.variedade ?? '—',
    status: <StatusPill tone={STATUS_TONES[safra.status]}>{STATUS_LABELS[safra.status]}</StatusPill>,
    plantio: formatDate(safra.dataPlantio),
    acoes: (
      <div className="flex flex-wrap justify-end gap-2">
        {canUpdate && (
          <ActionButton variant="ghost" size="sm" onClick={() => openEdit(safra)}>
            <Pencil /> Editar
          </ActionButton>
        )}
        {canDelete && (
          <ActionButton variant="subtle" size="sm" onClick={() => openDelete(safra)}>
            <Trash2 /> Excluir
          </ActionButton>
        )}
      </div>
    ),
  }))

  return (
    <div className="agroflow agroflow-glow min-h-screen p-4 text-foreground sm:p-6">
      <PageHeader
        title="Safras"
        subtitle="Ciclos de cultivo e safra por área."
        actions={
          canCreate && (
            <ActionButton variant="primary" onClick={openCreate}>
              <Plus /> Nova safra
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
                aria-label="Buscar safras"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por cultura ou variedade…"
                className="h-10 w-full rounded-xl border border-border/70 bg-background/50 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
            </div>
          </div>

          {isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Carregando safras…</p>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <p className="text-sm text-destructive">Erro ao carregar safras.</p>
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
                Página {data?.page ?? page} de {totalPages} · {data?.total ?? 0} safras
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
        <SafraFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          safra={selected}
          onSubmit={handleSubmit}
          isPending={isMutating}
        />
      )}

      {deleteOpen && selected && (
        <SafraDeleteDialog
          safra={selected}
          open={deleteOpen}
          onOpenChange={() => {
            setDeleteOpen(false)
            setSelected(null)
          }}
          onConfirm={() => handleDelete(selected)}
          isPending={deleteSafra.isPending}
        />
      )}
    </div>
  )
}
