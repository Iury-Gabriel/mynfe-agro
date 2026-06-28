import { useState } from 'react'

import type { AuditoriaAcao, AuditoriaLog } from '@/features/admin/api/auditoria-api'
import type { ReactElement } from 'react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AUDITORIA_ACOES, useAuditoriaLogs } from '@/features/admin/api/auditoria-api'
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

const COLUMNS: Column[] = [
  { key: 'data', label: 'Data/hora' },
  { key: 'usuario', label: 'Usuário' },
  { key: 'acao', label: 'Ação' },
  { key: 'entidade', label: 'Entidade' },
  { key: 'registro', label: 'Registro' },
]

const ACAO_LABELS: Record<AuditoriaAcao, string> = {
  criar: 'Criar',
  editar: 'Editar',
  excluir: 'Excluir',
  emitir: 'Emitir',
  ajustar: 'Ajustar',
}

const ACAO_TONES: Record<AuditoriaAcao, PillTone> = {
  criar: 'success',
  editar: 'info',
  excluir: 'danger',
  emitir: 'info',
  ajustar: 'warning',
}

const ACAO_ALL = '__all__'

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('pt-BR')
}

export function AuditoriaPage(): ReactElement {
  const [page, setPage] = useState(1)
  const [entidade, setEntidade] = useState('')
  const [acao, setAcao] = useState<AuditoriaAcao | typeof ACAO_ALL>(ACAO_ALL)

  const { data, isLoading, isError, refetch } = useAuditoriaLogs({
    page,
    entidade: entidade.trim() || undefined,
    acao: acao === ACAO_ALL ? undefined : acao,
  })

  const logs = data?.logs ?? []
  const totalPages = data?.totalPages ?? 1

  function onEntidadeChange(value: string): void {
    setEntidade(value)
    setPage(1)
  }

  function onAcaoChange(value: string): void {
    setAcao(value as AuditoriaAcao | typeof ACAO_ALL)
    setPage(1)
  }

  const rows: Row[] = logs.map((log: AuditoriaLog) => ({
    id: log.id,
    data: <span className="whitespace-nowrap text-muted-foreground">{formatDateTime(log.data)}</span>,
    usuario: log.usuarioId ?? '—',
    acao: <StatusPill tone={ACAO_TONES[log.acao]}>{ACAO_LABELS[log.acao]}</StatusPill>,
    entidade: <span className="font-medium text-foreground">{log.entidade}</span>,
    registro: <span className="font-mono text-xs text-muted-foreground">{log.entidadeId}</span>,
  }))

  return (
    <div className="agroflow agroflow-glow min-h-screen p-4 text-foreground sm:p-6">
      <PageHeader title="Auditoria" subtitle="Histórico de alterações no sistema." />

      <div className="mt-6">
        <Panel>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:max-w-xs">
              <input
                type="search"
                aria-label="Filtrar por entidade"
                value={entidade}
                onChange={(e) => onEntidadeChange(e.target.value)}
                placeholder="Filtrar por entidade…"
                className="h-10 w-full rounded-xl border border-border/70 bg-background/50 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
            </div>

            <div className="w-full sm:max-w-[200px]">
              <Select value={acao} onValueChange={onAcaoChange}>
                <SelectTrigger aria-label="Filtrar por ação">
                  <SelectValue placeholder="Todas as ações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ACAO_ALL}>Todas as ações</SelectItem>
                  {AUDITORIA_ACOES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {ACAO_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Carregando registros…</p>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <p className="text-sm text-destructive">Erro ao carregar a auditoria.</p>
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
                Página {data?.page ?? page} de {totalPages} · {data?.total ?? 0} registros
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
    </div>
  )
}
