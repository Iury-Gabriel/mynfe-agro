import { MapPin, Package, Plus, Sprout, Warehouse, Wheat } from 'lucide-react'

import {
  ActionButton,
  DataTable,
  PageHeader,
  Panel,
  StatusPill,
  Tabs,
  Toolbar,
  type Column,
  type Row,
} from '../ui'

import type { ReactElement, ReactNode } from 'react'

// ── Dados ilustrativos (mock) — substituídos por TanStack Query nas fases reais ──

const posicao: Row[] = [
  { id: '1', produto: 'Alface Crespa', empresa: 'Verde Folha', disponivel: '1.240 maços', reservado: '180 maços', total: '1.420 maços' },
  { id: '2', produto: 'Rúcula', empresa: 'Campo Bello', disponivel: '860 maços', reservado: '120 maços', total: '980 maços' },
  { id: '3', produto: 'Agrião', empresa: 'Campo Bello', disponivel: '540 maços', reservado: '40 maços', total: '580 maços' },
  { id: '4', produto: 'Mix de Folhas 200g', empresa: 'Verde Folha', disponivel: '320 un', reservado: '95 un', total: '415 un' },
  { id: '5', produto: 'Couve Manteiga', empresa: 'Verde Folha', disponivel: '210 maços', reservado: '0 maços', total: '210 maços' },
]

interface LoteRaw {
  id: string
  lote: string
  produto: string
  empresa: string
  qtd: string
  origem: string
  validade: string
  venceEm?: string
}

const lotes: LoteRaw[] = [
  { id: '1', lote: 'LT-2026-0142', produto: 'Alface Crespa', empresa: 'Verde Folha', qtd: '420 maços', origem: 'Colheita 12/06 · Talhão A1', validade: '01/07/2026', venceEm: 'Vence em 3d' },
  { id: '2', lote: 'LT-2026-0138', produto: 'Rúcula', empresa: 'Campo Bello', qtd: '310 maços', origem: 'Colheita 11/06 · Gleba 7', validade: '02/07/2026', venceEm: 'Vence em 3d' },
  { id: '3', lote: 'LT-2026-0151', produto: 'Agrião', empresa: 'Campo Bello', qtd: '180 maços', origem: 'Colheita 18/06 · Gleba 7', validade: '08/07/2026' },
  { id: '4', lote: 'LT-2026-0149', produto: 'Couve Manteiga', empresa: 'Verde Folha', qtd: '260 maços', origem: 'Colheita 17/06 · Canteiro C3', validade: '07/07/2026' },
  { id: '5', lote: 'LT-2026-0155', produto: 'Mix de Folhas 200g', empresa: 'Verde Folha', qtd: '140 un', origem: 'Embalado 20/06 · Talhão A1', validade: '04/07/2026' },
]

interface MovimentoRaw {
  id: string
  data: string
  produto: string
  lote: string
  tipo: 'Entrada' | 'Saída' | 'Ajuste' | 'Estorno'
  origem: string
  quantidade: string
}

const movimentos: MovimentoRaw[] = [
  { id: '1', data: '20/06 09:12', produto: 'Mix de Folhas 200g', lote: 'LT-2026-0155', tipo: 'Entrada', origem: 'Embalagem · Talhão A1', quantidade: '+140 un' },
  { id: '2', data: '20/06 11:40', produto: 'Alface Crespa', lote: 'LT-2026-0142', tipo: 'Saída', origem: 'Pedido PV-3081', quantidade: '-80 maços' },
  { id: '3', data: '19/06 16:05', produto: 'Rúcula', lote: 'LT-2026-0138', tipo: 'Ajuste', origem: 'Inventário cíclico', quantidade: '-12 maços' },
  { id: '4', data: '19/06 08:30', produto: 'Agrião', lote: 'LT-2026-0151', tipo: 'Entrada', origem: 'Colheita · Gleba 7', quantidade: '+320 maços' },
  { id: '5', data: '18/06 14:22', produto: 'Alface Crespa', lote: 'LT-2026-0142', tipo: 'Estorno', origem: 'Cancelamento PV-3074', quantidade: '+45 maços' },
  { id: '6', data: '18/06 07:50', produto: 'Couve Manteiga', lote: 'LT-2026-0149', tipo: 'Saída', origem: 'Remessa RM-1190', quantidade: '-60 maços' },
]

