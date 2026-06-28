import { FileText, Search, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { Column, Row } from '@/features/agroflow/ui'
import type { ReactElement } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ActionButton, DataTable, PageHeader, Panel } from '@/features/agroflow/ui'
import { AjusteEmpresaGate } from '@/features/estoque/components/empresa-gate'
import {
  useConsolidacaoPreview,
  useConsolidar,
} from '@/features/vendas/api/consolidacao-api'
import { formatCurrency, formatQty } from '@/features/vendas/lib/format'
import { hasAnyPermission } from '@/lib/permissions'
import { useAuth } from '@/providers/auth-context'
import { useActiveEmpresaStore } from '@/stores/active-empresa-store'

const itensColumns: Column[] = [
  { key: 'produto', label: 'Produto' },
  { key: 'preco', label: 'Preço unit.', align: 'right' },
  { key: 'quantidade', label: 'Quantidade', align: 'right' },
  { key: 'valor', label: 'Valor', align: 'right' },
]

export function ConsolidacaoPage(): ReactElement {
  const { user } = useAuth()
  const empresaId = useActiveEmpresaStore((s) => s.activeEmpresaId)
  const canConsolidar = hasAnyPermission(user?.permissions, ['consolidacao:create'])

  const [clienteId, setClienteId] = useState('')
  const [periodoInicio, setPeriodoInicio] = useState('')
  const [periodoFim, setPeriodoFim] = useState('')
  const [previewEnabled, setPreviewEnabled] = useState(false)

  const inicioIso = periodoInicio ? new Date(periodoInicio).toISOString() : null
  const fimIso = periodoFim ? new Date(periodoFim).toISOString() : null

  const preview = useConsolidacaoPreview({
    empresaId,
    clienteId: clienteId.trim() || null,
    periodoInicio: inicioIso,
    periodoFim: fimIso,
    enabled: previewEnabled,
  })
  const consolidar = useConsolidar()

  const camposCompletos = !!clienteId.trim() && !!periodoInicio && !!periodoFim

  function handleGerarPrevia(): void {
    if (!camposCompletos) {
      toast.error('Preencha cliente e período para gerar a prévia.')
      return
    }
    setPreviewEnabled(true)
    void preview.refetch()
  }

  function handleConsolidar(): void {
    if (!empresaId || !camposCompletos || !inicioIso || !fimIso) return
    consolidar.mutate(
      {
        empresaId,
        clienteId: clienteId.trim(),
        periodoInicio: inicioIso,
        periodoFim: fimIso,
      },
      {
        onSuccess: (data) => {
          toast.success(`Pedido ${data.pedido.numero} gerado a partir da consolidação.`)
          setPreviewEnabled(false)
        },
        onError: () => toast.error('Não foi possível consolidar as remessas.'),
      },
    )
  }

  const itensRows: Row[] = (preview.data?.itens ?? []).map((item, index) => ({
    id: `${item.produtoId}-${item.precoUnitario}-${index}`,
    produto: <span className="font-medium text-foreground">{item.produtoId}</span>,
    preco: formatCurrency(item.precoUnitario),
    quantidade: formatQty(item.quantidade),
    valor: formatCurrency(item.valorTotal),
  }))

  const totalRemessas = preview.data?.remessas.length ?? 0
  const valorTotal = preview.data?.valorTotal ?? 0

  return (
    <div className="agroflow agroflow-glow min-h-screen p-4 text-foreground sm:p-6">
      <PageHeader
        title="Consolidação"
        subtitle="Agrupe as remessas em aberto de um cliente no período e gere um único pedido."
      />

      <div className="mt-6 space-y-6">
        <Panel
          title="Fechamento mensal"
          description="Selecione o cliente e o período para visualizar as remessas a consolidar."
        >
          <AjusteEmpresaGate empresaId={empresaId}>
            {!canConsolidar ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Você não tem permissão para consolidar remessas.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 sm:items-end">
                <div className="space-y-1.5 sm:col-span-1">
                  <Label htmlFor="consolidacao-cliente">Cliente</Label>
                  <Input
                    id="consolidacao-cliente"
                    value={clienteId}
                    onChange={(e) => setClienteId(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-1">
                  <Label htmlFor="consolidacao-inicio">Início</Label>
                  <Input
                    id="consolidacao-inicio"
                    type="date"
                    value={periodoInicio}
                    onChange={(e) => setPeriodoInicio(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-1">
                  <Label htmlFor="consolidacao-fim">Fim</Label>
                  <Input
                    id="consolidacao-fim"
                    type="date"
                    value={periodoFim}
                    onChange={(e) => setPeriodoFim(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-1">
                  <ActionButton
                    variant="primary"
                    className="w-full"
                    disabled={!camposCompletos || preview.isFetching}
                    onClick={handleGerarPrevia}
                  >
                    <Search /> Gerar prévia
                  </ActionButton>
                </div>
              </div>
            )}
          </AjusteEmpresaGate>
        </Panel>

        {canConsolidar && previewEnabled && (
          <Panel title="Remessas a consolidar">
            {preview.isLoading || preview.isFetching ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Carregando prévia…</p>
            ) : preview.isError ? (
              <div className="flex flex-col items-center gap-3 py-10">
                <p className="text-sm text-destructive">Erro ao carregar a prévia.</p>
                <ActionButton variant="ghost" size="sm" onClick={() => void preview.refetch()}>
                  Tentar novamente
                </ActionButton>
              </div>
            ) : totalRemessas === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Nenhuma remessa em aberto para o cliente e período selecionados.
              </p>
            ) : (
              <>
                <DataTable columns={itensColumns} rows={itensRows} minWidth={620} />
                <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4 text-sm">
                  <span className="font-medium text-muted-foreground">
                    {totalRemessas} remessa{totalRemessas === 1 ? '' : 's'} · total agrupado
                  </span>
                  <span className="text-base font-bold text-foreground">
                    {formatCurrency(valorTotal)}
                  </span>
                </div>
              </>
            )}
          </Panel>
        )}

        {canConsolidar && previewEnabled && totalRemessas > 0 && (
          <Panel className="border-emerald-500/20 bg-gradient-to-b from-emerald-500/10 to-card/80">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                  Total consolidado
                </p>
                <p className="mt-1 text-3xl font-bold text-foreground">
                  {formatCurrency(valorTotal)}
                </p>
                <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="size-4 text-emerald-300" />
                  {totalRemessas} remessa{totalRemessas === 1 ? '' : 's'} → 1 pedido consolidado
                </p>
              </div>
              <ActionButton
                variant="primary"
                disabled={consolidar.isPending}
                onClick={handleConsolidar}
              >
                <Sparkles /> {consolidar.isPending ? 'Consolidando…' : 'Consolidar e gerar pedido'}
              </ActionButton>
            </div>
          </Panel>
        )}
      </div>
    </div>
  )
}
