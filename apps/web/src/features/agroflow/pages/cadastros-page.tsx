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

const fazendas: Row[] = [
  { id: '1', nome: 'Sítio Verde Folha', empresa: 'Verde Folha LTDA', municipio: 'Mogi das Cruzes / SP', area: '12,5 ha' },
  { id: '2', nome: 'Fazenda Campo Bello', empresa: 'Campo Bello LTDA', municipio: 'Ibiúna / SP', area: '34,0 ha' },
  { id: '3', nome: 'Chácara Boa Terra', empresa: 'Verde Folha LTDA', municipio: 'Biritiba Mirim / SP', area: '8,2 ha' },
]

const areas: Row[] = [
  { id: '1', identificacao: 'Talhão A1', fazenda: 'Sítio Verde Folha', tamanho: '1,2 ha', cultura: 'Alface crespa', rotulo: 'Talhão' },
  { id: '2', identificacao: 'Canteiro C3', fazenda: 'Chácara Boa Terra', tamanho: '450 m²', cultura: 'Rúcula', rotulo: 'Canteiro' },
  { id: '3', identificacao: 'Gleba 7', fazenda: 'Fazenda Campo Bello', tamanho: '3,0 ha', cultura: 'Agrião', rotulo: 'Gleba' },
]

const clientes: Row[] = [
  { id: '1', nome: 'Quitanda Horta Viva', doc: '12.345.678/0001-90', cidade: 'São Paulo / SP', ie: 'Contribuinte', vendedor: 'Felipe' },
  { id: '2', nome: 'Mercado São Jorge', doc: '98.765.432/0001-10', cidade: 'Guarulhos / SP', ie: 'Isento', vendedor: 'Mariana' },
  { id: '3', nome: 'Hortifruti Central', doc: '45.111.222/0001-33', cidade: 'Campinas / SP', ie: 'Contribuinte', vendedor: 'Felipe' },
]

const produtos: Row[] = [
  { id: '1', descricao: 'Alface Crespa', tipo: 'Bruto', unidade: 'maço', empresa: 'Verde Folha', preco: 'R$ 2,80', status: 'Ativo' },
  { id: '2', descricao: 'Mix de Folhas 200g', tipo: 'Embalado', unidade: 'un', empresa: 'Verde Folha', preco: 'R$ 6,90', status: 'Ativo' },
  { id: '3', descricao: 'Rúcula', tipo: 'Bruto', unidade: 'maço', empresa: 'Campo Bello', preco: 'R$ 3,20', status: 'Ativo' },
  { id: '4', descricao: 'Agrião', tipo: 'Bruto', unidade: 'maço', empresa: 'Campo Bello', preco: 'R$ 3,00', status: 'Inativo' },
]

const precos: Row[] = [
  { id: '1', cliente: 'Quitanda Horta Viva', produto: 'Mix de Folhas 200g', preco: 'R$ 6,40', vigencia: '01/06 – 31/12' },
  { id: '2', cliente: 'Hortifruti Central', produto: 'Alface Crespa', preco: 'R$ 2,50', vigencia: '01/06 – —' },
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

export function CadastrosPage(): ReactElement {
  return (
    <>
      <PageHeader
        title="Cadastros"
        subtitle="Fazendas, áreas, clientes, catálogo de produtos e tabelas de preço."
      />

      <div className="mt-6">
        <Tabs
          items={[
            {
              id: 'fazendas',
              label: 'Fazendas',
              content: (
                <ListPanel
                  title="Fazendas"
                  add="Nova fazenda"
                  columns={[
                    { key: 'nome', label: 'Nome' },
                    { key: 'empresa', label: 'Empresa' },
                    { key: 'municipio', label: 'Município / UF' },
                    { key: 'area', label: 'Área total', align: 'right' },
                  ]}
                  rows={fazendas}
                />
              ),
            },
            {
              id: 'areas',
              label: 'Áreas',
              content: (
                <ListPanel
                  title="Áreas"
                  add="Nova área"
                  columns={[
                    { key: 'identificacao', label: 'Identificação' },
                    { key: 'fazenda', label: 'Fazenda' },
                    { key: 'rotulo', label: 'Rótulo' },
                    { key: 'cultura', label: 'Cultura atual' },
                    { key: 'tamanho', label: 'Tamanho', align: 'right' },
                  ]}
                  rows={areas}
                />
              ),
            },
            {
              id: 'clientes',
              label: 'Clientes',
              content: (
                <ListPanel
                  title="Clientes"
                  add="Novo cliente"
                  columns={[
                    { key: 'nome', label: 'Razão social / Nome' },
                    { key: 'doc', label: 'CNPJ / CPF' },
                    { key: 'cidade', label: 'Cidade' },
                    { key: 'ie', label: 'IE' },
                    { key: 'vendedor', label: 'Vendedor' },
                  ]}
                  rows={clientes}
                  minWidth={720}
                />
              ),
            },
            {
              id: 'produtos',
              label: 'Produtos',
              content: (
                <ListPanel
                  title="Catálogo de produtos"
                  add="Novo produto"
                  columns={[
                    { key: 'descricao', label: 'Descrição' },
                    { key: 'tipo', label: 'Tipo' },
                    { key: 'unidade', label: 'Unidade' },
                    { key: 'empresa', label: 'Empresa' },
                    { key: 'preco', label: 'Preço padrão', align: 'right' },
                    { key: 'status', label: 'Status' },
                  ]}
                  rows={produtos.map((p) => ({
                    ...p,
                    tipo: <StatusPill tone={p.tipo === 'Embalado' ? 'info' : 'neutral'}>{p.tipo}</StatusPill>,
                    status: (
                      <StatusPill tone={p.status === 'Ativo' ? 'success' : 'neutral'}>{p.status}</StatusPill>
                    ),
                  }))}
                  minWidth={760}
                />
              ),
            },
            {
              id: 'precos',
              label: 'Tabelas de preço',
              content: (
                <ListPanel
                  title="Preços por cliente"
                  add="Novo preço"
                  columns={[
                    { key: 'cliente', label: 'Cliente' },
                    { key: 'produto', label: 'Produto' },
                    { key: 'preco', label: 'Preço negociado', align: 'right' },
                    { key: 'vigencia', label: 'Vigência' },
                  ]}
                  rows={precos}
                />
              ),
            },
          ]}
        />
      </div>
    </>
  )
}
