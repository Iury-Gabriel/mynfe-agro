import { Pencil, Plus, Power, PowerOff, Receipt } from 'lucide-react'
import { useMemo, useState } from 'react'

import type { Empresa } from '@/features/admin/api/empresas-api'
import type { ReactElement } from 'react'

import { useEmpresas } from '@/features/admin/api/empresas-api'
import { EmpresaFiscalDialog } from '@/features/admin/components/empresas/empresa-fiscal-dialog'
import { EmpresaFormDialog } from '@/features/admin/components/empresas/empresa-form-dialog'
import { EmpresaStatusDialog } from '@/features/admin/components/empresas/empresa-status-dialog'
import {
  ActionButton,
  DataTable,
  PageHeader,
  Panel,
  StatusPill,
  type Column,
  type Row,
} from '@/features/agroflow/ui'
import { hasAnyPermission } from '@/lib/permissions'
import { useAuth } from '@/providers/auth-context'

const COLUMNS: Column[] = [
  { key: 'razaoSocial', label: 'Razão social' },
  { key: 'cnpjCpf', label: 'CNPJ / CPF' },
  { key: 'ie', label: 'IE' },
  { key: 'regime', label: 'Regime' },
  { key: 'ambiente', label: 'Ambiente' },
  { key: 'status', label: 'Status' },
  { key: 'acoes', label: 'Ações', align: 'right' },
]

const AMBIENTE_LABEL: Record<string, string> = {
  homologacao: 'Homologação',
  producao: 'Produção',
}

export function EmpresasPage(): ReactElement {
  const { user } = useAuth()
  const canCreate = hasAnyPermission(user?.permissions, ['empresa:create'])
  const canUpdate = hasAnyPermission(user?.permissions, ['empresa:update'])
  const canStatus = hasAnyPermission(user?.permissions, ['empresa:status'])

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [fiscalOpen, setFiscalOpen] = useState(false)
  const [selected, setSelected] = useState<Empresa | null>(null)

  const { data, isLoading, isError, refetch } = useEmpresas({ page })

  const empresas = useMemo(() => data?.empresas ?? [], [data])
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return empresas
    return empresas.filter(
      (e) =>
        e.razaoSocial.toLowerCase().includes(term) ||
        e.cnpjCpfFormatado.toLowerCase().includes(term) ||
        (e.nomeFantasia?.toLowerCase().includes(term) ?? false),
    )
  }, [empresas, search])

  const totalPages = data?.totalPages ?? 1

  function openCreate() {
    setSelected(null)
    setFormOpen(true)
  }

  function openEdit(empresa: Empresa) {
    setSelected(empresa)
    setFormOpen(true)
  }

  function openStatus(empresa: Empresa) {
    setSelected(empresa)
    setStatusOpen(true)
  }

  function openFiscal(empresa: Empresa) {
    setSelected(empresa)
    setFiscalOpen(true)
  }

  const rows: Row[] = filtered.map((empresa) => ({
    id: empresa.id,
    razaoSocial: (
      <div>
        <span className="font-medium text-foreground">{empresa.razaoSocial}</span>
        {empresa.nomeFantasia && (
          <span className="block text-xs text-muted-foreground">{empresa.nomeFantasia}</span>
        )}
      </div>
    ),
    cnpjCpf: empresa.cnpjCpfFormatado,
    ie: empresa.inscricaoEstadual ?? '—',
    regime: empresa.regimeTributario,
    ambiente: (
      <StatusPill tone={empresa.ambienteFiscal === 'producao' ? 'info' : 'neutral'}>
        {AMBIENTE_LABEL[empresa.ambienteFiscal] ?? empresa.ambienteFiscal}
      </StatusPill>
    ),
    status: (
      <StatusPill tone={empresa.status === 'ativo' ? 'success' : 'neutral'}>
        {empresa.status === 'ativo' ? 'Ativo' : 'Inativo'}
      </StatusPill>
    ),
    acoes: (
      <div className="flex flex-wrap justify-end gap-2">
        {canUpdate && (
          <ActionButton variant="ghost" size="sm" onClick={() => openEdit(empresa)}>
            <Pencil /> Editar
          </ActionButton>
        )}
        {canUpdate && (
          <ActionButton variant="ghost" size="sm" onClick={() => openFiscal(empresa)}>
            <Receipt /> Fiscal
          </ActionButton>
        )}
        {canStatus && (
          <ActionButton variant="subtle" size="sm" onClick={() => openStatus(empresa)}>
            {empresa.status === 'ativo' ? <PowerOff /> : <Power />}
            {empresa.status === 'ativo' ? 'Inativar' : 'Ativar'}
          </ActionButton>
        )}
      </div>
    ),
  }))

  return (
    <div className="agroflow agroflow-glow min-h-screen p-4 text-foreground sm:p-6">
      <PageHeader
        title="Empresas"
        subtitle="Empresas (emitentes) do seu tenant."
        actions={
          canCreate && (
            <ActionButton variant="primary" onClick={openCreate}>
              <Plus /> Nova empresa
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
                aria-label="Buscar empresas"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por razão social ou documento…"
                className="h-10 w-full rounded-xl border border-border/70 bg-background/50 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
            </div>
          </div>

          {isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Carregando empresas…</p>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <p className="text-sm text-destructive">Erro ao carregar empresas.</p>
              <ActionButton variant="ghost" size="sm" onClick={() => void refetch()}>
                Tentar novamente
              </ActionButton>
            </div>
          ) : (
            <DataTable columns={COLUMNS} rows={rows} minWidth={840} />
          )}

          {!isLoading && !isError && (
            <div className="mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-xs text-muted-foreground">
                Página {data?.page ?? page} de {totalPages} · {data?.total ?? 0} empresas
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
        <EmpresaFormDialog open={formOpen} onOpenChange={setFormOpen} empresa={selected} />
      )}

      {statusOpen && selected && (
        <EmpresaStatusDialog
          empresa={selected}
          open={statusOpen}
          onOpenChange={() => {
            setStatusOpen(false)
            setSelected(null)
          }}
        />
      )}

      {fiscalOpen && selected && (
        <EmpresaFiscalDialog
          empresa={selected}
          canEdit={canUpdate}
          open={fiscalOpen}
          onOpenChange={() => {
            setFiscalOpen(false)
            setSelected(null)
          }}
        />
      )}
    </div>
  )
}
