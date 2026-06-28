import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import type { AjustarEstoqueInput } from '@/features/estoque/api/estoque-api'
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

const schema = z.object({
  produtoId: z.string().min(1, 'Produto obrigatório').max(60),
  direcao: z.enum(['entrada', 'saida']),
  quantidade: z.string().min(1, 'Quantidade obrigatória'),
  motivo: z.string().min(1, 'Motivo obrigatório').max(500),
  data: z.string().min(1, 'Data obrigatória'),
  loteId: z.string().max(60),
})

type FormValues = z.infer<typeof schema>

function emptyDefaults(): FormValues {
  return {
    produtoId: '',
    direcao: 'entrada',
    quantidade: '',
    motivo: '',
    data: new Date().toISOString().slice(0, 10),
    loteId: '',
  }
}

interface AjusteEstoqueDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  empresaId: string
  onSubmit: (payload: AjustarEstoqueInput) => void
  isPending: boolean
}

export function AjusteEstoqueDialog({
  open,
  onOpenChange,
  empresaId,
  onSubmit,
  isPending,
}: AjusteEstoqueDialogProps): ReactElement {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyDefaults(),
  })

  useEffect(() => {
    if (open) reset(emptyDefaults())
  }, [open, reset])

  function onValid(values: FormValues): void {
    const magnitude = Math.abs(Number(values.quantidade))
    onSubmit({
      empresaId,
      produtoId: values.produtoId.trim(),
      delta: values.direcao === 'saida' ? -magnitude : magnitude,
      motivo: values.motivo.trim(),
      data: new Date(values.data).toISOString(),
      loteId: values.loteId.trim() || null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajuste de estoque</DialogTitle>
          <DialogDescription>Correção manual de saldo com motivo registrado.</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            void handleSubmit(onValid)(e)
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ajuste-produto">Produto</Label>
              <Input id="ajuste-produto" {...register('produtoId')} />
              {errors.produtoId && (
                <p className="text-xs text-destructive">{errors.produtoId.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ajuste-lote">Lote</Label>
              <Input id="ajuste-lote" placeholder="Opcional" {...register('loteId')} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ajuste-direcao">Tipo</Label>
              <Controller
                control={control}
                name="direcao"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="ajuste-direcao" aria-label="Tipo">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada (+)</SelectItem>
                      <SelectItem value="saida">Saída (-)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ajuste-quantidade">Quantidade</Label>
              <Input id="ajuste-quantidade" inputMode="decimal" {...register('quantidade')} />
              {errors.quantidade && (
                <p className="text-xs text-destructive">{errors.quantidade.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ajuste-data">Data</Label>
            <Input id="ajuste-data" type="date" {...register('data')} />
            {errors.data && <p className="text-xs text-destructive">{errors.data.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ajuste-motivo">Motivo</Label>
            <Input id="ajuste-motivo" placeholder="Ex.: inventário cíclico" {...register('motivo')} />
            {errors.motivo && <p className="text-xs text-destructive">{errors.motivo.message}</p>}
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
              {isPending ? 'Salvando...' : 'Registrar ajuste'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
