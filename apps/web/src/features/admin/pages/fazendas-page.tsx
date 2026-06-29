import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import type { CreateFazendaInput, Fazenda } from '@/features/admin/api/fazendas-api'
import type { ReactElement } from 'react'

import {
  useCreateFazenda,
  useDeleteFazenda,
  useFazendas,
  useUpdateFazenda,
} from '@/features/admin/api/fazendas-api'
import { FazendaDeleteDialog } from '@/features/admin/components/fazendas/fazenda-delete-dialog'
import { FazendaFormDialog } from '@/features/admin/components/fazendas/fazenda-form-dialog'
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
  { key: 'nome', label: 'Nome' },
  { key: 'municipio', label: 'Município / UF' },
  { key: 'car', label: 'CAR' },
  { key: 'area', label: 'Área (ha)', align: 'right' },
  { key: 'acoes', label: 'Ações', align: 'right' },
]

export function FazendasPage(): ReactElement {
  const { user } = useAuth()
  const canCreate = hasAnyPermission(user?.permissions, ['fazenda:create'])
  const canUpdate = hasAnyPermission(user?.permissions, ['fazenda:update'])
  const canDelete = hasAnyPermission(user?.permissions, ['fazenda:delete'])

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selected, setSelected] = useState<Fazenda | null>(null)

  const { data, isLoading, isError, refetch } = useFazendas({ page })
  const createFazenda = useCreateFazenda()
  const updateFazenda = useUpdateFazenda()
  const deleteFazenda = useDeleteFazenda()

  const fazendas = useMemo(() => data?.fazendas ?? [], [data])
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return fazendas
    return fazendas.filter(
      (f) =>
        f.nome.toLowerCase().includes(term) ||
        (f.municipio?.toLowerCase().includes(term) ?? false) ||
        (f.car?.toLowerCase().includes(term) ?? false),
    )
  }, [fazendas, search])

  const totalPages = data?.totalPages ?? 1
  const isMutating = createFazenda.isPending || updateFazenda.isPending

  function openCreate() {
    setSelected(null)
    setFormOpen(true)
  }

  function openEdit(fazenda: Fazenda) {
    setSelected(fazenda)
    setFormOpen(true)
  }

  function openDelete(fazenda: Fazenda) {
    setSelected(fazenda)
    setDeleteOpen(true)
  }

  function handleSubmit(payload: CreateFazendaInput) {
    if (selected) {
      const { empresaId: _empresaId, ...rest } = payload
      updateFazenda.mutate(
        { id: selected.id, ...rest },
        {
          onSuccess: () => {
            setFormOpen(false)
            toast.success('Fazenda atualizada com sucesso.')
          },
          onError: () => toast.error('Não foi possível salvar a fazenda.'),
        },
      )
    } else {
      createFazenda.mutate(payload, {
        onSuccess: () => {
          setFormOpen(false)
          toast.success('Fazenda criada com sucesso.')
        },
        onError: () => toast.error('Não foi possível salvar a fazenda.'),
      })
    }
  }

  function handleDelete(target: Fazenda) {
    deleteFazenda.mutate(target.id, {
      onSuccess: () => {
        setDeleteOpen(false)
        setSelected(null)
        toast.success('Fazenda excluída.')
      },
      onError: (err) => {
        const message =
          err instanceof ApiError && err.isConflict
            ? 'Fazenda possui registros vinculados.'
            : 'Não foi possível excluir a fazenda.'
        toast.error(message)
      },
    })
  }

  const rows: Row[] = filtered.map((fazenda) => ({
    id: fazenda.id,
    nome: <span className="font-medium text-foreground">{fazenda.nome}</span>,
    municipio:
      fazenda.municipio || fazenda.uf
        ? `${fazenda.municipio ?? '—'}${fazenda.uf ? ` / ${fazenda.uf}` : ''}`
        : '—',
    car: fazenda.car ?? '—',
    area: fazenda.areaTotalHa != null ? fazenda.areaTotalHa.toLocaleString('pt-BR') : '—',
    acoes: (
      <div className="flex flex-wrap justify-end gap-2">
        {canUpdate && (
          <ActionButton variant="ghost" size="sm" onClick={() => openEdit(fazenda)}>
            <Pencil /> Editar
          </ActionButton>
        )}
        {canDelete && (
          <ActionButton variant="subtle" size="sm" onClick={() => openDelete(fazenda)}>
            <Trash2 /> Excluir
          </ActionButton>
        )}
      </div>
    ),
  }))

  return (
    <div className="agroflow agroflow-glow min-h-screen p-4 text-foreground sm:p-6">
      <PageHeader
        title="Fazendas"
        subtitle="Imóveis rurais (fazendas) do seu tenant."
        actions={
          canCreate && (
            <ActionButton variant="primary" onClick={openCreate}>
              <Plus /> Nova fazenda
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
                aria-label="Buscar fazendas"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, município ou CAR…"
                className="h-10 w-full rounded-xl border border-border/70 bg-background/50 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
            </div>
          </div>

          {isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Carregando fazendas…</p>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <p className="text-sm text-destructive">Erro ao carregar fazendas.</p>
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
                Página {data?.page ?? page} de {totalPages} · {data?.total ?? 0} fazendas
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
        <FazendaFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          fazenda={selected}
          onSubmit={handleSubmit}
          isPending={isMutating}
        />
      )}

      {deleteOpen && selected && (
        <FazendaDeleteDialog
          fazenda={selected}
          open={deleteOpen}
          onOpenChange={() => {
            setDeleteOpen(false)
            setSelected(null)
          }}
          onConfirm={() => handleDelete(selected)}
          isPending={deleteFazenda.isPending}
        />
      )}
    </div>
  )
}
