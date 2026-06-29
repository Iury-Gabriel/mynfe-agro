import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import type { RegisterTenantInput, TipoPessoaOnboarding } from '@/features/auth/api/onboarding-api'
import type { ApiErrorDetail } from '@/lib/api-error'
import type { ReactElement } from 'react'
import type { Path } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TIPOS_PESSOA_ONBOARDING } from '@/features/auth/api/onboarding-api'

const onboardingSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(120),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(12, 'A senha deve ter no mínimo 12 caracteres'),
  tenantNome: z.string().min(1, 'Nome do tenant obrigatório').max(120),
  razaoSocial: z.string().min(1, 'Razão social obrigatória').max(200),
  cnpjCpf: z.string().min(11, 'Mínimo 11 dígitos').max(18, 'Máximo 18 caracteres'),
  tipoPessoa: z.enum(TIPOS_PESSOA_ONBOARDING),
  regimeTributario: z.string().min(1, 'Regime tributário obrigatório').max(50),
  crt: z.string().min(1, 'CRT obrigatório').max(10),
})

export type OnboardingFormValues = z.infer<typeof onboardingSchema>

const TIPO_LABELS: Record<TipoPessoaOnboarding, string> = {
  PJ: 'Pessoa Jurídica',
  PF: 'Pessoa Física',
}

const FIELD_KEYS = new Set<keyof OnboardingFormValues>([
  'name',
  'email',
  'password',
  'tenantNome',
  'razaoSocial',
  'cnpjCpf',
  'tipoPessoa',
  'regimeTributario',
  'crt',
])

const SERVER_FIELD_MAP: Record<string, keyof OnboardingFormValues> = {
  'empresa.razaoSocial': 'razaoSocial',
  'empresa.cnpjCpf': 'cnpjCpf',
  'empresa.tipoPessoa': 'tipoPessoa',
  'empresa.regimeTributario': 'regimeTributario',
  'empresa.crt': 'crt',
}

function emptyDefaults(): OnboardingFormValues {
  return {
    name: '',
    email: '',
    password: '',
    tenantNome: '',
    razaoSocial: '',
    cnpjCpf: '',
    tipoPessoa: 'PJ',
    regimeTributario: '',
    crt: '',
  }
}

export function toRegisterPayload(values: OnboardingFormValues): RegisterTenantInput {
  return {
    name: values.name.trim(),
    email: values.email.trim().toLowerCase(),
    password: values.password,
    tenantNome: values.tenantNome.trim(),
    empresa: {
      razaoSocial: values.razaoSocial.trim(),
      cnpjCpf: values.cnpjCpf.trim(),
      tipoPessoa: values.tipoPessoa,
      regimeTributario: values.regimeTributario.trim(),
      crt: values.crt.trim(),
    },
  }
}

interface OnboardingFormProps {
  onSubmit: (values: OnboardingFormValues) => void
  isPending: boolean
  serverDetails?: ApiErrorDetail[]
  submitLabel: string
}

export function OnboardingForm({
  onSubmit,
  isPending,
  serverDetails,
  submitLabel,
}: OnboardingFormProps): ReactElement {
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: emptyDefaults(),
  })

  useEffect(() => {
    if (!serverDetails || serverDetails.length === 0) return
    for (const detail of serverDetails) {
      const mapped = SERVER_FIELD_MAP[detail.path]
      if (mapped) {
        setError(mapped, { message: detail.message })
      } else if (FIELD_KEYS.has(detail.path as keyof OnboardingFormValues)) {
        setError(detail.path as Path<OnboardingFormValues>, { message: detail.message })
      }
    }
  }, [serverDetails, setError])

  const tipoPessoa = watch('tipoPessoa')

  return (
    <form
      onSubmit={(e) => void handleSubmit(onSubmit)(e)}
      noValidate
      className="w-full space-y-4"
    >
      <div className="space-y-1.5">
        <Label htmlFor="onb-name">Seu nome</Label>
        <Input id="onb-name" autoComplete="name" {...register('name')} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="onb-email">E-mail</Label>
          <Input id="onb-email" type="email" autoComplete="email" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="onb-password">Senha</Label>
          <Input
            id="onb-password"
            type="password"
            autoComplete="new-password"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="onb-tenant">Nome da organização</Label>
        <Input id="onb-tenant" {...register('tenantNome')} />
        {errors.tenantNome && (
          <p className="text-xs text-destructive">{errors.tenantNome.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="onb-razao">Razão social</Label>
        <Input id="onb-razao" {...register('razaoSocial')} />
        {errors.razaoSocial && (
          <p className="text-xs text-destructive">{errors.razaoSocial.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="onb-tipo">Tipo de pessoa</Label>
          <Select
            name="tipoPessoa"
            value={tipoPessoa}
            onValueChange={(v) =>
              setValue('tipoPessoa', v as TipoPessoaOnboarding, { shouldValidate: true })
            }
          >
            <SelectTrigger id="onb-tipo" aria-label="Tipo de pessoa">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_PESSOA_ONBOARDING.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>
                  {TIPO_LABELS[tipo]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="onb-doc">CNPJ / CPF</Label>
          <Input id="onb-doc" {...register('cnpjCpf')} />
          {errors.cnpjCpf && <p className="text-xs text-destructive">{errors.cnpjCpf.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="onb-regime">Regime tributário</Label>
          <Input id="onb-regime" {...register('regimeTributario')} />
          {errors.regimeTributario && (
            <p className="text-xs text-destructive">{errors.regimeTributario.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="onb-crt">CRT</Label>
          <Input id="onb-crt" {...register('crt')} />
          {errors.crt && <p className="text-xs text-destructive">{errors.crt.message}</p>}
        </div>
      </div>

      <Button type="submit" className="h-11 w-full" disabled={isPending}>
        {isPending ? 'Enviando...' : submitLabel}
      </Button>
    </form>
  )
}
