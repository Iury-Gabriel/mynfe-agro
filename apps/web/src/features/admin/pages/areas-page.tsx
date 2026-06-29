import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import type { Area, CreateAreaInput } from '@/features/admin/api/areas-api'
import type { ReactElement } from 'react'

import { useAreas, useCreateArea, useDeleteArea, useUpdateArea } from '@/features/admin/api/areas-api'
import { AreaDeleteDialog } from '@/features/admin/components/areas/area-delete-dialog'
import { AreaFormDialog } from '@/features/admin/components/areas/area-form-dialog'
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
  { key: 'identificacao', label: 'Identificação' },
  { key: 'rotulo', label: 'Rótulo' },
  { key: 'tamanho', label: 'Tamanho', align: 'right' },
  { key: 'acoes', label: 'Ações', align: 'right' },
]

export function AreasPage(): ReactElement {
  const { user } = useAuth()
  const canCreate = hasAnyPermission(user?.permissions, ['area:create'])
  const canUpdate = hasAnyPermission(user?.permissions, ['area:update'])
  const canDelete = hasAnyPermission(user?.permissions, ['area:delete'])

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selected, setSelected] = useState<Area | null>(null)

  const { data, isLoading, isError, refetch } = useAreas({ page })
  const createArea = useCreateArea()
  const updateArea = useUpdateArea()
  const deleteArea = useDeleteArea()

  const areas = useMemo(() => data?.areas ?? [], [data])
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return areas
    return areas.filter(
      (a) =>
        a.identificacao.toLowerCase().includes(term) ||
        (a.rotulo?.toLowerCase().includes(term) ?? false),
    )
  }, [areas, search])

  const totalPages = data?.totalPages ?? 1
  const isMutating = createArea.isPending || updateArea.isPending

  function openCreate() {
    setSelected(null)
    setFormOpen(true)
  }

  function openEdit(area: Area) {
    setSelected(area)
    setFormOpen(true)
  }

  function openDelete(area: Area) {
    setSelected(area)
    setDeleteOpen(true)
  }

  function handleSubmit(payload: CreateAreaInput) {
    if (selected) {
      const { fazendaId: _fazendaId, ...rest } = payload
      updateArea.mutate(
        { id: selected.id, ...rest },
        {
          onSuccess: () => {
            setFormOpen(false)
            toast.success('Área atualizada com sucesso.')
          },
          onError: () => toast.error('Não foi possível salvar a área.'),
        },
      )
    } else {
      createArea.mutate(payload, {
        onSuccess: () => {
          setFormOpen(false)
          toast.success('Área criada com sucesso.')
        },
        onError: () => toast.error('Não foi possível salvar a área.'),
      })
    }
  }

  function handleDelete(target: Area) {
    deleteArea.mutate(target.id, {
      onSuccess: () => {
        setDeleteOpen(false)
        setSelected(null)
        toast.success('Área excluída.')
      },
      onError: (err) => {
        const message =
          err instanceof ApiError && err.isConflict
            ? 'Área possui registros vinculados.'
            : 'Não foi possível excluir a área.'
        toast.error(message)
      },
    })
  }

  const rows: Row[] = filtered.map((area) => ({
    id: area.id,
    identificacao: <span className="font-medium text-foreground">{area.identificacao}</span>,
    rotulo: area.rotulo ?? '—',
    tamanho:
      area.tamanho != null
        ? `${area.tamanho.toLocaleString('pt-BR')} ${area.unidadeTamanho ?? ''}`.trim()
        : '—',
    acoes: (
      <div className="flex flex-wrap justify-end gap-2">
        {canUpdate && (
          <ActionButton variant="ghost" size="sm" onClick={() => openEdit(area)}>
            <Pencil /> Editar
          </ActionButton>
        )}
        {canDelete && (
          <ActionButton variant="subtle" size="sm" onClick={() => openDelete(area)}>
            <Trash2 /> Excluir
          </ActionButton>
        )}
      </div>
    ),
  }))

  return (
    <div className="agroflow agroflow-glow min-h-screen p-4 text-foreground sm:p-6">
      <PageHeader
        title="Áreas"
        subtitle="Talhões e áreas produtivas das fazendas."
        actions={
          canCreate && (
            <ActionButton variant="primary" onClick={openCreate}>
              <Plus /> Nova área
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
                aria-label="Buscar áreas"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por identificação ou rótulo…"
                className="h-10 w-full rounded-xl border border-border/70 bg-background/50 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
            </div>
          </div>

          {isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Carregando áreas…</p>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <p className="text-sm text-destructive">Erro ao carregar áreas.</p>
              <ActionButton variant="ghost" size="sm" onClick={() => void refetch()}>
                Tentar novamente
              </ActionButton>
            </div>
          ) : (
            <DataTable columns={COLUMNS} rows={rows} minWidth={680} />
          )}

          {!isLoading && !isError && (
            <div className="mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-xs text-muted-foreground">
                Página {data?.page ?? page} de {totalPages} · {data?.total ?? 0} áreas
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
        <AreaFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          area={selected}
          onSubmit={handleSubmit}
          isPending={isMutating}
        />
      )}

      {deleteOpen && selected && (
        <AreaDeleteDialog
          area={selected}
          open={deleteOpen}
          onOpenChange={() => {
            setDeleteOpen(false)
            setSelected(null)
          }}
          onConfirm={() => handleDelete(selected)}
          isPending={deleteArea.isPending}
        />
      )}
    </div>
  )
}
