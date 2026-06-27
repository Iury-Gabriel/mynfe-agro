import { Download, FileText, Send } from 'lucide-react'

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

import type { ReactElement, ReactNode } from 'react'

// ── Dados ilustrativos (mock) — substituídos por TanStack Query nas fases reais ──

type FiscalStatus = 'Pendente' | 'Emitindo' | 'Autorizada' | 'Rejeitada' | 'Cancelada'

const STATUS_TONE: Record<FiscalStatus, PillTone> = {
  Pendente: 'warning',
  Emitindo: 'info',
  Autorizada: 'success',
  Rejeitada: 'danger',
  Cancelada: 'neutral',
}

const statusPill = (status: FiscalStatus): ReactElement => (
  <StatusPill tone={STATUS_TONE[status]}>{status}</StatusPill>
)

interface FilaItem {
  id: string
  pedido: string
  cliente: string
  emitente: string
  tipo: 'Avulso' | 'Consolidado'
  valor: string
  status: FiscalStatus
}

const fila: FilaItem[] = [
  { id: '1', pedido: 'PED-0042', cliente: 'Quitanda Horta Viva', emitente: 'Verde Folha LTDA', tipo: 'Avulso', valor: 'R$ 1.284,50', status: 'Pendente' },
  { id: '2', pedido: 'PED-0043', cliente: 'Mercado São Jorge', emitente: 'Verde Folha LTDA', tipo: 'Consolidado', valor: 'R$ 3.910,00', status: 'Emitindo' },
  { id: '3', pedido: 'PED-0044', cliente: 'Hortifruti Central', emitente: 'Verde Folha LTDA', tipo: 'Avulso', valor: 'R$ 742,80', status: 'Pendente' },
  { id: '4', pedido: 'PED-0040', cliente: 'Sacolão do Bairro', emitente: 'Campo Bello LTDA', tipo: 'Avulso', valor: 'R$ 2.156,30', status: 'Autorizada' },
  { id: '5', pedido: 'PED-0039', cliente: 'Feira Orgânica SP', emitente: 'Campo Bello LTDA', tipo: 'Consolidado', valor: 'R$ 5.480,90', status: 'Rejeitada' },
  { id: '6', pedido: 'PED-0037', cliente: 'Quitanda Horta Viva', emitente: 'Verde Folha LTDA', tipo: 'Avulso', valor: 'R$ 980,00', status: 'Cancelada' },
]

interface NotaItem {
  id: string
  numeroSerie: string
  emitente: string
  cliente: string
  valor: string
  status: FiscalStatus
  emissao: string
  chave: string
  protocolo: string
}

const notas: NotaItem[] = [
  { id: '1', numeroSerie: '1042 / 1', emitente: 'Verde Folha LTDA', cliente: 'Sacolão do Bairro', valor: 'R$ 2.156,30', status: 'Autorizada', emissao: '26/06/2026', chave: '35260612345678000190550010000010421000010428', protocolo: '135260000891234' },
  { id: '2', numeroSerie: '1041 / 1', emitente: 'Verde Folha LTDA', cliente: 'Hortifruti Central', valor: 'R$ 1.870,00', status: 'Autorizada', emissao: '25/06/2026', chave: '35260612345678000190550010000010411000010415', protocolo: '135260000887651' },
  { id: '3', numeroSerie: '1043 / 1', emitente: 'Verde Folha LTDA', cliente: 'Mercado São Jorge', valor: 'R$ 3.910,00', status: 'Emitindo', emissao: '27/06/2026', chave: '—', protocolo: '—' },
  { id: '4', numeroSerie: '0512 / 2', emitente: 'Campo Bello LTDA', cliente: 'Feira Orgânica SP', valor: 'R$ 5.480,90', status: 'Rejeitada', emissao: '24/06/2026', chave: '35260687654321000110550020000005121000005124', protocolo: '—' },
  { id: '5', numeroSerie: '0511 / 2', emitente: 'Campo Bello LTDA', cliente: 'Sacolão do Bairro', valor: 'R$ 2.156,30', status: 'Autorizada', emissao: '23/06/2026', chave: '35260687654321000110550020000005111000005118', protocolo: '135260000871002' },
  { id: '6', numeroSerie: '1038 / 1', emitente: 'Verde Folha LTDA', cliente: 'Quitanda Horta Viva', valor: 'R$ 980,00', status: 'Cancelada', emissao: '20/06/2026', chave: '35260612345678000190550010000010381000010387', protocolo: '135260000864330' },
]

const itensEmissao: Row[] = [
  { id: '1', produto: 'Alface Crespa', ncm: '0705.11.00', cfop: '5101', cst: '00', qtd: '120 maços', valor: 'R$ 336,00' },
  { id: '2', produto: 'Mix de Folhas 200g', ncm: '0709.99.90', cfop: '5101', cst: '00', qtd: '48 un', valor: 'R$ 331,20' },
  { id: '3', produto: 'Rúcula', ncm: '0709.99.90', cfop: '5101', cst: '00', qtd: '24 maços', valor: 'R$ 76,80' },
]

// ── Aba: Fila de faturamento ──

const filaColumns: Column[] = [
  { key: 'pedido', label: 'Pedido' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'emitente', label: 'Empresa emitente' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'valor', label: 'Valor', align: 'right' },
  { key: 'status', label: 'Status fiscal' },
  { key: 'acao', label: 'Ação', align: 'right' },
]

