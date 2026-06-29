import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import type { Area, CreateAreaInput } from '@/features/admin/api/areas-api'
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

const UNIDADES_TAMANHO = ['ha', 'm2', 'alq'] as const
type UnidadeTamanho = (typeof UNIDADES_TAMANHO)[number]

const UNIDADE_LABELS: Record<UnidadeTamanho, string> = {
  ha: 'Hectares (ha)',
  m2: 'Metros² (m²)',
  alq: 'Alqueires (alq)',
}

const areaSchema = z.object({
  fazendaId: z.string().min(1, 'Fazenda obrigatória').max(60),
  identificacao: z.string().min(1, 'Identificação obrigatória').max(200),
  tamanho: z.string().max(20),
  unidadeTamanho: z.enum(UNIDADES_TAMANHO),
  rotulo: z.string().max(100),
})

type AreaFormValues = z.infer<typeof areaSchema>

function emptyDefaults(): AreaFormValues {
  return {
    fazendaId: '',
    identificacao: '',
    tamanho: '',
    unidadeTamanho: 'ha',
    rotulo: '',
  }
}

function normalizeUnidade(value: string | null): UnidadeTamanho {
  return (UNIDADES_TAMANHO as readonly string[]).includes(value ?? '')
    ? (value as UnidadeTamanho)
    : 'ha'
}

function fromArea(area: Area): AreaFormValues {
  return {
    fazendaId: area.fazendaId,
    identificacao: area.identificacao,
    tamanho: area.tamanho != null ? String(area.tamanho) : '',
    unidadeTamanho: normalizeUnidade(area.unidadeTamanho),
    rotulo: area.rotulo ?? '',
  }
}

function toAreaPayload(values: AreaFormValues): CreateAreaInput {
  const tamanho = values.tamanho.trim()
  return {
    fazendaId: values.fazendaId.trim(),
    identificacao: values.identificacao.trim(),
    tamanho: tamanho === '' ? null : Number(tamanho),
    unidadeTamanho: values.unidadeTamanho,
    rotulo: values.rotulo.trim() || null,
  }
}

interface AreaFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  area: Area | null
  onSubmit: (payload: CreateAreaInput) => void
  isPending: boolean
}

export function AreaFormDialog({
  open,
  onOpenChange,
  area,
  onSubmit,
  isPending,
}: AreaFormDialogProps): ReactElement {
  const isEdit = area !== null

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AreaFormValues>({
    resolver: zodResolver(areaSchema),
    defaultValues: emptyDefaults(),
  })

  useEffect(() => {
    if (open) {
      reset(area ? fromArea(area) : emptyDefaults())
    }
  }, [open, area, reset])

  const unidadeTamanho = watch('unidadeTamanho')

  function onValid(values: AreaFormValues): void {
    onSubmit(toAreaPayload(values))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar área' : 'Nova área'}</DialogTitle>
          <DialogDescription>Talhão ou área produtiva de uma fazenda.</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            void handleSubmit(onValid)(e)
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="area-fazenda">Fazenda</Label>
            <Input id="area-fazenda" disabled={isEdit} {...register('fazendaId')} />
            {errors.fazendaId && (
              <p className="text-xs text-destructive">{errors.fazendaId.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="area-identificacao">Identificação</Label>
            <Input id="area-identificacao" {...register('identificacao')} />
            {errors.identificacao && (
              <p className="text-xs text-destructive">{errors.identificacao.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="area-tamanho">Tamanho</Label>
              <Input id="area-tamanho" inputMode="decimal" {...register('tamanho')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="area-unidade">Unidade</Label>
              <Select
                name="unidadeTamanho"
                value={unidadeTamanho}
                onValueChange={(v) =>
                  setValue('unidadeTamanho', v as UnidadeTamanho, { shouldValidate: true })
                }
              >
                <SelectTrigger id="area-unidade" aria-label="Unidade">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIDADES_TAMANHO.map((u) => (
                    <SelectItem key={u} value={u}>
                      {UNIDADE_LABELS[u]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="area-rotulo">Rótulo</Label>
            <Input id="area-rotulo" {...register('rotulo')} />
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
              {isPending ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar área'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
