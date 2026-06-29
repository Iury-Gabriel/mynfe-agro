import { Plus, ShieldCheck } from 'lucide-react'

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

const empresas: { id: string; razao: string; doc: string; ie: string; regime: string; status: string }[] = [
  { id: '1', razao: 'Verde Folha LTDA', doc: '12.345.678/0001-90', ie: '123.456.789.012', regime: 'Simples Nacional', status: 'Ativo' },
  { id: '2', razao: 'Campo Bello LTDA', doc: '98.765.432/0001-10', ie: '987.654.321.098', regime: 'Lucro Presumido', status: 'Ativo' },
  { id: '3', razao: 'Boa Terra Agropecuária LTDA', doc: '45.111.222/0001-33', ie: 'Isento', regime: 'Simples Nacional', status: 'Inativo' },
]

const usuarios: { id: string; nome: string; email: string; papel: string; empresas: string; status: string }[] = [
  { id: '1', nome: 'Roberta Almeida', email: 'roberta.almeida@verdefolha.com', papel: 'Administrador', empresas: 'Verde Folha, Campo Bello', status: 'Ativo' },
  { id: '2', nome: 'Carlos Henrique', email: 'carlos.henrique@verdefolha.com', papel: 'Gestor', empresas: 'Verde Folha', status: 'Ativo' },
  { id: '3', nome: 'João Pereira', email: 'joao.pereira@campobello.com', papel: 'Operador de Campo', empresas: 'Campo Bello', status: 'Ativo' },
  { id: '4', nome: 'Mariana Souza', email: 'mariana.souza@verdefolha.com', papel: 'Vendedor', empresas: 'Verde Folha, Campo Bello', status: 'Ativo' },
  { id: '5', nome: 'Felipe Costa', email: 'felipe.costa@boaterra.com', papel: 'Faturista', empresas: 'Boa Terra', status: 'Inativo' },
]

const papeis: { id: string; papel: string; descricao: string; permissoes: number; usuarios: number }[] = [
  { id: '1', papel: 'Administrador', descricao: 'Acesso total ao tenant, configurações e gestão de usuários.', permissoes: 24, usuarios: 1 },
  { id: '2', papel: 'Gestor', descricao: 'Gestão operacional de produção, estoque e vendas.', permissoes: 18, usuarios: 1 },
  { id: '3', papel: 'Operador de Campo', descricao: 'Apontamentos de produção e movimentações de estoque.', permissoes: 6, usuarios: 1 },
  { id: '4', papel: 'Vendedor', descricao: 'Criação de pedidos e consulta de clientes e produtos.', permissoes: 9, usuarios: 1 },
  { id: '5', papel: 'Faturista', descricao: 'Emissão fiscal e ajustes de faturamento.', permissoes: 8, usuarios: 1 },
]

const modulosOperador: { modulo: string; permitido: boolean }[] = [
  { modulo: 'Produção', permitido: true },
  { modulo: 'Estoque', permitido: true },
  { modulo: 'Vendas', permitido: false },
  { modulo: 'Fiscal', permitido: false },
  { modulo: 'Cadastros', permitido: false },
  { modulo: 'Admin', permitido: false },
]

const auditoria: { id: string; data: string; usuario: string; acao: string; entidade: string; registro: string }[] = [
  { id: '1', data: '27/06/2026 14:32', usuario: 'Roberta Almeida', acao: 'Criar', entidade: 'Usuário', registro: 'Felipe Costa' },
  { id: '2', data: '27/06/2026 13:10', usuario: 'Carlos Henrique', acao: 'Editar', entidade: 'Produto', registro: 'Mix de Folhas 200g' },
  { id: '3', data: '27/06/2026 11:48', usuario: 'Felipe Costa', acao: 'Emitir', entidade: 'NF-e', registro: 'Pedido #1042' },
  { id: '4', data: '26/06/2026 18:05', usuario: 'João Pereira', acao: 'Ajustar', entidade: 'Estoque', registro: 'Alface Crespa — +120 maços' },
  { id: '5', data: '26/06/2026 16:22', usuario: 'Roberta Almeida', acao: 'Excluir', entidade: 'Tabela de preço', registro: 'Hortifruti Central' },
  { id: '6', data: '26/06/2026 09:14', usuario: 'Mariana Souza', acao: 'Criar', entidade: 'Pedido', registro: 'Quitanda Horta Viva' },
]

// ── Helpers ──

const addBtn = (label: string): ReactElement => (
  <ActionButton variant="primary" size="sm">
    <Plus /> {label}
  </ActionButton>
)

const statusTone = (status: string): PillTone => (status === 'Ativo' ? 'success' : 'neutral')

const acaoTones: Record<string, PillTone> = {
  Criar: 'success',
  Editar: 'info',
  Excluir: 'danger',
  Emitir: 'warning',
  Ajustar: 'neutral',
}

