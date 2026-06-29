import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import type { RegistrarColheitaInput } from '@/features/estoque/api/colheitas-api'
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
import { useProdutos } from '@/features/admin/api/produtos-api'
import { useSafras } from '@/features/admin/api/safras-api'

const NONE = '__none__'

const schema = z.object({
  produtoId: z.string().min(1, 'Produto obrigatório').max(60),
  quantidade: z.string().min(1, 'Quantidade obrigatória'),
  data: z.string().min(1, 'Data obrigatória'),
  safraId: z.string().max(60),
  areaId: z.string().max(60),
  codigoLote: z.string().max(120),
  validade: z.string().max(20),
})

type FormValues = z.infer<typeof schema>

function emptyDefaults(): FormValues {
  return {
    produtoId: '',
    quantidade: '',
    data: new Date().toISOString().slice(0, 10),
    safraId: '',
    areaId: '',
    codigoLote: '',
    validade: '',
  }
}

interface RegistrarColheitaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  empresaId: string
  onSubmit: (payload: RegistrarColheitaInput) => void
  isPending: boolean
}

export function RegistrarColheitaDialog({
  open,
  onOpenChange,
  empresaId,
  onSubmit,
  isPending,
}: RegistrarColheitaDialogProps): ReactElement {
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

  const produtos = useProdutos().data?.produtos ?? []
  const safras = useSafras().data?.safras ?? []
  const areas = useAreas().data?.areas ?? []

  useEffect(() => {
    if (open) reset(emptyDefaults())
  }, [open, reset])

  function onValid(values: FormValues): void {
    onSubmit({
      empresaId,
      produtoId: values.produtoId.trim(),
      quantidade: Number(values.quantidade),
      data: new Date(values.data).toISOString(),
      safraId: values.safraId.trim() || null,
      areaId: values.areaId.trim() || null,
      codigoLote: values.codigoLote.trim() || null,
      validade: values.validade.trim() ? new Date(values.validade).toISOString() : null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar colheita</DialogTitle>
          <DialogDescription>Cria a colheita e o lote de origem correspondente.</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            void handleSubmit(onValid)(e)
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="colheita-produto">Produto</Label>
              <Controller
                control={control}
                name="produtoId"
                render={({ field }) => (
                  <Select
                    name="produtoId"
                    value={field.value}
                    onValueChange={(v) => field.onChange(v)}
                  >
                    <SelectTrigger id="colheita-produto" aria-label="Produto" className="h-11">
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {produtos.length === 0 ? (
                        <SelectItem value={NONE} disabled>
                          Nenhum produto cadastrado
                        </SelectItem>
                      ) : (
                        produtos.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.descricao}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.produtoId && (
                <p className="text-xs text-destructive">{errors.produtoId.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="colheita-quantidade">Quantidade</Label>
              <Input
                id="colheita-quantidade"
                className="h-11"
                inputMode="decimal"
                {...register('quantidade')}
              />
              {errors.quantidade && (
                <p className="text-xs text-destructive">{errors.quantidade.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="colheita-data">Data</Label>
              <Input id="colheita-data" className="h-11" type="date" {...register('data')} />
              {errors.data && <p className="text-xs text-destructive">{errors.data.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="colheita-validade">Validade</Label>
              <Input
                id="colheita-validade"
                className="h-11"
                type="date"
                {...register('validade')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="colheita-safra">Safra</Label>
              <Controller
                control={control}
                name="safraId"
                render={({ field }) => (
                  <Select
                    name="safraId"
                    value={field.value || NONE}
                    onValueChange={(v) => field.onChange(v === NONE ? '' : v)}
                  >
                    <SelectTrigger id="colheita-safra" aria-label="Safra" className="h-11">
                      <SelectValue placeholder="Nenhuma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Nenhuma</SelectItem>
                      {safras.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.cultura}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="colheita-area">Área</Label>
              <Controller
                control={control}
                name="areaId"
                render={({ field }) => (
                  <Select
                    name="areaId"
                    value={field.value || NONE}
                    onValueChange={(v) => field.onChange(v === NONE ? '' : v)}
                  >
                    <SelectTrigger id="colheita-area" aria-label="Área" className="h-11">
                      <SelectValue placeholder="Nenhuma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Nenhuma</SelectItem>
                      {areas.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.identificacao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="colheita-codigo">Código do lote</Label>
            <Input
              id="colheita-codigo"
              className="h-11"
              placeholder="Gerado automaticamente se vazio"
              {...register('codigoLote')}
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
              {isPending ? 'Salvando...' : 'Registrar colheita'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