const TIPO_TONE = {
  Entrada: 'success',
  Saída: 'danger',
  Ajuste: 'warning',
  Estorno: 'neutral',
} as const

const consumidores: Row[] = [
  { id: '1', documento: 'PV-3081', cliente: 'Quitanda Horta Viva', quantidade: '80 maços', data: '20/06/2026' },
  { id: '2', documento: 'RM-1190', cliente: 'Mercado São Jorge', quantidade: '120 maços', data: '19/06/2026' },
  { id: '3', documento: 'PV-3066', cliente: 'Hortifruti Central', quantidade: '60 maços', data: '17/06/2026' },
]

const ajustesRecentes: Row[] = [
  { id: '1', data: '19/06 16:05', produto: 'Rúcula', lote: 'LT-2026-0138', tipo: <StatusPill tone="warning">Saída</StatusPill>, quantidade: '-12 maços', motivo: 'Inventário cíclico' },
  { id: '2', data: '16/06 10:18', produto: 'Agrião', lote: 'LT-2026-0151', tipo: <StatusPill tone="success">Entrada</StatusPill>, quantidade: '+8 maços', motivo: 'Recontagem física' },
  { id: '3', data: '14/06 18:44', produto: 'Couve Manteiga', lote: 'LT-2026-0149', tipo: <StatusPill tone="warning">Saída</StatusPill>, quantidade: '-5 maços', motivo: 'Perda por avaria' },
]

const addBtn = (label: string): ReactElement => (
  <ActionButton variant="primary" size="sm">
    <Plus /> {label}
  </ActionButton>
)

// ── Rastreabilidade ──────────────────────────────────────────────────────────

interface ChainStep {
  icon: ReactElement
  label: string
  value: string
}

const cadeia: ChainStep[] = [
  { icon: <Package />, label: 'Lote', value: 'LT-2026-0142 · Alface Crespa' },
  { icon: <Sprout />, label: 'Colheita', value: '12/06/2026 · 420 maços' },
  { icon: <Wheat />, label: 'Safra', value: 'Safra 2026 · Inverno' },
  { icon: <MapPin />, label: 'Área', value: 'Talhão A1 · 1,2 ha' },
  { icon: <Warehouse />, label: 'Fazenda', value: 'Sítio Verde Folha · Mogi das Cruzes / SP' },
]

function ChainRow({ step, last }: { step: ChainStep; last: boolean }): ReactElement {
  return (
    <li className="relative pl-2">
      {!last && <span className="absolute left-[1.45rem] top-12 h-6 w-px bg-border/60" aria-hidden />}
      <div className="flex items-center gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300 ring-1 ring-inset ring-emerald-400/25 [&_svg]:size-5">
          {step.icon}
        </span>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{step.label}</p>
          <p className="truncate text-sm font-semibold text-foreground">{step.value}</p>
        </div>
      </div>
    </li>
  )
}

function RastreioPanel(): ReactElement {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <Panel
        title="Cadeia do lote LT-2026-0142"
        description="Rastreabilidade da origem até a entrega."
      >
        <ol className="space-y-6">
          {cadeia.map((step, i) => (
            <ChainRow key={step.label} step={step} last={i === cadeia.length - 1} />
          ))}
        </ol>
      </Panel>

      <Panel title="Consumido por" description="Documentos que baixaram este lote.">
        <DataTable
          columns={[
            { key: 'documento', label: 'Documento' },
            { key: 'cliente', label: 'Cliente' },
            { key: 'quantidade', label: 'Quantidade', align: 'right' },
            { key: 'data', label: 'Data' },
          ]}
          rows={consumidores}
          minWidth={460}
        />
      </Panel>
    </div>
  )
}

// ── Ajustes ──────────────────────────────────────────────────────────────────

const fieldClass =
  'h-10 w-full rounded-xl border border-border/70 bg-background/50 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50'

