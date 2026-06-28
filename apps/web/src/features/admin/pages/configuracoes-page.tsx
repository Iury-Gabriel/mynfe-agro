import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import type { TenantConfig } from '@/features/admin/api/tenant-config-api'
import type { ReactElement } from 'react'

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
  LABEL_AREA_OPTIONS,
  useTenantConfig,
  useUpdateTenantConfig,
} from '@/features/admin/api/tenant-config-api'
import { ActionButton, PageHeader, Panel } from '@/features/agroflow/ui'
import { hasAnyPermission } from '@/lib/permissions'
import { useAuth } from '@/providers/auth-context'

const configSchema = z.object({
  nome: z.string().min(1, 'Nome obrigatório').max(200),
  labelArea: z.enum(LABEL_AREA_OPTIONS),
  diaCorteConsolidacao: z.string().max(2),
})

type ConfigFormValues = z.infer<typeof configSchema>

function normalizeLabelArea(value: string): (typeof LABEL_AREA_OPTIONS)[number] {
  return (LABEL_AREA_OPTIONS as readonly string[]).includes(value)
    ? (value as (typeof LABEL_AREA_OPTIONS)[number])
    : 'Talhão'
}

function fromConfig(config: TenantConfig): ConfigFormValues {
  return {
    nome: config.nome,
    labelArea: normalizeLabelArea(config.labelArea),
    diaCorteConsolidacao:
      config.diaCorteConsolidacao != null ? String(config.diaCorteConsolidacao) : '',
  }
}

export function ConfiguracoesPage(): ReactElement {
  const { user } = useAuth()
  const canManage = hasAnyPermission(user?.permissions, ['manage:settings'])

  const { data, isLoading, isError, refetch } = useTenantConfig()
  const updateConfig = useUpdateTenantConfig()

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ConfigFormValues>({
    resolver: zodResolver(configSchema),
    defaultValues: { nome: '', labelArea: 'Talhão', diaCorteConsolidacao: '' },
  })

  useEffect(() => {
    if (data) reset(fromConfig(data))
  }, [data, reset])

  function onValid(values: ConfigFormValues): void {
    const dia = values.diaCorteConsolidacao.trim()
    updateConfig.mutate(
      {
        nome: values.nome.trim(),
        labelArea: values.labelArea,
        diaCorteConsolidacao: dia === '' ? null : Number(dia),
      },
      {
        onSuccess: () => toast.success('Configurações salvas com sucesso.'),
        onError: () => toast.error('Não foi possível salvar as configurações.'),
      },
    )
  }

  return (
    <div className="agroflow agroflow-glow min-h-screen p-4 text-foreground sm:p-6">
      <PageHeader
        title="Configurações"
        subtitle="Preferências gerais da sua organização."
      />

      <div className="mt-6 max-w-2xl">
        <Panel>
          {isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Carregando configurações…
            </p>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <p className="text-sm text-destructive">Erro ao carregar configurações.</p>
              <ActionButton variant="ghost" size="sm" onClick={() => void refetch()}>
                Tentar novamente
              </ActionButton>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                void handleSubmit(onValid)(e)
              }}
              className="space-y-5"
            >
              <div className="space-y-1.5">
                <Label htmlFor="config-nome">Nome da organização</Label>
                <Input id="config-nome" disabled={!canManage} {...register('nome')} />
                {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="config-label-area">Nomenclatura de área</Label>
                <Controller
                  control={control}
                  name="labelArea"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!canManage}
                    >
                      <SelectTrigger id="config-label-area" aria-label="Nomenclatura de área">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LABEL_AREA_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="config-dia-corte">Dia de corte da consolidação</Label>
                <Input
                  id="config-dia-corte"
                  type="number"
                  min={1}
                  max={31}
                  inputMode="numeric"
                  disabled={!canManage}
                  {...register('diaCorteConsolidacao')}
                />
                <p className="text-xs text-muted-foreground">
                  Dia do mês (1–31) usado para fechar a consolidação. Deixe em branco para não
                  definir.
                </p>
              </div>

              {canManage && (
                <div className="flex justify-end">
                  <ActionButton
                    type="submit"
                    variant="primary"
                    disabled={updateConfig.isPending}
                  >
                    {updateConfig.isPending ? 'Salvando…' : 'Salvar configurações'}
                  </ActionButton>
                </div>
              )}
            </form>
          )}
        </Panel>
      </div>
    </div>
  )
}
