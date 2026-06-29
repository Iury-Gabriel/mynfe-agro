import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import type { RegistrarEmbalagemInput } from '@/features/estoque/api/colheitas-api'
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
import { useProdutos } from '@/features/admin/api/produtos-api'

const NONE = '__none__'

const schema = z.object({
  produtoId: z.string().min(1, 'Produto obrigatório').max(60),
  quantidade: z.string().min(1, 'Quantidade obrigatória'),
  data: z.string().min(1, 'Data obrigatória'),
  codigoLote: z.string().max(120),
  validade: z.string().max(20),
})

type FormValues = z.infer<typeof schema>

function emptyDefaults(): FormValues {
  return {
    produtoId: '',
    quantidade: '',
    data: new Date().toISOString().slice(0, 10),
    codigoLote: '',
    validade: '',
  }
}

interface RegistrarEmbalagemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  empresaId: string
  onSubmit: (payload: RegistrarEmbalagemInput) => void
  isPending: boolean
}

export function RegistrarEmbalagemDialog({
  open,
  onOpenChange,
  empresaId,
  onSubmit,
  isPending,
}: RegistrarEmbalagemDialogProps): ReactElement {
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

  useEffect(() => {
    if (open) reset(emptyDefaults())
  }, [open, reset])

  function onValid(values: FormValues): void {
    onSubmit({
      empresaId,
      produtoId: values.produtoId.trim(),
      quantidade: Number(values.quantidade),
      data: new Date(values.data).toISOString(),
      codigoLote: values.codigoLote.trim() || null,
      validade: values.validade.trim() ? new Date(values.validade).toISOString() : null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar embalagem</DialogTitle>
          <DialogDescription>Cria um lote embalado e dá entrada no estoque.</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            void handleSubmit(onValid)(e)
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="embalagem-produto">Produto</Label>
              <Controller
                control={control}
                name="produtoId"
                render={({ field }) => (
                  <Select
                    name="produtoId"
                    value={field.value}
                    onValueChange={(v) => field.onChange(v)}
                  >
                    <SelectTrigger id="embalagem-produto" aria-label="Produto" className="h-11">
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
              <Label htmlFor="embalagem-quantidade">Quantidade</Label>
              <Input
                id="embalagem-quantidade"
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
              <Label htmlFor="embalagem-data">Data</Label>
              <Input id="embalagem-data" className="h-11" type="date" {...register('data')} />
              {errors.data && <p className="text-xs text-destructive">{errors.data.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="embalagem-validade">Validade</Label>
              <Input
                id="embalagem-validade"
                className="h-11"
                type="date"
                {...register('validade')}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="embalagem-codigo">Código do lote</Label>
            <Input
              id="embalagem-codigo"
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
              {isPending ? 'Salvando...' : 'Registrar embalagem'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