function Field({ label, children }: { label: string; children: ReactNode }): ReactElement {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

function AjustesPanel(): ReactElement {
  return (
    <div className="space-y-6">
      <Panel title="Novo ajuste de estoque" action={addBtn('Registrar ajuste')}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Produto">
            <input className={fieldClass} placeholder="Alface Crespa" defaultValue="Alface Crespa" readOnly />
          </Field>
          <Field label="Lote">
            <input className={fieldClass} placeholder="LT-2026-0142" defaultValue="LT-2026-0142" readOnly />
          </Field>
          <Field label="Tipo">
            <input className={fieldClass} placeholder="Entrada / Saída" defaultValue="Saída" readOnly />
          </Field>
          <Field label="Quantidade">
            <input className={fieldClass} placeholder="0 maços" defaultValue="12 maços" readOnly />
          </Field>
          <Field label="Motivo">
            <input className={fieldClass} placeholder="Inventário cíclico" defaultValue="Inventário cíclico" readOnly />
          </Field>
        </div>
      </Panel>

      <Panel title="Ajustes recentes" description="Histórico das últimas correções de saldo.">
        <DataTable
          columns={[
            { key: 'data', label: 'Data' },
            { key: 'produto', label: 'Produto' },
            { key: 'lote', label: 'Lote' },
            { key: 'tipo', label: 'Tipo' },
            { key: 'quantidade', label: 'Quantidade', align: 'right' },
            { key: 'motivo', label: 'Motivo' },
          ]}
          rows={ajustesRecentes}
          minWidth={720}
        />
      </Panel>
    </div>
  )
}

// ── Página ───────────────────────────────────────────────────────────────────

const posicaoColumns: Column[] = [
  { key: 'produto', label: 'Produto' },
  { key: 'empresa', label: 'Empresa' },
  { key: 'disponivel', label: 'Disponível', align: 'right' },
  { key: 'reservado', label: 'Reservado', align: 'right' },
  { key: 'total', label: 'Total', align: 'right' },
]

const loteColumns: Column[] = [
  { key: 'lote', label: 'Lote' },
  { key: 'produto', label: 'Produto' },
  { key: 'empresa', label: 'Empresa' },
  { key: 'qtd', label: 'Qtd atual', align: 'right' },
  { key: 'origem', label: 'Origem' },
  { key: 'validade', label: 'Validade' },
]

const movimentoColumns: Column[] = [
  { key: 'data', label: 'Data' },
  { key: 'produto', label: 'Produto' },
  { key: 'lote', label: 'Lote' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'origem', label: 'Origem' },
  { key: 'quantidade', label: 'Quantidade', align: 'right' },
]

export function EstoquePage(): ReactElement {
  const loteRows: Row[] = lotes.map((l) => ({
    id: l.id,
    lote: l.lote,
    produto: l.produto,
    empresa: l.empresa,
    qtd: l.qtd,
    origem: l.origem,
    validade: l.venceEm ? <StatusPill tone="warning">{l.venceEm}</StatusPill> : l.validade,
  }))

  const movimentoRows: Row[] = movimentos.map((m) => ({
    id: m.id,
    data: m.data,
    produto: m.produto,
    lote: m.lote,
    tipo: <StatusPill tone={TIPO_TONE[m.tipo]}>{m.tipo}</StatusPill>,
    origem: m.origem,
    quantidade: m.quantidade,
  }))

  return (
    <>
      <PageHeader
        title="Estoque"
        subtitle="Saldo por empresa, lotes e rastreabilidade da colheita até a entrega."
      />

      <div className="mt-6">
        <Tabs
          items={[
            {
              id: 'posicao',
              label: 'Posição de estoque',
              content: (
                <Panel title="Posição de estoque">
                  <Toolbar placeholder="Buscar em posição de estoque…" />
                  <DataTable columns={posicaoColumns} rows={posicao} minWidth={720} />
                </Panel>
              ),
            },
            {
              id: 'lotes',
              label: 'Lotes',
              content: (
                <Panel title="Lotes" action={addBtn('Novo lote')}>
                  <Toolbar placeholder="Buscar em lotes…" />
                  <DataTable columns={loteColumns} rows={loteRows} minWidth={820} />
                </Panel>
              ),
            },
            {
              id: 'movimentos',
              label: 'Movimentações',
              content: (
                <Panel title="Movimentações">
                  <Toolbar placeholder="Buscar em movimentações…" />
                  <DataTable columns={movimentoColumns} rows={movimentoRows} minWidth={820} />
                </Panel>
              ),
            },
            {
              id: 'rastreio',
              label: 'Rastreabilidade',
              content: <RastreioPanel />,
            },
            {
              id: 'ajustes',
              label: 'Ajustes',
              content: <AjustesPanel />,
            },
          ]}
        />
      </div>
    </>
  )
}
