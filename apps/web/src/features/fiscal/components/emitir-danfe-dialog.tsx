import { Download, FileText } from 'lucide-react'

import type { Cliente } from '@/features/admin/api/clientes-api'
import type { Empresa } from '@/features/admin/api/empresas-api'
import type { Produto } from '@/features/admin/api/produtos-api'
import type { Column, Row } from '@/features/agroflow/ui'
import type { FilaPedido } from '@/features/fiscal/api/fila-faturamento-api'
import type { NotaFiscal } from '@/features/fiscal/api/notas-fiscais-api'
import type { Pedido } from '@/features/vendas/api/pedidos-api'
import type { ReactElement, ReactNode } from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useClientes } from '@/features/admin/api/clientes-api'
import { useEmpresas } from '@/features/admin/api/empresas-api'
import { useProdutos } from '@/features/admin/api/produtos-api'
import { ActionButton, DataTable, StatusPill } from '@/features/agroflow/ui'
import { FiscalStatusPill } from '@/features/fiscal/components/fiscal-status-pill'
import { usePedido } from '@/features/vendas/api/pedidos-api'
import { formatCurrency, formatDate, formatQty } from '@/features/vendas/lib/format'

const AMBIENTE_LABEL: Record<string, string> = {
  homologacao: 'Homologação',
  producao: 'Produção',
}

const itensColumns: Column[] = [
  { key: 'descricao', label: 'Produto' },
  { key: 'ncm', label: 'NCM' },
  { key: 'cfop', label: 'CFOP' },
  { key: 'cst', label: 'CST/CSOSN' },
  { key: 'qtd', label: 'Qtd', align: 'right' },
  { key: 'unit', label: 'Vlr. unit.', align: 'right' },
  { key: 'valor', label: 'Total', align: 'right' },
]

function ReviewField({ label, value }: { label: string; value: ReactNode }): ReactElement {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="break-words text-sm font-medium text-foreground">{value}</span>
    </div>
  )
}

function ReviewSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}): ReactElement {
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 p-4">
      <h3 className="mb-3 text-sm font-bold text-foreground">{title}</h3>
      {children}
    </div>
  )
}

interface EmitirDanfeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pedido: FilaPedido
  empresaId: string
  nota: NotaFiscal | null
  isEmitting: boolean
  onConfirm: () => void
}

function findEmitente(empresas: Empresa[] | undefined, empresaId: string): Empresa | undefined {
  return (empresas ?? []).find((empresa) => empresa.id === empresaId)
}

function findCliente(clientes: Cliente[] | undefined, clienteId: string): Cliente | undefined {
  return (clientes ?? []).find((cliente) => cliente.id === clienteId)
}

function findProduto(produtos: Produto[] | undefined, produtoId: string): Produto | undefined {
  return (produtos ?? []).find((produto) => produto.id === produtoId)
}

function buildItensRows(pedido: Pedido | undefined, produtos: Produto[] | undefined): Row[] {
  return (pedido?.itens ?? []).map((item) => {
    const produto = findProduto(produtos, item.produtoId)
    return {
      id: item.id,
      descricao: (
        <span className="font-medium text-foreground">
          {produto?.descricao ?? item.produtoId}
        </span>
      ),
      ncm: produto?.ncm ?? '—',
      cfop: produto?.cfopPadrao ?? '—',
      cst: produto?.cstCsosn ?? '—',
      qtd: formatQty(item.quantidade),
      unit: formatCurrency(item.precoUnitario),
      valor: formatCurrency(item.valorTotal),
    }
  })
}

