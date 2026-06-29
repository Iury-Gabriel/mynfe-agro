import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import type { CreateAtividadeCampoInput } from '@/features/admin/api/atividades-campo-api'
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
import { useAreas } from '@/features/admin/api/areas-api'
import { ATIVIDADE_CAMPO_TIPOS } from '@/features/admin/api/atividades-campo-api'
import { useSafras } from '@/features/admin/api/safras-api'

const NONE_VALUE = '__none'

const TIPO_LABELS: Record<(typeof ATIVIDADE_CAMPO_TIPOS)[number], string> = {
  plantio: 'Plantio',
  irrigacao: 'Irrigação',
  pulverizacao: 'Pulverização',
  adubacao: 'Adubação',
  outro: 'Outro',
}

const atividadeSchema = z.object({
  safraId: z.string().max(60),
  areaId: z.string().max(60),
  tipo: z.enum(ATIVIDADE_CAMPO_TIPOS),
  data: z.string().min(1, 'Data obrigatória').max(10),
  responsavelUsuarioId: z.string().max(60),
  observacoes: z.string().max(1000),
})

type AtividadeFormValues = z.infer<typeof atividadeSchema>

function emptyDefaults(): AtividadeFormValues {
  return {
    safraId: '',
    areaId: '',
    tipo: 'plantio',
    data: '',
    responsavelUsuarioId: '',
    observacoes: '',
  }
}

export function toAtividadePayload(values: AtividadeFormValues): CreateAtividadeCampoInput {
  return {
    safraId: values.safraId.trim() || null,
    areaId: values.areaId.trim() || null,
    tipo: values.tipo,
    data: values.data.trim(),
    responsavelUsuarioId: values.responsavelUsuarioId.trim() || null,
    observacoes: values.observacoes.trim() || null,
  }
}

interface AtividadeCampoFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: CreateAtividadeCampoInput) => void
  isPending: boolean
}

export function AtividadeCampoFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: AtividadeCampoFormDialogProps): ReactElement {
  const { data: safrasData } = useSafras({ perPage: 100 })
  const safras = safrasData?.safras ?? []
  const { data: areasData } = useAreas({ perPage: 100 })
  const areas = areasData?.areas ?? []

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AtividadeFormValues>({
    resolver: zodResolver(atividadeSchema),
    defaultValues: emptyDefaults(),
  })

  useEffect(() => {
    if (open) {
      reset(emptyDefaults())
    }
  }, [open, reset])

  const safraId = watch('safraId')
  const areaId = watch('areaId')

  function onValid(values: AtividadeFormValues): void {
    onSubmit(toAtividadePayload(values))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova atividade</DialogTitle>
          <DialogDescription>Registro de operação de campo (plantio, irrigação…).</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            void handleSubmit(onValid)(e)
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="atividade-tipo">Tipo</Label>
              <Controller
                control={control}
                name="tipo"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="atividade-tipo" aria-label="Tipo">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ATIVIDADE_CAMPO_TIPOS.map((tipo) => (
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
              <Label htmlFor="atividade-data">Data</Label>
              <Input id="atividade-data" type="date" {...register('data')} />
              {errors.data && <p className="text-xs text-destructive">{errors.data.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="atividade-safra">Safra (opcional)</Label>
              <Select
                name="safraId"
                value={safraId === '' ? NONE_VALUE : safraId}
                onValueChange={(v) =>
                  setValue('safraId', v === NONE_VALUE ? '' : v, { shouldValidate: true })
                }
              >
                <SelectTrigger id="atividade-safra" aria-label="Safra">
                  <SelectValue placeholder="Nenhuma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Nenhuma</SelectItem>
                  {safras.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.cultura}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="atividade-area">Área (opcional)</Label>
              <Select
                name="areaId"
                value={areaId === '' ? NONE_VALUE : areaId}
                onValueChange={(v) =>
                  setValue('areaId', v === NONE_VALUE ? '' : v, { shouldValidate: true })
                }
              >
                <SelectTrigger id="atividade-area" aria-label="Área">
                  <SelectValue placeholder="Nenhuma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Nenhuma</SelectItem>
                  {areas.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.identificacao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="atividade-responsavel">Responsável (opcional)</Label>
            <Input id="atividade-responsavel" {...register('responsavelUsuarioId')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="atividade-observacoes">Observações</Label>
            <textarea
              id="atividade-observacoes"
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              {...register('observacoes')}
            />
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
              {isPending ? 'Salvando...' : 'Criar atividade'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
