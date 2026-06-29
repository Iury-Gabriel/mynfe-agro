import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import type { CreateFazendaInput, Fazenda } from '@/features/admin/api/fazendas-api'
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
import { useEmpresas } from '@/features/admin/api/empresas-api'

const fazendaSchema = z.object({
  empresaId: z.string().min(1, 'Empresa obrigatória').max(60),
  nome: z.string().min(1, 'Nome obrigatório').max(200),
  enderecoLogradouro: z.string().max(200),
  enderecoNumero: z.string().max(20),
  enderecoBairro: z.string().max(100),
  enderecoCep: z.string().max(9),
  municipio: z.string().max(100),
  uf: z.string().max(2),
  car: z.string().max(100),
  nirfIncra: z.string().max(50),
  areaTotalHa: z.string().max(20),
})

type FazendaFormValues = z.infer<typeof fazendaSchema>

function emptyDefaults(): FazendaFormValues {
  return {
    empresaId: '',
    nome: '',
    enderecoLogradouro: '',
    enderecoNumero: '',
    enderecoBairro: '',
    enderecoCep: '',
    municipio: '',
    uf: '',
    car: '',
    nirfIncra: '',
    areaTotalHa: '',
  }
}

function fromFazenda(fazenda: Fazenda): FazendaFormValues {
  return {
    empresaId: fazenda.empresaId,
    nome: fazenda.nome,
    enderecoLogradouro: fazenda.enderecoLogradouro ?? '',
    enderecoNumero: fazenda.enderecoNumero ?? '',
    enderecoBairro: fazenda.enderecoBairro ?? '',
    enderecoCep: fazenda.enderecoCep ?? '',
    municipio: fazenda.municipio ?? '',
    uf: fazenda.uf ?? '',
    car: fazenda.car ?? '',
    nirfIncra: fazenda.nirfIncra ?? '',
    areaTotalHa: fazenda.areaTotalHa != null ? String(fazenda.areaTotalHa) : '',
  }
}

function toFazendaPayload(values: FazendaFormValues): CreateFazendaInput {
  const area = values.areaTotalHa.trim()
  return {
    empresaId: values.empresaId.trim(),
    nome: values.nome.trim(),
    enderecoLogradouro: values.enderecoLogradouro.trim() || null,
    enderecoNumero: values.enderecoNumero.trim() || null,
    enderecoBairro: values.enderecoBairro.trim() || null,
    enderecoCep: values.enderecoCep.trim() || null,
    municipio: values.municipio.trim() || null,
    uf: values.uf.trim().toUpperCase() || null,
    car: values.car.trim() || null,
    nirfIncra: values.nirfIncra.trim() || null,
    areaTotalHa: area === '' ? null : Number(area),
  }
}

interface FazendaFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fazenda: Fazenda | null
  onSubmit: (payload: CreateFazendaInput) => void
  isPending: boolean
}

export function FazendaFormDialog({
  open,
  onOpenChange,
  fazenda,
  onSubmit,
  isPending,
}: FazendaFormDialogProps): ReactElement {
  const isEdit = fazenda !== null

  const { data: empresasData } = useEmpresas({ perPage: 100 })
  const empresas = empresasData?.empresas ?? []

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FazendaFormValues>({
    resolver: zodResolver(fazendaSchema),
    defaultValues: emptyDefaults(),
  })

  useEffect(() => {
    if (open) {
      reset(fazenda ? fromFazenda(fazenda) : emptyDefaults())
    }
  }, [open, fazenda, reset])

  const empresaId = watch('empresaId')

  function onValid(values: FazendaFormValues): void {
    onSubmit(toFazendaPayload(values))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar fazenda' : 'Nova fazenda'}</DialogTitle>
          <DialogDescription>Dados cadastrais e fundiários da fazenda.</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            void handleSubmit(onValid)(e)
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fazenda-empresa">Empresa</Label>
              <Select
                name="empresaId"
                value={empresaId}
                disabled={isEdit}
                onValueChange={(v) => setValue('empresaId', v, { shouldValidate: true })}
              >
                <SelectTrigger id="fazenda-empresa" aria-label="Empresa">
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {empresas.length === 0 ? (
                    <SelectItem value="__empty" disabled>
                      Nenhuma empresa cadastrada
                    </SelectItem>
                  ) : (
                    empresas.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.nomeFantasia ?? e.razaoSocial}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.empresaId && (
                <p className="text-xs text-destructive">{errors.empresaId.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fazenda-nome">Nome</Label>
              <Input id="fazenda-nome" {...register('nome')} />
              {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fazenda-logradouro">Logradouro</Label>
              <Input id="fazenda-logradouro" {...register('enderecoLogradouro')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fazenda-numero">Número</Label>
              <Input id="fazenda-numero" {...register('enderecoNumero')} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fazenda-bairro">Bairro</Label>
              <Input id="fazenda-bairro" {...register('enderecoBairro')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fazenda-cep">CEP</Label>
              <Input id="fazenda-cep" {...register('enderecoCep')} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fazenda-municipio">Município</Label>
              <Input id="fazenda-municipio" {...register('municipio')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fazenda-uf">UF</Label>
              <Input id="fazenda-uf" maxLength={2} {...register('uf')} />
              {errors.uf && <p className="text-xs text-destructive">{errors.uf.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fazenda-car">CAR</Label>
              <Input id="fazenda-car" {...register('car')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fazenda-nirf">NIRF / INCRA</Label>
              <Input id="fazenda-nirf" {...register('nirfIncra')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fazenda-area">Área total (ha)</Label>
            <Input id="fazenda-area" inputMode="decimal" {...register('areaTotalHa')} />
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
              {isPending ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar fazenda'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
