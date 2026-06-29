import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import type { AmbienteFiscal, Empresa, UpdateEmpresaInput } from '@/features/admin/api/empresas-api'
import type { ReactElement, ReactNode } from 'react'
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
import { AMBIENTES_FISCAIS, useUpdateEmpresa } from '@/features/admin/api/empresas-api'
import { StatusPill } from '@/features/agroflow/ui'
import { ApiError } from '@/lib/api-error'

const fiscalSchema = z.object({
  ambienteFiscal: z.enum(AMBIENTES_FISCAIS),
  serieNfe: z.string().max(10),
  regimeTributario: z.string().min(1, 'Regime tributário obrigatório').max(50),
  crt: z.string().min(1, 'CRT obrigatório').max(10),
})

type FiscalFormValues = z.infer<typeof fiscalSchema>

const AMBIENTE_LABELS: Record<AmbienteFiscal, string> = {
  homologacao: 'Homologação',
  producao: 'Produção',
}

function fromEmpresa(empresa: Empresa): FiscalFormValues {
  return {
    ambienteFiscal: empresa.ambienteFiscal,
    serieNfe: empresa.serieNfe != null ? String(empresa.serieNfe) : '',
    regimeTributario: empresa.regimeTributario,
    crt: empresa.crt,
  }
}

function toPayload(values: FiscalFormValues, id: string): UpdateEmpresaInput {
  const serie = values.serieNfe.trim()
  return {
    id,
    ambienteFiscal: values.ambienteFiscal,
    serieNfe: serie === '' ? null : Number(serie),
    regimeTributario: values.regimeTributario.trim(),
    crt: values.crt.trim(),
  }
}

const FIELD_KEYS = new Set<string>(['ambienteFiscal', 'serieNfe', 'regimeTributario', 'crt'])

function ReadField({ label, value }: { label: string; value: ReactNode }): ReactElement {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  )
}

interface EmpresaFiscalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  empresa: Empresa
  canEdit: boolean
}

export function EmpresaFiscalDialog({
  open,
  onOpenChange,
  empresa,
  canEdit,
}: EmpresaFiscalDialogProps): ReactElement {
  const updateEmpresa = useUpdateEmpresa()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<FiscalFormValues>({
    resolver: zodResolver(fiscalSchema),
    defaultValues: fromEmpresa(empresa),
  })

  useEffect(() => {
    if (open) reset(fromEmpresa(empresa))
  }, [open, empresa, reset])

  const ambienteFiscal = watch('ambienteFiscal')

  function applyServerErrors(err: unknown): void {
    if (err instanceof ApiError && err.details.length > 0) {
      for (const detail of err.details) {
        if (FIELD_KEYS.has(detail.path)) {
          setError(detail.path as Path<FiscalFormValues>, { message: detail.message })
        }
      }
      return
    }
    toast.error('Não foi possível salvar a configuração fiscal.')
  }

  function onValid(values: FiscalFormValues): void {
    updateEmpresa.mutate(toPayload(values, empresa.id), {
      onSuccess: () => {
        onOpenChange(false)
        toast.success('Configuração fiscal atualizada.')
      },
      onError: applyServerErrors,
    })
  }

  const plugnotasConfigurado = empresa.plugnotasConfigurado === true
  const proximaNumeracao =
    empresa.proximaNumeracaoNfe != null ? String(empresa.proximaNumeracaoNfe) : 'Não disponível'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-full max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configuração fiscal · {empresa.razaoSocial}</DialogTitle>
          <DialogDescription>
            Parâmetros de emissão NF-e e credenciais do emitente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-border/60 bg-background/40 p-4 sm:grid-cols-2">
            <ReadField label="Próxima numeração NF-e" value={proximaNumeracao} />
            <ReadField
              label="Integração PlugNotas"
              value={
                <StatusPill tone={plugnotasConfigurado ? 'success' : 'neutral'}>
                  {plugnotasConfigurado ? 'Configurado' : 'Não configurado'}
                </StatusPill>
              }
            />
          </div>

          <form
            onSubmit={(e) => {
              void handleSubmit(onValid)(e)
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="fiscal-ambiente">Ambiente fiscal</Label>
                <Select
                  name="ambienteFiscal"
                  value={ambienteFiscal}
                  onValueChange={(v) =>
                    setValue('ambienteFiscal', v as AmbienteFiscal, { shouldValidate: true })
                  }
                  disabled={!canEdit}
                >
                  <SelectTrigger id="fiscal-ambiente" aria-label="Ambiente fiscal">
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

              <div className="space-y-1.5">
                <Label htmlFor="fiscal-serie">Série NF-e</Label>
                <Input
                  id="fiscal-serie"
                  inputMode="numeric"
                  disabled={!canEdit}
                  {...register('serieNfe')}
                />
                {errors.serieNfe && (
                  <p className="text-xs text-destructive">{errors.serieNfe.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="fiscal-regime">Regime tributário</Label>
                <Input id="fiscal-regime" disabled={!canEdit} {...register('regimeTributario')} />
                {errors.regimeTributario && (
                  <p className="text-xs text-destructive">{errors.regimeTributario.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fiscal-crt">CRT</Label>
                <Input id="fiscal-crt" disabled={!canEdit} {...register('crt')} />
                {errors.crt && <p className="text-xs text-destructive">{errors.crt.message}</p>}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full sm:w-auto"
                onClick={() => onOpenChange(false)}
                disabled={updateEmpresa.isPending}
              >
                {canEdit ? 'Cancelar' : 'Fechar painel'}
              </Button>
              {canEdit && (
                <Button
                  type="submit"
                  className="h-11 w-full sm:w-auto"
                  disabled={updateEmpresa.isPending}
                >
                  {updateEmpresa.isPending ? 'Salvando...' : 'Salvar configuração'}
                </Button>
              )}
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
