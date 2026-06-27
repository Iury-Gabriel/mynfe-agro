import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import type { Cliente, CreateClienteInput } from '@/features/admin/api/clientes-api'
import type { ReactElement } from 'react'

import {
  useClientes,
  useCreateCliente,
  useDeleteCliente,
  useUpdateCliente,
} from '@/features/admin/api/clientes-api'
import { ClienteDeleteDialog } from '@/features/admin/components/clientes/cliente-delete-dialog'
import { ClienteFormDialog } from '@/features/admin/components/clientes/cliente-form-dialog'
import {
  ActionButton,
  DataTable,
  PageHeader,
  Panel,
  StatusPill,
  type Column,
  type Row,
} from '@/features/agroflow/ui'
import { ApiError } from '@/lib/api-error'
import { hasAnyPermission } from '@/lib/permissions'
import { useAuth } from '@/providers/auth-context'

const COLUMNS: Column[] = [
  { key: 'nome', label: 'Razão social / Nome' },
  { key: 'documento', label: 'CNPJ / CPF' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'icms', label: 'ICMS' },
  { key: 'contato', label: 'Contato' },
  { key: 'acoes', label: 'Ações', align: 'right' },
]

const TIPO_LABEL: Record<string, string> = {
  PJ: 'Jurídica',
  PF: 'Física',
}

export function ClientesPage(): ReactElement {
  const { user } = useAuth()
  const canCreate = hasAnyPermission(user?.permissions, ['cliente:create'])
  const canUpdate = hasAnyPermission(user?.permissions, ['cliente:update'])
  const canDelete = hasAnyPermission(user?.permissions, ['cliente:delete'])

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selected, setSelected] = useState<Cliente | null>(null)

  const { data, isLoading, isError, refetch } = useClientes({ page })
  const createCliente = useCreateCliente()
  const updateCliente = useUpdateCliente()
  const deleteCliente = useDeleteCliente()

  const clientes = useMemo(() => data?.clientes ?? [], [data])
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return clientes
    return clientes.filter(
      (c) =>
        c.razaoSocialNome.toLowerCase().includes(term) ||
        c.cnpjCpfFormatado.toLowerCase().includes(term) ||
        (c.email?.toLowerCase().includes(term) ?? false),
    )
  }, [clientes, search])

  const totalPages = data?.totalPages ?? 1
  const isMutating = createCliente.isPending || updateCliente.isPending

  function openCreate() {
    setSelected(null)
    setFormOpen(true)
  }

  function openEdit(cliente: Cliente) {
    setSelected(cliente)
    setFormOpen(true)
  }

  function openDelete(cliente: Cliente) {
    setSelected(cliente)
    setDeleteOpen(true)
  }

  function handleSubmit(payload: CreateClienteInput) {
    if (selected) {
      updateCliente.mutate(
        { id: selected.id, ...payload },
        {
          onSuccess: () => {
            setFormOpen(false)
            toast.success('Cliente atualizado com sucesso.')
          },
          onError: (err) => {
            const message =
              err instanceof ApiError && err.kind === 'InvalidCnpjCpf'
                ? 'CNPJ/CPF inválido.'
                : 'Não foi possível salvar o cliente.'
            toast.error(message)
          },
        },
      )
    } else {
      createCliente.mutate(payload, {
        onSuccess: () => {
          setFormOpen(false)
          toast.success('Cliente criado com sucesso.')
        },
        onError: (err) => {
          const message =
            err instanceof ApiError && err.kind === 'InvalidCnpjCpf'
              ? 'CNPJ/CPF inválido.'
              : 'Não foi possível salvar o cliente.'
          toast.error(message)
        },
      })
    }
  }

  function handleDelete() {
    if (!selected) return
    deleteCliente.mutate(selected.id, {
      onSuccess: () => {
        setDeleteOpen(false)
        setSelected(null)
        toast.success('Cliente excluído.')
      },
      onError: () => toast.error('Não foi possível excluir o cliente.'),
    })
  }

  const rows: Row[] = filtered.map((cliente) => ({
    id: cliente.id,
    nome: <span className="font-medium text-foreground">{cliente.razaoSocialNome}</span>,
    documento: cliente.cnpjCpfFormatado,
    tipo: TIPO_LABEL[cliente.tipoPessoa] ?? cliente.tipoPessoa,
    icms: (
      <StatusPill tone={cliente.contribuinteIcms ? 'success' : 'neutral'}>
        {cliente.contribuinteIcms ? 'Contribuinte' : 'Não'}
      </StatusPill>
    ),
    contato: cliente.email ?? cliente.telefone ?? '—',
    acoes: (
      <div className="flex flex-wrap justify-end gap-2">
        {canUpdate && (
          <ActionButton variant="ghost" size="sm" onClick={() => openEdit(cliente)}>
            <Pencil /> Editar
          </ActionButton>
        )}
        {canDelete && (
          <ActionButton variant="subtle" size="sm" onClick={() => openDelete(cliente)}>
            <Trash2 /> Excluir
          </ActionButton>
        )}
      </div>
    ),
  }))

  return (
    <div className="agroflow agroflow-glow min-h-screen p-4 text-foreground sm:p-6">
      <PageHeader
        title="Clientes"
        subtitle="Destinatários (clientes) do seu tenant."
        actions={
          canCreate && (
            <ActionButton variant="primary" onClick={openCreate}>
              <Plus /> Novo cliente
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
                aria-label="Buscar clientes"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, documento ou e-mail…"
                className="h-10 w-full rounded-xl border border-border/70 bg-background/50 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
            </div>
          </div>

          {isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Carregando clientes…</p>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <p className="text-sm text-destructive">Erro ao carregar clientes.</p>
              <ActionButton variant="ghost" size="sm" onClick={() => void refetch()}>
                Tentar novamente
              </ActionButton>
            </div>
          ) : (
            <DataTable columns={COLUMNS} rows={rows} minWidth={860} />
          )}

          {!isLoading && !isError && (
            <div className="mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-xs text-muted-foreground">
                Página {data?.page ?? page} de {totalPages} · {data?.total ?? 0} clientes
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
        <ClienteFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          cliente={selected}
          onSubmit={handleSubmit}
          isPending={isMutating}
        />
      )}

      {deleteOpen && selected && (
        <ClienteDeleteDialog
          cliente={selected}
          open={deleteOpen}
          onOpenChange={(open) => {
            setDeleteOpen(open)
            if (!open) setSelected(null)
          }}
          onConfirm={handleDelete}
          isPending={deleteCliente.isPending}
        />
      )}
    </div>
  )
}
