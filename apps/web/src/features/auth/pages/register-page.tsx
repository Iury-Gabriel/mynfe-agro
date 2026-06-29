import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import type { OnboardingFormValues } from '@/features/auth/components/onboarding-form'
import type { ApiErrorDetail } from '@/lib/api-error'
import type { ReactElement } from 'react'

import { useRegisterTenant } from '@/features/auth/api/onboarding-api'
import { OnboardingForm, toRegisterPayload } from '@/features/auth/components/onboarding-form'
import { ApiError } from '@/lib/api-error'

export function RegisterPage(): ReactElement {
  const navigate = useNavigate()
  const register = useRegisterTenant()
  const [serverDetails, setServerDetails] = useState<ApiErrorDetail[]>([])
  const [topError, setTopError] = useState<string | null>(null)

  function handleSubmit(values: OnboardingFormValues): void {
    setServerDetails([])
    setTopError(null)
    register.mutate(toRegisterPayload(values), {
      onSuccess: () => {
        toast.success('Conta criada, faça login')
        void navigate('/sign-in')
      },
      onError: (err) => {
        if (err instanceof ApiError && err.isValidation) {
          setServerDetails(err.details)
          return
        }
        if (err instanceof ApiError && err.isConflict) {
          setTopError('Este e-mail já está em uso.')
          return
        }
        setTopError(
          err instanceof ApiError ? err.message : 'Não foi possível criar a conta. Tente novamente.',
        )
      },
    })
  }

  return (
    <div className="w-full max-w-lg rounded-2xl border border-border/60 bg-card/70 p-6 shadow-xl shadow-black/20 backdrop-blur-sm sm:p-8">
      <div className="mb-6 space-y-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Criar conta</h1>
        <p className="text-sm text-muted-foreground">
          Cadastre sua organização e comece a usar o AgroFlow.
        </p>
      </div>

      {topError && (
        <p
          role="alert"
          className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {topError}
        </p>
      )}

      <OnboardingForm
        onSubmit={handleSubmit}
        isPending={register.isPending}
        serverDetails={serverDetails}
        submitLabel="Criar conta"
      />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Já tem conta?{' '}
        <Link to="/sign-in" className="text-primary underline-offset-4 hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  )
}