function FormField({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}): ReactElement {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-muted-foreground">{label}</label>
      <div className="flex h-10 items-center rounded-xl border border-border/70 bg-background/50 px-3 text-sm text-foreground">
        {value}
      </div>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

function ListPanel({
  title,
  add,
  columns,
  rows,
  withToolbar,
  minWidth,
}: {
  title: string
  add: string
  columns: Column[]
  rows: Row[]
  withToolbar?: boolean
  minWidth?: number
}): ReactElement {
  return (
    <Panel title={title} action={addBtn(add)}>
      {withToolbar && <Toolbar placeholder={`Buscar em ${title.toLowerCase()}…`} />}
      <DataTable columns={columns} rows={rows} minWidth={minWidth} />
    </Panel>
  )
}

// ── Conteúdo das abas ──

function EmpresasTab(): ReactElement {
  return (
    <ListPanel
      title="Empresas"
      add="Nova empresa"
      withToolbar
      minWidth={760}
      columns={[
        { key: 'razao', label: 'Razão social' },
        { key: 'doc', label: 'CNPJ / CPF' },
        { key: 'ie', label: 'IE' },
        { key: 'regime', label: 'Regime' },
        { key: 'status', label: 'Status' },
      ]}
      rows={empresas.map((e) => ({
        ...e,
        status: <StatusPill tone={statusTone(e.status)}>{e.status}</StatusPill>,
      }))}
    />
  )
}

function UsuariosTab(): ReactElement {
  return (
    <ListPanel
      title="Usuários"
      add="Novo usuário"
      withToolbar
      minWidth={820}
      columns={[
        { key: 'nome', label: 'Nome' },
        { key: 'email', label: 'Email' },
        { key: 'papel', label: 'Papel' },
        { key: 'empresas', label: 'Empresas' },
        { key: 'status', label: 'Status' },
      ]}
      rows={usuarios.map((u) => ({
        ...u,
        papel: <StatusPill tone="info">{u.papel}</StatusPill>,
        status: <StatusPill tone={statusTone(u.status)}>{u.status}</StatusPill>,
      }))}
    />
  )
}

function PapeisTab(): ReactElement {
  const papeisRows: Row[] = papeis.map((p) => ({
    id: p.id,
    papel: p.papel,
    descricao: p.descricao,
    permissoes: <StatusPill tone="neutral">{p.permissoes} permissões</StatusPill>,
    usuarios: p.usuarios,
  }))

  return (
    <div className="space-y-6">
      <ListPanel
        title="Papéis & permissões"
        add="Novo papel"
        minWidth={820}
        columns={[
          { key: 'papel', label: 'Papel' },
          { key: 'descricao', label: 'Descrição' },
          { key: 'permissoes', label: 'Permissões' },
          { key: 'usuarios', label: 'Usuários', align: 'right' },
        ]}
        rows={papeisRows}
      />

      <Panel
        title="Matriz de permissões — Operador de Campo"
        description="Allow-list por módulo: apenas o que está explicitamente permitido é liberado."
      >
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {modulosOperador.map((m) => (
            <li
              key={m.modulo}
              className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 px-4 py-3"
            >
              <span className="text-sm font-medium text-foreground">{m.modulo}</span>
              {m.permitido ? (
                <StatusPill tone="success">Permitido</StatusPill>
              ) : (
                <StatusPill tone="neutral">—</StatusPill>
              )}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}

function ConfigTab(): ReactElement {
  const saveBtn: ReactNode = (
    <ActionButton variant="primary" size="sm">
      <ShieldCheck /> Salvar
    </ActionButton>
  )

  return (
    <Panel
      title="Preferências do tenant"
      description="Configurações gerais aplicadas a todas as empresas do tenant."
      action={saveBtn}
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField
          label="Nome do tenant"
          value="Grupo Verde Folha"
          hint="Identificação interna do tenant."
        />
        <FormField
          label="Nomenclatura de área"
          value="Talhão"
          hint="Rótulo padrão usado nos cadastros de área."
        />
        <FormField
          label="Dia de corte da consolidação mensal"
          value="30"
          hint="Dia em que os relatórios mensais são fechados."
        />
        <FormField
          label="Fuso horário"
          value="America/Sao_Paulo (GMT-3)"
        />
      </div>
    </Panel>
  )
}

function AuditoriaTab(): ReactElement {
  const auditRows: Row[] = auditoria.map((a) => ({
    id: a.id,
    data: a.data,
    usuario: a.usuario,
    acao: <StatusPill tone={acaoTones[a.acao] ?? 'neutral'}>{a.acao}</StatusPill>,
    entidade: a.entidade,
    registro: a.registro,
  }))

  return (
    <Panel title="Auditoria">
      <Toolbar placeholder="Buscar em auditoria…" />
      <DataTable
        minWidth={820}
        columns={[
          { key: 'data', label: 'Data/hora' },
          { key: 'usuario', label: 'Usuário' },
          { key: 'acao', label: 'Ação' },
          { key: 'entidade', label: 'Entidade' },
          { key: 'registro', label: 'Registro' },
        ]}
        rows={auditRows}
      />
    </Panel>
  )
}

export function AdminPage(): ReactElement {
  return (
    <>
      <PageHeader
        title="Admin"
        subtitle="Empresas, usuários, papéis e permissões e configurações do tenant."
      />

      <div className="mt-6">
        <Tabs
          items={[
            { id: 'empresas', label: 'Empresas', content: <EmpresasTab /> },
            { id: 'usuarios', label: 'Usuários', content: <UsuariosTab /> },
            { id: 'papeis', label: 'Papéis & permissões', content: <PapeisTab /> },
            { id: 'config', label: 'Configurações do tenant', content: <ConfigTab /> },
            { id: 'auditoria', label: 'Auditoria', content: <AuditoriaTab /> },
          ]}
        />
      </div>
    </>
  )
}