export function EmitirDanfeDialog({
  open,
  onOpenChange,
  pedido,
  empresaId,
  nota,
  isEmitting,
  onConfirm,
}: EmitirDanfeDialogProps): ReactElement {
  const empresasQuery = useEmpresas()
  const clientesQuery = useClientes()
  const produtosQuery = useProdutos()
  const pedidoQuery = usePedido({ empresaId, pedidoId: open ? pedido.id : null })

  const emitente = findEmitente(empresasQuery.data?.empresas, empresaId)
  const cliente = findCliente(clientesQuery.data?.clientes, pedido.clienteId)
  const itensRows = buildItensRows(pedidoQuery.data, produtosQuery.data?.produtos)

  const ambiente = emitente?.ambienteFiscal
  const emitted = nota !== null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-full max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Revisão da DANFE · Pedido {pedido.numero}</DialogTitle>
          <DialogDescription>
            Confira emitente, destinatário e itens antes de transmitir a NF-e.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {ambiente && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Ambiente
              </span>
              <StatusPill tone={ambiente === 'producao' ? 'info' : 'warning'}>
                {AMBIENTE_LABEL[ambiente] ?? ambiente}
              </StatusPill>
              {emitente?.serieNfe != null && (
                <span className="text-xs text-muted-foreground">Série {emitente.serieNfe}</span>
              )}
            </div>
          )}

          <ReviewSection title="Emitente">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <ReviewField
                label="Razão social"
                value={emitente?.razaoSocial ?? pedido.empresaFaturadoraId}
              />
              <ReviewField label="CNPJ / CPF" value={emitente?.cnpjCpfFormatado ?? '—'} />
              <ReviewField label="Regime" value={emitente?.regimeTributario ?? '—'} />
            </div>
          </ReviewSection>

          <ReviewSection title="Destinatário">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <ReviewField
                label="Cliente"
                value={cliente?.razaoSocialNome ?? pedido.clienteId}
              />
              <ReviewField label="CNPJ / CPF" value={cliente?.cnpjCpfFormatado ?? '—'} />
              <ReviewField
                label="Município / UF"
                value={
                  cliente?.municipio
                    ? `${cliente.municipio}${cliente.uf ? ` / ${cliente.uf}` : ''}`
                    : '—'
                }
              />
            </div>
          </ReviewSection>

          <ReviewSection title="Itens">
            {pedidoQuery.isLoading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Carregando itens…</p>
            ) : pedidoQuery.isError ? (
              <p className="py-6 text-center text-sm text-destructive">
                Erro ao carregar os itens do pedido.
              </p>
            ) : (
              <DataTable columns={itensColumns} rows={itensRows} minWidth={680} />
            )}
            <div className="mt-3 flex justify-end">
              <span className="text-sm font-bold text-foreground">
                Total: {formatCurrency(pedido.valorTotal)}
              </span>
            </div>
          </ReviewSection>

          {emitted && nota && (
            <ReviewSection title="Resultado da emissão">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <ReviewField label="Status" value={<FiscalStatusPill status={nota.status} />} />
                <ReviewField label="Número / Série" value={`${nota.numero ?? '—'} / ${nota.serie ?? '—'}`} />
                <ReviewField label="Emissão" value={formatDate(nota.dataEmissao)} />
                <ReviewField label="Chave de acesso" value={nota.chaveAcesso ?? '—'} />
                <ReviewField label="Protocolo" value={nota.protocolo ?? '—'} />
                <ReviewField label="Ambiente" value={AMBIENTE_LABEL[nota.ambiente] ?? nota.ambiente} />
              </div>
              {nota.mensagemRetorno && (
                <p className="mt-3 rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm text-muted-foreground">
                  {nota.mensagemRetorno}
                </p>
              )}
              {(nota.danfeUrl !== null || nota.xmlUrl !== null) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {nota.danfeUrl && (
                    <a href={nota.danfeUrl} target="_blank" rel="noopener noreferrer">
                      <ActionButton variant="ghost" size="sm">
                        <FileText /> DANFE
                      </ActionButton>
                    </a>
                  )}
                  {nota.xmlUrl && (
                    <a href={nota.xmlUrl} target="_blank" rel="noopener noreferrer">
                      <ActionButton variant="ghost" size="sm">
                        <Download /> XML
                      </ActionButton>
                    </a>
                  )}
                </div>
              )}
            </ReviewSection>
          )}
        </div>

        <DialogFooter>
          {emitted ? (
            <ActionButton variant="primary" onClick={() => onOpenChange(false)}>
              Concluir
            </ActionButton>
          ) : (
            <>
              <ActionButton variant="ghost" disabled={isEmitting} onClick={() => onOpenChange(false)}>
                Cancelar
              </ActionButton>
              <ActionButton variant="primary" disabled={isEmitting} onClick={onConfirm}>
                <FileText /> {isEmitting ? 'Emitindo…' : 'Emitir DANFE'}
              </ActionButton>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
