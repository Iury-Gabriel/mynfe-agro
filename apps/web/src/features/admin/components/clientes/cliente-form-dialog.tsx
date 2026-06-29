import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import type { Cliente, CreateClienteInput, IndicadorIe, TipoPessoaCliente } from '@/features/admin/api/clientes-api'
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
import { INDICADORES_IE, TIPOS_PESSOA_CLIENTE } from '@/features/admin/api/clientes-api'

const TIPO_LABELS: Record<TipoPessoaCliente, string> = {
  PJ: 'Pessoa Jurídica',
  PF: 'Pessoa Física',
}

const INDICADOR_IE_LABELS: Record<IndicadorIe, string> = {
  '1': '1 - Contribuinte ICMS',
  '2': '2 - Isento de IE',
  '9': '9 - Não contribuinte',
}

const clienteSchema = z.object({
  tipoPessoa: z.enum(TIPOS_PESSOA_CLIENTE),
  razaoSocialNome: z.string().min(1, 'Nome / razão social obrigatório').max(200),
  cnpjCpf: z.string().min(11, 'Mínimo 11 dígitos').max(18, 'Máximo 18 caracteres'),
  indicadorIe: z.enum(INDICADORES_IE),
  contribuinteIcms: z.boolean(),
  inscricaoEstadual: z.string().max(30),
  enderecoLogradouro: z.string().max(200),
  enderecoNumero: z.string().max(20),
  enderecoBairro: z.string().max(100),
  enderecoCep: z.string().max(9),
  municipio: z.string().max(100),
  uf: z.string().max(2),
  email: z.string().max(200).refine((v) => v === '' || /.+@.+\..+/.test(v), {
    message: 'E-mail inválido',
  }),
  telefone: z.string().max(30),
})

type ClienteFormValues = z.infer<typeof clienteSchema>

function emptyDefaults(): ClienteFormValues {
  return {
    tipoPessoa: 'PJ',
    razaoSocialNome: '',
    cnpjCpf: '',
    indicadorIe: '9',
    contribuinteIcms: false,
    inscricaoEstadual: '',
    enderecoLogradouro: '',
    enderecoNumero: '',
    enderecoBairro: '',
    enderecoCep: '',
    municipio: '',
    uf: '',
    email: '',
    telefone: '',
  }
}

function fromCliente(cliente: Cliente): ClienteFormValues {
  return {
    tipoPessoa: cliente.tipoPessoa,
    razaoSocialNome: cliente.razaoSocialNome,
    cnpjCpf: cliente.cnpjCpf,
    indicadorIe: cliente.indicadorIe,
    contribuinteIcms: cliente.contribuinteIcms,
    inscricaoEstadual: cliente.inscricaoEstadual ?? '',
    enderecoLogradouro: cliente.enderecoLogradouro ?? '',
    enderecoNumero: cliente.enderecoNumero ?? '',
    enderecoBairro: cliente.enderecoBairro ?? '',
    enderecoCep: cliente.enderecoCep ?? '',
    municipio: cliente.municipio ?? '',
    uf: cliente.uf ?? '',
    email: cliente.email ?? '',
    telefone: cliente.telefone ?? '',
  }
}

function toClientePayload(values: ClienteFormValues): CreateClienteInput {
  return {
    tipoPessoa: values.tipoPessoa,
    razaoSocialNome: values.razaoSocialNome.trim(),
    cnpjCpf: values.cnpjCpf.trim(),
    indicadorIe: values.indicadorIe,
    contribuinteIcms: values.contribuinteIcms,
    inscricaoEstadual: values.inscricaoEstadual.trim() || null,
    enderecoLogradouro: values.enderecoLogradouro.trim() || null,
    enderecoNumero: values.enderecoNumero.trim() || null,
    enderecoBairro: values.enderecoBairro.trim() || null,
    enderecoCep: values.enderecoCep.trim() || null,
    municipio: values.municipio.trim() || null,
    uf: values.uf.trim().toUpperCase() || null,
    email: values.email.trim() || null,
    telefone: values.telefone.trim() || null,
  }
}

