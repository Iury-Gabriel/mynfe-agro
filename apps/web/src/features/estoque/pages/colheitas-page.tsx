import { Package, Sprout } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type {
  RegistrarColheitaInput,
  RegistrarEmbalagemInput,
} from '@/features/estoque/api/colheitas-api'
import type { ReactElement } from 'react'

import {
  ActionButton,
  DataTable,
  PageHeader,
  Panel,
  type Column,
  type Row,
} from '@/features/agroflow/ui'
import {
  useColheitas,
  useRegistrarColheita,
  useRegistrarEmbalagem,
} from '@/features/estoque/api/colheitas-api'
import { AjusteEmpresaGate } from '@/features/estoque/components/empresa-gate'
import { RegistrarColheitaDialog } from '@/features/estoque/components/registrar-colheita-dialog'
import { RegistrarEmbalagemDialog } from '@/features/estoque/components/registrar-embalagem-dialog'
import { formatDate, formatQty } from '@/features/estoque/lib/format'
import { hasAnyPermission } from '@/lib/permissions'
import { useAuth } from '@/providers/auth-context'
import { useActiveEmpresaStore } from '@/stores/active-empresa-store'

const COLUMNS: Column[] = [
  { key: 'data', label: 'Data' },
  { key: 'produto', label: 'Produto' },
  { key: 'quantidade', label: 'Quantidade', align: 'right' },
  { key: 'safra', label: 'Safra' },
  { key: 'area', label: 'Área' },
]

export function ColheitasPage(): ReactElement {
  const { user } = useAuth()
  const canCreateColheita = hasAnyPermission(user?.permissions, ['colheita:create'])
  const canCreateEmbalagem = hasAnyPermission(user?.permissions, ['embalagem:create'])

  const empresaId = useActiveEmpresaStore((s) => s.activeEmpresaId)
  const [page, setPage] = useState(1)
  const [colheitaOpen, setColheitaOpen] = useState(false)
  const [embalagemOpen, setEmbalagemOpen] = useState(false)

  const { data, isLoading, isError, refetch } = useColheitas({ empresaId, page })
  const registrarColheita = useRegistrarColheita()
  const registrarEmbalagem = useRegistrarEmbalagem()

  const colheitas = data?.colheitas ?? []
  const totalPages = data?.totalPages ?? 1

  function handleColheita(payload: RegistrarColheitaInput) {
    registrarColheita.mutate(payload, {
      onSuccess: () => {
        setColheitaOpen(false)
        toast.success('Colheita registrada com sucesso.')
      },
      onError: () => toast.error('Não foi possível registrar a colheita.'),
    })
  }

  function handleEmbalagem(payload: RegistrarEmbalagemInput) {
    registrarEmbalagem.mutate(payload, {
      onSuccess: () => {
        setEmbalagemOpen(false)
        toast.success('Embalagem registrada com sucesso.')
      },
      onError: () => toast.error('Não foi possível registrar a embalagem.'),
    })
  }

  const rows: Row[] = colheitas.map((c) => ({
    id: c.id,
    data: formatDate(c.data),
    produto: <span className="font-medium text-foreground">{c.produtoId}</span>,
    quantidade: formatQty(c.quantidade),
    safra: c.safraId ?? '—',
    area: c.areaId ?? '—',
  }))

  return (
    <div className="agroflow agroflow-glow min-h-screen p-4 text-foreground sm:p-6">
      <PageHeader
        title="Colheitas"
        subtitle="Registro de colheitas e embalagens com geração de lote."
        actions={
          <div className="flex flex-wrap gap-2">
            {canCreateEmbalagem && (
              <ActionButton
                variant="subtle"
                disabled={!empresaId}
                onClick={() => setEmbalagemOpen(true)}
              >
                <Package /> Registrar embalagem
              </ActionButton>
            )}
            {canCreateColheita && (
              <ActionButton
                variant="primary"
                disabled={!empresaId}
                onClick={() => setColheitaOpen(true)}
              >
                <Sprout /> Registrar colheita
              </ActionButton>
            )}
          </div>
        }
      />

      <div className="mt-6">
        <Panel title="Colheitas registradas">
          <AjusteEmpresaGate empresaId={empresaId}>
            {isLoading ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Carregando colheitas…</p>
            ) : isError ? (
              <div className="flex flex-col items-center gap-3 py-10">
                <p className="text-sm text-destructive">Erro ao carregar colheitas.</p>
                <ActionButton variant="ghost" size="sm" onClick={() => void refetch()}>
                  Tentar novamente
                </ActionButton>
              </div>
            ) : (
              <>
                <DataTable columns={COLUMNS} rows={rows} minWidth={720} />
                <div className="mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row">
                  <p className="text-xs text-muted-foreground">
                    Página {data?.page ?? page} de {totalPages} · {data?.total ?? 0} colheitas
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
              </>
            )}
          </AjusteEmpresaGate>
        </Panel>
      </div>

      {colheitaOpen && empresaId && (
        <RegistrarColheitaDialog
          open={colheitaOpen}
          onOpenChange={setColheitaOpen}
          empresaId={empresaId}
          onSubmit={handleColheita}
          isPending={registrarColheita.isPending}
        />
      )}

      {embalagemOpen && empresaId && (
        <RegistrarEmbalagemDialog
          open={embalagemOpen}
          onOpenChange={setEmbalagemOpen}
          empresaId={empresaId}
          onSubmit={handleEmbalagem}
          isPending={registrarEmbalagem.isPending}
        />
      )}
    </div>
  )
}
