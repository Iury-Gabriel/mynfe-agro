import { Plus } from 'lucide-react'

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

import type { ReactElement } from 'react'

// ── Dados ilustrativos (mock) — substituídos por TanStack Query nas fases reais ──

const safras: Row[] = [
  {
    id: '1',
    cultura: 'Alface crespa',
    variedade: 'Vera',
    area: 'Talhão A1 · Sítio Verde Folha',
    plantio: '02/05/2026',
    colheita: '12/06/2026',
    status: 'Em andamento',
  },
  {
    id: '2',
    cultura: 'Rúcula',
    variedade: 'Cultivada folha larga',
    area: 'Canteiro C3 · Chácara Boa Terra',
    plantio: '20/05/2026',
    colheita: '24/06/2026',
    status: 'Em andamento',
  },
  {
    id: '3',
    cultura: 'Agrião',
    variedade: 'D’água comum',
    area: 'Gleba 7 · Fazenda Campo Bello',
    plantio: '10/06/2026',
    colheita: '15/07/2026',
    status: 'Planejado',
  },
  {
    id: '4',
    cultura: 'Couve manteiga',
    variedade: 'Geórgia',
    area: 'Talhão B2 · Sítio Verde Folha',
    plantio: '15/04/2026',
    colheita: '08/06/2026',
    status: 'Colhido',
  },
]

type SafraStatus = 'Planejado' | 'Em andamento' | 'Colhido'

const safraTone: Record<SafraStatus, 'neutral' | 'warning' | 'success'> = {
  Planejado: 'neutral',
  'Em andamento': 'warning',
  Colhido: 'success',
}

const atividades: Row[] = [
  {
    id: '1',
    tipo: 'Plantio',
    area: 'Talhão A1 · Alface crespa',
    data: '02/05/2026',
    responsavel: 'João Pereira',
    observacoes: 'Mudas transplantadas, espaçamento 25 cm.',
  },
  {
    id: '2',
    tipo: 'Irrigação',
    area: 'Canteiro C3 · Rúcula',
    data: '22/05/2026',
    responsavel: 'Marcos Lima',
    observacoes: 'Gotejamento, 40 min no fim da tarde.',
  },
  {
    id: '3',
    tipo: 'Pulverização',
    area: 'Gleba 7 · Agrião',
    data: '11/06/2026',
    responsavel: 'Ana Souza',
    observacoes: 'Defensivo biológico contra pulgão.',
  },
  {
    id: '4',
    tipo: 'Adubação',
    area: 'Talhão B2 · Couve manteiga',
    data: '18/04/2026',
    responsavel: 'João Pereira',
    observacoes: 'Cobertura com composto orgânico.',
  },
]

const custos: Row[] = [
  {
    id: '1',
    tipo: 'Insumo',
    descricao: 'Mudas de alface crespa (bandejas)',
    area: 'Talhão A1 · Alface crespa',
    data: '30/04/2026',
    valor: 'R$ 1.250,00',
  },
  {
    id: '2',
    tipo: 'Mão de obra',
    descricao: 'Diária de plantio (3 pessoas)',
    area: 'Talhão A1 · Alface crespa',
    data: '02/05/2026',
    valor: 'R$ 540,00',
  },
  {
    id: '3',
    tipo: 'Insumo',
    descricao: 'Composto orgânico (toneladas)',
    area: 'Talhão B2 · Couve manteiga',
    data: '16/04/2026',
    valor: 'R$ 880,00',
  },
  {
    id: '4',
    tipo: 'Maquinário',
    descricao: 'Locação de trator p/ preparo de solo',
    area: 'Gleba 7 · Agrião',
    data: '08/06/2026',
    valor: 'R$ 1.600,00',
  },
]

const colheitas: Row[] = [
  {
    id: '1',
    data: '08/06/2026',
    produto: 'Couve manteiga',
    origem: 'Talhão B2 · Sítio Verde Folha',
    quantidade: '180 maços',
    lote: 'LT-2026-0138',
  },
  {
    id: '2',
    data: '12/06/2026',
    produto: 'Alface crespa',
    origem: 'Talhão A1 · Sítio Verde Folha',
    quantidade: '320 kg',
    lote: 'LT-2026-0142',
  },
  {
    id: '3',
    data: '24/06/2026',
    produto: 'Rúcula',
    origem: 'Canteiro C3 · Chácara Boa Terra',
    quantidade: '240 maços',
    lote: 'LT-2026-0151',
  },
  {
    id: '4',
    data: '20/05/2026',
    produto: 'Espinafre',
    origem: 'Gleba 4 · Fazenda Campo Bello',
    quantidade: '150 kg',
    lote: 'LT-2026-0119',
  },
]