function FilaTab(): ReactElement {
  const rows: Row[] = fila.map((item) => ({
    id: item.id,
    pedido: <span className="font-semibold">{item.pedido}</span>,
    cliente: item.cliente,
    emitente: item.emitente,
    tipo: <StatusPill tone={item.tipo === 'Consolidado' ? 'info' : 'neutral'}>{item.tipo}</StatusPill>,
    valor: item.valor,
    status: statusPill(item.status),
    acao:
      item.status === 'Pendente' ? (
        <ActionButton variant="primary" size="sm">
          <FileText /> Emitir DANFE
        </ActionButton>
      ) : (
        <ActionButton variant="ghost" size="sm">
          Ver
        </ActionButton>
      ),
  }))

  return (
    <Panel title="Fila de faturamento" description="Pedidos aptos a faturar — emissão de DANFE via PlugNotas.">
      <Toolbar placeholder="Buscar por pedido ou cliente…" />
      <DataTable columns={filaColumns} rows={rows} minWidth={900} />
    </Panel>
  )
}

// ── Aba: Notas fiscais ──

const notasColumns: Column[] = [
  { key: 'numeroSerie', label: 'Número / Série' },
  { key: 'emitente', label: 'Emitente' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'valor', label: 'Valor', align: 'right' },
  { key: 'status', label: 'Status' },
  { key: 'emissao', label: 'Emissão' },
  { key: 'acoes', label: 'Ações', align: 'right' },
]

const itensColumns: Column[] = [
  { key: 'produto', label: 'Produto' },
  { key: 'ncm', label: 'NCM' },
  { key: 'cfop', label: 'CFOP' },
  { key: 'cst', label: 'CST' },
  { key: 'qtd', label: 'Qtd', align: 'right' },
  { key: 'valor', label: 'Valor', align: 'right' },
]

function ReviewField({ label, value }: { label: string; value: ReactNode }): ReactElement {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  )
}

function EmissaoReviewPanel(): ReactElement {
  return (
    <Panel
      title="Emissão — PED-0044"
      description="Revisão dos dados antes do envio à SEFAZ."
      action={
        <ActionButton variant="primary" size="sm">
          <Send /> Enviar ao PlugNotas
        </ActionButton>
      }
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <ReviewField label="Emitente" value="Verde Folha LTDA" />
        <ReviewField label="CNPJ emitente" value="12.345.678/0001-90" />
        <ReviewField label="Natureza da operação" value="Venda de produção do estabelecimento" />
        <ReviewField label="Destinatário" value="Hortifruti Central" />
        <ReviewField label="CNPJ destinatário" value="45.111.222/0001-33" />
        <ReviewField label="Modelo / Série" value="NF-e 55 / Série 1" />
      </div>

      <div className="mt-6">
        <DataTable columns={itensColumns} rows={itensEmissao} minWidth={720} />
      </div>
    </Panel>
  )
}

function NotasTab(): ReactElement {
  const rows: Row[] = notas.map((nota) => ({
    id: nota.id,
    numeroSerie: <span className="font-semibold">{nota.numeroSerie}</span>,
    emitente: nota.emitente,
    cliente: nota.cliente,
    valor: nota.valor,
    status: statusPill(nota.status),
    emissao: nota.emissao,
    acoes: (
      <div className="flex items-center justify-end gap-2">
        <ActionButton variant="ghost" size="sm">
          <FileText /> DANFE
        </ActionButton>
        <ActionButton variant="ghost" size="sm">
          <Download /> XML
        </ActionButton>
      </div>
    ),
  }))

  return (
    <div className="space-y-6">
      <EmissaoReviewPanel />

      <Panel title="Notas fiscais" description="Documentos emitidos — chave de acesso de 44 dígitos e protocolo de autorização.">
        <Toolbar placeholder="Buscar por número, chave ou cliente…" />
        <DataTable columns={notasColumns} rows={rows} minWidth={920} />
      </Panel>
    </div>
  )
}

// ── Aba: Configuração fiscal ──

function ConfigField({ label, value }: { label: string; value: ReactNode }): ReactElement {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex h-10 items-center rounded-xl border border-border/70 bg-background/50 px-3 text-sm text-foreground">
        {value}
      </div>
    </label>
  )
}

function ConfigTab(): ReactElement {
  return (
    <Panel
      title="Configuração fiscal por empresa"
      description="Parâmetros de emissão e credenciais de integração."
      action={
        <ActionButton variant="primary" size="sm">
          Salvar configuração
        </ActionButton>
      }
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <ConfigField label="Empresa emitente" value="Verde Folha LTDA" />
        <ConfigField label="Regime tributário" value="Simples Nacional" />
        <ConfigField label="CRT" value="1 — Simples Nacional" />
        <ConfigField label="Série NF-e" value="1" />
        <ConfigField label="Próxima numeração" value="1044" />
        <ConfigField
          label="Ambiente"
          value={<StatusPill tone="warning">Homologação</StatusPill>}
        />
        <ConfigField label="Inscrição estadual" value="123.456.789.112" />
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-bold text-foreground">Integração PlugNotas</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Credenciais usadas para emissão e consulta de documentos fiscais.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <ConfigField label="API Token" value="••••••••••3f2a" />
          <ConfigField label="Status da integração" value={<StatusPill tone="success">Conectado</StatusPill>} />
        </div>
      </div>
    </Panel>
  )
}

export function FiscalPage(): ReactElement {
  return (
    <>
      <PageHeader
        title="Fiscal"
        subtitle="Faturamento e emissão de DANFE / NF-e via integração PlugNotas."
      />

      <div className="mt-6">
        <Tabs
          items={[
            { id: 'fila', label: 'Fila de faturamento', content: <FilaTab /> },
            { id: 'notas', label: 'Notas fiscais', content: <NotasTab /> },
            { id: 'config', label: 'Configuração fiscal', content: <ConfigTab /> },
          ]}
        />
      </div>
    </>
  )
}
