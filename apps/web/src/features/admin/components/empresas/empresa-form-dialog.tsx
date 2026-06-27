import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import type {
  AmbienteFiscal,
  CreateEmpresaInput,
  Empresa,
  TipoPessoa,
} from '@/features/admin/api/empresas-api'
import type { ReactElement } from 'react'
import type { Path } from 'react-hook-form'

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
import {
  AMBIENTES_FISCAIS,
  TIPOS_PESSOA,
  useCreateEmpresa,
  useUpdateEmpresa,
} from '@/features/admin/api/empresas-api'
import { ApiError } from '@/lib/api-error'

const empresaSchema = z.object({
  tipoPessoa: z.enum(TIPOS_PESSOA),
  razaoSocial: z.string().min(1, 'Razão social obrigatória').max(200),
  nomeFantasia: z.string().max(200),
  cnpjCpf: z
    .string()
    .min(11, 'Mínimo 11 dígitos')
    .max(18, 'Máximo 18 caracteres'),
  inscricaoEstadual: z.string().max(30),
  ieProdutorRural: z.string().max(30),
  regimeTributario: z.string().min(1, 'Regime tributário obrigatório').max(50),
  crt: z.string().min(1, 'CRT obrigatório').max(10),
  ambienteFiscal: z.enum(AMBIENTES_FISCAIS),
  serieNfe: z.string().max(10),
})

type EmpresaFormValues = z.infer<typeof empresaSchema>

const AMBIENTE_LABELS: Record<AmbienteFiscal, string> = {
  homologacao: 'Homologação',
  producao: 'Produção',
}

const TIPO_LABELS: Record<TipoPessoa, string> = {
  PJ: 'Pessoa Jurídica',
  PF: 'Pessoa Física',
}

function emptyDefaults(): EmpresaFormValues {
  return {
    tipoPessoa: 'PJ',
    razaoSocial: '',
    nomeFantasia: '',
    cnpjCpf: '',
    inscricaoEstadual: '',
    ieProdutorRural: '',
    regimeTributario: '',
    crt: '',
    ambienteFiscal: 'homologacao',
    serieNfe: '',
  }
}

function fromEmpresa(empresa: Empresa): EmpresaFormValues {
  return {
    tipoPessoa: empresa.tipoPessoa,
    razaoSocial: empresa.razaoSocial,
    nomeFantasia: empresa.nomeFantasia ?? '',
    cnpjCpf: empresa.cnpjCpf,
    inscricaoEstadual: empresa.inscricaoEstadual ?? '',
    ieProdutorRural: empresa.ieProdutorRural ?? '',
    regimeTributario: empresa.regimeTributario,
    crt: empresa.crt,
    ambienteFiscal: empresa.ambienteFiscal,
    serieNfe: empresa.serieNfe != null ? String(empresa.serieNfe) : '',
  }
}

function toPayload(values: EmpresaFormValues): CreateEmpresaInput {
  const serie = values.serieNfe.trim()
  return {
    tipoPessoa: values.tipoPessoa,
    razaoSocial: values.razaoSocial.trim(),
    nomeFantasia: values.nomeFantasia.trim() || null,
    cnpjCpf: values.cnpjCpf.trim(),
    inscricaoEstadual: values.inscricaoEstadual.trim() || null,
    ieProdutorRural: values.ieProdutorRural.trim() || null,
    regimeTributario: values.regimeTributario.trim(),
    crt: values.crt.trim(),
    ambienteFiscal: values.ambienteFiscal,
    serieNfe: serie === '' ? null : Number(serie),
  }
}

const FIELD_KEYS = new Set<string>(Object.keys(emptyDefaults()))

interface EmpresaFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  empresa: Empresa | null
}

