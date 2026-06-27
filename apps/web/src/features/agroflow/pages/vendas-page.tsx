import { CalendarRange, FileText, Plus, Search, Sparkles, User } from 'lucide-react'

import {
  ActionButton,
  DataTable,
  PageHeader,
  Panel,
  StatusPill,
  Tabs,
  Toolbar,
  type Column,
  type PillTone,
  type Row,
} from '../ui'

import type { ReactElement } from 'react'

// ── Dados ilustrativos (mock) — substituídos por TanStack Query nas fases reais ──

type PedidoTipo = 'Avulso' | 'Consolidado'
type PedidoStatus = 'Rascunho' | 'Confirmado' | 'Faturado' | 'Cancelado'
type FiscalStatus = 'Autorizada' | 'Pendente' | 'Rejeitada' | '—'

interface Pedido {
  id: string
  numero: string
  cliente: string
  empresa: string
  tipo: PedidoTipo
  valor: string
  status: PedidoStatus
  fiscal: FiscalStatus
}

const tipoTone: Record<PedidoTipo, PillTone> = {
  Avulso: 'neutral',
  Consolidado: 'info',
}

const pedidoStatusTone: Record<PedidoStatus, PillTone> = {
  Rascunho: 'neutral',
  Confirmado: 'warning',
  Faturado: 'success',
  Cancelado: 'danger',
}

const fiscalTone: Record<FiscalStatus, PillTone> = {
  Autorizada: 'success',
  Pendente: 'warning',
  Rejeitada: 'danger',
  '—': 'neutral',
}

const pedidos: Pedido[] = [
  {
    id: '1',
    numero: 'PED-0042',
    cliente: 'Quitanda Horta Viva',
    empresa: 'Verde Folha',
    tipo: 'Consolidado',
    valor: 'R$ 8.940,00',
    status: 'Faturado',
    fiscal: 'Autorizada',
  },
  {
    id: '2',
    numero: 'PED-0041',
    cliente: 'Mercado São Jorge',
    empresa: 'Verde Folha',
    tipo: 'Avulso',
    valor: 'R$ 1.320,00',
    status: 'Confirmado',
    fiscal: 'Pendente',
  },
  {
    id: '3',
    numero: 'PED-0040',
    cliente: 'Hortifruti Central',
    empresa: 'Campo Bello',
    tipo: 'Avulso',
    valor: 'R$ 2.760,00',
    status: 'Faturado',
    fiscal: 'Autorizada',
  },
  {
    id: '4',
    numero: 'PED-0039',
    cliente: 'Empório Bom Prato',
    empresa: 'Campo Bello',
    tipo: 'Consolidado',
    valor: 'R$ 5.480,00',
    status: 'Confirmado',
    fiscal: 'Rejeitada',
  },
  {
    id: '5',
    numero: 'PED-0038',
    cliente: 'Supermercado Mais',
    empresa: 'Verde Folha',
    tipo: 'Avulso',
    valor: 'R$ 980,00',
    status: 'Rascunho',
    fiscal: '—',
  },
  {
    id: '6',
    numero: 'PED-0037',
    cliente: 'Mercado São Jorge',
    empresa: 'Campo Bello',
    tipo: 'Avulso',
    valor: 'R$ 640,00',
    status: 'Cancelado',
    fiscal: '—',
  },
]

type RemessaStatus = 'Aberta' | 'Entregue' | 'Consolidada' | 'Cancelada'

interface Remessa {
  id: string
  numero: string
  cliente: string
  empresa: string
  data: string
  valor: string
  status: RemessaStatus
}

const remessaTone: Record<RemessaStatus, PillTone> = {
  Aberta: 'warning',
  Entregue: 'info',
  Consolidada: 'success',
  Cancelada: 'danger',
}

const remessas: Remessa[] = [
  {
    id: '1',
    numero: 'REM-0118',
    cliente: 'Quitanda Horta Viva',
    empresa: 'Verde Folha',
    data: '03/06/2026',
    valor: 'R$ 2.180,00',
    status: 'Aberta',
  },
  {
    id: '2',
    numero: 'REM-0117',
    cliente: 'Quitanda Horta Viva',
    empresa: 'Verde Folha',
    data: '10/06/2026',
    valor: 'R$ 2.640,00',
    status: 'Aberta',
  },
  {
    id: '3',
    numero: 'REM-0116',
    cliente: 'Mercado São Jorge',
    empresa: 'Campo Bello',
    data: '11/06/2026',
    valor: 'R$ 1.430,00',
    status: 'Entregue',
  },
  {
    id: '4',
    numero: 'REM-0115',
    cliente: 'Hortifruti Central',
    empresa: 'Campo Bello',
    data: '12/06/2026',
    valor: 'R$ 3.050,00',
    status: 'Entregue',
  },
  {
    id: '5',
    numero: 'REM-0114',
    cliente: 'Empório Bom Prato',
    empresa: 'Verde Folha',
    data: '01/06/2026',
    valor: 'R$ 1.890,00',
    status: 'Consolidada',
  },
  {
    id: '6',
    numero: 'REM-0113',
    cliente: 'Supermercado Mais',
    empresa: 'Campo Bello',
    data: '28/05/2026',
    valor: 'R$ 760,00',
    status: 'Cancelada',
  },
]

