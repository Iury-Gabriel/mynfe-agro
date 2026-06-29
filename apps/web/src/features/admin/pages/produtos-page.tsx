import { ClipboardList, Pencil, Plus, Power, PowerOff } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import type { Produto } from '@/features/admin/api/produtos-api'
import type { ProdutoFormValues } from '@/features/admin/components/produtos/produto-form-dialog'
import type { ReactElement } from 'react'

import {
  useCreateProduto,
  useProdutos,
  useSetProdutoStatus,
  useUpdateProduto,
} from '@/features/admin/api/produtos-api'
import { FichaTecnicaDialog } from '@/features/admin/components/produtos/ficha-tecnica-dialog'
import {
  ProdutoFormDialog,
  toCreatePayload,
} from '@/features/admin/components/produtos/produto-form-dialog'
import { ProdutoStatusDialog } from '@/features/admin/components/produtos/produto-status-dialog'
import {
  ActionButton,
  DataTable,
  PageHeader,
  Panel,
  StatusPill,
  type Column,
  type Row,
} from '@/features/agroflow/ui'
import { hasAnyPermission } from '@/lib/permissions'
import { useAuth } from '@/providers/auth-context'

const COLUMNS: Column[] = [
  { key: 'descricao', label: 'Descrição' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'unidade', label: 'Unidade' },
  { key: 'preco', label: 'Preço padrão', align: 'right' },
  { key: 'status', label: 'Status' },
  { key: 'acoes', label: 'Ações', align: 'right' },
]

const PRECO_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function ProdutosPage(): ReactElement {
  const { user } = useAuth()
  const canCreate = hasAnyPermission(user?.permissions, ['produto:create'])
  const canUpdate = hasAnyPermission(user?.permissions, ['produto:update'])
  const canStatus = hasAnyPermission(user?.permissions, ['produto:status'])

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [fichaOpen, setFichaOpen] = useState(false)
  const [selected, setSelected] = useState<Produto | null>(null)

  const { data, isLoading, isError, refetch } = useProdutos({ page })
  const createProduto = useCreateProduto()
  const updateProduto = useUpdateProduto()
  const setStatus = useSetProdutoStatus()

  const produtos = useMemo(() => data?.produtos ?? [], [data])
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return produtos
    return produtos.filter(
      (p) =>
        p.descricao.toLowerCase().includes(term) ||
        p.unidadeMedida.toLowerCase().includes(term),
    )
  }, [produtos, search])

  const totalPages = data?.totalPages ?? 1
  const isSubmitting = createProduto.isPending || updateProduto.isPending

  function openCreate() {
    setSelected(null)
    setFormOpen(true)
  }

  function openEdit(produto: Produto) {
    setSelected(produto)
    setFormOpen(true)
  }

  function openStatus(produto: Produto) {
    setSelected(produto)
    setStatusOpen(true)
  }

  function openFicha(produto: Produto) {
    setSelected(produto)
    setFichaOpen(true)
  }

  function handleSubmit(values: ProdutoFormValues) {
    const payload = toCreatePayload(values)
    if (selected) {
      const { empresaId, ...rest } = payload
      void empresaId
      updateProduto.mutate(
        { id: selected.id, ...rest },
        {
          onSuccess: () => {
            setFormOpen(false)
            toast.success('Produto atualizado com sucesso.')
          },
          onError: () => toast.error('Não foi possível salvar o produto.'),
        },
      )
    } else {
      createProduto.mutate(payload, {
        onSuccess: () => {
          setFormOpen(false)
          toast.success('Produto criado com sucesso.')
        },
        onError: () => toast.error('Não foi possível salvar o produto.'),
      })
    }
  }

  function handleStatusConfirm(target: Produto) {
    const nextStatus = target.status === 'ativo' ? 'inativo' : 'ativo'
    setStatus.mutate(
      { id: target.id, status: nextStatus },
      {
        onSuccess: () => {
          setStatusOpen(false)
          setSelected(null)
          toast.success(nextStatus === 'ativo' ? 'Produto ativado.' : 'Produto inativado.')
        },
        onError: () => toast.error('Não foi possível alterar o status.'),
      },
    )
  }

  const rows: Row[] = filtered.map((produto) => ({
    id: produto.id,
    descricao: <span className="font-medium text-foreground">{produto.descricao}</span>,
    tipo: (
      <StatusPill tone={produto.tipo === 'embalado' ? 'info' : 'neutral'}>
        {produto.tipo === 'embalado' ? 'Embalado' : 'Bruto'}
      </StatusPill>
    ),
    unidade: produto.unidadeMedida,
    preco: produto.precoPadrao != null ? PRECO_FORMATTER.format(produto.precoPadrao) : '—',
    status: (
      <StatusPill tone={produto.status === 'ativo' ? 'success' : 'neutral'}>
        {produto.status === 'ativo' ? 'Ativo' : 'Inativo'}
      </StatusPill>
    ),
    acoes: (
      <div className="flex flex-wrap justify-end gap-2">
        {canUpdate && (
          <ActionButton variant="ghost" size="sm" onClick={() => openEdit(produto)}>
            <Pencil /> Editar
          </ActionButton>
        )}
        {produto.tipo === 'embalado' && (
          <ActionButton variant="ghost" size="sm" onClick={() => openFicha(produto)}>
            <ClipboardList /> Ficha técnica
          </ActionButton>
        )}
        {canStatus && (
          <ActionButton variant="subtle" size="sm" onClick={() => openStatus(produto)}>
            {produto.status === 'ativo' ? <PowerOff /> : <Power />}
            {produto.status === 'ativo' ? 'Inativar' : 'Ativar'}
          </ActionButton>
        )}
      </div>
    ),
  }))

  return (
    <div className="agroflow agroflow-glow min-h-screen p-4 text-foreground sm:p-6">
      <PageHeader
        title="Produtos"
        subtitle="Catálogo de produtos do seu tenant."
        actions={
          canCreate && (
            <ActionButton variant="primary" onClick={openCreate}>
              <Plus /> Novo produto
            </ActionButton>
          )
        }
      />

      <div className="mt-6">
        <Panel>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <input
                type="search"
                aria-label="Buscar produtos"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por descrição ou unidade…"
                className="h-10 w-full rounded-xl border border-border/70 bg-background/50 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
            </div>
          </div>

          {isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Carregando produtos…</p>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <p className="text-sm text-destructive">Erro ao carregar produtos.</p>
              <ActionButton variant="ghost" size="sm" onClick={() => void refetch()}>
                Tentar novamente
              </ActionButton>
            </div>
          ) : (
            <DataTable columns={COLUMNS} rows={rows} minWidth={840} />
          )}

          {!isLoading && !isError && (
            <div className="mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-xs text-muted-foreground">
                Página {data?.page ?? page} de {totalPages} · {data?.total ?? 0} produtos
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

      {formOpen && (
        <ProdutoFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          produto={selected}
          onSubmit={handleSubmit}
          isPending={isSubmitting}
        />
      )}

      {statusOpen && selected && (
        <ProdutoStatusDialog
          produto={selected}
          open={statusOpen}
          onOpenChange={() => {
            setStatusOpen(false)
            setSelected(null)
          }}
          onConfirm={() => handleStatusConfirm(selected)}
          isPending={setStatus.isPending}
        />
      )}

      {fichaOpen && selected && (
        <FichaTecnicaDialog
          produto={selected}
          canEdit={canUpdate}
          open={fichaOpen}
          onOpenChange={() => {
            setFichaOpen(false)
            setSelected(null)
          }}
        />
      )}
    </div>
  )
}
