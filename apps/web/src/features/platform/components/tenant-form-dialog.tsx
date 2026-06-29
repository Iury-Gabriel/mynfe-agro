import { useState } from 'react'

import type { OnboardingFormValues } from '@/features/auth/components/onboarding-form'
import type { ApiErrorDetail } from '@/lib/api-error'
import type { ReactElement } from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { OnboardingForm, toRegisterPayload } from '@/features/auth/components/onboarding-form'
import { useCreateTenant } from '@/features/platform/api/tenants-api'
import { ApiError } from '@/lib/api-error'

interface TenantFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

export function TenantFormDialog({
  open,
  onOpenChange,
  onCreated,
}: TenantFormDialogProps): ReactElement {
  const createTenant = useCreateTenant()
  const [serverDetails, setServerDetails] = useState<ApiErrorDetail[]>([])
  const [topError, setTopError] = useState<string | null>(null)

  function handleSubmit(values: OnboardingFormValues): void {
    setServerDetails([])
    setTopError(null)
    createTenant.mutate(toRegisterPayload(values), {
      onSuccess: () => {
        onCreated()
        onOpenChange(false)
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
          err instanceof ApiError
            ? err.message
            : 'Não foi possível criar o tenant. Tente novamente.',
        )
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo tenant</DialogTitle>
          <DialogDescription>
            Cria um tenant com sua primeira empresa e o usuário administrador.
          </DialogDescription>
        </DialogHeader>

        {topError && (
          <p
            role="alert"
            className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {topError}
          </p>
        )}

        <OnboardingForm
          onSubmit={handleSubmit}
          isPending={createTenant.isPending}
          serverDetails={serverDetails}
          submitLabel="Criar tenant"
        />
      </DialogContent>
    </Dialog>
  )
}
