import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import type { CreateCustoProducaoInput } from '@/features/admin/api/custos-producao-api'
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
import { CUSTO_PRODUCAO_TIPOS } from '@/features/admin/api/custos-producao-api'

const TIPO_LABELS: Record<(typeof CUSTO_PRODUCAO_TIPOS)[number], string> = {
  insumo: 'Insumo',
  mao_de_obra: 'Mão de obra',
  maquinario: 'Maquinário',
  outro: 'Outro',
}

const custoSchema = z.object({
  safraId: z.string().max(60),
  areaId: z.string().max(60),
  tipo: z.enum(CUSTO_PRODUCAO_TIPOS),
  descricao: z.string().min(1, 'Descrição obrigatória').max(200),
  valor: z.string().min(1, 'Valor obrigatório').max(20),
  data: z.string().min(1, 'Data obrigatória').max(10),
})

type CustoFormValues = z.infer<typeof custoSchema>

function emptyDefaults(): CustoFormValues {
  return {
    safraId: '',
    areaId: '',
    tipo: 'insumo',
    descricao: '',
    valor: '',
    data: '',
  }
}

export function toCustoPayload(values: CustoFormValues): CreateCustoProducaoInput {
  return {
    safraId: values.safraId.trim() || null,
    areaId: values.areaId.trim() || null,
    tipo: values.tipo,
    descricao: values.descricao.trim(),
    valor: Number(values.valor.trim()),
    data: values.data.trim(),
  }
}

interface CustoProducaoFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: CreateCustoProducaoInput) => void
  isPending: boolean
}

export function CustoProducaoFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: CustoProducaoFormDialogProps): ReactElement {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CustoFormValues>({
    resolver: zodResolver(custoSchema),
    defaultValues: emptyDefaults(),
  })

  useEffect(() => {
    if (open) {
      reset(emptyDefaults())
    }
  }, [open, reset])

  function onValid(values: CustoFormValues): void {
    onSubmit(toCustoPayload(values))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo custo</DialogTitle>
          <DialogDescription>Custo de produção vinculado a safra ou área.</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            void handleSubmit(onValid)(e)
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="custo-tipo">Tipo</Label>
              <Controller
                control={control}
                name="tipo"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="custo-tipo" aria-label="Tipo">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CUSTO_PRODUCAO_TIPOS.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {TIPO_LABELS[tipo]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="custo-data">Data</Label>
              <Input id="custo-data" type="date" {...register('data')} />
              {errors.data && <p className="text-xs text-destructive">{errors.data.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="custo-descricao">Descrição</Label>
            <Input id="custo-descricao" {...register('descricao')} />
            {errors.descricao && (
              <p className="text-xs text-destructive">{errors.descricao.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="custo-valor">Valor</Label>
              <Input id="custo-valor" inputMode="decimal" {...register('valor')} />
              {errors.valor && <p className="text-xs text-destructive">{errors.valor.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="custo-safra">Safra (opcional)</Label>
              <Input id="custo-safra" {...register('safraId')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="custo-area">Área (opcional)</Label>
            <Input id="custo-area" {...register('areaId')} />
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
              {isPending ? 'Salvando...' : 'Criar custo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