interface ClienteFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cliente: Cliente | null
  onSubmit: (payload: CreateClienteInput) => void
  isPending: boolean
}

export function ClienteFormDialog({
  open,
  onOpenChange,
  cliente,
  onSubmit,
  isPending,
}: ClienteFormDialogProps): ReactElement {
  const isEdit = cliente !== null

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: emptyDefaults(),
  })

  useEffect(() => {
    if (open) {
      reset(cliente ? fromCliente(cliente) : emptyDefaults())
    }
  }, [open, cliente, reset])

  const tipoPessoa = watch('tipoPessoa')
  const indicadorIe = watch('indicadorIe')
  const contribuinteIcms = watch('contribuinteIcms')

  function onValid(values: ClienteFormValues): void {
    onSubmit(toClientePayload(values))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar cliente' : 'Novo cliente'}</DialogTitle>
          <DialogDescription>Dados cadastrais e fiscais do cliente.</DialogDescription>
        </DialogHeader>

        <form
          noValidate
          onSubmit={(e) => {
            void handleSubmit(onValid)(e)
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cliente-tipo">Tipo de pessoa</Label>
              <Select
                name="tipoPessoa"
                value={tipoPessoa}
                onValueChange={(v) =>
                  setValue('tipoPessoa', v as TipoPessoaCliente, { shouldValidate: true })
                }
              >
                <SelectTrigger id="cliente-tipo" aria-label="Tipo de pessoa">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_PESSOA_CLIENTE.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {TIPO_LABELS[tipo]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cliente-indicador">Indicador IE</Label>
              <Select
                name="indicadorIe"
                value={indicadorIe}
                onValueChange={(v) =>
                  setValue('indicadorIe', v as IndicadorIe, { shouldValidate: true })
                }
              >
                <SelectTrigger id="cliente-indicador" aria-label="Indicador IE">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INDICADORES_IE.map((ind) => (
                    <SelectItem key={ind} value={ind}>
                      {INDICADOR_IE_LABELS[ind]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cliente-nome">Razão social / Nome</Label>
            <Input id="cliente-nome" {...register('razaoSocialNome')} />
            {errors.razaoSocialNome && (
              <p className="text-xs text-destructive">{errors.razaoSocialNome.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cliente-doc">CNPJ / CPF</Label>
              <Input id="cliente-doc" {...register('cnpjCpf')} />
              {errors.cnpjCpf && (
                <p className="text-xs text-destructive">{errors.cnpjCpf.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cliente-ie">Inscrição estadual</Label>
              <Input id="cliente-ie" {...register('inscricaoEstadual')} />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              aria-label="Contribuinte ICMS"
              className="h-4 w-4 rounded border-border"
              checked={contribuinteIcms}
              onChange={(e) =>
                setValue('contribuinteIcms', e.target.checked, { shouldValidate: true })
              }
            />
            Contribuinte ICMS
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cliente-email">E-mail</Label>
              <Input id="cliente-email" type="email" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cliente-telefone">Telefone</Label>
              <Input id="cliente-telefone" {...register('telefone')} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cliente-logradouro">Logradouro</Label>
              <Input id="cliente-logradouro" {...register('enderecoLogradouro')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cliente-numero">Número</Label>
              <Input id="cliente-numero" {...register('enderecoNumero')} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cliente-bairro">Bairro</Label>
              <Input id="cliente-bairro" {...register('enderecoBairro')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cliente-cep">CEP</Label>
              <Input id="cliente-cep" {...register('enderecoCep')} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cliente-municipio">Município</Label>
              <Input id="cliente-municipio" {...register('municipio')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cliente-uf">UF</Label>
              <Input id="cliente-uf" maxLength={2} {...register('uf')} />
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
              {isPending ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar cliente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
