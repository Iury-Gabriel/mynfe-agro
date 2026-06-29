// Dados ilustrativos do MVP — protótipo visual do dashboard AgroFlow.
// Serão substituídos por dados reais (TanStack Query) na Fase 7 do roadmap.

export type FiscalStatus = 'autorizada' | 'pendente' | 'rejeitada'

export interface RecentOrder {
  initials: string
  cliente: string
  tipo: 'Avulso' | 'Consolidado'
  empresa: string
  valor: string
  fiscal: FiscalStatus
}

export interface AttentionItem {
  icon: 'alert' | 'list' | 'clock' | 'sprout'
  tone: 'danger' | 'warning' | 'neutral' | 'success'
  title: string
  description: string
  count: number
}

export const greeting = {
  name: 'Felipe',
  dateLabel: 'Hoje é 27 de junho',
  summary: { remessas: 6, notas: 2 },
}

export const empresaAtiva = { initials: 'VF', nome: 'Verde Folha LTDA' }
export const usuarioAtivo = { initials: 'FE' }

export interface Kpi {
  icon: 'trending' | 'list' | 'file' | 'box'
  label: string
  value: string
  valueSuffix?: string
  delta: { dir: 'up' | 'down' | 'neutral'; label: string; suffix: string }
}

export const kpis: Kpi[] = [
  {
    icon: 'trending',
    label: 'Vendas no mês',
    value: 'R$ 184.520',
    delta: { dir: 'up', label: '12,4%', suffix: 'vs. maio' },
  },
  {
    icon: 'list',
    label: 'A consolidar',
    value: 'R$ 42.180',
    delta: { dir: 'neutral', label: '', suffix: '6 remessas abertas' },
  },
  {
    icon: 'file',
    label: 'Notas emitidas',
    value: '38',
    valueSuffix: '/ 2 pend.',
    delta: { dir: 'up', label: '5 hoje', suffix: 'autorizadas' },
  },
  {
    icon: 'box',
    label: 'Estoque disponível',
    value: '126',
    valueSuffix: 'lotes',
    delta: { dir: 'down', label: '4 vencendo', suffix: 'esta semana' },
  },
]

export const recentOrders: RecentOrder[] = [
  { initials: 'QH', cliente: 'Quitanda Horta Viva', tipo: 'Consolidado', empresa: 'Verde Folha', valor: 'R$ 8.940', fiscal: 'autorizada' },
  { initials: 'MS', cliente: 'Mercado São Jorge', tipo: 'Avulso', empresa: 'Verde Folha', valor: 'R$ 2.310', fiscal: 'pendente' },
  { initials: 'HC', cliente: 'Hortifruti Central', tipo: 'Consolidado', empresa: 'Campo Bello', valor: 'R$ 15.620', fiscal: 'autorizada' },
  { initials: 'EB', cliente: 'Empório Bom Prato', tipo: 'Avulso', empresa: 'Verde Folha', valor: 'R$ 1.180', fiscal: 'rejeitada' },
  { initials: 'SM', cliente: 'Supermercado Mais', tipo: 'Consolidado', empresa: 'Campo Bello', valor: 'R$ 9.450', fiscal: 'pendente' },
]

export const fechamento = {
  mes: 'junho',
  valor: 'R$ 42.180',
  resumo: '6 remessas de 3 clientes prontas para virar pedido + DANFE',
  corteLabel: 'Corte dia 30',
  restante: '3 dias restantes',
  progresso: 78,
}

export const attentionItems: AttentionItem[] = [
  { icon: 'alert', tone: 'danger', title: 'Notas rejeitadas', description: 'Corrigir e reenviar ao PlugNotas', count: 2 },
  { icon: 'list', tone: 'warning', title: 'Remessas a consolidar', description: '3 clientes no fechamento de junho', count: 6 },
  { icon: 'clock', tone: 'neutral', title: 'Lotes vencendo', description: 'Validade nos próximos 7 dias', count: 4 },
  { icon: 'sprout', tone: 'success', title: 'Safras em andamento', description: 'Alface crespa · Rúcula · Agrião', count: 3 },
]

export const navItems = [
  { label: 'Início', to: '/preview' },
  { label: 'Produção', to: '/preview/producao' },
  { label: 'Estoque', to: '/preview/estoque' },
  { label: 'Vendas', to: '/preview/vendas' },
  { label: 'Fiscal', to: '/preview/fiscal' },
  { label: 'Cadastros', to: '/preview/cadastros' },
  { label: 'Admin', to: '/preview/admin' },
] as const
