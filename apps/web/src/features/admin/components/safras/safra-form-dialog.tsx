import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import type { CreateSafraInput, Safra } from '@/features/admin/api/safras-api'
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
import { SAFRA_STATUSES } from '@/features/admin/api/safras-api'

const STATUS_LABELS: Record<(typeof SAFRA_STATUSES)[number], string> = {
  planejado: 'Planejado',
  em_andamento: 'Em andamento',
  colhido: 'Colhido',
}

const safraSchema = z.object({
  areaId: z.string().min(1, 'Área obrigatória').max(60),
  cultura: z.string().min(1, 'Cultura obrigatória').max(120),
  variedade: z.string().max(120),
  dataPlantio: z.string().max(10),
  dataColheitaPrevista: z.string().max(10),
  estimativaProducao: z.string().max(20),
  status: z.enum(SAFRA_STATUSES),
})

type SafraFormValues = z.infer<typeof safraSchema>

function emptyDefaults(): SafraFormValues {
  return {
    areaId: '',
    cultura: '',
    variedade: '',
    dataPlantio: '',
    dataColheitaPrevista: '',
    estimativaProducao: '',
    status: 'planejado',
  }
}

function isoToDateInput(value: string | null): string {
  return value ? value.slice(0, 10) : ''
}

function fromSafra(safra: Safra): SafraFormValues {
  return {
    areaId: safra.areaId,
    cultura: safra.cultura,
    variedade: safra.variedade ?? '',
    dataPlantio: isoToDateInput(safra.dataPlantio),
    dataColheitaPrevista: isoToDateInput(safra.dataColheitaPrevista),
    estimativaProducao: safra.estimativaProducao != null ? String(safra.estimativaProducao) : '',
    status: safra.status,
  }
}

export function toSafraPayload(values: SafraFormValues): CreateSafraInput {
  const estimativa = values.estimativaProducao.trim()
  return {
    areaId: values.areaId.trim(),
    cultura: values.cultura.trim(),
    variedade: values.variedade.trim() || null,
    dataPlantio: values.dataPlantio.trim() || null,
    dataColheitaPrevista: values.dataColheitaPrevista.trim() || null,
    estimativaProducao: estimativa === '' ? null : Number(estimativa),
    status: values.status,
  }
}

interface SafraFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  safra: Safra | null
  onSubmit: (payload: CreateSafraInput) => void
  isPending: boolean
}

export function SafraFormDialog({
  open,
  onOpenChange,
  safra,
  onSubmit,
  isPending,
}: SafraFormDialogProps): ReactElement {
  const isEdit = safra !== null

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<SafraFormValues>({
    resolver: zodResolver(safraSchema),
    defaultValues: emptyDefaults(),
  })

  useEffect(() => {
    if (open) {
      reset(safra ? fromSafra(safra) : emptyDefaults())
    }
  }, [open, safra, reset])

  function onValid(values: SafraFormValues): void {
    onSubmit(toSafraPayload(values))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar safra' : 'Nova safra'}</DialogTitle>
          <DialogDescription>Ciclo de cultivo vinculado a uma área.</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            void handleSubmit(onValid)(e)
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="safra-area">Área</Label>
              <Input id="safra-area" disabled={isEdit} {...register('areaId')} />
              {errors.areaId && <p className="text-xs text-destructive">{errors.areaId.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="safra-cultura">Cultura</Label>
              <Input id="safra-cultura" {...register('cultura')} />
              {errors.cultura && (
                <p className="text-xs text-destructive">{errors.cultura.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="safra-variedade">Variedade</Label>
              <Input id="safra-variedade" {...register('variedade')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="safra-status">Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="safra-status" aria-label="Status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SAFRA_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="safra-plantio">Data de plantio</Label>
              <Input id="safra-plantio" type="date" {...register('dataPlantio')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="safra-colheita">Colheita prevista</Label>
              <Input id="safra-colheita" type="date" {...register('dataColheitaPrevista')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="safra-estimativa">Estimativa de produção</Label>
            <Input id="safra-estimativa" inputMode="decimal" {...register('estimativaProducao')} />
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
              {isPending ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar safra'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