const remessasConsolidar: Row[] = [
  { id: '1', remessa: 'REM-0118', data: '03/06/2026', produtos: '6 itens', valor: 'R$ 2.180,00' },
  { id: '2', remessa: 'REM-0117', data: '10/06/2026', produtos: '7 itens', valor: 'R$ 2.640,00' },
  { id: '3', remessa: 'REM-0119', data: '17/06/2026', produtos: '5 itens', valor: 'R$ 1.960,00' },
  { id: '4', remessa: 'REM-0121', data: '24/06/2026', produtos: '6 itens', valor: 'R$ 2.160,00' },
]

const addBtn = (label: string): ReactElement => (
  <ActionButton variant="primary" size="sm">
    <Plus /> {label}
  </ActionButton>
)

function ListPanel({
  title,
  add,
  columns,
  rows,
  minWidth,
}: {
  title: string
  add: string
  columns: Column[]
  rows: Row[]
  minWidth?: number
}): ReactElement {
  return (
    <Panel title={title} action={addBtn(add)}>
      <Toolbar placeholder={`Buscar em ${title.toLowerCase()}…`} />
      <DataTable columns={columns} rows={rows} minWidth={minWidth} />
    </Panel>
  )
}

const filterInput = (placeholder: string, icon: ReactElement): ReactElement => (
  <div className="relative w-full sm:max-w-xs">
    <span className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground [&_svg]:size-4">
      {icon}
    </span>
    <input
      type="text"
      placeholder={placeholder}
      className="h-10 w-full rounded-xl border border-border/70 bg-background/50 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
    />
  </div>
)

function ConsolidacaoTab(): ReactElement {
  return (
    <div className="space-y-6">
      <Panel
        title="Fechamento mensal"
        description="Agrupe as remessas em aberto de um cliente no período e gere um único pedido consolidado com uma só nota fiscal."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {filterInput('Cliente', <User />)}
          {filterInput('Período (mês)', <CalendarRange />)}
          <ActionButton variant="primary">
            <Search /> Gerar prévia
          </ActionButton>
        </div>
      </Panel>

      <Panel title="Remessas a consolidar — Quitanda Horta Viva · junho/2026">
        <DataTable
          columns={[
            { key: 'remessa', label: 'Remessa' },
            { key: 'data', label: 'Data' },
            { key: 'produtos', label: 'Produtos' },
            { key: 'valor', label: 'Valor', align: 'right' },
          ]}
          rows={remessasConsolidar}
          minWidth={620}
        />
        <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4 text-sm">
          <span className="font-medium text-muted-foreground">
            4 remessas em aberto · total selecionado
          </span>
          <span className="text-base font-bold text-foreground">R$ 8.940,00</span>
        </div>
      </Panel>

      <Panel className="border-emerald-500/20 bg-gradient-to-b from-emerald-500/10 to-card/80">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
              Total consolidado · junho/2026
            </p>
            <p className="mt-1 text-3xl font-bold text-foreground">R$ 8.940</p>
            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="size-4 text-emerald-300" />4 remessas → 1 pedido consolidado + 1 DANFE
            </p>
          </div>
          <ActionButton variant="primary">
            <Sparkles /> Consolidar e gerar pedido
          </ActionButton>
        </div>
      </Panel>
    </div>
  )
}

export function VendasPage(): ReactElement {
  return (
    <>
      <PageHeader
        title="Vendas"
        subtitle="Pedidos, remessas e consolidação mensal do marketplace de hortifruti."
      />

      <div className="mt-6">
        <Tabs
          items={[
            {
              id: 'pedidos',
              label: 'Pedidos',
              content: (
                <ListPanel
                  title="Pedidos"
                  add="Novo pedido"
                  columns={[
                    { key: 'numero', label: 'Número' },
                    { key: 'cliente', label: 'Cliente' },
                    { key: 'empresa', label: 'Empresa' },
                    { key: 'tipo', label: 'Tipo' },
                    { key: 'valor', label: 'Valor', align: 'right' },
                    { key: 'status', label: 'Status' },
                    { key: 'fiscal', label: 'Fiscal' },
                  ]}
                  rows={pedidos.map((p) => ({
                    ...p,
                    tipo: <StatusPill tone={tipoTone[p.tipo]}>{p.tipo}</StatusPill>,
                    status: <StatusPill tone={pedidoStatusTone[p.status]}>{p.status}</StatusPill>,
                    fiscal: <StatusPill tone={fiscalTone[p.fiscal]}>{p.fiscal}</StatusPill>,
                  }))}
                  minWidth={860}
                />
              ),
            },
            {
              id: 'remessas',
              label: 'Remessas',
              content: (
                <ListPanel
                  title="Remessas"
                  add="Nova remessa"
                  columns={[
                    { key: 'numero', label: 'Número' },
                    { key: 'cliente', label: 'Cliente' },
                    { key: 'empresa', label: 'Empresa' },
                    { key: 'data', label: 'Data' },
                    { key: 'valor', label: 'Valor estimado', align: 'right' },
                    { key: 'status', label: 'Status' },
                  ]}
                  rows={remessas.map((r) => ({
                    ...r,
                    status: <StatusPill tone={remessaTone[r.status]}>{r.status}</StatusPill>,
                  }))}
                  minWidth={820}
                />
              ),
            },
            {
              id: 'consolidacao',
              label: 'Consolidação',
              content: <ConsolidacaoTab />,
            },
          ]}
        />
      </div>
    </>
  )
}
