import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { useEffect } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'

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

export interface VendaFormItem {
  produtoId: string
  loteId?: string | null
  quantidade: number
  precoUnitario?: number | null
}

export interface VendaFormPayload {
  clienteId: string
  data: string
  observacoes: string | null
  confirmar: boolean
  itens: VendaFormItem[]
}

const itemSchema = z.object({
  produtoId: z.string().min(1, 'Produto obrigatório').max(60),
  loteId: z.string().max(60),
  quantidade: z.string().min(1, 'Qtd. obrigatória'),
  precoUnitario: z.string().max(20),
})

const schema = z.object({
  clienteId: z.string().min(1, 'Cliente obrigatório').max(60),
  data: z.string().min(1, 'Data obrigatória'),
  observacoes: z.string().max(2000),
  confirmar: z.boolean(),
  itens: z.array(itemSchema).min(1, 'Adicione ao menos um item'),
})

type FormValues = z.infer<typeof schema>

function emptyItem(): FormValues['itens'][number] {
  return { produtoId: '', loteId: '', quantidade: '', precoUnitario: '' }
}

function emptyDefaults(): FormValues {
  return {
    clienteId: '',
    data: new Date().toISOString().slice(0, 10),
    observacoes: '',
    confirmar: false,
    itens: [emptyItem()],
  }
}

interface VendaFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  submitLabel: string
  showConfirmar?: boolean
  onSubmit: (payload: VendaFormPayload) => void
  isPending: boolean
}

export function VendaFormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  showConfirmar = false,
  onSubmit,
  isPending,
}: VendaFormDialogProps): ReactElement {
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

  const { fields, append, remove } = useFieldArray({ control, name: 'itens' })

  useEffect(() => {
    if (open) reset(emptyDefaults())
  }, [open, reset])

  function onValid(values: FormValues): void {
    onSubmit({
      clienteId: values.clienteId.trim(),
      data: new Date(values.data).toISOString(),
      observacoes: values.observacoes.trim() || null,
      confirmar: values.confirmar,
      itens: values.itens.map((item) => ({
        produtoId: item.produtoId.trim(),
        loteId: item.loteId.trim() || null,
        quantidade: Number(item.quantidade),
        precoUnitario: item.precoUnitario.trim() ? Number(item.precoUnitario) : null,
      })),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            void handleSubmit(onValid)(e)
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="venda-cliente">Cliente</Label>
              <Input id="venda-cliente" {...register('clienteId')} />
              {errors.clienteId && (
                <p className="text-xs text-destructive">{errors.clienteId.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="venda-data">Data</Label>
              <Input id="venda-data" type="date" {...register('data')} />
              {errors.data && <p className="text-xs text-destructive">{errors.data.message}</p>}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Itens</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append(emptyItem())}
              >
                <Plus className="size-4" /> Adicionar item
              </Button>
            </div>

            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-1 gap-3 rounded-xl border border-border/60 p-3 sm:grid-cols-12"
              >
                <div className="space-y-1.5 sm:col-span-4">
                  <Label htmlFor={`venda-item-produto-${index}`}>Produto</Label>
                  <Input
                    id={`venda-item-produto-${index}`}
                    {...register(`itens.${index}.produtoId`)}
                  />
                  {errors.itens?.[index]?.produtoId && (
                    <p className="text-xs text-destructive">
                      {errors.itens[index]?.produtoId?.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5 sm:col-span-3">
                  <Label htmlFor={`venda-item-lote-${index}`}>Lote</Label>
                  <Input
                    id={`venda-item-lote-${index}`}
                    placeholder="Opcional"
                    {...register(`itens.${index}.loteId`)}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor={`venda-item-qtd-${index}`}>Qtd.</Label>
                  <Input
                    id={`venda-item-qtd-${index}`}
                    inputMode="decimal"
                    {...register(`itens.${index}.quantidade`)}
                  />
                  {errors.itens?.[index]?.quantidade && (
                    <p className="text-xs text-destructive">
                      {errors.itens[index]?.quantidade?.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor={`venda-item-preco-${index}`}>Preço</Label>
                  <Input
                    id={`venda-item-preco-${index}`}
                    inputMode="decimal"
                    placeholder="Auto"
                    {...register(`itens.${index}.precoUnitario`)}
                  />
                </div>
                <div className="flex items-end sm:col-span-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remover item"
                    disabled={fields.length <= 1}
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="venda-observacoes">Observações</Label>
            <Input id="venda-observacoes" placeholder="Opcional" {...register('observacoes')} />
          </div>

          {showConfirmar && (
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" className="size-4" {...register('confirmar')} />
              Confirmar pedido ao criar (baixa estoque)
            </label>
          )}

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
              {isPending ? 'Salvando...' : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
