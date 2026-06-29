import { Plus, Power, PowerOff } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import type { Tenant } from '@/features/platform/api/tenants-api'
import type { ReactElement } from 'react'

import {
  ActionButton,
  DataTable,
  PageHeader,
  Panel,
  StatusPill,
  type Column,
  type Row,
} from '@/features/agroflow/ui'
import {
  useSetTenantStatus,
  useTenants,
} from '@/features/platform/api/tenants-api'
import { TenantFormDialog } from '@/features/platform/components/tenant-form-dialog'
import { TenantStatusDialog } from '@/features/platform/components/tenant-status-dialog'

const COLUMNS: Column[] = [
  { key: 'nome', label: 'Tenant' },
  { key: 'status', label: 'Status' },
  { key: 'empresas', label: 'Empresas', align: 'right' },
  { key: 'usuarios', label: 'Usuários', align: 'right' },
  { key: 'criadoEm', label: 'Criado em' },
  { key: 'acoes', label: 'Ações', align: 'right' },
]

const DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' })

export function TenantsPage(): ReactElement {
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [selected, setSelected] = useState<Tenant | null>(null)

  const { data, isLoading, isError, refetch } = useTenants({ page })
  const setStatus = useSetTenantStatus()

  const tenants = useMemo(() => data?.tenants ?? [], [data])

  const perPage = data?.perPage ?? 20
  const currentPage = data?.page ?? page
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / perPage))

  function openStatus(tenant: Tenant) {
    setSelected(tenant)
    setStatusOpen(true)
  }

  function closeStatus() {
    setStatusOpen(false)
    setSelected(null)
  }

  function handleStatusConfirm(target: Tenant) {
    const nextStatus = target.status === 'ativo' ? 'suspenso' : 'ativo'
    setStatus.mutate(
      { id: target.id, status: nextStatus },
      {
        onSuccess: () => {
          closeStatus()
          toast.success(nextStatus === 'ativo' ? 'Tenant ativado.' : 'Tenant suspenso.')
        },
        onError: () => toast.error('Não foi possível alterar o status.'),
      },
    )
  }

  const rows: Row[] = tenants.map((tenant) => ({
    id: tenant.id,
    nome: <span className="font-medium text-foreground">{tenant.nome}</span>,
    status: (
      <StatusPill tone={tenant.status === 'ativo' ? 'success' : 'danger'}>
        {tenant.status === 'ativo' ? 'Ativo' : 'Suspenso'}
      </StatusPill>
    ),
    empresas: tenant.empresasCount,
    usuarios: tenant.usuariosCount,
    criadoEm: DATE_FORMATTER.format(new Date(tenant.createdAt)),
    acoes: (
      <div className="flex flex-wrap justify-end gap-2">
        <ActionButton variant="subtle" size="sm" onClick={() => openStatus(tenant)}>
          {tenant.status === 'ativo' ? <PowerOff /> : <Power />}
          {tenant.status === 'ativo' ? 'Suspender' : 'Ativar'}
        </ActionButton>
      </div>
    ),
  }))

  return (
    <div className="agroflow agroflow-glow min-h-screen p-4 text-foreground sm:p-6">
      <PageHeader
        title="Tenants"
        subtitle="Gestão de tenants da plataforma."
        actions={
          <ActionButton variant="primary" onClick={() => setFormOpen(true)}>
            <Plus /> Novo tenant
          </ActionButton>
        }
      />

      <div className="mt-6">
        <Panel>
          {isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Carregando tenants…</p>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <p className="text-sm text-destructive">Erro ao carregar tenants.</p>
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
                Página {currentPage} de {totalPages} · {total} tenants
              </p>
              <div className="flex gap-2">
                <ActionButton
                  variant="ghost"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </ActionButton>
                <ActionButton
                  variant="ghost"
                  size="sm"
                  disabled={currentPage >= totalPages}
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
        <TenantFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          onCreated={() => toast.success('Tenant criado com sucesso.')}
        />
      )}

      {statusOpen && selected && (
        <TenantStatusDialog
          tenant={selected}
          open={statusOpen}
          onOpenChange={closeStatus}
          onConfirm={() => handleStatusConfirm(selected)}
          isPending={setStatus.isPending}
        />
      )}
    </div>
  )
}
