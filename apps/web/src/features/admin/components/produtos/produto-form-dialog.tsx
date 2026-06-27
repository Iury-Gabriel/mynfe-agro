import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import type { CreateProdutoInput, Produto, ProdutoTipo } from '@/features/admin/api/produtos-api'
import type { ReactElement } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PRODUTO_TIPOS } from '@/features/admin/api/produtos-api'

const produtoSchema = z.object({
  empresaId: z.string().min(1, 'Empresa obrigatória').max(100),
  descricao: z.string().min(1, 'Descrição obrigatória').max(200),
  tipo: z.enum(PRODUTO_TIPOS),
  unidadeMedida: z.string().min(1, 'Unidade obrigatória').max(10),
  precoPadrao: z.string().max(20),
  ncm: z.string().max(20),
  cest: z.string().max(20),
  cfopPadrao: z.string().max(10),
  cstCsosn: z.string().max(5),
})

export type ProdutoFormValues = z.infer<typeof produtoSchema>

const TIPO_LABELS: Record<ProdutoTipo, string> = {
  bruto: 'Bruto',
  embalado: 'Embalado',
}

function emptyDefaults(): ProdutoFormValues {
  return {
    empresaId: '',
    descricao: '',
    tipo: 'bruto',
    unidadeMedida: '',
    precoPadrao: '',
    ncm: '',
    cest: '',
    cfopPadrao: '',
    cstCsosn: '',
  }
}

function fromProduto(produto: Produto): ProdutoFormValues {
  return {
    empresaId: produto.empresaId,
    descricao: produto.descricao,
    tipo: produto.tipo,
    unidadeMedida: produto.unidadeMedida,
    precoPadrao: produto.precoPadrao != null ? String(produto.precoPadrao) : '',
    ncm: produto.ncm ?? '',
    cest: produto.cest ?? '',
    cfopPadrao: produto.cfopPadrao ?? '',
    cstCsosn: produto.cstCsosn ?? '',
  }
}

export function toCreatePayload(values: ProdutoFormValues): CreateProdutoInput {
  const preco = values.precoPadrao.trim()
  return {
    empresaId: values.empresaId.trim(),
    descricao: values.descricao.trim(),
    tipo: values.tipo,
    unidadeMedida: values.unidadeMedida.trim(),
    precoPadrao: preco === '' ? null : Number(preco),
    ncm: values.ncm.trim() || null,
    cest: values.cest.trim() || null,
    cfopPadrao: values.cfopPadrao.trim() || null,
    cstCsosn: values.cstCsosn.trim() || null,
  }
}

interface ProdutoFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  produto: Produto | null
  onSubmit: (values: ProdutoFormValues) => void
  isPending: boolean
}

export function ProdutoFormDialog({
  open,
  onOpenChange,
  produto,
  onSubmit,
  isPending,
}: ProdutoFormDialogProps): ReactElement {
  const isEdit = produto !== null

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProdutoFormValues>({
    resolver: zodResolver(produtoSchema),
    defaultValues: emptyDefaults(),
  })

  useEffect(() => {
    if (open) {
      reset(produto ? fromProduto(produto) : emptyDefaults())
    }
  }, [open, produto, reset])

  const tipo = watch('tipo')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar produto' : 'Novo produto'}</DialogTitle>
          <DialogDescription>Dados cadastrais e fiscais do produto.</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            void handleSubmit(onSubmit)(e)
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="produto-descricao">Descrição</Label>
            <Input id="produto-descricao" {...register('descricao')} />
            {errors.descricao && (
              <p className="text-xs text-destructive">{errors.descricao.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="produto-tipo">Tipo</Label>
              <Select
                value={tipo}
                onValueChange={(v) => setValue('tipo', v as ProdutoTipo, { shouldValidate: true })}
              >
                <SelectTrigger id="produto-tipo" aria-label="Tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUTO_TIPOS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TIPO_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="produto-unidade">Unidade de medida</Label>
              <Input id="produto-unidade" {...register('unidadeMedida')} />
              {errors.unidadeMedida && (
                <p className="text-xs text-destructive">{errors.unidadeMedida.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="produto-empresa">Empresa</Label>
              <Input id="produto-empresa" {...register('empresaId')} />
              {errors.empresaId && (
                <p className="text-xs text-destructive">{errors.empresaId.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="produto-preco">Preço padrão</Label>
              <Input id="produto-preco" inputMode="decimal" {...register('precoPadrao')} />
              {errors.precoPadrao && (
                <p className="text-xs text-destructive">{errors.precoPadrao.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="produto-ncm">NCM</Label>
              <Input id="produto-ncm" {...register('ncm')} />
              {errors.ncm && <p className="text-xs text-destructive">{errors.ncm.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="produto-cest">CEST</Label>
              <Input id="produto-cest" {...register('cest')} />
              {errors.cest && <p className="text-xs text-destructive">{errors.cest.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="produto-cfop">CFOP padrão</Label>
              <Input id="produto-cfop" {...register('cfopPadrao')} />
              {errors.cfopPadrao && (
                <p className="text-xs text-destructive">{errors.cfopPadrao.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="produto-cst">CST / CSOSN</Label>
              <Input id="produto-cst" {...register('cstCsosn')} />
              {errors.cstCsosn && (
                <p className="text-xs text-destructive">{errors.cstCsosn.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full sm:w-auto"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" className="h-11 w-full sm:w-auto" disabled={isPending}>
              {isPending ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar produto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
