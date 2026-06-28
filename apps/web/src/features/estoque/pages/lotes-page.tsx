import { MapPin, Package, Sprout, Wheat } from 'lucide-react'
import { useState } from 'react'

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
import { useLoteRastreabilidade, useLotes } from '@/features/estoque/api/lotes-api'
import { AjusteEmpresaGate } from '@/features/estoque/components/empresa-gate'
import { formatDate, formatQty } from '@/features/estoque/lib/format'
import { useActiveEmpresaStore } from '@/stores/active-empresa-store'

const COLUMNS: Column[] = [
  { key: 'codigo', label: 'Lote' },
  { key: 'produto', label: 'Produto' },
  { key: 'qtd', label: 'Qtd atual', align: 'right' },
  { key: 'origem', label: 'Origem' },
  { key: 'validade', label: 'Validade' },
  { key: 'acoes', label: 'Ações', align: 'right' },
]

interface ChainStep {
  icon: ReactElement
  label: string
  value: string
}

function RastreabilidadeDetail({ loteId }: { loteId: string }): ReactElement {
  const { data, isLoading, isError, refetch } = useLoteRastreabilidade(loteId)

  if (isLoading) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Carregando rastreabilidade…</p>
  }
  if (isError || !data) {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <p className="text-sm text-destructive">Erro ao carregar rastreabilidade.</p>
        <ActionButton variant="ghost" size="sm" onClick={() => void refetch()}>
          Tentar novamente
        </ActionButton>
      </div>
    )
  }

  const { lote, montante, jusante } = data
  const steps: ChainStep[] = [
    { icon: <Package />, label: 'Lote', value: `${lote.codigoLote} · ${lote.produtoId}` },
    {
      icon: <Sprout />,
      label: 'Colheita',
      value: montante.colheita
        ? `${formatDate(montante.colheita.data)} · ${formatQty(montante.colheita.quantidade)}`
        : 'Sem colheita de origem',
    },
    { icon: <Wheat />, label: 'Safra', value: montante.safraId ?? '—' },
    { icon: <MapPin />, label: 'Área', value: montante.areaId ?? '—' },
  ]

  const consumoTotal = jusante.pedidoItens.length + jusante.remessaItens.length

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <Panel title={`Cadeia do lote ${lote.codigoLote}`} description="Rastreabilidade da origem.">
        <ol className="space-y-6">
          {steps.map((step, i) => (
            <li key={step.label} className="relative pl-2">
              {i < steps.length - 1 && (
                <span className="absolute left-[1.45rem] top-12 h-6 w-px bg-border/60" aria-hidden />
              )}
              <div className="flex items-center gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300 ring-1 ring-inset ring-emerald-400/25 [&_svg]:size-5">
                  {step.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {step.label}
                  </p>
                  <p className="truncate text-sm font-semibold text-foreground">{step.value}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Panel>

      <Panel title="Consumido por" description="Documentos que baixaram este lote.">
        {consumoTotal === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nenhum consumo registrado para este lote.
          </p>
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {consumoTotal} documento(s) vinculado(s).
          </p>
        )}
      </Panel>
    </div>
  )
}

export function LotesPage(): ReactElement {
  const empresaId = useActiveEmpresaStore((s) => s.activeEmpresaId)
  const [page, setPage] = useState(1)
  const [selectedLoteId, setSelectedLoteId] = useState<string | null>(null)

  const { data, isLoading, isError, refetch } = useLotes({ empresaId, page })
  const lotes = data?.lotes ?? []
  const totalPages = data?.totalPages ?? 1

  const rows: Row[] = lotes.map((l) => ({
    id: l.id,
    codigo: <span className="font-medium text-foreground">{l.codigoLote}</span>,
    produto: l.produtoId,
    qtd: formatQty(l.quantidadeAtual),
    origem: l.origemTipo ?? '—',
    validade: l.validade ? formatDate(l.validade) : <StatusPill tone="neutral">Sem validade</StatusPill>,
    acoes: (
      <div className="flex justify-end">
        <ActionButton variant="ghost" size="sm" onClick={() => setSelectedLoteId(l.id)}>
          Ver rastreabilidade
        </ActionButton>
      </div>
    ),
  }))

  return (
    <div className="agroflow agroflow-glow min-h-screen p-4 text-foreground sm:p-6">
      <PageHeader title="Lotes" subtitle="Lotes de estoque e sua rastreabilidade." />

      <div className="mt-6 space-y-6">
        <Panel title="Lotes">
          <AjusteEmpresaGate empresaId={empresaId}>
            {isLoading ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Carregando lotes…</p>
            ) : isError ? (
              <div className="flex flex-col items-center gap-3 py-10">
                <p className="text-sm text-destructive">Erro ao carregar lotes.</p>
                <ActionButton variant="ghost" size="sm" onClick={() => void refetch()}>
                  Tentar novamente
                </ActionButton>
              </div>
            ) : (
              <>
                <DataTable columns={COLUMNS} rows={rows} minWidth={840} />
                <div className="mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row">
                  <p className="text-xs text-muted-foreground">
                    Página {data?.page ?? page} de {totalPages} · {data?.total ?? 0} lotes
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

        {selectedLoteId && <RastreabilidadeDetail loteId={selectedLoteId} />}
      </div>
    </div>
  )
}