export function EmpresaFormDialog({
  open,
  onOpenChange,
  empresa,
}: EmpresaFormDialogProps): ReactElement {
  const isEdit = empresa !== null
  const createEmpresa = useCreateEmpresa()
  const updateEmpresa = useUpdateEmpresa()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<EmpresaFormValues>({
    resolver: zodResolver(empresaSchema),
    defaultValues: emptyDefaults(),
  })

  useEffect(() => {
    if (open) {
      reset(empresa ? fromEmpresa(empresa) : emptyDefaults())
    }
  }, [open, empresa, reset])

  const tipoPessoa = watch('tipoPessoa')
  const ambienteFiscal = watch('ambienteFiscal')
  const isPending = createEmpresa.isPending || updateEmpresa.isPending

  function applyServerErrors(err: unknown): void {
    if (err instanceof ApiError && err.details.length > 0) {
      for (const detail of err.details) {
        if (FIELD_KEYS.has(detail.path)) {
          setError(detail.path as Path<EmpresaFormValues>, { message: detail.message })
        }
      }
      return
    }
    toast.error('Não foi possível salvar a empresa.')
  }

  function onValid(values: EmpresaFormValues): void {
    const payload = toPayload(values)
    if (isEdit) {
      updateEmpresa.mutate(
        { id: empresa.id, ...payload },
        {
          onSuccess: () => {
            onOpenChange(false)
            toast.success('Empresa atualizada com sucesso.')
          },
          onError: applyServerErrors,
        },
      )
    } else {
      createEmpresa.mutate(payload, {
        onSuccess: () => {
          onOpenChange(false)
          toast.success('Empresa criada com sucesso.')
        },
        onError: applyServerErrors,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar empresa' : 'Nova empresa'}</DialogTitle>
          <DialogDescription>
            Dados cadastrais e fiscais da empresa do tenant.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            void handleSubmit(onValid)(e)
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="empresa-tipo">Tipo de pessoa</Label>
              <Select
                value={tipoPessoa}
                onValueChange={(v) =>
                  setValue('tipoPessoa', v as TipoPessoa, { shouldValidate: true })
                }
              >
                <SelectTrigger id="empresa-tipo" aria-label="Tipo de pessoa">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_PESSOA.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {TIPO_LABELS[tipo]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="empresa-ambiente">Ambiente fiscal</Label>
              <Select
                value={ambienteFiscal}
                onValueChange={(v) =>
                  setValue('ambienteFiscal', v as AmbienteFiscal, { shouldValidate: true })
                }
              >
                <SelectTrigger id="empresa-ambiente" aria-label="Ambiente fiscal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AMBIENTES_FISCAIS.map((amb) => (
                    <SelectItem key={amb} value={amb}>
                      {AMBIENTE_LABELS[amb]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="empresa-razao">Razão social</Label>
            <Input id="empresa-razao" {...register('razaoSocial')} />
            {errors.razaoSocial && (
              <p className="text-xs text-destructive">{errors.razaoSocial.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="empresa-fantasia">Nome fantasia</Label>
            <Input id="empresa-fantasia" {...register('nomeFantasia')} />
            {errors.nomeFantasia && (
              <p className="text-xs text-destructive">{errors.nomeFantasia.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="empresa-doc">CNPJ / CPF</Label>
              <Input id="empresa-doc" {...register('cnpjCpf')} />
              {errors.cnpjCpf && (
                <p className="text-xs text-destructive">{errors.cnpjCpf.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="empresa-ie">Inscrição estadual</Label>
              <Input id="empresa-ie" {...register('inscricaoEstadual')} />
              {errors.inscricaoEstadual && (
                <p className="text-xs text-destructive">{errors.inscricaoEstadual.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="empresa-ie-rural">IE produtor rural</Label>
              <Input id="empresa-ie-rural" {...register('ieProdutorRural')} />
              {errors.ieProdutorRural && (
                <p className="text-xs text-destructive">{errors.ieProdutorRural.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="empresa-serie">Série NF-e</Label>
              <Input id="empresa-serie" inputMode="numeric" {...register('serieNfe')} />
              {errors.serieNfe && (
                <p className="text-xs text-destructive">{errors.serieNfe.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="empresa-regime">Regime tributário</Label>
              <Input id="empresa-regime" {...register('regimeTributario')} />
              {errors.regimeTributario && (
                <p className="text-xs text-destructive">{errors.regimeTributario.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="empresa-crt">CRT</Label>
              <Input id="empresa-crt" {...register('crt')} />
              {errors.crt && <p className="text-xs text-destructive">{errors.crt.message}</p>}
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
              {isPending ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar empresa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