const embalagem: Row[] = [
  {
    id: '1',
    produto: 'Mix de Folhas 200g',
    quantidade: '460 un',
    lote: 'EM-2026-0207',
    origem: 'Colheita LT-2026-0142 · Talhão A1',
    data: '13/06/2026',
  },
  {
    id: '2',
    produto: 'Alface Crespa 1 maço',
    quantidade: '300 maços',
    lote: 'EM-2026-0208',
    origem: 'Colheita LT-2026-0142 · Talhão A1',
    data: '13/06/2026',
  },
  {
    id: '3',
    produto: 'Rúcula Lavada 150g',
    quantidade: '220 un',
    lote: 'EM-2026-0214',
    origem: 'Colheita LT-2026-0151 · Canteiro C3',
    data: '25/06/2026',
  },
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

export function ProducaoPage(): ReactElement {
  return (
    <>
      <PageHeader
        title="Produção"
        subtitle="Cultivo, atividades de campo, custos, colheita e embalagem (pós-colheita)."
      />

      <div className="mt-6">
        <Tabs
          items={[
            {
              id: 'safras',
              label: 'Safras',
              content: (
                <ListPanel
                  title="Safras"
                  add="Nova safra"
                  columns={[
                    { key: 'cultura', label: 'Cultura' },
                    { key: 'variedade', label: 'Variedade' },
                    { key: 'area', label: 'Área' },
                    { key: 'plantio', label: 'Plantio' },
                    { key: 'colheita', label: 'Colheita prevista' },
                    { key: 'status', label: 'Status' },
                  ]}
                  rows={safras.map((s) => ({
                    ...s,
                    status: (
                      <StatusPill tone={safraTone[s.status as SafraStatus]}>{s.status}</StatusPill>
                    ),
                  }))}
                  minWidth={820}
                />
              ),
            },
            {
              id: 'atividades',
              label: 'Atividades de campo',
              content: (
                <ListPanel
                  title="Atividades de campo"
                  add="Nova atividade"
                  columns={[
                    { key: 'tipo', label: 'Tipo' },
                    { key: 'area', label: 'Safra / Área' },
                    { key: 'data', label: 'Data' },
                    { key: 'responsavel', label: 'Responsável' },
                    { key: 'observacoes', label: 'Observações' },
                  ]}
                  rows={atividades.map((a) => ({
                    ...a,
                    tipo: <StatusPill tone="info">{a.tipo}</StatusPill>,
                  }))}
                  minWidth={820}
                />
              ),
            },
            {
              id: 'custos',
              label: 'Custos de produção',
              content: (
                <ListPanel
                  title="Custos de produção"
                  add="Lançar custo"
                  columns={[
                    { key: 'tipo', label: 'Tipo' },
                    { key: 'descricao', label: 'Descrição' },
                    { key: 'area', label: 'Safra / Área' },
                    { key: 'data', label: 'Data' },
                    { key: 'valor', label: 'Valor', align: 'right' },
                  ]}
                  rows={custos}
                  minWidth={780}
                />
              ),
            },
            {
              id: 'colheitas',
              label: 'Colheitas',
              content: (
                <ListPanel
                  title="Colheitas"
                  add="Registrar colheita"
                  columns={[
                    { key: 'data', label: 'Data' },
                    { key: 'produto', label: 'Produto' },
                    { key: 'origem', label: 'Origem' },
                    { key: 'quantidade', label: 'Quantidade', align: 'right' },
                    { key: 'lote', label: 'Lote gerado' },
                  ]}
                  rows={colheitas}
                  minWidth={760}
                />
              ),
            },
            {
              id: 'embalagem',
              label: 'Embalagem',
              content: (
                <ListPanel
                  title="Embalagem"
                  add="Entrada embalada"
                  columns={[
                    { key: 'produto', label: 'Produto' },
                    { key: 'quantidade', label: 'Quantidade', align: 'right' },
                    { key: 'lote', label: 'Lote' },
                    { key: 'origem', label: 'Origem' },
                    { key: 'data', label: 'Data' },
                  ]}
                  rows={embalagem}
                  minWidth={760}
                />
              ),
            },
          ]}
        />
      </div>
    </>
  )
}
