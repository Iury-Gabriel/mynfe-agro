import { Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import type {
  AtividadeCampo,
  AtividadeCampoTipo,
  CreateAtividadeCampoInput,
} from '@/features/admin/api/atividades-campo-api'
import type { ReactElement } from 'react'

import {
  useAtividadesCampo,
  useCreateAtividadeCampo,
  useDeleteAtividadeCampo,
} from '@/features/admin/api/atividades-campo-api'
import { AtividadeCampoDeleteDialog } from '@/features/admin/components/atividades-campo/atividade-campo-delete-dialog'
import { AtividadeCampoFormDialog } from '@/features/admin/components/atividades-campo/atividade-campo-form-dialog'
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
  { key: 'tipo', label: 'Tipo' },
  { key: 'data', label: 'Data' },
  { key: 'observacoes', label: 'Observações' },
  { key: 'acoes', label: 'Ações', align: 'right' },
]

const TIPO_LABELS: Record<AtividadeCampoTipo, string> = {
  plantio: 'Plantio',
  irrigacao: 'Irrigação',
  pulverizacao: 'Pulverização',
  adubacao: 'Adubação',
  outro: 'Outro',
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('pt-BR')
}

export function AtividadesCampoPage(): ReactElement {
  const { user } = useAuth()
  const canCreate = hasAnyPermission(user?.permissions, ['atividade:create'])
  const canDelete = hasAnyPermission(user?.permissions, ['atividade:delete'])

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selected, setSelected] = useState<AtividadeCampo | null>(null)

  const { data, isLoading, isError, refetch } = useAtividadesCampo({ page })
  const createAtividade = useCreateAtividadeCampo()
  const deleteAtividade = useDeleteAtividadeCampo()

  const atividades = useMemo(() => data?.atividades ?? [], [data])
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return atividades
    return atividades.filter(
      (a) =>
        TIPO_LABELS[a.tipo].toLowerCase().includes(term) ||
        (a.observacoes?.toLowerCase().includes(term) ?? false),
    )
  }, [atividades, search])

  const totalPages = data?.totalPages ?? 1

  function openCreate() {
    setFormOpen(true)
  }

  function openDelete(atividade: AtividadeCampo) {
    setSelected(atividade)
    setDeleteOpen(true)
  }

  function handleSubmit(payload: CreateAtividadeCampoInput) {
    createAtividade.mutate(payload, {
      onSuccess: () => {
        setFormOpen(false)
        toast.success('Atividade criada com sucesso.')
      },
      onError: () => toast.error('Não foi possível salvar a atividade.'),
    })
  }

  function handleDelete(target: AtividadeCampo) {
    deleteAtividade.mutate(target.id, {
      onSuccess: () => {
        setDeleteOpen(false)
        setSelected(null)
        toast.success('Atividade excluída.')
      },
      onError: (err) => {
        const message =
          err instanceof ApiError && err.isConflict
            ? 'Atividade possui registros vinculados.'
            : 'Não foi possível excluir a atividade.'
        toast.error(message)
      },
    })
  }

  const rows: Row[] = filtered.map((atividade) => ({
    id: atividade.id,
    tipo: <span className="font-medium text-foreground">{TIPO_LABELS[atividade.tipo]}</span>,
    data: formatDate(atividade.data),
    observacoes: atividade.observacoes ?? '—',
    acoes: (
      <div className="flex flex-wrap justify-end gap-2">
        {canDelete && (
          <ActionButton variant="subtle" size="sm" onClick={() => openDelete(atividade)}>
            <Trash2 /> Excluir
          </ActionButton>
        )}
      </div>
    ),
  }))

  return (
    <div className="agroflow agroflow-glow min-h-screen p-4 text-foreground sm:p-6">
      <PageHeader
        title="Atividades de campo"
        subtitle="Operações de campo registradas por safra ou área."
        actions={
          canCreate && (
            <ActionButton variant="primary" onClick={openCreate}>
              <Plus /> Nova atividade
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
                aria-label="Buscar atividades"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por tipo ou observação…"
                className="h-10 w-full rounded-xl border border-border/70 bg-background/50 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
            </div>
          </div>

          {isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Carregando atividades…</p>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <p className="text-sm text-destructive">Erro ao carregar atividades.</p>
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
                Página {data?.page ?? page} de {totalPages} · {data?.total ?? 0} atividades
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
        <AtividadeCampoFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={handleSubmit}
          isPending={createAtividade.isPending}
        />
      )}

      {deleteOpen && selected && (
        <AtividadeCampoDeleteDialog
          atividade={selected}
          open={deleteOpen}
          onOpenChange={() => {
            setDeleteOpen(false)
            setSelected(null)
          }}
          onConfirm={() => handleDelete(selected)}
          isPending={deleteAtividade.isPending}
        />
      )}
    </div>
  )
}
