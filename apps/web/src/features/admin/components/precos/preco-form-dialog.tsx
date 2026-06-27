import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import type { CreateTabelaPrecoInput } from '@/features/admin/api/tabela-precos-api'
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

const precoSchema = z.object({
  clienteId: z.string().min(1, 'Cliente obrigatório').max(100),
  produtoId: z.string().min(1, 'Produto obrigatório').max(100),
  preco: z.string().min(1, 'Preço obrigatório').max(20),
  vigenciaInicio: z.string().max(10),
  vigenciaFim: z.string().max(10),
})

export type PrecoFormValues = z.infer<typeof precoSchema>

function emptyDefaults(): PrecoFormValues {
  return {
    clienteId: '',
    produtoId: '',
    preco: '',
    vigenciaInicio: '',
    vigenciaFim: '',
  }
}

export function toCreatePayload(values: PrecoFormValues): CreateTabelaPrecoInput {
  return {
    clienteId: values.clienteId.trim(),
    produtoId: values.produtoId.trim(),
    preco: Number(values.preco.trim()),
    vigenciaInicio: values.vigenciaInicio.trim() || null,
    vigenciaFim: values.vigenciaFim.trim() || null,
  }
}

interface PrecoFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: PrecoFormValues) => void
  isPending: boolean
}

export function PrecoFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: PrecoFormDialogProps): ReactElement {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PrecoFormValues>({
    resolver: zodResolver(precoSchema),
    defaultValues: emptyDefaults(),
  })

  useEffect(() => {
    if (open) {
      reset(emptyDefaults())
    }
  }, [open, reset])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo preço</DialogTitle>
          <DialogDescription>Preço por cliente e produto, com vigência opcional.</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            void handleSubmit(onSubmit)(e)
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="preco-cliente">Cliente</Label>
              <Input id="preco-cliente" {...register('clienteId')} />
              {errors.clienteId && (
                <p className="text-xs text-destructive">{errors.clienteId.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="preco-produto">Produto</Label>
              <Input id="preco-produto" {...register('produtoId')} />
              {errors.produtoId && (
                <p className="text-xs text-destructive">{errors.produtoId.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="preco-valor">Preço</Label>
            <Input id="preco-valor" inputMode="decimal" {...register('preco')} />
            {errors.preco && <p className="text-xs text-destructive">{errors.preco.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="preco-vig-inicio">Vigência início</Label>
              <Input id="preco-vig-inicio" type="date" {...register('vigenciaInicio')} />
              {errors.vigenciaInicio && (
                <p className="text-xs text-destructive">{errors.vigenciaInicio.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="preco-vig-fim">Vigência fim</Label>
              <Input id="preco-vig-fim" type="date" {...register('vigenciaFim')} />
              {errors.vigenciaFim && (
                <p className="text-xs text-destructive">{errors.vigenciaFim.message}</p>
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
              {isPending ? 'Salvando...' : 'Criar preço'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
