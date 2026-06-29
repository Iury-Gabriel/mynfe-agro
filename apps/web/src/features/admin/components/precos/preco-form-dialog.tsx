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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useClientes } from '@/features/admin/api/clientes-api'
import { useProdutos } from '@/features/admin/api/produtos-api'

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
  const { data: clientesData } = useClientes({ perPage: 100 })
  const clientes = clientesData?.clientes ?? []
  const { data: produtosData } = useProdutos({ perPage: 100 })
  const produtos = produtosData?.produtos ?? []

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
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

  const clienteId = watch('clienteId')
  const produtoId = watch('produtoId')

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
              <Select
                name="clienteId"
                value={clienteId}
                onValueChange={(v) => setValue('clienteId', v, { shouldValidate: true })}
              >
                <SelectTrigger id="preco-cliente" aria-label="Cliente">
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.length === 0 ? (
                    <SelectItem value="__empty" disabled>
                      Nenhum cliente cadastrado
                    </SelectItem>
                  ) : (
                    clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.razaoSocialNome}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.clienteId && (
                <p className="text-xs text-destructive">{errors.clienteId.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="preco-produto">Produto</Label>
              <Select
                name="produtoId"
                value={produtoId}
                onValueChange={(v) => setValue('produtoId', v, { shouldValidate: true })}
              >
                <SelectTrigger id="preco-produto" aria-label="Produto">
                  <SelectValue placeholder="Selecione o produto" />
                </SelectTrigger>
                <SelectContent>
                  {produtos.length === 0 ? (
                    <SelectItem value="__empty" disabled>
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
